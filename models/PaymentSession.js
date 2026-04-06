const mongoose = require("mongoose");

const paymentSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    addons: [
      {
        name: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          min: 0,
        },
      },
    ],
    deliveryMethod: {
      type: String,
      enum: ["homeDelivery", "meetUpPoint", "selfPickup"],
      default: "selfPickup",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "consumed", "expired", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "wallet", "netbanking"],
    },
    transactionId: String,
    payerName: String,
    payerEmail: String,
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    paidAt: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PaymentSession", paymentSessionSchema);
