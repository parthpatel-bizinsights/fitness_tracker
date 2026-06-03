const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WeightLog = sequelize.define("WeightLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  weightKg: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: "WeightLogs",
});

module.exports = WeightLog;
