const { WorkoutPlan, Exercise } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const getWorkoutPlans = async (req, res, next) => {
  try {
    const plans = await WorkoutPlan.findAll({ where: { userId: req.user.id } });

    // Extract unique exercise IDs
    const exerciseIds = new Set();
    plans.forEach((plan) => {
      if (plan.schedule) {
        plan.schedule.forEach((day) => {
          if (day.exercises) {
            day.exercises.forEach((ex) => exerciseIds.add(ex.exerciseId));
          }
        });
      }
    });

    // Fetch exercises from DB (only valid UUIDs to prevent DB cast errors)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validUuids = Array.from(exerciseIds).filter(id => uuidRegex.test(id));

    const exercises = await Exercise.findAll({
      where: { id: validUuids },
      attributes: ["id", "name", "category"]
    });
    const exMap = {};
    exercises.forEach((e) => (exMap[e.id] = e));

    // Enrich plans with exercise data
    const enrichedPlans = plans.map((p) => {
      const planData = p.toJSON();
      if (planData.schedule) {
        planData.schedule = planData.schedule.map((day) => ({
          ...day,
          exercises: (day.exercises || []).map((ex) => ({
            ...ex,
            exercise: exMap[ex.exerciseId] || null,
            exerciseName: exMap[ex.exerciseId]
              ? exMap[ex.exerciseId].name
              : null,
          })),
        }));
      }
      return planData;
    });

    res
      .status(HTTP_STATUS.OK)
      .json(
        new apiResponse(
          HTTP_STATUS.OK,
          HTTP_CODE.OK,
          "Workout plans retrieved",
          enrichedPlans,
        ),
      );
  } catch (error) {
    next(error);
  }
};

const createWorkoutPlan = async (req, res, next) => {
  try {
    const { name, goal, daysPerWeek, isAiGenerated, schedule } = req.body;
    if (!name) {
      return next(
        new apiError(
          HTTP_STATUS.BAD_REQUEST,
          HTTP_CODE.BAD_REQUEST,
          "Plan name is required",
        ),
      );
    }

    const plan = await WorkoutPlan.create({
      userId: req.user.id,
      name,
      goal,
      daysPerWeek,
      isAiGenerated: !!isAiGenerated,
      schedule: schedule || [],
    });

    res
      .status(HTTP_STATUS.CREATED)
      .json(
        new apiResponse(
          HTTP_STATUS.CREATED,
          HTTP_CODE.CREATED,
          "Workout plan created successfully",
          plan,
        ),
      );
  } catch (error) {
    next(error);
  }
};

const getWorkoutPlanById = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!plan) {
      return next(
        new apiError(
          HTTP_STATUS.NOT_FOUND,
          HTTP_CODE.DATA_NOT_FOUND,
          "Workout plan not found",
        ),
      );
    }
    res
      .status(HTTP_STATUS.OK)
      .json(
        new apiResponse(
          HTTP_STATUS.OK,
          HTTP_CODE.OK,
          "Workout plan retrieved",
          plan,
        ),
      );
  } catch (error) {
    next(error);
  }
};

const updateWorkoutPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!plan) {
      return next(
        new apiError(
          HTTP_STATUS.NOT_FOUND,
          HTTP_CODE.DATA_NOT_FOUND,
          "Workout plan not found",
        ),
      );
    }

    const updates = ["name", "goal", "daysPerWeek", "schedule"];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field];
      }
    });

    await plan.save();
    res
      .status(HTTP_STATUS.OK)
      .json(
        new apiResponse(
          HTTP_STATUS.OK,
          HTTP_CODE.OK,
          "Workout plan updated successfully",
          plan,
        ),
      );
  } catch (error) {
    next(error);
  }
};

const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!plan) {
      return next(
        new apiError(
          HTTP_STATUS.NOT_FOUND,
          HTTP_CODE.DATA_NOT_FOUND,
          "Workout plan not found",
        ),
      );
    }

    await plan.destroy();
    res
      .status(HTTP_STATUS.OK)
      .json(
        new apiResponse(
          HTTP_STATUS.OK,
          HTTP_CODE.OK,
          "Workout plan deleted successfully",
          null,
        ),
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkoutPlans,
  createWorkoutPlan,
  getWorkoutPlanById,
  updateWorkoutPlan,
  deleteWorkoutPlan,
};
