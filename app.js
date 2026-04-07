// =====================================
// IMPORTS
// =====================================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// ROUTES
const carRoutes = require("./routes/cars");
const bookingRoutes = require("./routes/bookings");
const userRoutes = require("./routes/users");
const serviceRoutes = require("./routes/services");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");

// =====================================
// APP INIT
// =====================================
const app = express();
const clientDistPath = path.join(__dirname, "client", "dist");
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// =====================================
// DATABASE CONNECTION
// =====================================
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });

// =====================================
// MIDDLEWARE
// =====================================
app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// =====================================
// STATIC FILES
// =====================================
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================================
// ROUTES
// =====================================
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV || "development",
  });
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// =====================================
// HEALTH CHECK
// =====================================
app.get("/", (req, res) => {
  res.send("🚗 DriveEase Backend Running...");
});

// =====================================
// GLOBAL ERROR HANDLER
// =====================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
  });
});

// =====================================
// SERVER START
// =====================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
