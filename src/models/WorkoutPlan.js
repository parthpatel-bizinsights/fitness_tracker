const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WorkoutPlan = sequelize.define(
  "WorkoutPlan",
  {
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
    schedule: {
      type: DataTypes.JSONB, // Stores: [{ dayName: string, exercises: [{ exerciseId: UUID, sets: number, reps: number, weightKg: number }] }]
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    tableName: "WorkoutPlans",
  },
);

WorkoutPlan.associate = (models) => {
  WorkoutPlan.belongsTo(models.User, { foreignKey: "userId", as: "user" });
};

module.exports = WorkoutPlan;
