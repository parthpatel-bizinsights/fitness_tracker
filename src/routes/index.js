const express = require("express");
const authRoutes = require("./auth.routes");
const workoutRoutes = require("./workout.routes");
const exerciseRoutes = require("./exercise.routes");
const sessionRoutes = require("./session.routes");
const foodRoutes = require("./food.routes");
const waterRoutes = require("./water.routes");
const weightRoutes = require("./weight.routes");
const measurementRoutes = require("./measurement.routes");
const aiRoutes = require("./ai.routes");
const adminRoutes = require("./admin.routes");
const historyRoutes = require("./history.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/workouts", workoutRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/sessions", sessionRoutes);
router.use("/food", foodRoutes);
router.use("/water", waterRoutes);
router.use("/weight", weightRoutes);
router.use("/measurements", measurementRoutes);
router.use("/ai", aiRoutes);
router.use("/admin", adminRoutes);
router.use("/dashboard/history", historyRoutes);

module.exports = router;

