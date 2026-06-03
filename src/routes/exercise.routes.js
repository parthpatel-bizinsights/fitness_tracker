const express = require("express");
const {
  getExercises,
  getExercisesByCategory,
  getExerciseById,
  getExerciseHistory,
} = require("../controllers/exercise.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getExercises);
router.get("/category/:cat", getExercisesByCategory);
router.get("/:id", getExerciseById);
router.get("/:id/history", getExerciseHistory);

module.exports = router;
