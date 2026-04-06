// =====================================
// MULTER FILE UPLOAD CONFIG
// =====================================

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsRoot = path.join(__dirname, "..", "uploads");

// =====================================
// CREATE FOLDERS IF NOT EXIST
// =====================================
const createFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Ensure required folders exist
createFolder(path.join(uploadsRoot, "cars"));
createFolder(path.join(uploadsRoot, "before"));
createFolder(path.join(uploadsRoot, "after"));
createFolder(path.join(uploadsRoot, "avatars"));

const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

// =====================================
// STORAGE CONFIGURATION
// =====================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.uploadType || req.body.type;

    if (type === "car") {
      cb(null, path.join(uploadsRoot, "cars"));
    } else if (type === "before") {
      cb(null, path.join(uploadsRoot, "before"));
    } else if (type === "after") {
      cb(null, path.join(uploadsRoot, "after"));
    } else if (type === "avatar") {
      cb(null, path.join(uploadsRoot, "avatars"));
    } else {
      cb(null, uploadsRoot);
    }
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// =====================================
// FILE FILTER (ONLY IMAGES)
// =====================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

module.exports = {
  setUploadType,
  upload,
};
