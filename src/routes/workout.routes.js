const express = require("express");
const {
  getWorkoutPlans,
  createWorkoutPlan,
  getWorkoutPlanById,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} = require("../controllers/workout.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getWorkoutPlans)
  .post(createWorkoutPlan);

router.route("/:id")
  .get(getWorkoutPlanById)
  .put(updateWorkoutPlan)
  .delete(deleteWorkoutPlan);

module.exports = router;
