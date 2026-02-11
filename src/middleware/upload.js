const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Ensure upload directories exist
const ensureDirectories = () => {
  const dirs = ["uploads/temp", "uploads/products", "uploads/barcodes"];

  dirs.forEach((dir) => {
    const fullPath = path.join(__dirname, "..", "..", dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectories();

    let folder = "temp";
    if (req.query.type === "product") {
      folder = "products";
    } else if (req.query.type === "barcode") {
      folder = "barcodes";
    }

    cb(null, path.join(__dirname, "..", "..", "uploads", folder));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|heic/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed (jpeg, jpg, png, webp, heic)"));
};

// File filter for barcodes specifically
const barcodeFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
};

// Upload configuration for general images
const uploadProductImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Max 5 files per request
  },
}).array("images", 5);

// Upload configuration for barcode images
const uploadBarcodeImage = multer({
  storage: storage,
  fileFilter: barcodeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single("image");

// Upload configuration for single image
const uploadSingleImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("image");

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum is 5 files.",
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next();
};

// Clean up temporary files
const cleanupTempFiles = (req) => {
  if (req.files) {
    req.files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    });
  }
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }
};

module.exports = {
  uploadProductImage,
  uploadBarcodeImage,
  uploadSingleImage,
  handleUploadError,
  cleanupTempFiles,
  ensureDirectories,
};
