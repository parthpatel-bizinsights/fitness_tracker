const express = require("express");
const { getUnifiedHistory } = require("../controllers/history.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getUnifiedHistory);

module.exports = router;
