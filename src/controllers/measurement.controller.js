const { BodyMeasurement } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const logMeasurements = async (req, res, next) => {
  try {
    const { date, waistCm, chestCm, hipsCm, armsCm, thighsCm } = req.body;
    if (!date) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "date is required"));
    }

    const log = await BodyMeasurement.create({
      userId: req.user.id,
      date,
      waistCm,
      chestCm,
      hipsCm,
      armsCm,
      thighsCm,
    });

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Measurements logged successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const getMeasurements = async (req, res, next) => {
  try {
    const logs = await BodyMeasurement.findAll({
      where: { userId: req.user.id },
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Measurements retrieved", logs)
    );
  } catch (error) {
    next(error);
  }
};

const updateMeasurement = async (req, res, next) => {
  try {
    const log = await BodyMeasurement.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Measurement log not found"));
    }

    const fields = ["date", "waistCm", "chestCm", "hipsCm", "armsCm", "thighsCm"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        log[field] = req.body[field];
      }
    });

    await log.save();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Measurements updated successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const deleteMeasurement = async (req, res, next) => {
  try {
    const log = await BodyMeasurement.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Measurement log not found"));
    }

    await log.destroy();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Measurement log deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logMeasurements,
  getMeasurements,
  updateMeasurement,
  deleteMeasurement,
};
