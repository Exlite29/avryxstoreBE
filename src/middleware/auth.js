const jwt = require("jsonwebtoken");
const { initializeDatabase } = require("../config/database");

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
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
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
      return res.status(401).json({
        success: false,
        error: "User not found.",
      });
    }

    const user = userResult;

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: "User account is deactivated.",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.store_id,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(403).json({
      success: false,
      error: "Invalid token.",
    });
  }
};

// Verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: "Refresh token required.",
    });
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
      return res.status(403).json({
        success: false,
        error: "Invalid refresh token.",
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid refresh token.",
    });
  }
};

// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions.",
      });
    }

    next();
  };
};

// Check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    // Owners have all permissions
    if (req.user.role === "owner") {
      return next();
    }

    // Check role permissions
    const { hasPermission } = require("../config/security");
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permission}`,
      });
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
