const authService = require("../services/auth.service");
const { success, error, created } = require("../utils/apiResponse");

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
    res.status(400).json(error(err.message));
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(success(result, "Login successful"));
  } catch (err) {
    res.status(401).json(error(err.message));
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(req.userId);
    res.json(success(result, "Token refreshed"));
  } catch (err) {
    res.status(401).json(error(err.message));
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout(req.user.id);
    res.json(success(null, "Logged out successfully"));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json(success(profile));
  } catch (err) {
    res.status(404).json(error(err.message));
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const profile = await authService.updateProfile(req.user.id, { fullName });
    res.json(success(profile, "Profile updated"));
  } catch (err) {
    res.status(400).json(error(err.message));
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
    res.status(400).json(error(err.message));
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
