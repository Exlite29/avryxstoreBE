const express = require("express");
const router = express.Router();
const scannerController = require("../controllers/scanner.controller");
const visualRecognitionController = require("../controllers/visual-recognition.controller");
const { authenticateToken, requirePermission } = require("../middleware/auth");
const { scannerRateLimiter } = require("../middleware/rateLimiter");
const {
  uploadBarcodeImage,
  handleUploadError,
  uploadSingleImage,
} = require("../middleware/upload");
const {
  validateBulkScan,
  validateQuickSale,
} = require("../validations/scanner.validation");
const { handleValidationErrors } = require("../middleware/validation");

// All scanner routes require authentication and scanner permission
router.use(authenticateToken);
router.use(requirePermission("use_scanner"));

// Barcode scanning
router.post(
  "/barcode",
  scannerRateLimiter,
  handleValidationErrors,
  scannerController.scanBarcode,
);

// Image scanning
router.post(
  "/image",
  scannerRateLimiter,
  uploadSingleImage,
  handleUploadError,
  scannerController.scanImage,
);

// Bulk scanning
router.post(
  "/bulk-scan",
  scannerRateLimiter,
  validateBulkScan,
  handleValidationErrors,
  scannerController.bulkScan,
);

// Quick sale
router.post(
  "/quick-sale",
  scannerRateLimiter,
  validateQuickSale,
  handleValidationErrors,
  scannerController.quickSale,
);

// Scan history
router.get("/history", scannerController.getScanHistory);

// ============================================
// Visual Recognition Routes (AI Product Recognition)
// ============================================

// Recognize product from uploaded image
router.post(
  "/visual-recognize",
  scannerRateLimiter,
  uploadSingleImage,
  handleUploadError,
  handleValidationErrors,
  visualRecognitionController.recognizeProduct,
);

// Recognize product from base64 image
router.post(
  "/visual-recognize/base64",
  scannerRateLimiter,
  handleValidationErrors,
  visualRecognitionController.recognizeProductBase64,
);

// Train product recognition with images
router.post(
  "/visual-recognize/train/:productId",
  scannerRateLimiter,
  requirePermission("manage_inventory"),
  handleValidationErrors,
  visualRecognitionController.trainProduct,
);

// Get suggestions based on visual analysis
router.get(
  "/visual-recognize/suggestions",
  scannerRateLimiter,
  visualRecognitionController.getSuggestions,
);

// Search products by category
router.get(
  "/visual-recognize/category",
  scannerRateLimiter,
  visualRecognitionController.searchByCategory,
);

module.exports = router;
