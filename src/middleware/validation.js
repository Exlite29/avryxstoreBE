const { body, param, query, validationResult } = require("express-validator");
const { sanitizeInput } = require("../config/security");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  // Sanitize inputs
  const sanitize = (obj) => {
    if (typeof obj === "string") {
      return sanitizeInput(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

// User validation rules
const validateUserRegistration = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("full_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage(
      "Full name can only contain letters, spaces, hyphens, and apostrophes",
    ),
  body("role")
    .optional()
    .isIn(["owner", "manager", "cashier"])
    .withMessage("Invalid role"),
  handleValidationErrors,
];

const validateUserLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Product validation rules
const validateProduct = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage(
      "Product name is required and must be less than 255 characters",
    ),
  body("barcode")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Barcode must be less than 50 characters"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Category must be less than 100 characters"),
  body("unit_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number")
    .toFloat(),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number")
    .toFloat()
    .custom((value, { req }) => {
      if (!req.body.unit_price) {
        req.body.unit_price = value;
      }
      return true;
    }),
  body("wholesale_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Wholesale price must be a positive number"),
  body("stock_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer")
    .toInt(),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer")
    .toInt()
    .custom((value, { req }) => {
      if (!req.body.stock_quantity) {
        req.body.stock_quantity = value;
      }
      return true;
    }),
  body("low_stock_threshold")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Low stock threshold must be a non-negative integer"),
  handleValidationErrors,
];

// Scanner validation rules
const validateBarcode = [
  param("barcode")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Barcode is required and must be less than 50 characters"),
  handleValidationErrors,
];

const validateScanRequest = [
  body("scan_type")
    .isIn(["barcode", "image", "both"])
    .withMessage("Scan type must be barcode, image, or both"),
  body("barcode")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Barcode must be less than 50 characters"),
  handleValidationErrors,
];

// Sales validation rules
const validateSale = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.product_id")
    .isUUID()
    .withMessage("Valid product ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("payment_method")
    .isIn(["cash", "card", "gcash", "paymaya", "credit"])
    .withMessage("Invalid payment method"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a non-negative number"),
  handleValidationErrors,
];

// Pagination validation
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  handleValidationErrors,
];

// UUID validation
const validateUUID = (paramName) => [
  param(paramName).isUUID().withMessage(`Invalid ${paramName}`),
  handleValidationErrors,
];

// Date range validation
const validateDateRange = [
  query("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  query("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateBarcode,
  validateScanRequest,
  validateSale,
  validatePagination,
  validateUUID,
  validateDateRange,
};
