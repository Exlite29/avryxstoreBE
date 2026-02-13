const jwt = require("jsonwebtoken");
const { initializeDatabase } = require("../config/database");
const {
  error: apiError,
  unauthorized,
  forbidden,
} = require("../utils/apiResponse");
const { AUTH_ERRORS, PERMISSION_ERRORS } = require("../utils/errorConstants");

const JWT_SECRET =
  process.env.JWT_SECRET || "my-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "my-refresh-secret-key-change-in-production";

// We'll initialize the database connection when needed
let db;

const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json(unauthorized(AUTH_ERRORS.NO_TOKEN.message));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Initialize database connection
    const database = await initializeDb();

    // Verify user still exists and is active
    const userResult = await database.get(
      "SELECT id, email, role, store_id, is_active FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (!userResult) {
      return res
        .status(401)
        .json(unauthorized(AUTH_ERRORS.USER_NOT_FOUND.message));
    }

    const user = userResult;

    if (!user.is_active) {
      return res
        .status(401)
        .json(unauthorized(AUTH_ERRORS.USER_DEACTIVATED.message));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.store_id,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(
          apiError(
            AUTH_ERRORS.TOKEN_EXPIRED.message,
            AUTH_ERRORS.TOKEN_EXPIRED.code,
          ),
        );
    }

    return res
      .status(403)
      .json(
        apiError(
          AUTH_ERRORS.INVALID_TOKEN.message,
          AUTH_ERRORS.INVALID_TOKEN.code,
        ),
      );
  }
};

// Verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .json(
        apiError(
          AUTH_ERRORS.REFRESH_TOKEN_REQUIRED.message,
          AUTH_ERRORS.REFRESH_TOKEN_REQUIRED.code,
        ),
      );
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Initialize database connection
    const database = await initializeDb();

    const userResult = await database.get(
      "SELECT id, email, role, is_active FROM users WHERE id = ?",
      [decoded.userId],
    );

    if (!userResult || !userResult.is_active) {
      return res
        .status(403)
        .json(
          apiError(
            AUTH_ERRORS.INVALID_REFRESH_TOKEN.message,
            AUTH_ERRORS.INVALID_REFRESH_TOKEN.code,
          ),
        );
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res
      .status(403)
      .json(
        apiError(
          AUTH_ERRORS.INVALID_REFRESH_TOKEN.message,
          AUTH_ERRORS.INVALID_REFRESH_TOKEN.code,
        ),
      );
  }
};

// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json(forbidden(PERMISSION_ERRORS.AUTHENTICATION_REQUIRED.message));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(forbidden(PERMISSION_ERRORS.INSUFFICIENT_PERMISSIONS.message));
    }

    next();
  };
};

// Check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json(forbidden(PERMISSION_ERRORS.AUTHENTICATION_REQUIRED.message));
    }

    // Owners have all permissions
    if (req.user.role === "owner") {
      return next();
    }

    // Check role permissions
    const { hasPermission } = require("../config/security");
    if (!hasPermission(req.user.role, permission)) {
      return res
        .status(403)
        .json(
          apiError(
            `${PERMISSION_ERRORS.PERMISSION_DENIED.message}: ${permission}`,
            PERMISSION_ERRORS.PERMISSION_DENIED.code,
          ),
        );
    }

    next();
  };
};

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

module.exports = {
  authenticateToken,
  verifyRefreshToken,
  requireRole,
  requirePermission,
  generateAccessToken,
  generateRefreshToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
};
