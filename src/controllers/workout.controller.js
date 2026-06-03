const { WorkoutPlan } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const getWorkoutPlans = async (req, res, next) => {
  try {
    const plans = await WorkoutPlan.findAll({ where: { userId: req.user.id } });
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout plans retrieved", plans)
    );
  } catch (error) {
    next(error);
  }
};

const createWorkoutPlan = async (req, res, next) => {
  try {
    const { name, goal, daysPerWeek, isAiGenerated, exercises } = req.body;
    if (!name) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Plan name is required"));
    }

    const plan = await WorkoutPlan.create({
      userId: req.user.id,
      name,
      goal,
      daysPerWeek,
      isAiGenerated: !!isAiGenerated,
      exercises: exercises || [],
    });

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Workout plan created successfully", plan)
    );
  } catch (error) {
    next(error);
  }
};

const getWorkoutPlanById = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!plan) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout plan not found"));
    }
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout plan retrieved", plan)
    );
  } catch (error) {
    next(error);
  }
};

const updateWorkoutPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!plan) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout plan not found"));
    }

    const updates = ["name", "goal", "daysPerWeek", "exercises"];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field];
      }
    });

    await plan.save();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout plan updated successfully", plan)
    );
  } catch (error) {
    next(error);
  }
};

const deleteWorkoutPlan = async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!plan) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Workout plan not found"));
    }

    await plan.destroy();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout plan deleted successfully", null)
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
