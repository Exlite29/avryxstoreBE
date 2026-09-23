const { error: apiError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

// Custom Error Class for API Errors
class ApiError extends Error {
  constructor(errorInfo) {
    super(errorInfo.message);
    this.code = errorInfo.code;
    this.statusCode = errorInfo.statusCode;
    this.details = errorInfo.details || null;
    this.name = "ApiError";
  }

  toJSON() {
    return apiError(this.message, this.code, this.details);
  }
}

// Helper to create error response
const createError = (errorInfo, details = null) => {
  const err = new ApiError(errorInfo);
  if (details) {
    err.details = details;
  }
  return err;
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    code: err.code || "UNKNOWN",
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Prisma errors
  if (err.code && err.code.startsWith("P")) {
    const prismaErrors = {
      P2002: {
        code: "DB_CONSTRAINT",
        message: "A record with this value already exists.",
        statusCode: 409,
      },
      P2025: {
        code: "DB_NOT_FOUND",
        message: "Record not found.",
        statusCode: 404,
      },
    };

    const prismaError = prismaErrors[err.code] || {
      code: "DB_ERROR",
      message: "Database operation failed.",
      statusCode: 500,
    };

    return res.status(prismaError.statusCode).json(
      apiError(prismaError.message, prismaError.code, {
        prismaCode: err.code,
        meta: err.meta,
      }),
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(apiError("Invalid token.", "AUTH_002"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(apiError("Token expired.", "AUTH_003"));
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === "function") {
    return res.status(400).json(
      apiError("Validation failed.", "VAL_001", {
        details: err.array(),
      }),
    );
  }

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json(apiError("File too large.", "VAL_009"));
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json(apiError("Too many files.", "VAL_009"));
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err.message;

  res.status(statusCode).json(
    apiError(message, "SRV_001", {
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    }),
  );
};

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  createError,
  errorHandler,
  asyncHandler,
};
