const express = require("express");
const {
  startSession,
  logSet,
  completeSession,
  discardSession,
  getSessionHistory,
  getSessionById,
} = require("../controllers/session.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/start", startSession);
router.get("/history", getSessionHistory);

router.route("/:id")
  .get(getSessionById)
  .delete(discardSession);

router.put("/:id/log-set", logSet);
router.post("/:id/complete", completeSession);

module.exports = router;
