const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProgressPhoto = sequelize.define("ProgressPhoto", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  photoType: {
    type: DataTypes.ENUM("front", "side", "back"),
    allowNull: false,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: "ProgressPhotos",
  updatedAt: false,
});

module.exports = ProgressPhoto;
