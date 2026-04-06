// =====================================
// USER MODEL (AUTH + ROLES)
// =====================================

const mongoose = require("mongoose");

// =====================================
// SCHEMA
// =====================================
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // IMPORTANT: hide password by default
    },

    role: {
      type: String,
      enum: ["user", "admin", "owner"],
      default: "user",
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String, // profile image
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// =====================================
// EXPORT MODEL
// =====================================
module.exports = mongoose.model("User", userSchema);
