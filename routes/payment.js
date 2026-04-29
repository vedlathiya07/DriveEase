const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");

const auth = require("../middleware/auth");
const PaymentSession = require("../models/PaymentSession");
const { buildBookingSummary } = require("../utils/booking");
const {
  createBookingFromPaymentSession,
} = require("../utils/bookingFulfillment");

const router = express.Router();

// ──────────────────────────────────────────────────────────────
// Razorpay client (test mode — keys loaded from .env)
// ──────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ──────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order and a pending PaymentSession in DB.
// ──────────────────────────────────────────────────────────────
router.post("/create-order", auth, async (req, res) => {
  try {
    const summary = await buildBookingSummary(req.body);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10-minute window

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(summary.totalPrice * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: sessionId,
      notes: {
        carId: summary.car._id.toString(),
        userId: req.user.userId,
      },
    });

    const session = await PaymentSession.create({
      sessionId,
      orderId: razorpayOrder.id, // real razorpay_order_id (order_xxxx)
      user: req.user.userId,
      car: summary.car._id,
      startDate: summary.startDate,
      endDate: summary.endDate,
      days: summary.days,
      addons: summary.addons,
      deliveryMethod: summary.deliveryMethod,
      amount: summary.totalPrice,
      status: "pending",
      expiresAt,
    });

    res.status(201).json({
      success: true,
      paymentMode: "razorpay",
      session: {
        sessionId: session.sessionId,
        orderId: session.orderId,         // razorpay order id for checkout
        amount: session.amount,
        amountInPaise,
        currency: "INR",
        expiresAt: session.expiresAt,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      breakdown: {
        days: summary.days,
        addons: summary.addons,
        deliveryMethod: summary.deliveryMethod,
        totalPrice: summary.totalPrice,
      },
    });
  } catch (error) {
    console.error("❌ create-order error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Verifies the Razorpay payment signature and fulfils the booking.
// Body: { sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ──────────────────────────────────────────────────────────────
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      sessionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "sessionId, razorpay_order_id, razorpay_payment_id and razorpay_signature are all required",
      });
    }

    // 1. Look up the session
    const session = await PaymentSession.findOne({
      sessionId,
      orderId: razorpay_order_id,
      user: req.user.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Payment session not found",
      });
    }

    // 2. Check session expiry
    if (session.expiresAt < new Date()) {
      session.status = "expired";
      await session.save();
      return res.status(410).json({
        success: false,
        message: "This payment session has expired. Please try again.",
      });
    }

    // 3. Idempotency — already fulfilled
    if (session.status === "consumed" && session.booking) {
      const booking = await createBookingFromPaymentSession(session);
      return res.json({
        success: true,
        message: "Payment already verified",
        payment: {
          orderId: session.orderId,
          transactionId: session.transactionId,
          provider: "razorpay",
        },
        booking,
      });
    }

    // 4. Verify Razorpay HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed. Do not fulfil this order.",
      });
    }

    // 5. Mark session paid
    if (session.status === "pending") {
      const summary = await buildBookingSummary({
        carId: session.car,
        startDate: session.startDate,
        endDate: session.endDate,
        addons: session.addons,
        deliveryMethod: session.deliveryMethod,
      });

      session.days = summary.days;
      session.addons = summary.addons;
      session.deliveryMethod = summary.deliveryMethod;
      session.amount = summary.totalPrice;
      session.paymentMethod = "card"; // Razorpay handles method internally
      session.transactionId = razorpay_payment_id;
      session.status = "paid";
      session.paidAt = new Date();

      await session.save();
    }

    // 6. Create/fetch the booking
    const booking = await createBookingFromPaymentSession(session);

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        orderId: session.orderId,
        transactionId: session.transactionId,
        provider: "razorpay",
      },
      booking,
    });
  } catch (error) {
    console.error("❌ verify error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
