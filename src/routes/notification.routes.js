const express = require("express");
const {
  subscribe,
  testNotification,
  getVapidKey,
} = require("../controllers/notification.controller");
const authenticate = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/vapidPublicKey", authenticate, getVapidKey);
router.post("/subscribe", authenticate, subscribe);
router.post("/test", authenticate, testNotification);

module.exports = router;
