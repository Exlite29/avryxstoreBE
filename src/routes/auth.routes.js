const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken, verifyRefreshToken } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");
const {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
} = require("../middleware/validation");

// Public routes
router.post(
  "/register",
  authRateLimiter,
  validateUserRegistration,
  handleValidationErrors,
  authController.register,
);
router.post(
  "/login",
  authRateLimiter,
  validateUserLogin,
  handleValidationErrors,
  authController.login,
);
router.post("/refresh-token", verifyRefreshToken, authController.refreshToken);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);
router.post(
  "/change-password",
  authenticateToken,
  authController.changePassword,
);
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
