const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // Nullable for Google Auth users
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM("male", "female", "other"),
    allowNull: true,
  },
  height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  currentWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  goal: {
    type: DataTypes.ENUM("fat_loss", "muscle_gain", "strength", "general_fitness"),
    allowNull: true,
  },
  experienceLevel: {
    type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
    allowNull: true,
  },
  equipment: {
    type: DataTypes.ENUM("bodyweight", "dumbbells", "full_gym", "bands"),
    allowNull: true,
  },
  unitSystem: {
    type: DataTypes.ENUM("metric", "imperial"),
    defaultValue: "metric",
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  longestStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastActiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  onboardingComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.ENUM("user", "superadmin"),
    defaultValue: "user",
    allowNull: false,
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // Defaulting to true so existing test accounts aren't locked out immediately
  },
  verificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  authProvider: {
    type: DataTypes.ENUM("local", "google"),
    defaultValue: "local",
    allowNull: false,
  },
  googleId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
}, {
  timestamps: true,
  tableName: "Users",
});

module.exports = User;
