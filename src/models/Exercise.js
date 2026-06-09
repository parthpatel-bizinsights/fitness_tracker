const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Exercise = sequelize.define("Exercise", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM("chest", "back", "legs", "shoulders", "arms", "core", "cardio"),
    allowNull: false,
  },
  instructions: {
    type: DataTypes.JSONB, // Stores string instructions array
    allowNull: true,
  },
  videoUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  muscleGroup: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  difficulty: {
    type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
    allowNull: true,
  },
  equipment: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  commonMistakes: {
    type: DataTypes.JSONB, // Stores array of strings
    allowNull: true,
  },
  muscleActivationIndex: {
    type: DataTypes.JSONB, // Stores JSON data for muscle activation
    allowNull: true,
  },
  targetMusclePhoto: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  videoThumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: "Exercises",
  updatedAt: false,
});

module.exports = Exercise;
