const authService = require("../services/auth.service");
const {
  success,
  error,
  created,
  unauthorized,
} = require("../utils/apiResponse");
const { AUTH_ERRORS } = require("../utils/errorConstants");

const register = async (req, res) => {
  try {
    const { email, password, fullName, full_name, role, storeId } = req.body;
    console.log(
      "Registration request body:",
      JSON.stringify(req.body, null, 2),
    );
    const result = await authService.register({
      email,
      password,
      fullName: fullName || full_name,
      role,
      storeId,
    });
    res.status(201).json(created(result, "Registration successful"));
  } catch (err) {
    console.error("Registration error:", err.message);

    // Map service errors to appropriate responses
    if (err.message && err.message.includes("already exists")) {
      return res
        .status(409)
        .json(
          error(
            AUTH_ERRORS.ACCOUNT_EXISTS.message,
            AUTH_ERRORS.ACCOUNT_EXISTS.code,
          ),
        );
    }

    res
      .status(400)
      .json(
        error(
          err.message || AUTH_ERRORS.REGISTRATION_FAILED.message,
          AUTH_ERRORS.REGISTRATION_FAILED.code,
        ),
      );
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(success(result, "Login successful"));
  } catch (err) {
    res.status(401).json(unauthorized(err.message));
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(req.userId);
    res.json(success(result, "Token refreshed"));
  } catch (err) {
    res
      .status(401)
      .json(
        error(
          AUTH_ERRORS.INVALID_REFRESH_TOKEN.message,
          AUTH_ERRORS.INVALID_REFRESH_TOKEN.code,
        ),
      );
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout(req.user.id);
    res.json(success(null, "Logged out successfully"));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(success(profile));
  } catch (err) {
    res
      .status(404)
      .json(
        error(
          AUTH_ERRORS.USER_NOT_FOUND.message,
          AUTH_ERRORS.USER_NOT_FOUND.code,
        ),
      );
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const profile = await authService.updateProfile(req.user.id, { fullName });
    res.json(success(profile, "Profile updated"));
  } catch (err) {
    res.status(400).json(error(err.message, "VAL_001"));
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });
    res.json(success(null, "Password changed successfully"));
  } catch (err) {
    if (err.message.includes("incorrect")) {
      return res
        .status(400)
        .json(
          error(
            AUTH_ERRORS.PASSWORD_MISMATCH.message,
            AUTH_ERRORS.PASSWORD_MISMATCH.code,
          ),
        );
    }
    res.status(400).json(error(err.message, "VAL_001"));
  }
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
