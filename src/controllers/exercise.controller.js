const { Exercise, ExerciseLog, WorkoutSession } = require("../models");
const { Op } = require("sequelize");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const getExercises = async (req, res, next) => {
  try {
    const { search, category, difficulty, page, limit } = req.query;
    const pageIndex = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageIndex - 1) * pageSize;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { muscleGroup: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category && category !== "all") {
      whereClause.category = category;
    }
    if (difficulty && difficulty !== "all") {
      whereClause.difficulty = difficulty;
    }

    const { count, rows } = await Exercise.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset,
      order: [["name", "ASC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercises retrieved", {
        total: count,
        page: pageIndex,
        limit: pageSize,
        exercises: rows,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getExercisesByCategory = async (req, res, next) => {
  try {
    const { cat } = req.params;
    const exercises = await Exercise.findAll({
      where: { category: cat },
      order: [["name", "ASC"]],
    });
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, `Exercises in category ${cat} retrieved`, exercises)
    );
  } catch (error) {
    next(error);
  }
};

const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findByPk(req.params.id);
    if (!exercise) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Exercise not found"));
    }
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercise retrieved", exercise)
    );
  } catch (error) {
    next(error);
  }
};

const getExerciseHistory = async (req, res, next) => {
  try {
    const { id } = req.params; // exercise id
    
    // Find all completed sessions for this user
    const sessions = await WorkoutSession.findAll({
      where: { userId: req.user.id, completed: true },
      attributes: ["id", "date"],
    });

    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return res.status(HTTP_STATUS.OK).json(
        new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercise history retrieved", [])
      );
    }

    // Find exercise logs matching these sessions and this exercise
    const logs = await ExerciseLog.findAll({
      where: {
        workoutSessionId: { [Op.in]: sessionIds },
        exerciseId: id,
      },
      order: [["createdAt", "DESC"]],
    });

    // Map logs to history containing dates
    const sessionMap = new Map(sessions.map((s) => [s.id, s.date]));
    const history = logs.map((log) => ({
      id: log.id,
      date: sessionMap.get(log.workoutSessionId),
      sets: log.sets,
      reps: log.reps,
      weightKg: log.weightKg,
      setData: log.setData,
      notes: log.notes,
    }));

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercise history retrieved", history)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExercises,
  getExercisesByCategory,
  getExerciseById,
  getExerciseHistory,
};
