const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } = require("sequelize");
const apiError = require("../../utils/error.util.js");
const HTTP_STATUS = require("../../constants/httpStatus.constant.js");
const HTTP_CODE = require("../../constants/httpCode.constant.js");

const errorHandler = (err, req, res, next) => {
  console.error("💥 Error Handler:", err);

  if (err instanceof apiError) {
    return res.status(err.http_status).json({
      http_status: err.http_status,
      http_code: err.http_code,
      message: err.message,
      data: err.data || null,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      http_status: HTTP_STATUS.BAD_REQUEST,
      http_code: HTTP_CODE.VALIDATION,
      message: err.errors.map((e) => e.message).join(", "),
      data: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
        type: e.type,
      })),
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      http_status: HTTP_STATUS.CONFLICT,
      http_code: HTTP_CODE.DATA_EXIST,
      message: "Duplicate entry: " + err.errors.map((e) => e.message).join(", "),
      data: err.fields || null,
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      http_status: HTTP_STATUS.BAD_REQUEST,
      http_code: HTTP_CODE.BAD_REQUEST,
      message: "Foreign key constraint failed.",
      data: {
        table: err.table,
        fields: err.fields,
      },
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      http_status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      http_code: HTTP_CODE.DATABASE_ERROR,
      message: "A database error occurred.",
      data: {
        message: err.message,
      },
    });
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    http_status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    http_code: HTTP_CODE.INTERNAL_SERVER_ERROR,
    message: err.message || "Internal Server Error",
    data: null,
  });
};

module.exports = errorHandler;
