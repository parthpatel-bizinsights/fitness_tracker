const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Recipe = sequelize.define("Recipe", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  recipeName: {
    type: DataTypes.STRING(200),
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
  fiber: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  sugar: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  sodium: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  ingredients: {
    type: DataTypes.JSON, // Could store array of ingredients
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: "Recipes",
});

module.exports = Recipe;
