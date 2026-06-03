const express = require("express");
const {
  logWeight,
  getWeightLogs,
  updateWeightLog,
  deleteWeightLog,
} = require("../controllers/weight.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getWeightLogs)
  .post(logWeight);

router.route("/:id")
  .put(updateWeightLog)
  .delete(deleteWeightLog);

module.exports = router;
