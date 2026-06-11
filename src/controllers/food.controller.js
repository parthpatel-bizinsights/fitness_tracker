const { FoodLog, Recipe } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");
const { updateStreak } = require("../helpers/streakCalc");

const logFood = async (req, res, next) => {
  try {
    const { mealName, mealType, calories, protein, carbs, fats, fiber, sugar, sodium, imageUrl, barcode, mealDate, recipeId } = req.body;
    if (!mealName || !mealType || !mealDate) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "mealName, mealType, and mealDate are required"));
    }

    const log = await FoodLog.create({
      userId: req.user.id,
      mealName,
      mealType,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fats: fats || 0,
      fiber: fiber || 0,
      sugar: sugar || 0,
      sodium: sodium || 0,
      imageUrl,
      barcode,
      mealDate,
    });

    // Update streak for activity
    await updateStreak(req.user);

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Food log created successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const getFoodLogsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Date parameter (YYYY-MM-DD) is required"));
    }

    const logs = await FoodLog.findAll({
      where: { userId: req.user.id, mealDate: date },
      order: [["createdAt", "ASC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Food logs retrieved", logs)
    );
  } catch (error) {
    next(error);
  }
};

const updateFoodLog = async (req, res, next) => {
  try {
    const log = await FoodLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Food log not found"));
    }

    const fields = ["mealName", "mealType", "calories", "protein", "carbs", "fats", "fiber", "sugar", "sodium", "imageUrl", "barcode", "mealDate"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        log[field] = req.body[field];
      }
    });

    await log.save();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Food log updated successfully", log)
    );
  } catch (error) {
    next(error);
  }
};

const deleteFoodLog = async (req, res, next) => {
  try {
    const log = await FoodLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Food log not found"));
    }

    await log.destroy();
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Food log deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

const barcodeLookup = async (req, res, next) => {
  try {
    const { code } = req.params;
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    if (!response.ok) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Barcode not found on Open Food Facts"));
    }
    const result = await response.json();
    if (result.status === 0 || !result.product) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Product not found"));
    }
    
    const p = result.product;
    const nut = p.nutriments || {};
    const parsedData = {
      mealName: p.product_name || "Unknown Product",
      calories: nut["energy-kcal_100g"] || nut["energy-kcal"] || 0,
      protein: nut["proteins_100g"] || nut["proteins"] || 0,
      carbs: nut["carbohydrates_100g"] || nut["carbohydrates"] || 0,
      fats: nut["fat_100g"] || nut["fat"] || 0,
      barcode: code
    };

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Product looked up successfully", parsedData)
    );
  } catch (error) {
    next(error);
  }
};

const createRecipe = async (req, res, next) => {
  try {
    const { recipeName, calories, protein, carbs, fats, fiber, sugar, sodium, ingredients } = req.body;
    if (!recipeName) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "recipeName is required"));
    }

    const recipe = await Recipe.create({
      userId: req.user.id,
      recipeName,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fats: fats || 0,
      fiber: fiber || 0,
      sugar: sugar || 0,
      sodium: sodium || 0,
      ingredients: ingredients || [],
    });

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Recipe created successfully", recipe)
    );
  } catch (error) {
    next(error);
  }
};

const getRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Recipes retrieved", recipes)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logFood,
  getFoodLogsByDate,
  updateFoodLog,
  deleteFoodLog,
  barcodeLookup,
  createRecipe,
  getRecipes,
};
