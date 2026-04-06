// =====================================
// OWNER OR ADMIN MIDDLEWARE
// =====================================

const ownerOnly = (req, res, next) => {
  try {
    // Check login
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    // Allow owner OR admin
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Owner only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in owner middleware",
    });
  }
};

module.exports = ownerOnly;
