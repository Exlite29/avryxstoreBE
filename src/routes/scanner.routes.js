const express = require("express");
const router = express.Router();
const scannerController = require("../controllers/scanner.controller");
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

module.exports = router;
