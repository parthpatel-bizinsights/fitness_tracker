const apiError = require("../../utils/error.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    return next(
      new apiError(
        HTTP_STATUS.FORBIDDEN,
        HTTP_CODE.FORBIDDEN,
        "Access denied. Super Admin privileges required."
      )
    );
  }
  next();
};

module.exports = adminMiddleware;
