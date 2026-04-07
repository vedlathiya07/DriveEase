// =====================================
// IMPORTS
// =====================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Car = require("../models/Car");
const auth = require("../middleware/auth");
const { setUploadType, upload } = require("../middleware/upload");

const router = express.Router();

// =====================================
// SANITIZE USER (RETURN SAFE DATA)
// =====================================

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  avatar: user.avatar || "", // Cloudinary URL directly
  wishlist: user.wishlist || [],
  createdAt: user.createdAt,
});

// =====================================
// SIGNUP
// =====================================

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const safeRole = role === "owner" ? "owner" : "user";

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: safeRole,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// LOGIN
// =====================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password")
      .populate("wishlist", "title brand pricePerDay location fuelType images");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || "1d",
      },
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// GET PROFILE
// =====================================

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "wishlist",
      "title brand pricePerDay location fuelType images category",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// UPLOAD AVATAR (CLOUDINARY)
// =====================================

router.post(
  "/me/avatar",
  auth,
  setUploadType("avatar"),
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please choose an image to upload",
        });
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      //  Save Cloudinary URL directly
      user.avatar = req.file.path;

      await user.save();

      const refreshedUser = await User.findById(user._id).populate(
        "wishlist",
        "title brand pricePerDay location fuelType images category",
      );

      res.json({
        success: true,
        message: "Profile photo updated successfully",
        user: sanitizeUser(refreshedUser),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// =====================================
// UPDATE PROFILE
// =====================================

router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone, avatar, password } = req.body;
    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (typeof phone === "string") user.phone = phone;
    if (typeof avatar === "string") user.avatar = avatar;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const refreshedUser = await User.findById(user._id).populate(
      "wishlist",
      "title brand pricePerDay location fuelType images category",
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(refreshedUser),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// GET WISHLIST
// =====================================

router.get("/wishlist", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "wishlist",
      "title brand pricePerDay location fuelType images category",
    );

    res.json({
      success: true,
      wishlist: user?.wishlist || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================
// TOGGLE WISHLIST
// =====================================

router.put("/wishlist/:carId", auth, async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    const user = await User.findById(req.user.userId);

    const alreadyWishlisted = user.wishlist.some(
      (item) => item.toString() === req.params.carId,
    );

    if (alreadyWishlisted) {
      user.wishlist = user.wishlist.filter(
        (item) => item.toString() !== req.params.carId,
      );
    } else {
      user.wishlist.push(req.params.carId);
    }

    await user.save();

    const refreshedUser = await User.findById(req.user.userId).populate(
      "wishlist",
      "title brand pricePerDay location fuelType images category",
    );

    res.json({
      success: true,
      isWishlisted: !alreadyWishlisted,
      wishlist: refreshedUser.wishlist,
      user: sanitizeUser(refreshedUser),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
