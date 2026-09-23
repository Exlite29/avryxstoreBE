// Standard API Response Format
// Provides consistent response structure across all API endpoints

/**
 * Success response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {object} meta - Additional metadata
 * @returns {object} Standard success response
 */
const success = (data = null, message = "Success", meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta,
  };
};

/**
 * Error response
 * @param {string} error - Error message
 * @param {string} code - Error code
 * @param {*} details - Additional error details
 * @returns {object} Standard error response
 */
const error = (error, code = null, details = null) => {
  const response = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  if (details !== null) {
    response.details = details;
  }

  return response;
};

/**
 * Paginated response
 * @param {array} data - Array of items
 * @param {object} pagination - Pagination metadata
 * @returns {object} Standard paginated response
 */
const paginated = (data, pagination) => {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < pagination.total,
      hasPrevPage: pagination.page > 1,
    },
  };
};

/**
 * Created response (201)
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {object} Standard created response
 */
const created = (data = null, message = "Resource created successfully") => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * No content response (204)
 * @returns {object} Standard no content response
 */
const noContent = () => {
  return {
    success: true,
  };
};

/**
 * Response with scan metadata
 * @param {*} scanData - Scanned data
 * @param {object} metadata - Scan metadata
 * @returns {object} Standard scanned response
 */
const scanned = (scanData, metadata) => {
  return {
    success: true,
    data: scanData,
    metadata: {
      ...metadata,
      scanTime: new Date().toISOString(),
    },
  };
};

/**
 * Validation error response
 * @param {array} errors - Array of validation errors
 * @returns {object} Standard validation error response
 */
const validationError = (errors) => {
  return {
    success: false,
    error: "Validation failed",
    code: "VAL_001",
    details: errors,
  };
};

/**
 * Unauthorized response
 * @param {string} message - Error message
 * @returns {object} Standard unauthorized response
 */
const unauthorized = (message = "Unauthorized") => {
  return {
    success: false,
    error: message,
    code: "AUTH_000",
  };
};

/**
 * Forbidden response
 * @param {string} message - Error message
 * @returns {object} Standard forbidden response
 */
const forbidden = (message = "Access denied") => {
  return {
    success: false,
    error: message,
    code: "PERM_000",
  };
};

/**
 * Not found response
 * @param {string} message - Error message
 * @returns {object} Standard not found response
 */
const notFound = (message = "Resource not found") => {
  return {
    success: false,
    error: message,
    code: "NOT_FOUND",
  };
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  scanned,
  validationError,
  unauthorized,
  forbidden,
  notFound,
};
