const rateLimit = require("express-rate-limit");
const {
  rateLimitConfig,
  authRateLimitConfig,
  scannerRateLimitConfig,
} = require("../config/security");

// General API rate limiter
const apiRateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: {
    success: false,
    error: rateLimitConfig.message,
    retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, options) => {
    res.status(429).json(options.message);
  },
});

// Authentication rate limiter (stricter)
const authRateLimiter = rateLimit({
  windowMs: authRateLimitConfig.windowMs,
  max: authRateLimitConfig.max,
  message: {
    success: false,
    error: authRateLimitConfig.message,
    code: "TOO_MANY_ATTEMPTS",
    retryAfter: Math.ceil(authRateLimitConfig.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, options) => {
    res.status(429).json(options.message);
  },
  skip: (req, res) => {
    // Skip rate limiting for OPTIONS requests
    if (req.method === "OPTIONS") {
      return true;
    }
    return false;
  },
});

// Scanner rate limiter (high throughput)
const scannerRateLimiter = rateLimit({
  windowMs: scannerRateLimitConfig.windowMs,
  max: scannerRateLimitConfig.max,
  message: {
    success: false,
    error: scannerRateLimitConfig.message,
    code: "SCAN_RATE_EXCEEDED",
    retryAfter: Math.ceil(scannerRateLimitConfig.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, options) => {
    res.status(429).json(options.message);
  },
});

// Create custom rate limiter
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || "Too many requests",
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip || (() => false),
  });
};

// IP whitelist check (for trusted networks)
const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(",") || [];

// Dynamic rate limiter based on user role
const dynamicRateLimiter = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Skip for whitelisted IPs
  if (whitelist.includes(clientIP)) {
    return next();
  }

  // Apply different limits based on authentication
  if (req.user) {
    // Authenticated users get higher limits
    if (req.user.role === "owner" || req.user.role === "manager") {
      return apiRateLimiter(req, res, next);
    }
    // Regular authenticated users
    return apiRateLimiter(req, res, next);
  }

  // Unauthenticated users
  return apiRateLimiter(req, res, next);
};

module.exports = {
  apiRateLimiter,
  authRateLimiter,
  scannerRateLimiter,
  createRateLimiter,
  dynamicRateLimiter,
};
