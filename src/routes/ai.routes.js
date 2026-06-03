const express = require("express");
const {
  mealScan,
  generateWorkout,
  coachChat,
  getChatHistory,
  clearChatHistory,
} = require("../controllers/ai.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");
const { aiLimiter } = require("../middlewares/rateLimiter.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/meal-scan", aiLimiter, upload.single("image"), mealScan);
router.post("/generate-workout", aiLimiter, generateWorkout);
router.post("/chat", aiLimiter, coachChat);
router.get("/chat/history", getChatHistory);
router.delete("/chat/history", clearChatHistory);

module.exports = router;
