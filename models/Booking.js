// =====================================
// BOOKING MODEL (CORE LOGIC)
// =====================================

const mongoose = require("mongoose");

// =====================================
// SCHEMA
// =====================================
const bookingSchema = new mongoose.Schema(
  {
    // =====================================
    // RELATIONS
    // =====================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },

    // =====================================
    // BOOKING DETAILS
    // =====================================
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingCode: {
      type: String,
      unique: true,
      required: true,
    },

    status: {
      type: String,
      enum: ["Booked", "Completed", "Cancelled"],
      default: "Booked",
    },

    // =====================================
    // ADD-ONS SELECTED
    // =====================================
    addons: {
      type: [
        {
          name: String,
          price: Number,
        },
      ],
      default: [],
    },

    // =====================================
    // DELIVERY METHOD (NEW FEATURE)
    // =====================================
    deliveryMethod: {
      type: String,
      enum: ["homeDelivery", "meetUpPoint", "selfPickup"],
      default: "selfPickup",
    },

    // =====================================
    // CONDITION REPORT (BEFORE/AFTER)
    // =====================================
    conditionReport: {
      beforeImages: {
        type: [String],
        default: [],
      },
      afterImages: {
        type: [String],
        default: [],
      },
    },

    // =====================================
    // DAMAGE DETECTION
    // =====================================
    damageReport: {
      possibleDamage: {
        type: Boolean,
        default: false,
      },
      notes: {
        type: String,
        default: "",
      },
    },

    payment: {
      provider: {
        type: String,
        default: "dummy",
      },
      sessionId: String,
      orderId: String,
      transactionId: String,
      method: String,
      status: {
        type: String,
        enum: ["paid", "refunded"],
        default: "paid",
      },
      amount: Number,
      paidAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ car: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
