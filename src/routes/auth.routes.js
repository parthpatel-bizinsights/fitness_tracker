const express = require("express");
const {
  register,
  login,
  verifyEmail,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getCurrentUser: getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  googleAuth,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimiter.middleware");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/verify-email", verifyEmail);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Authenticated routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.patch("/change-password", authMiddleware, changePassword);
router.delete("/account", authMiddleware, deleteAccount);

module.exports = router;
