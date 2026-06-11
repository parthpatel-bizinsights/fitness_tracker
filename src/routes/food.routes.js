const express = require("express");
const {
  logFood,
  getFoodLogsByDate,
  updateFoodLog,
  deleteFoodLog,
  barcodeLookup,
  createRecipe,
  getRecipes,
} = require("../controllers/food.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.route("/")
  .get(getFoodLogsByDate)
  .post(logFood);

router.route("/recipes")
  .get(getRecipes)
  .post(createRecipe);

router.route("/:id")
  .put(updateFoodLog)
  .delete(deleteFoodLog);

router.get("/barcode/:code", barcodeLookup);

module.exports = router;
