const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_ROUNDS = 12;

// Hash password using bcrypt
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Compare password with hash
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Encrypt sensitive data
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(
      process.env.ENCRYPTION_KEY || "this-is-a-32-byte-encryption-key!!",
    ),
    iv,
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
    authTag: authTag.toString("hex"),
  };
};

// Decrypt sensitive data
const decrypt = (encryptedObj) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(
      process.env.ENCRYPTION_KEY || "this-is-a-32-byte-encryption-key!!",
    ),
    Buffer.from(encryptedObj.iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, "hex"));

  let decrypted = decipher.update(encryptedObj.encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Generate secure random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Generate secure random number in range
const generateSecureRandom = (min, max) => {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const randomValue = parseInt(
    crypto.randomBytes(bytesNeeded).toString("hex"),
    16,
  );
  return min + (randomValue % range);
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (input) => {
  if (typeof input !== "string") {
    return input;
  }

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
};

// Stricter rate limit for auth endpoints
const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
};

// Even stricter rate limit for scanner endpoints
const scannerRateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 scan requests per minute
  message: "Too many scan requests, please slow down.",
};

// Role permissions
const rolePermissions = {
  owner: [
    "manage_users",
    "manage_products",
    "manage_inventory",
    "manage_sales",
    "view_reports",
    "manage_settings",
    "manage_scanner",
  ],
  manager: [
    "manage_products",
    "manage_inventory",
    "manage_sales",
    "view_reports",
    "manage_scanner",
  ],
  cashier: ["manage_sales", "view_reports", "use_scanner"],
};

// Check if role has permission
const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
  generateToken,
  generateSecureRandom,
  sanitizeInput,
  rateLimitConfig,
  authRateLimitConfig,
  scannerRateLimitConfig,
  rolePermissions,
  hasPermission,
  ALGORITHM,
  IV_LENGTH,
};
