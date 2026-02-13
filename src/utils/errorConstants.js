// Error Codes and Messages Constants
// Organized by module for easy maintenance

// ==================== AUTH ERRORS ====================
const AUTH_ERRORS = {
  // Authentication
  NO_TOKEN: {
    code: "AUTH_001",
    message: "Access denied. No token provided.",
    statusCode: 401,
  },
  INVALID_TOKEN: {
    code: "AUTH_002",
    message: "Invalid token.",
    statusCode: 403,
  },
  TOKEN_EXPIRED: {
    code: "AUTH_003",
    message: "Token expired.",
    statusCode: 401,
  },
  INVALID_CREDENTIALS: {
    code: "AUTH_004",
    message: "Invalid email or password.",
    statusCode: 401,
  },
  USER_NOT_FOUND: {
    code: "AUTH_005",
    message: "User not found.",
    statusCode: 404,
  },
  USER_DEACTIVATED: {
    code: "AUTH_006",
    message: "User account is deactivated.",
    statusCode: 401,
  },
  INVALID_REFRESH_TOKEN: {
    code: "AUTH_007",
    message: "Invalid refresh token.",
    statusCode: 403,
  },
  REFRESH_TOKEN_REQUIRED: {
    code: "AUTH_008",
    message: "Refresh token required.",
    statusCode: 401,
  },
  ACCOUNT_EXISTS: {
    code: "AUTH_009",
    message: "An account with this email already exists.",
    statusCode: 409,
  },
  REGISTRATION_FAILED: {
    code: "AUTH_010",
    message: "Registration failed. Please try again.",
    statusCode: 400,
  },
  PASSWORD_MISMATCH: {
    code: "AUTH_011",
    message: "Current password is incorrect.",
    statusCode: 400,
  },
  PASSWORD_TOO_WEAK: {
    code: "AUTH_012",
    message: "Password does not meet security requirements.",
    statusCode: 400,
  },
};

// ==================== PERMISSION ERRORS ====================
const PERMISSION_ERRORS = {
  AUTHENTICATION_REQUIRED: {
    code: "PERM_001",
    message: "Authentication required.",
    statusCode: 401,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: "PERM_002",
    message: "Insufficient permissions to perform this action.",
    statusCode: 403,
  },
  PERMISSION_DENIED: {
    code: "PERM_003",
    message: "You do not have permission to perform this action.",
    statusCode: 403,
  },
  ROLE_NOT_ALLOWED: {
    code: "PERM_004",
    message: "Your role does not allow this action.",
    statusCode: 403,
  },
};

// ==================== VALIDATION ERRORS ====================
const VALIDATION_ERRORS = {
  VALIDATION_FAILED: {
    code: "VAL_001",
    message: "Validation failed.",
    statusCode: 400,
  },
  MISSING_REQUIRED_FIELD: {
    code: "VAL_002",
    message: "Required field is missing.",
    statusCode: 400,
  },
  INVALID_EMAIL: {
    code: "VAL_003",
    message: "Please provide a valid email address.",
    statusCode: 400,
  },
  INVALID_PASSWORD: {
    code: "VAL_004",
    message:
      "Password must be at least 8 characters and contain uppercase, lowercase, and number.",
    statusCode: 400,
  },
  INVALID_UUID: {
    code: "VAL_005",
    message: "Invalid ID format.",
    statusCode: 400,
  },
  INVALID_DATE: {
    code: "VAL_006",
    message: "Invalid date format.",
    statusCode: 400,
  },
  INVALID_PAGINATION: {
    code: "VAL_007",
    message: "Invalid pagination parameters.",
    statusCode: 400,
  },
  INVALID_FILE_TYPE: {
    code: "VAL_008",
    message: "Invalid file type.",
    statusCode: 400,
  },
  FILE_TOO_LARGE: {
    code: "VAL_009",
    message: "File size exceeds maximum limit.",
    statusCode: 400,
  },
};

// ==================== PRODUCT ERRORS ====================
const PRODUCT_ERRORS = {
  PRODUCT_NOT_FOUND: {
    code: "PROD_001",
    message: "Product not found.",
    statusCode: 404,
  },
  PRODUCT_CREATE_FAILED: {
    code: "PROD_002",
    message: "Failed to create product.",
    statusCode: 400,
  },
  PRODUCT_UPDATE_FAILED: {
    code: "PROD_003",
    message: "Failed to update product.",
    statusCode: 400,
  },
  PRODUCT_DELETE_FAILED: {
    code: "PROD_004",
    message: "Failed to delete product.",
    statusCode: 400,
  },
  BARCODE_EXISTS: {
    code: "PROD_005",
    message: "A product with this barcode already exists.",
    statusCode: 409,
  },
  INVALID_STOCK_QUANTITY: {
    code: "PROD_006",
    message: "Stock quantity must be a non-negative number.",
    statusCode: 400,
  },
  INSUFFICIENT_STOCK: {
    code: "PROD_007",
    message: "Insufficient stock available.",
    statusCode: 400,
  },
  LOW_STOCK: {
    code: "PROD_008",
    message: "Warning: Stock is running low.",
    statusCode: 200,
  },
  CATEGORY_NOT_FOUND: {
    code: "PROD_009",
    message: "Category not found.",
    statusCode: 404,
  },
};

// ==================== SALES ERRORS ====================
const SALES_ERRORS = {
  SALE_NOT_FOUND: {
    code: "SALE_001",
    message: "Sale not found.",
    statusCode: 404,
  },
  SALE_CREATE_FAILED: {
    code: "SALE_002",
    message: "Failed to create sale.",
    statusCode: 400,
  },
  SALE_UPDATE_FAILED: {
    code: "SALE_003",
    message: "Failed to update sale.",
    statusCode: 400,
  },
  SALE_CANCEL_FAILED: {
    code: "SALE_004",
    message: "Failed to cancel sale.",
    statusCode: 400,
  },
  EMPTY_CART: {
    code: "SALE_005",
    message: "Cart cannot be empty.",
    statusCode: 400,
  },
  INVALID_PAYMENT_METHOD: {
    code: "SALE_006",
    message: "Invalid payment method.",
    statusCode: 400,
  },
  PAYMENT_FAILED: {
    code: "SALE_007",
    message: "Payment processing failed.",
    statusCode: 400,
  },
  TRANSACTION_FAILED: {
    code: "SALE_008",
    message: "Transaction failed. Please try again.",
    statusCode: 400,
  },
};

// ==================== INVENTORY ERRORS ====================
const INVENTORY_ERRORS = {
  INVENTORY_NOT_FOUND: {
    code: "INV_001",
    message: "Inventory record not found.",
    statusCode: 404,
  },
  INVENTORY_UPDATE_FAILED: {
    code: "INV_002",
    message: "Failed to update inventory.",
    statusCode: 400,
  },
  ADJUSTMENT_FAILED: {
    code: "INV_003",
    message: "Failed to adjust inventory.",
    statusCode: 400,
  },
  NEGATIVE_STOCK: {
    code: "INV_004",
    message: "Cannot reduce stock below zero.",
    statusCode: 400,
  },
  TRANSFER_FAILED: {
    code: "INV_005",
    message: "Failed to transfer inventory.",
    statusCode: 400,
  },
};

// ==================== SCANNER ERRORS ====================
const SCANNER_ERRORS = {
  SCAN_FAILED: {
    code: "SCAN_001",
    message: "Scan operation failed.",
    statusCode: 400,
  },
  BARCODE_NOT_FOUND: {
    code: "SCAN_002",
    message: "Barcode not recognized.",
    statusCode: 404,
  },
  INVALID_BARCODE: {
    code: "SCAN_003",
    message: "Invalid barcode format.",
    statusCode: 400,
  },
  IMAGE_PROCESSING_FAILED: {
    code: "SCAN_004",
    message: "Failed to process image.",
    statusCode: 400,
  },
  OCR_FAILED: {
    code: "SCAN_005",
    message: "Failed to extract text from image.",
    statusCode: 400,
  },
  CAMERA_ERROR: {
    code: "SCAN_006",
    message: "Camera access error.",
    statusCode: 400,
  },
  SCAN_TYPE_INVALID: {
    code: "SCAN_007",
    message: "Invalid scan type.",
    statusCode: 400,
  },
};

// ==================== DATABASE ERRORS ====================
const DATABASE_ERRORS = {
  CONNECTION_FAILED: {
    code: "DB_001",
    message: "Database connection failed.",
    statusCode: 503,
  },
  QUERY_FAILED: {
    code: "DB_002",
    message: "Database operation failed.",
    statusCode: 500,
  },
  TRANSACTION_FAILED: {
    code: "DB_003",
    message: "Transaction failed.",
    statusCode: 500,
  },
  CONSTRAINT_VIOLATION: {
    code: "DB_004",
    message: "Database constraint violation.",
    statusCode: 400,
  },
};

// ==================== SERVER ERRORS ====================
const SERVER_ERRORS = {
  INTERNAL_ERROR: {
    code: "SRV_001",
    message: "An unexpected error occurred. Please try again later.",
    statusCode: 500,
  },
  NOT_IMPLEMENTED: {
    code: "SRV_002",
    message: "This feature is not implemented yet.",
    statusCode: 501,
  },
  SERVICE_UNAVAILABLE: {
    code: "SRV_003",
    message: "Service temporarily unavailable.",
    statusCode: 503,
  },
  RATE_LIMIT_EXCEEDED: {
    code: "SRV_004",
    message: "Too many requests. Please slow down.",
    statusCode: 429,
  },
};

// ==================== EXPORTS ====================
module.exports = {
  AUTH_ERRORS,
  PERMISSION_ERRORS,
  VALIDATION_ERRORS,
  PRODUCT_ERRORS,
  SALES_ERRORS,
  INVENTORY_ERRORS,
  SCANNER_ERRORS,
  DATABASE_ERRORS,
  SERVER_ERRORS,
};
