const sharp = require("sharp");
const { geminiFlash } = require("../config/gemini");
const { uploadToCloudinary } = require("../middlewares/upload.middleware");
const { ChatMessage, Exercise } = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

// Helper to strip markdown JSON blocks from Gemini responses
const cleanJsonResponse = (text) => {
  return text.replace(/```json|```/g, "").trim();
};

const mealScan = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Meal image file is required"));
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

    const prompt = `
      You are a professional nutrition expert. Analyze the provided meal image and return ONLY a valid JSON object.
      Do not include any explanations, markdown code block wrappers (like \`\`\`json), or extra text. Just the raw JSON.
      
      The JSON structure MUST be:
      {
        "mealName": "Name of the meal",
        "calories": 450, // estimation in kcal
        "protein": 30, // estimation in grams
        "carbs": 50, // estimation in grams
        "fats": 12, // estimation in grams
        "confidence": "high" // "high", "medium", or "low" depending on identification certainty
      }
    `;

    const result = await geminiFlash.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const cleanJson = cleanJsonResponse(responseText);

    const parsedMacros = JSON.parse(cleanJson);
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
    const { goal, experience, daysPerWeek, equipment, restDays } = req.body;
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

    const prompt = `
      You are a certified fitness coach. Design a custom, weekly structured workout plan based on the client's preferences:
      - Goal: ${goal.replace("_", " ")}
      - Experience level: ${experience}
      - Training frequency: ${daysPerWeek} days per week
      - Available equipment: ${equipment.replace("_", " ")}
      ${restDays && restDays.length > 0 ? `- The user explicitly cannot train on these days: ${restDays.join(", ")}. Plan the schedule around this.` : ""}

      Structure the plan across the week. For example, if training 3 days a week, provide 3 distinct day routines (e.g., Push/Pull/Legs or Day 1/Day 2/Day 3).
      Assign a descriptive name to each day (e.g., "Push (Chest & Triceps)").
      Choose exercises strictly from this database list to match the user's split. Do not make up exercise IDs:
      ${JSON.stringify(exerciseList)}

      Return ONLY a valid JSON object representing the plan. Do not include markdown code block backticks (like \`\`\`json) or extra details.
      
      Required JSON format:
      {
        "name": "AI Generated Split Plan Name (e.g., 3-Day Push Pull Legs)",
        "goal": "${goal}",
        "daysPerWeek": ${daysPerWeek},
        "schedule": [
          {
            "dayName": "Day 1: Push (Chest, Shoulders, Triceps)",
            "exercises": [
              { "exerciseId": "matching_uuid_from_above", "sets": 4, "reps": 10, "weightKg": 60 }
            ]
          },
          {
            "dayName": "Day 2: Pull (Back, Biceps)",
            "exercises": [
              { "exerciseId": "another_matching_uuid", "sets": 3, "reps": 12, "weightKg": 15 }
            ]
          }
        ]
      }
    `;

    const result = await geminiFlash.generateContent([prompt]);
    const responseText = result.response.text();
    const cleanJson = cleanJsonResponse(responseText);

    const planData = JSON.parse(cleanJson);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Workout plan generated successfully", planData)
    );
  } catch (error) {
    next(error);
  }
};

const coachChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Message text is required"));
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
    `;

    const chatContext = convoHistory.map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content}`).join("\n");

    const fullPrompt = `
      ${userProfileContext}
      
      Conversation History:
      ${chatContext}
      
      Client's message: "${message}"
      
      Respond as Coach Aura in a friendly, motivating, and expert tone. Keep the answer concise (under 150 words) and directly actionable.
    `;

    const result = await geminiFlash.generateContent([fullPrompt]);
    const reply = result.response.text().trim();

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
