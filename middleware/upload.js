// =====================================
// MULTER FILE UPLOAD CONFIG (CLOUDINARY)
// =====================================

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// =====================================
// SET UPLOAD TYPE (car, avatar, etc.)
// =====================================
const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

// =====================================
// CLOUDINARY STORAGE CONFIG
// =====================================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "general";

    if (req.uploadType === "car") {
      folder = "cars";
    } else if (req.uploadType === "before") {
      folder = "before";
    } else if (req.uploadType === "after") {
      folder = "after";
    } else if (req.uploadType === "avatar") {
      folder = "avatars";
    }

    return {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    };
  },
});

// =====================================
// FILE FILTER (ONLY IMAGES)
// =====================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const ext = allowedTypes.test(file.originalname.toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// =====================================
// MULTER INSTANCE
// =====================================
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

module.exports = {
  setUploadType,
  upload,
};
