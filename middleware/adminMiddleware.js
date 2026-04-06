// =====================================
// ADMIN ONLY MIDDLEWARE
// =====================================

const adminMiddleware = (req, res, next) => {
  try {
    // Check if user exists (from auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    // Check role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in admin middleware",
    });
  }
};

module.exports = adminMiddleware;
