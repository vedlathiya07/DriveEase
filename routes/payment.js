const crypto = require("crypto");
const express = require("express");

const auth = require("../middleware/auth");
const PaymentSession = require("../models/PaymentSession");
const { buildBookingSummary } = require("../utils/booking");
const {
  createBookingFromPaymentSession,
} = require("../utils/bookingFulfillment");

const router = express.Router();

const createDemoOrderId = () =>
  `demo_order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

const createDemoTransactionId = () =>
  `demo_txn_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

router.post("/create-order", auth, async (req, res) => {
  try {
    const summary = await buildBookingSummary(req.body);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const session = await PaymentSession.create({
      sessionId,
      orderId: createDemoOrderId(),
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
      paymentMode: "dummy",
      session: {
        sessionId: session.sessionId,
        orderId: session.orderId,
        amount: session.amount,
        currency: "INR",
        expiresAt: session.expiresAt,
      },
      breakdown: {
        days: summary.days,
        addons: summary.addons,
        deliveryMethod: summary.deliveryMethod,
        totalPrice: summary.totalPrice,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/verify", auth, async (req, res) => {
  try {
    const { sessionId, orderId, paymentMethod, payerName } = req.body;

    if (!sessionId || !orderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Session, order, and payment method are required",
      });
    }

    const session = await PaymentSession.findOne({
      sessionId,
      orderId,
      user: req.user.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Payment session not found",
      });
    }

    if (session.expiresAt < new Date()) {
      session.status = "expired";
      await session.save();

      return res.status(410).json({
        success: false,
        message: "This payment session has expired. Please try again.",
      });
    }

    if (session.status === "consumed" && session.booking) {
      const booking = await createBookingFromPaymentSession(session);

      return res.json({
        success: true,
        message: "Demo payment already completed",
        payment: {
          orderId: session.orderId,
          transactionId: session.transactionId,
          provider: "dummy",
        },
        booking,
      });
    }

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
      session.paymentMethod = paymentMethod;
      session.transactionId = createDemoTransactionId();
      session.payerName = payerName || "Demo User";
      session.status = "paid";
      session.paidAt = new Date();

      await session.save();
    }

    const booking = await createBookingFromPaymentSession(session);

    res.json({
      success: true,
      message: "Demo payment verified successfully",
      payment: {
        orderId: session.orderId,
        transactionId: session.transactionId,
        provider: "dummy",
      },
      booking,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
