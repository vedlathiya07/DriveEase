// =====================================
// BOOKING ROUTES
// =====================================

const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Car = require("../models/Car");
const PaymentSession = require("../models/PaymentSession");

const auth = require("../middleware/auth");
const { setUploadType, upload } = require("../middleware/upload");
const {
  buildBookingSummary,
  createHttpError,
  getBookedRanges,
} = require("../utils/booking");
const {
  createBookingFromPaymentSession,
  hydrateBooking,
} = require("../utils/bookingFulfillment");

const canAccessBooking = (booking, userId, role) =>
  role === "admin" ||
  booking.user.toString() === userId ||
  booking.car?.owner?.toString() === userId;

const toPublicFilePath = (filePath) => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");

  if (uploadsIndex >= 0) {
    return normalizedPath.slice(uploadsIndex + 1);
  }

  if (normalizedPath.startsWith("uploads/")) {
    return normalizedPath;
  }

  return `uploads/${normalizedPath.split("/").pop()}`;
};

router.post("/quote", auth, async (req, res) => {
  try {
    const summary = await buildBookingSummary(req.body);

    res.json({
      success: true,
      summary: {
        carId: summary.car._id,
        pricePerDay: summary.car.pricePerDay,
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

router.post("/", auth, async (req, res) => {
  try {
    const { paymentSessionId } = req.body;

    if (!paymentSessionId) {
      throw createHttpError(400, "Payment session is required");
    }

    const session = await PaymentSession.findOne({
      sessionId: paymentSessionId,
      user: req.user.userId,
    });

    if (!session || !["paid", "consumed"].includes(session.status)) {
      throw createHttpError(404, "Paid payment session not found");
    }

    const booking = await createBookingFromPaymentSession(session);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/car/:carId/dates", async (req, res) => {
  try {
    const dates = await getBookedRanges(req.params.carId);
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.userId,
    })
      .populate({
        path: "car",
        populate: {
          path: "owner",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await hydrateBooking(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (!canAccessBooking(booking, req.user.userId, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "car",
      select: "owner",
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!canAccessBooking(booking, req.user.userId, req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (booking.status !== "Booked") {
      return res.status(400).json({
        error: "Only active bookings can be cancelled",
      });
    }

    booking.status = "Cancelled";
    if (booking.payment) {
      booking.payment.status = "refunded";
    }
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/:id/before",
  auth,
  setUploadType("before"),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).populate({
        path: "car",
        select: "owner",
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (!canAccessBooking(booking, req.user.userId, req.user.role)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      booking.conditionReport.beforeImages = (req.files || []).map((file) =>
        toPublicFilePath(file.path),
      );

      await booking.save();

      res.json({
        success: true,
        message: "Pickup condition images uploaded",
        beforeImages: booking.conditionReport.beforeImages,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

router.post(
  "/:id/after",
  auth,
  setUploadType("after"),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).populate({
        path: "car",
        select: "owner",
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (!canAccessBooking(booking, req.user.userId, req.user.role)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      booking.conditionReport.afterImages = (req.files || []).map((file) =>
        toPublicFilePath(file.path),
      );

      booking.damageReport = {
        possibleDamage:
          booking.conditionReport.beforeImages.length !==
          booking.conditionReport.afterImages.length,
        notes:
          booking.conditionReport.beforeImages.length !==
          booking.conditionReport.afterImages.length
            ? "Image count mismatch detected. Manual review recommended."
            : "No automatic mismatch detected.",
      };

      booking.status = "Completed";
      await booking.save();

      res.json({
        success: true,
        message: "Return condition images uploaded",
        damageReport: booking.damageReport,
        afterImages: booking.conditionReport.afterImages,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// =====================================
// CREATE BOOKING
// =====================================
router.post("/legacy-disabled", auth, async (req, res) => {
  try {
    return res.status(410).json({ error: "Legacy booking route is disabled" });

    const { carId, startDate, endDate, addons, deliveryMethod } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    // CALCULATE DAYS
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

    if (days <= 0) {
      return res.status(400).json({ error: "Invalid booking dates" });
    }

    // CHECK OVERLAPPING BOOKINGS
    const existingBooking = await Booking.findOne({
      car: carId,
      status: "Booked",
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (existingBooking) {
      return res.status(400).json({
        error: "Car already booked for selected dates",
      });
    }

    // CALCULATE PRICE
    let addonsTotal = 0;
    if (addons && addons.length > 0) {
      addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
    }

    const totalPrice = days * car.pricePerDay + addonsTotal;

    // CREATE BOOKING
    const booking = new Booking({
      user: req.user.userId,
      car: car._id,
      startDate,
      endDate,
      totalPrice,
      addons,
      deliveryMethod,
      status: "Booked",
    });

    await booking.save();

    // SEND EMAIL
    const user = await User.findById(req.user.userId);

    if (user?.email) {
      await sendEmail(
        user.email,
        "DriveEase Booking Confirmed",
        `Hello ${user.name},

Your booking is confirmed!

Car: ${car.title}
Location: ${car.location}
Dates: ${startDate} to ${endDate}
Total: ₹${totalPrice}

Thank you for choosing DriveEase 🚗`,
      );
    }

    // MARK CAR UNAVAILABLE
    car.isAvailable = false;
    await car.save();

    res.json({
      message: "Booking successful",
      booking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// GET BOOKED DATES
// =====================================
router.get("/legacy-disabled/car/:carId/dates", async (req, res) => {
  try {
    const bookings = await Booking.find({
      car: req.params.carId,
      status: "Booked",
    });

    const dates = bookings.map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
    }));

    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// GET MY BOOKINGS
// =====================================
router.get("/legacy-disabled/my-bookings", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.userId,
    }).populate("car");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// CANCEL BOOKING
// =====================================
router.put("/legacy-disabled/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    booking.status = "Cancelled";
    await booking.save();

    // MAKE CAR AVAILABLE AGAIN
    const car = await Car.findById(booking.car);
    if (car) {
      car.isAvailable = true;
      await car.save();
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// UPLOAD BEFORE IMAGES
// =====================================
router.post(
  "/legacy-disabled/:id/before",
  auth,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      booking.conditionReport.beforeImages = req.files.map((f) => f.path);

      await booking.save();

      res.json({ message: "Before images uploaded" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// =====================================
// UPLOAD AFTER IMAGES + DAMAGE DETECTION
// =====================================
router.post(
  "/legacy-disabled/:id/after",
  auth,
  upload.array("images", 5),
  async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    booking.conditionReport.afterImages = req.files.map((f) => f.path);

    // SIMPLE DAMAGE DETECTION
    if (
      booking.conditionReport.beforeImages &&
      booking.conditionReport.afterImages &&
      booking.conditionReport.beforeImages.length !==
        booking.conditionReport.afterImages.length
    ) {
      booking.damageReport = {
        possibleDamage: true,
        notes: "Mismatch in image count. Check manually.",
      };
    }

    await booking.save();

    res.json({
      message: "After images uploaded",
      damageReport: booking.damageReport,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  },
);

module.exports = router;
