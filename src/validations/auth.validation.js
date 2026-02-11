// Authentication validation schemas
const registerSchema = {
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: "Please provide a valid email address",
  },
  password: {
    isLength: { min: 8 },
    matches: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    errorMessage:
      "Password must be at least 8 characters with uppercase, lowercase, and number",
  },
  full_name: {
    trim: true,
    isLength: { min: 2, max: 100 },
    matches: /^[a-zA-Z\s\-']+$/,
    errorMessage: "Name must be 2-100 characters and contain only letters",
  },
  role: {
    optional: true,
    isIn: ["owner", "manager", "cashier"],
    errorMessage: "Invalid role",
  },
};

const loginSchema = {
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: "Please provide a valid email address",
  },
  password: {
    notEmpty: true,
    errorMessage: "Password is required",
  },
};

const refreshTokenSchema = {
  refreshToken: {
    notEmpty: true,
    errorMessage: "Refresh token is required",
  },
};

const changePasswordSchema = {
  currentPassword: {
    notEmpty: true,
    errorMessage: "Current password is required",
  },
  newPassword: {
    isLength: { min: 8 },
    matches: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    errorMessage:
      "New password must be at least 8 characters with uppercase, lowercase, and number",
  },
};

const updateProfileSchema = {
  full_name: {
    optional: true,
    trim: true,
    isLength: { min: 2, max: 100 },
    matches: /^[a-zA-Z\s\-']+$/,
    errorMessage: "Name must be 2-100 characters and contain only letters",
  },
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
};
