const jwt = require("jsonwebtoken");
const { User } = require("../models");
const apiError = require("../../utils/error.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "Access token is missing or invalid"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "your_access_secret_min_32_chars");
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "User not found"));
    }

    if (user.isBanned) {
      return next(new apiError(HTTP_STATUS.FORBIDDEN, HTTP_CODE.FORBIDDEN, "Your account has been suspended. Please contact support."));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new apiError(HTTP_STATUS.INVALID_TOKEN, HTTP_CODE.INVALID_TOKEN, "Access token has expired"));
    }
    return next(new apiError(HTTP_STATUS.UNAUTHORIZED, HTTP_CODE.UNAUTHORIZED, "Invalid access token"));
  }
};

module.exports = authMiddleware;
