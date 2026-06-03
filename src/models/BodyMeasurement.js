const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BodyMeasurement = sequelize.define("BodyMeasurement", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  waistCm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  chestCm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  hipsCm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  armsCm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  thighsCm: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: "BodyMeasurements",
});

module.exports = BodyMeasurement;
