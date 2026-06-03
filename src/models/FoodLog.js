const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FoodLog = sequelize.define("FoodLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mealName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  mealType: {
    type: DataTypes.ENUM("breakfast", "lunch", "dinner", "snack"),
    allowNull: false,
  },
  calories: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: true,
  },
  protein: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  carbs: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  fats: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  mealDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  isAiScanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: "FoodLogs",
});

module.exports = FoodLog;
