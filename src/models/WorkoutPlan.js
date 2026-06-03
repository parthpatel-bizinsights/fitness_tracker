const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WorkoutPlan = sequelize.define("WorkoutPlan", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  goal: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  daysPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isAiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  exercises: {
    type: DataTypes.JSONB, // Stores: [{ exerciseId: UUID, sets: number, reps: number, weightKg: number }]
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: "WorkoutPlans",
});

module.exports = WorkoutPlan;
