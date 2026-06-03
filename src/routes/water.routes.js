const express = require("express");
const {
  logWater,
  getWaterLogsByDate,
  deleteWaterLog,
} = require("../controllers/water.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getWaterLogsByDate)
  .post(logWater);

router.delete("/:id", deleteWaterLog);

module.exports = router;
