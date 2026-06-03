const rateLimit = require("express-rate-limit");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: {
    http_status: HTTP_STATUS.TOO_MANY_REQUESTS,
    http_code: HTTP_CODE.TOO_MANY_REQUESTS,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // increased slightly to be local development friendly
  message: {
    http_status: HTTP_STATUS.TOO_MANY_REQUESTS,
    http_code: HTTP_CODE.TOO_MANY_REQUESTS,
    message: "Too many authentication requests from this IP, please try again after 15 minutes."
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    http_status: HTTP_STATUS.TOO_MANY_REQUESTS,
    http_code: HTTP_CODE.TOO_MANY_REQUESTS,
    message: "Too many AI coaching requests, please try again after an hour."
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter
};
