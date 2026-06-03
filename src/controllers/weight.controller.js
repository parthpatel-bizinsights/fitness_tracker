const { WeightLog } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const logWeight = async (req, res, next) => {
  try {
    const { weightKg, note, date } = req.body;
    if (!weightKg || !date) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "weightKg and date are required"));
    }

    const log = await WeightLog.create({
      userId: req.user.id,
      weightKg,
      note,
      date,
    });

    // Sync user model weight
    req.user.currentWeight = weightKg;
    await req.user.save();

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Weight logged successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const getWeightLogs = async (req, res, next) => {
  try {
    const logs = await WeightLog.findAll({
      where: { userId: req.user.id },
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Weight logs retrieved", logs)
    );
  } catch (error) {
    next(error);
  }
};

const updateWeightLog = async (req, res, next) => {
  try {
    const log = await WeightLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Weight log not found"));
    }

    if (req.body.weightKg !== undefined) {
      log.weightKg = req.body.weightKg;
      req.user.currentWeight = req.body.weightKg;
      await req.user.save();
    }
    if (req.body.note !== undefined) log.note = req.body.note;
    if (req.body.date !== undefined) log.date = req.body.date;

    await log.save();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Weight log updated successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const deleteWeightLog = async (req, res, next) => {
  try {
    const log = await WeightLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Weight log not found"));
    }

    await log.destroy();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Weight log deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logWeight,
  getWeightLogs,
  updateWeightLog,
  deleteWeightLog,
};
