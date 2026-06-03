const { WaterLog } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");
const { updateStreak } = require("../helpers/streakCalc");

const logWater = async (req, res, next) => {
  try {
    const { amountMl, date } = req.body;
    if (!amountMl || !date) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "amountMl and date are required"));
    }

    const log = await WaterLog.create({
      userId: req.user.id,
      amountMl,
      date,
    });

    await updateStreak(req.user);

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Water logged successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const getWaterLogsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Date (YYYY-MM-DD) is required"));
    }

    const logs = await WaterLog.findAll({
      where: { userId: req.user.id, date },
      order: [["createdAt", "ASC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Water logs retrieved", logs)
    );
  } catch (error) {
    next(error);
  }
};

const deleteWaterLog = async (req, res, next) => {
  try {
    const log = await WaterLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Water log not found"));
    }
    await log.destroy();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Water log deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logWater,
  getWaterLogsByDate,
  deleteWaterLog,
};
