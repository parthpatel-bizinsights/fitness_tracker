const webpush = require("web-push");
const { User } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@aurafit.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

exports.subscribe = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return next(
        new apiError(
          HTTP_STATUS.BAD_REQUEST,
          HTTP_CODE.BAD_REQUEST,
          "Missing subscription",
        ),
      );
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(
        new apiError(
          HTTP_STATUS.NOT_FOUND,
          HTTP_CODE.DATA_NOT_FOUND,
          "User not found",
        ),
      );
    }

    user.pushSubscription = subscription;
    await user.save();

    res
      .status(HTTP_STATUS.OK)
      .json(
        new apiResponse(
          HTTP_STATUS.OK,
          HTTP_CODE.OK,
          "Successfully subscribed to push notifications",
        ),
      );
  } catch (error) {
    next(error);
  }
};

exports.testNotification = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.pushSubscription) {
      return next(
        new apiError(
          HTTP_STATUS.BAD_REQUEST,
          HTTP_CODE.BAD_REQUEST,
          "User has no push subscription",
        ),
      );
    }

    const payload = JSON.stringify({
      title: "Test Notification",
      body: "Push notifications are working perfectly!",
      url: "/dashboard",
    });

    await webpush.sendNotification(user.pushSubscription, payload);

    res
      .status(HTTP_STATUS.OK)
      .json(
        new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Test notification sent"),
      );
  } catch (error) {
    next(error);
  }
};

exports.getVapidKey = (req, res) => {
  res.status(HTTP_STATUS.OK).json(
    new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "VAPID key retrieved", {
      publicKey: process.env.VAPID_PUBLIC_KEY,
    }),
  );
};
