// Scanner validation schemas
const { body, validationResult } = require("express-validator");
const { handleValidationErrors } = require("../middleware/validation");

const scanRequestSchema = {
  scan_type: {
    isIn: ["barcode", "image", "both"],
    errorMessage: "Scan type must be barcode, image, or both",
  },
  barcode: {
    optional: true,
    trim: true,
    isLength: { min: 1, max: 50 },
    errorMessage: "Barcode must be 1-50 characters",
  },
  device_id: {
    optional: true,
    trim: true,
    isLength: { max: 100 },
  },
  location: {
    optional: true,
    isObject: true,
    errorMessage: "Location must be an object with lat and lng",
  },
  "location.lat": {
    optional: true,
    isFloat: { min: -90, max: 90 },
    errorMessage: "Invalid latitude",
  },
  "location.lng": {
    optional: true,
    isFloat: { min: -180, max: 180 },
    errorMessage: "Invalid longitude",
  },
};

const bulkScanSchema = {
  items: {
    isArray: { min: 1, max: 50 },
    errorMessage: "Items array must have 1-50 items",
  },
  "items.*.barcode": {
    optional: true,
    trim: true,
    isLength: { max: 50 },
  },
  "items.*.image": {
    optional: true,
    isString: true,
    errorMessage: "Image must be a base64 string",
  },
  device_id: {
    optional: true,
    trim: true,
    isLength: { max: 100 },
  },
};

const quickSaleSchema = {
  items: {
    isArray: { min: 1 },
    errorMessage: "Items array is required",
  },
  "items.*.product_id": {
    isUUID: true,
    errorMessage: "Valid product ID is required",
  },
  "items.*.quantity": {
    isInt: { min: 1 },
    toInt: true,
    errorMessage: "Quantity must be at least 1",
  },
  "items.*.priceOverride": {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
  },
  payment_method: {
    isIn: ["cash", "card", "gcash", "paymaya", "credit"],
    errorMessage: "Invalid payment method",
  },
  discount: {
    optional: true,
    isFloat: { min: 0, max: 100 },
    toFloat: true,
    errorMessage: "Discount must be between 0 and 100",
  },
  customer_id: {
    optional: true,
    isUUID: true,
    errorMessage: "Customer ID must be a valid UUID",
  },
  notes: {
    optional: true,
    trim: true,
    isLength: { max: 500 },
  },
};

const barcodeValidationSchema = {
  barcode: {
    trim: true,
    isLength: { min: 1, max: 50 },
    errorMessage: "Barcode must be 1-50 characters",
  },
};

const imageUploadSchema = {
  type: {
    optional: true,
    isIn: ["product", "barcode"],
    errorMessage: "Type must be product or barcode",
  },
};

// Bulk scan validation
const validateBulkScan = [
  body("items")
    .isArray({ min: 1, max: 50 })
    .withMessage("Items array must have 1-50 items"),
  body("items.*.barcode")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Barcode must be less than 50 characters"),
  body("items.*.image")
    .optional()
    .isString()
    .withMessage("Image must be a base64 string"),
  body("device_id")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Device ID must be less than 100 characters"),
  handleValidationErrors,
];

// Quick sale validation
const validateQuickSale = [
  body("items").isArray({ min: 1 }).withMessage("Items array is required"),
  body("items.*.product_id")
    .isUUID()
    .withMessage("Valid product ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .toInt()
    .withMessage("Quantity must be at least 1"),
  body("items.*.priceOverride")
    .optional()
    .isFloat({ min: 0 })
    .toFloat()
    .withMessage("Price override must be a positive number"),
  body("payment_method")
    .isIn(["cash", "card", "gcash", "paymaya", "credit"])
    .withMessage("Invalid payment method"),
  body("discount")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .toFloat()
    .withMessage("Discount must be between 0 and 100"),
  body("customer_id")
    .optional()
    .isUUID()
    .withMessage("Customer ID must be a valid UUID"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),
  handleValidationErrors,
];

module.exports = {
  scanRequestSchema,
  bulkScanSchema,
  quickSaleSchema,
  barcodeValidationSchema,
  imageUploadSchema,
  validateBulkScan,
  validateQuickSale,
};
