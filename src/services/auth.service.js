const { initializeDatabase } = require("../config/database");
const { hashPassword, comparePassword } = require("../config/security");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/auth");

// We'll initialize the database connection when needed
let db;

const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

const register = async ({
  email,
  password,
  fullName,
  role = "owner",
  storeId,
}) => {
  const database = await initializeDb();

  // Check if user already exists
  const existingUser = await database.all(
    "SELECT id FROM users WHERE email = ?",
    [email.toLowerCase()]
  );

  if (existingUser.length > 0) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = await database.run(
    `INSERT INTO users (email, password_hash, full_name, role, store_id)
     VALUES (?, ?, ?, ?, ?)`,
    [email.toLowerCase(), passwordHash, fullName, role, storeId]
  );

  // Get the created user
  const userResult = await database.get(
    `SELECT id, email, full_name, role, store_id, is_active, created_at
     FROM users WHERE id = ?`,
    [result.lastID]
  );

  // Generate tokens
  const accessToken = generateAccessToken(userResult);
  const refreshToken = generateRefreshToken(userResult);

  return {
    user: {
      id: userResult.id,
      email: userResult.email,
      fullName: userResult.full_name,
      role: userResult.role,
      storeId: userResult.store_id,
    },
    accessToken,
    refreshToken,
  };
};

const login = async ({ email, password }) => {
  const database = await initializeDb();

  // Find user
  const user = await database.get(
    "SELECT id, email, password_hash, full_name, role, store_id, is_active FROM users WHERE email = ?",
    [email.toLowerCase()]
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.is_active) {
    throw new Error("Account is deactivated");
  }

  // Verify password
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      storeId: user.store_id,
    },
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (userId) => {
  const database = await initializeDb();

  const user = await database.get(
    "SELECT id, email, full_name, role, store_id, is_active FROM users WHERE id = ?",
    [userId]
  );

  if (!user || !user.is_active) {
    throw new Error("Invalid refresh token");
  }

  const accessToken = generateAccessToken(user);

  return { accessToken };
};

const logout = async (userId) => {
  // In a production app, you might want to blacklist the token
  // For now, just return success
  return { message: "Logged out successfully" };
};

const getProfile = async (userId) => {
  const database = await initializeDb();

  const user = await database.get(
    `SELECT id, email, full_name, role, store_id, is_active, created_at, updated_at
     FROM users WHERE id = ?`,
    [userId]
  );

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    storeId: user.store_id,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

const updateProfile = async (userId, { fullName }) => {
  const database = await initializeDb();

  await database.run(
    `UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [fullName, userId]
  );

  const user = await database.get(
    `SELECT id, email, full_name, role, store_id, is_active
     FROM users WHERE id = ?`,
    [userId]
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const database = await initializeDb();

  const user = await database.get(
    "SELECT password_hash FROM users WHERE id = ?",
    [userId]
  );

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await comparePassword(
    currentPassword,
    user.password_hash
  );
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  const newPasswordHash = await hashPassword(newPassword);
  await database.run(
    "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [newPasswordHash, userId]
  );

  return { message: "Password changed successfully" };
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};