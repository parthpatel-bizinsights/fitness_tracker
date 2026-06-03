const express = require("express");
const {
  logMeasurements,
  getMeasurements,
  updateMeasurement,
  deleteMeasurement,
} = require("../controllers/measurement.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getMeasurements)
  .post(logMeasurements);

router.route("/:id")
  .put(updateMeasurement)
  .delete(deleteMeasurement);

module.exports = router;
