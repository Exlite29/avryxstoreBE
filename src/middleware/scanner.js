const {
  decodeBarcodeFromBuffer,
  isValidBarcode,
} = require("../config/scanner");
const {
  uploadSingleImage,
  handleUploadError,
  cleanupTempFiles,
} = require("./upload");

// Process barcode scan from uploaded image
const processBarcodeImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No image file provided.",
    });
  }

  try {
    const result = await decodeBarcodeFromBuffer(req.file.path);

    if (!result) {
      // Clean up temp file
      cleanupTempFiles(req);
      return res.status(400).json({
        success: false,
        error: "No barcode found in the image.",
        suggestion:
          "Please ensure the barcode is clearly visible and well-lit.",
      });
    }

    if (!isValidBarcode(result.text)) {
      cleanupTempFiles(req);
      return res.status(400).json({
        success: false,
        error: "Invalid barcode format detected.",
        detected: result.text,
        format: result.format,
      });
    }

    req.scannedBarcode = {
      value: result.text,
      format: result.format,
      imagePath: req.file.path,
    };

    next();
  } catch (error) {
    cleanupTempFiles(req);
    console.error("Barcode processing error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process barcode image.",
    });
  }
};

// Validate scan request payload
const validateScanPayload = (req, res, next) => {
  const { scan_type, barcode, image } = req.body;

  if (!scan_type) {
    return res.status(400).json({
      success: false,
      error: "Scan type is required (barcode, image, or both).",
    });
  }

  const validScanTypes = ["barcode", "image", "both"];
  if (!validScanTypes.includes(scan_type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid scan type. Must be one of: ${validScanTypes.join(", ")}`,
    });
  }

  if (scan_type === "barcode" && !barcode) {
    return res.status(400).json({
      success: false,
      error: "Barcode value is required for barcode scan type.",
    });
  }

  if (scan_type === "image" && !req.file && !image) {
    return res.status(400).json({
      success: false,
      error: "Image is required for image scan type.",
    });
  }

  if (scan_type === "both" && !barcode) {
    return res.status(400).json({
      success: false,
      error: 'Barcode value is required when scan_type is "both".',
    });
  }

  next();
};

// Validate bulk scan request
const validateBulkScan = (req, res, next) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      error: "Items array is required for bulk scan.",
    });
  }

  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one item is required for bulk scan.",
    });
  }

  if (items.length > 50) {
    return res.status(400).json({
      success: false,
      error: "Maximum 50 items per bulk scan.",
    });
  }

  // Validate each item
  const invalidItems = items.filter((item) => !item.barcode && !item.image);

  if (invalidItems.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Each item must have at least a barcode or image.",
      invalidCount: invalidItems.length,
    });
  }

  req.bulkItems = items;
  next();
};

// Validate quick sale request
const validateQuickSale = (req, res, next) => {
  const { items, payment_method } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Items array is required for quick sale.",
    });
  }

  const validPaymentMethods = ["cash", "card", "gcash", "paymaya", "credit"];
  if (payment_method && !validPaymentMethods.includes(payment_method)) {
    return res.status(400).json({
      success: false,
      error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(", ")}`,
    });
  }

  // Validate each item has product_id and quantity
  const invalidItems = items.filter(
    (item) => !item.product_id || !item.quantity || item.quantity < 1,
  );

  if (invalidItems.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Each item must have product_id and quantity >= 1.",
    });
  }

  req.quickSaleItems = items;
  next();
};

module.exports = {
  processBarcodeImage,
  validateScanPayload,
  validateBulkScan,
  validateQuickSale,
};
