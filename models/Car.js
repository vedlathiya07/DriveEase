// =====================================
// CAR MODEL (CORE SYSTEM)
// =====================================

const mongoose = require("mongoose");

// =====================================
// SCHEMA
// =====================================
const carSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Car title is required"],
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: "Premium",
    },

    year: {
      type: Number,
      min: 1990,
      max: 2100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1200,
    },

    pricePerDay: {
      type: Number,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric"],
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    images: [
      {
        type: String,
      },
    ],

    // =====================================
    // CAR SPECIFICATIONS
    // =====================================
    specs: {
      seats: Number,
      transmission: String,
      mileage: String,
    },

    // =====================================
    // ADD-ONS SYSTEM
    // =====================================
    addons: [
      {
        name: {
          type: String,
        },
        price: {
          type: Number,
        },
      },
    ],

    // =====================================
    // DELIVERY OPTIONS (NEW FEATURE)
    // =====================================
    deliveryOptions: {
      homeDelivery: {
        type: Boolean,
        default: false,
      },
      meetUpPoint: {
        type: String,
      },
      selfPickup: {
        type: Boolean,
        default: false,
      },
    },

    // =====================================
    // OWNER (WHO ADDED CAR)
    // =====================================
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // =====================================
    // MAP LOCATION
    // =====================================
    locationCoords: {
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
  },
);

// =====================================
// EXPORT MODEL
// =====================================
module.exports = mongoose.model("Car", carSchema);
