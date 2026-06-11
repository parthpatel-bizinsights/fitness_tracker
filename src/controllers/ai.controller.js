const sharp = require("sharp");
const { analyzeMealImage, generateWorkoutPlan, generateCoachReply } = require("../services/ai.service");
const { uploadToCloudinary } = require("../middlewares/upload.middleware");
const { ChatMessage, Exercise, FoodLog, WorkoutSession, WorkoutPlan, ExerciseLog } = require("../models");
const { Op } = require("sequelize");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");
const { MEAL_SCAN_PROMPT, getWorkoutGenerationPrompt, getCoachChatPrompt } = require("../constants/aiPrompts.constant");

const mealScan = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Meal image file is required"));
    }

    if (req.user.subscriptionTier === 'free') {
      return res.status(403).json(new apiResponse(403, "UPGRADE_REQUIRED", "AI Meal Scanning is a Pro feature. Please upgrade to Pro to unlock Gemini Vision."));
    }

    // Resize image to max 1200px width before uploading to Cloudinary
    const processedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, "meal_scans");

    // Convert processed image buffer to base64 inlineData for Gemini API
    const imagePart = {
      inlineData: {
        data: processedBuffer.toString("base64"),
        mimeType: "image/jpeg"
      }
    };

    const prompt = MEAL_SCAN_PROMPT;

    const parsedMacros = await analyzeMealImage(prompt, imagePart);
    parsedMacros.imageUrl = cloudinaryUrl;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Meal scanned successfully", parsedMacros)
    );
  } catch (error) {
    next(error);
  }
};

const generateWorkout = async (req, res, next) => {
  try {
    const { goal, experience, daysPerWeek, equipment, restDays, preferredSplit } = req.body;
    if (!goal || !experience || !daysPerWeek || !equipment) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "goal, experience, daysPerWeek, and equipment are required"));
    }

    // Load available exercises to feed their IDs to Gemini
    const dbExercises = await Exercise.findAll({ attributes: ["id", "name", "category"] });
    const exerciseList = dbExercises.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
    }));

    const prompt = getWorkoutGenerationPrompt(goal, experience, daysPerWeek, equipment, restDays, exerciseList, preferredSplit);

    const planData = await generateWorkoutPlan(prompt);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout plan generated successfully", planData)
    );
  } catch (error) {
    next(error);
  }
};

const coachChat = async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Message text is required"));
    }

    // Rate Limiting for Free Tier
    if (req.user.subscriptionTier === 'free') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messageCount = await ChatMessage.count({
        where: {
          userId: req.user.id,
          role: "user",
          createdAt: { [Op.gte]: today }
        }
      });
      if (messageCount >= 5) {
        return res.status(403).json(new apiResponse(403, "UPGRADE_REQUIRED", "You have reached your daily limit of 5 free AI messages. Please upgrade to Pro."));
      }
    }

    // Save user message to database
    await ChatMessage.create({
      userId: req.user.id,
      role: "user",
      content: message,
    });

    // Fetch previous conversation history for context (last 10 messages)
    const history = await ChatMessage.findAll({
      where: { userId: req.user.id },
      limit: 10,
      order: [["createdAt", "DESC"]],
    });
    
    // Sort chronological
    const convoHistory = history.reverse();

    // Prepare system prompts with context injection
    const userProfileContext = `
      You are Aura, an elite personal fitness coach. Here is your client's profile:
      - Name: ${req.user.fullName}
      - Fitness Goal: ${req.user.goal ? req.user.goal.replace("_", " ") : "general fitness"}
      - Current Weight: ${req.user.currentWeight || "unrecorded"} kg
      - Height: ${req.user.height || "unrecorded"} cm
      - Experience Level: ${req.user.experienceLevel || "intermediate"}
      - Equipment Access: ${req.user.equipment ? req.user.equipment.replace("_", " ") : "full gym"}
      - Streak: ${req.user.currentStreak} active days
      ${context ? `\n=== ADDITIONAL CLIENT CONTEXT FOR THIS REQUEST ===\n${context}\n==================================================` : ""}
    `;

    const chatContext = convoHistory.map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content}`).join("\n");

    const fullPrompt = getCoachChatPrompt(userProfileContext, chatContext, message);

    let reply = await generateCoachReply(fullPrompt);

    // Auto-Logging Interceptor
    const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const actionPayload = JSON.parse(jsonMatch[1]);
        if (actionPayload.action === "LOG_MEAL") {
          await FoodLog.create({
            userId: req.user.id,
            mealName: actionPayload.data.mealName || "AI Logged Meal",
            mealType: "snack",
            calories: actionPayload.data.calories || 0,
            protein: actionPayload.data.protein || 0,
            carbs: actionPayload.data.carbs || 0,
            fats: actionPayload.data.fats || 0,
            mealDate: new Date().toISOString().split("T")[0]
          });
        } else if (actionPayload.action === "LOG_WORKOUT") {
          // Find exercise
          const exName = actionPayload.data.exerciseName || "";
          const ex = await Exercise.findOne({ where: { name: exName } });
          if (ex) {
            // Create a quick custom session
            const plan = await WorkoutPlan.create({
              userId: req.user.id,
              name: "AI Quick Log",
              goal: "general_fitness",
              daysPerWeek: 1,
              isAiGenerated: true,
              schedule: []
            });
            const session = await WorkoutSession.create({
              userId: req.user.id,
              workoutPlanId: plan.id,
              date: new Date().toISOString().split("T")[0],
              status: "completed"
            });
            await ExerciseLog.create({
              workoutSessionId: session.id,
              exerciseId: ex.id,
              setsCompleted: actionPayload.data.sets || 1,
              repsCompleted: actionPayload.data.reps || 10,
              weightKg: actionPayload.data.weightKg || 0
            });
          }
        }
        // Remove the JSON block so the user only sees the friendly text!
        reply = reply.replace(/```json\n[\s\S]*?\n```/, "").trim();
      } catch (err) {
        console.error("AI Auto-Log Parsing Error:", err);
      }
    }

    // Save assistant reply to database
    const coachMessage = await ChatMessage.create({
      userId: req.user.id,
      role: "assistant",
      content: reply,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Coach reply received", coachMessage)
    );
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const pageIndex = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageIndex - 1) * pageSize;

    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { userId: req.user.id },
      limit: pageSize,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Chat history retrieved", {
        total: count,
        page: pageIndex,
        limit: pageSize,
        messages: rows.reverse(), // chronologically ordered for client view
      })
    );
  } catch (error) {
    next(error);
  }
};

const clearChatHistory = async (req, res, next) => {
  try {
    await ChatMessage.destroy({ where: { userId: req.user.id } });
    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Chat history cleared", null)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  mealScan,
  generateWorkout,
  coachChat,
  getChatHistory,
  clearChatHistory,
};
