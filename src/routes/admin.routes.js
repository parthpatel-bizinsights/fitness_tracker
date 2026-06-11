const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const {
  getDashboardStats,
  getPlatformAnalytics,
  getAllUsers,
  getUserDetail,
  updateUserRole,
  toggleUserBan,
  deleteUser,
  getAllExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  getAiUsage,
  updateSubscription,
} = require("../controllers/admin.controller");

const router = express.Router();

// All admin routes require auth + superadmin role
router.use(authMiddleware, adminMiddleware);

// ── Dashboard & Analytics ──────────────────────────────
router.get("/stats", getDashboardStats);
router.get("/analytics", getPlatformAnalytics);
router.get("/ai-usage", getAiUsage);

// ── User Management ────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/ban", toggleUserBan);
router.patch("/users/:id/subscription", updateSubscription);
router.delete("/users/:id", deleteUser);

// ── Exercise Management (CRUD) ─────────────────────────
router.get("/exercises", getAllExercises);
router.post("/exercises", createExercise);
router.put("/exercises/:id", updateExercise);
router.delete("/exercises/:id", deleteExercise);

module.exports = router;
