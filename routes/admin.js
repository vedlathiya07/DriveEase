// =====================================
// ADMIN ROUTES (DASHBOARD + ANALYTICS)
// =====================================

const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Car = require("../models/Car");
const Booking = require("../models/Booking");

const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const { decorateCarsWithAvailability } = require("../utils/carAvailability");

// =====================================
// GET ALL USERS
// =====================================
router.get("/users", auth, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// GET ALL CARS
// =====================================
router.get("/cars", auth, adminMiddleware, async (req, res) => {
  try {
    const cars = await Car.find().populate("owner", "name email");
    const decoratedCars = await decorateCarsWithAvailability(cars);

    res.json({
      success: true,
      count: decoratedCars.length,
      cars: decoratedCars,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// GET ALL BOOKINGS
// =====================================
router.get("/bookings", auth, adminMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("car", "title pricePerDay location");

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// ANALYTICS DASHBOARD
// =====================================
router.get("/analytics", auth, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCars = await Car.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const revenueResult = await Booking.aggregate([
      {
        $match: { status: { $in: ["Booked", "Completed"] } },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const popularCars = await Booking.aggregate([
      {
        $match: { status: { $in: ["Booked", "Completed"] } },
      },
      {
        $group: {
          _id: "$car",
          bookingsCount: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "cars",
          localField: "_id",
          foreignField: "_id",
          as: "car",
        },
      },
      {
        $unwind: {
          path: "$car",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          bookingsCount: 1,
          revenue: 1,
          title: "$car.title",
          brand: "$car.brand",
          location: "$car.location",
        },
      },
    ]);

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("car", "title");

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCars,
        totalBookings,
        totalRevenue,
        popularCars,
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// DELETE USER (ADMIN)
// =====================================
router.delete("/user/:id", auth, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================
// DELETE BOOKING (ADMIN)
// =====================================
router.delete("/booking/:id", auth, adminMiddleware, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
