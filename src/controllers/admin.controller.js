const { Op, fn, col, literal } = require("sequelize");
const {
  User,
  Exercise,
  WorkoutPlan,
  WorkoutSession,
  ExerciseLog,
  FoodLog,
  WaterLog,
  WeightLog,
  BodyMeasurement,
  ChatMessage,
} = require("../models");
const apiError = require("../../utils/error.util");
const apiResponse = require("../../utils/response.util");
const HTTP_STATUS = require("../../constants/httpStatus.constant");
const HTTP_CODE = require("../../constants/httpCode.constant");

// ─────────────────────────────────────────────
//  DASHBOARD STATS
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newTodayUsers,
      totalWorkoutSessions,
      completedWorkouts,
      totalFoodLogs,
      totalWaterLogs,
      totalWeightLogs,
      totalChatMessages,
      superadminCount,
      bannedUsers,
      onboardedUsers,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { createdAt: { [Op.gte]: today } } }),
      WorkoutSession.count(),
      WorkoutSession.count({ where: { completed: true } }),
      FoodLog.count(),
      WaterLog.count(),
      WeightLog.count(),
      ChatMessage.count({ where: { role: "user" } }), // AI interactions
      User.count({ where: { role: "superadmin" } }),
      User.count({ where: { isBanned: true } }),
      User.count({ where: { onboardingComplete: true } }),
    ]);

    // Recent registrations (last 7 users)
    const recentUsers = await User.findAll({
      attributes: ["id", "fullName", "email", "role", "isBanned", "onboardingComplete", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: 7,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Dashboard stats retrieved", {
        users: {
          total: totalUsers,
          newToday: newTodayUsers,
          superadmins: superadminCount,
          banned: bannedUsers,
          onboarded: onboardedUsers,
        },
        workouts: {
          total: totalWorkoutSessions,
          completed: completedWorkouts,
          completionRate: totalWorkoutSessions > 0
            ? Math.round((completedWorkouts / totalWorkoutSessions) * 100)
            : 0,
        },
        nutrition: {
          foodLogs: totalFoodLogs,
          waterLogs: totalWaterLogs,
          weightLogs: totalWeightLogs,
        },
        ai: {
          totalCoachInteractions: totalChatMessages,
        },
        recentUsers,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  PLATFORM ANALYTICS
// ─────────────────────────────────────────────
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // User registrations per day (last 30 days)
    const registrationsPerDay = await User.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // Workout completions per day (last 30 days)
    const workoutsPerDay = await WorkoutSession.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        completed: true,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // Meal type distribution
    const mealTypeDistribution = await FoodLog.findAll({
      attributes: [
        "mealType",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["mealType"],
      raw: true,
    });

    // AI interactions per day (coach chat messages from users)
    const aiUsagePerDay = await ChatMessage.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        role: "user",
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // Goal distribution across users
    const goalDistribution = await User.findAll({
      attributes: [
        "goal",
        [fn("COUNT", col("id")), "count"],
      ],
      where: { goal: { [Op.not]: null } },
      group: ["goal"],
      raw: true,
    });

    // Equipment distribution
    const equipmentDistribution = await User.findAll({
      attributes: [
        "equipment",
        [fn("COUNT", col("id")), "count"],
      ],
      where: { equipment: { [Op.not]: null } },
      group: ["equipment"],
      raw: true,
    });

    // Exercise category distribution in exercise logs
    const exerciseCategoryUsage = await ExerciseLog.findAll({
      attributes: [
        [fn("COUNT", col("ExerciseLog.id")), "count"],
      ],
      include: [
        {
          model: Exercise,
          as: "exercise",
          attributes: ["category"],
        },
      ],
      group: ["exercise.category", "exercise.id"],
      raw: true,
    });

    // Top 5 most active users (most workout sessions)
    const topActiveUsers = await WorkoutSession.findAll({
      attributes: [
        "userId",
        [fn("COUNT", col("WorkoutSession.id")), "sessionCount"],
      ],
      include: [
        {
          model: User,
          attributes: ["fullName", "email", "avatarUrl"],
        },
      ],
      group: ["userId", "User.id"],
      order: [[fn("COUNT", col("WorkoutSession.id")), "DESC"]],
      limit: 5,
      raw: true,
    });

    // Total AI meal scans (FoodLogs where isAiScanned = true)
    const totalAiMealScans = await FoodLog.count({ where: { isAiScanned: true } });

    // AI workout generations (WorkoutPlans where isAiGenerated = true)
    const totalAiWorkouts = await WorkoutPlan.count({ where: { isAiGenerated: true } });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Platform analytics retrieved", {
        registrationsPerDay,
        workoutsPerDay,
        mealTypeDistribution,
        aiUsagePerDay,
        goalDistribution,
        equipmentDistribution,
        topActiveUsers,
        ai: {
          totalCoachMessages: await ChatMessage.count({ where: { role: "user" } }),
          totalMealScans: totalAiMealScans,
          totalAiWorkouts: totalAiWorkouts,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  USER MANAGEMENT
// ─────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      role,
      isBanned,
      onboardingComplete,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned === "true";
    if (onboardingComplete !== undefined)
      where.onboardingComplete = onboardingComplete === "true";

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Users retrieved", {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
        users: rows,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User not found"));
    }

    // Fetch summary stats for this user
    const [
      workoutCount,
      foodLogCount,
      waterLogCount,
      weightLogCount,
      chatMessageCount,
      aiMealScans,
    ] = await Promise.all([
      WorkoutSession.count({ where: { userId: id } }),
      FoodLog.count({ where: { userId: id } }),
      WaterLog.count({ where: { userId: id } }),
      WeightLog.count({ where: { userId: id } }),
      ChatMessage.count({ where: { userId: id, role: "user" } }),
      FoodLog.count({ where: { userId: id, isAiScanned: true } }),
    ]);

    // Recent workout sessions
    const recentWorkouts = await WorkoutSession.findAll({
      where: { userId: id },
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Weight history
    const weightHistory = await WeightLog.findAll({
      where: { userId: id },
      order: [["date", "ASC"]],
      limit: 30,
    });

    // Recent food logs
    const recentFoodLogs = await FoodLog.findAll({
      where: { userId: id },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "User detail retrieved", {
        user,
        stats: {
          workouts: workoutCount,
          foodLogs: foodLogCount,
          waterLogs: waterLogCount,
          weightLogs: weightLogCount,
          aiCoachMessages: chatMessageCount,
          aiMealScans,
        },
        recentWorkouts,
        weightHistory,
        recentFoodLogs,
      })
    );
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "superadmin"].includes(role)) {
      return next(
        new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Role must be 'user' or 'superadmin'")
      );
    }

    // Prevent self-demotion
    if (id === req.user.id && role !== "superadmin") {
      return next(
        new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "You cannot remove your own superadmin role")
      );
    }

    const user = await User.findByPk(id);
    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User not found"));
    }

    user.role = role;
    await user.save();

    const cleanUser = user.toJSON();
    delete cleanUser.password;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, `User role updated to ${role}`, cleanUser)
    );
  } catch (error) {
    next(error);
  }
};

const toggleUserBan = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return next(
        new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "You cannot ban yourself")
      );
    }

    const user = await User.findByPk(id);
    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User not found"));
    }

    user.isBanned = !user.isBanned;
    await user.save();

    const cleanUser = user.toJSON();
    delete cleanUser.password;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(
        HTTP_STATUS.OK,
        HTTP_CODE.OK,
        user.isBanned ? "User banned successfully" : "User unbanned successfully",
        cleanUser
      )
    );
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return next(
        new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "You cannot delete your own account from admin panel")
      );
    }

    const user = await User.findByPk(id);
    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User not found"));
    }

    await user.destroy(); // All related data cascades via model associations

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "User and all associated data deleted", null)
    );
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (!["free", "pro"].includes(tier)) {
      return next(
        new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Tier must be 'free' or 'pro'")
      );
    }

    const user = await User.findByPk(id);
    if (!user) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "User not found"));
    }

    user.subscriptionTier = tier;
    await user.save();

    const cleanUser = user.toJSON();
    delete cleanUser.password;

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, `User subscription updated to ${tier}`, cleanUser)
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  EXERCISE MANAGEMENT (CRUD)
// ─────────────────────────────────────────────
const getAllExercises = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", category, difficulty } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { muscleGroup: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const { count, rows } = await Exercise.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercises retrieved", {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
        exercises: rows,
      })
    );
  } catch (error) {
    next(error);
  }
};

const createExercise = async (req, res, next) => {
  try {
    const { name, category, muscleGroup, difficulty, equipment, instructions, videoUrl, imageUrl, commonMistakes, muscleActivationIndex, targetMusclePhoto, videoThumbnailUrl } = req.body;

    if (!name || !category) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "name and category are required"));
    }

    const exercise = await Exercise.create({
      name,
      category,
      muscleGroup,
      difficulty,
      equipment,
      instructions: Array.isArray(instructions) ? instructions : [],
      commonMistakes: Array.isArray(commonMistakes) ? commonMistakes : [],
      muscleActivationIndex,
      videoUrl,
      imageUrl,
      targetMusclePhoto,
      videoThumbnailUrl,
    });

    res.status(HTTP_STATUS.CREATED).json(
      new apiResponse(HTTP_STATUS.CREATED, HTTP_CODE.CREATED, "Exercise created successfully", exercise)
    );
  } catch (error) {
    next(error);
  }
};

const updateExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Exercise not found"));
    }

    const allowedFields = ["name", "category", "muscleGroup", "difficulty", "equipment", "instructions", "commonMistakes", "muscleActivationIndex", "videoUrl", "imageUrl", "targetMusclePhoto", "videoThumbnailUrl"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        exercise[field] = req.body[field];
      }
    });

    await exercise.save();

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercise updated successfully", exercise)
    );
  } catch (error) {
    next(error);
  }
};

const deleteExercise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return next(new apiError(HTTP_STATUS.NOT_FOUND, HTTP_CODE.DATA_NOT_FOUND, "Exercise not found"));
    }

    await exercise.destroy();

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Exercise deleted successfully", null)
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  AI USAGE OVERVIEW
// ─────────────────────────────────────────────
const getAiUsage = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Coach chat stats
    const totalCoachMessages = await ChatMessage.count({ where: { role: "user" } });
    const coachMessagesToday = await ChatMessage.count({
      where: {
        role: "user",
        createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    // AI meal scans
    const totalMealScans = await FoodLog.count({ where: { isAiScanned: true } });
    const mealScansToday = await FoodLog.count({
      where: {
        isAiScanned: true,
        createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    // AI generated workout plans
    const totalAiWorkouts = await WorkoutPlan.count({ where: { isAiGenerated: true } });
    const aiWorkoutsToday = await WorkoutPlan.count({
      where: {
        isAiGenerated: true,
        createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    // Coach chat messages per day (last 30 days)
    const coachMessagesPerDay = await ChatMessage.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        role: "user",
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // Meal scans per day (last 30 days)
    const mealScansPerDay = await FoodLog.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        isAiScanned: true,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // Top users by AI coach usage
    const topCoachUsers = await ChatMessage.findAll({
      attributes: [
        "userId",
        [fn("COUNT", col("ChatMessage.id")), "messageCount"],
      ],
      include: [
        {
          model: User,
          attributes: ["fullName", "email"],
        },
      ],
      where: { role: "user" },
      group: ["userId", "User.id"],
      order: [[fn("COUNT", col("ChatMessage.id")), "DESC"]],
      limit: 10,
      raw: true,
    });

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "AI usage data retrieved", {
        coachChat: {
          total: totalCoachMessages,
          today: coachMessagesToday,
          perDay: coachMessagesPerDay,
        },
        mealScan: {
          total: totalMealScans,
          today: mealScansToday,
          perDay: mealScansPerDay,
        },
        workoutGeneration: {
          total: totalAiWorkouts,
          today: aiWorkoutsToday,
        },
        topCoachUsers,
      })
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
//  BROADCAST PUSH NOTIFICATION
// ─────────────────────────────────────────────
const webpush = require("web-push");

const broadcastPushNotification = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    
    if (!title || !body) {
      return next(new apiError(HTTP_STATUS.BAD_REQUEST, HTTP_CODE.BAD_REQUEST, "Title and body are required"));
    }

    // Find all users with a valid push subscription
    const users = await User.findAll({
      where: {
        pushSubscription: {
          [Op.not]: null,
        },
      },
    });

    if (!users || users.length === 0) {
      return res.status(HTTP_STATUS.OK).json(new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "No users found with active push subscriptions."));
    }

    const payload = JSON.stringify({
      title,
      body,
      url: "/dashboard",
    });

    let successCount = 0;
    let failCount = 0;

    // Send notifications in parallel
    const sendPromises = users.map(async (user) => {
      try {
        await webpush.sendNotification(user.pushSubscription, payload);
        successCount++;
      } catch (error) {
        failCount++;
        // If subscription is expired/invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          user.pushSubscription = null;
          await user.save();
        }
      }
    });

    await Promise.all(sendPromises);

    res.status(HTTP_STATUS.OK).json(
      new apiResponse(HTTP_STATUS.OK, HTTP_CODE.OK, "Broadcast complete", {
        totalAttempted: users.length,
        successCount,
        failCount,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getPlatformAnalytics,
  getAllUsers,
  getUserDetail,
  updateUserRole,
  toggleUserBan,
  deleteUser,
  getAllExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  getAiUsage,
  updateSubscription,
  broadcastPushNotification,
};
