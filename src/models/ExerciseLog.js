const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ExerciseLog = sequelize.define("ExerciseLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  workoutSessionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  exerciseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sets: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reps: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  weightKg: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  setData: {
    type: DataTypes.JSONB, // Stores: [{ set: number, reps: number, weightKg: number, done: boolean }]
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: "ExerciseLogs",
});

module.exports = ExerciseLog;
