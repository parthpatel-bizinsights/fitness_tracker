const { WorkoutSession, FoodLog, WaterLog, WeightLog, BodyMeasurement, ExerciseLog, Exercise } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");
const { Op } = require("sequelize");

const getUnifiedHistory = async (req, res, next) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    let dateFilter = {};
    if (date) {
      dateFilter = { date };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const pastDateString = thirtyDaysAgo.toISOString().split("T")[0];
      
      dateFilter = {
        date: {
          [Op.gte]: pastDateString,
        },
      };
    }

    // Note: FoodLog uses 'mealDate', others use 'date'
    const foodDateFilter = date 
      ? { mealDate: date } 
      : { mealDate: { [Op.gte]: dateFilter.date[Op.gte] } };

    // Run queries concurrently
    const [workouts, food, water, weight, measurements] = await Promise.all([
      WorkoutSession.findAll({
        where: { userId, ...dateFilter },
        include: [{
          model: ExerciseLog,
          as: "exerciseLogs",
          include: [{ model: Exercise, as: "exercise" }]
        }],
        order: [["date", "DESC"]],
      }),
      FoodLog.findAll({
        where: { userId, ...foodDateFilter },
        order: [["mealDate", "DESC"]],
      }),
      WaterLog.findAll({
        where: { userId, ...dateFilter },
        order: [["date", "DESC"]],
      }),
      WeightLog.findAll({
        where: { userId, ...dateFilter },
        order: [["date", "DESC"]],
      }),
      BodyMeasurement.findAll({
        where: { userId, ...dateFilter },
        order: [["date", "DESC"]],
      }),
    ]);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Unified history retrieved", {
        workouts,
        food,
        water,
        weight,
        measurements
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnifiedHistory,
};
