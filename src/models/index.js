const sequelize = require("../config/database");
const User = require("./User");
const RefreshToken = require("./RefreshToken");
const Exercise = require("./Exercise");
const WorkoutPlan = require("./WorkoutPlan");
const WorkoutSession = require("./WorkoutSession");
const ExerciseLog = require("./ExerciseLog");
const FoodLog = require("./FoodLog");
const WaterLog = require("./WaterLog");
const WeightLog = require("./WeightLog");
const BodyMeasurement = require("./BodyMeasurement");
const ProgressPhoto = require("./ProgressPhoto");
const ChatMessage = require("./ChatMessage");
const Recipe = require("./Recipe");

// User Relations
User.hasMany(RefreshToken, { foreignKey: "userId", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

User.hasMany(WorkoutPlan, { foreignKey: "userId", onDelete: "CASCADE" });
WorkoutPlan.belongsTo(User, { foreignKey: "userId" });

User.hasMany(WorkoutSession, { foreignKey: "userId", onDelete: "CASCADE" });
WorkoutSession.belongsTo(User, { foreignKey: "userId" });

User.hasMany(FoodLog, { foreignKey: "userId", onDelete: "CASCADE" });
FoodLog.belongsTo(User, { foreignKey: "userId" });

User.hasMany(WaterLog, { foreignKey: "userId", onDelete: "CASCADE" });
WaterLog.belongsTo(User, { foreignKey: "userId" });

User.hasMany(WeightLog, { foreignKey: "userId", onDelete: "CASCADE" });
WeightLog.belongsTo(User, { foreignKey: "userId" });

User.hasMany(BodyMeasurement, { foreignKey: "userId", onDelete: "CASCADE" });
BodyMeasurement.belongsTo(User, { foreignKey: "userId" });

User.hasMany(ProgressPhoto, { foreignKey: "userId", onDelete: "CASCADE" });
ProgressPhoto.belongsTo(User, { foreignKey: "userId" });

User.hasMany(ChatMessage, { foreignKey: "userId", onDelete: "CASCADE" });
ChatMessage.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Recipe, { foreignKey: "userId", onDelete: "CASCADE" });
Recipe.belongsTo(User, { foreignKey: "userId" });

// Workout relations
WorkoutPlan.hasMany(WorkoutSession, { foreignKey: "workoutPlanId", onDelete: "SET NULL" });
WorkoutSession.belongsTo(WorkoutPlan, { foreignKey: "workoutPlanId" });

WorkoutSession.hasMany(ExerciseLog, { foreignKey: "workoutSessionId", onDelete: "CASCADE", as: "exerciseLogs" });
ExerciseLog.belongsTo(WorkoutSession, { foreignKey: "workoutSessionId" });

Exercise.hasMany(ExerciseLog, { foreignKey: "exerciseId", onDelete: "RESTRICT" });
ExerciseLog.belongsTo(Exercise, { foreignKey: "exerciseId", as: "exercise" });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  Exercise,
  WorkoutPlan,
  WorkoutSession,
  ExerciseLog,
  FoodLog,
  WaterLog,
  WeightLog,
  BodyMeasurement,
  ProgressPhoto,
  ChatMessage,
  Recipe,
};
