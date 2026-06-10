module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FoodLogs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      mealName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mealType: {
        type: Sequelize.ENUM,
        allowNull: false,
      },
      calories: {
        type: Sequelize.DECIMAL,
      },
      protein: {
        type: Sequelize.DECIMAL,
      },
      carbs: {
        type: Sequelize.DECIMAL,
      },
      fats: {
        type: Sequelize.DECIMAL,
      },
      imageUrl: {
        type: Sequelize.TEXT,
      },
      barcode: {
        type: Sequelize.STRING,
      },
      mealDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      isAiScanned: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FoodLogs');
  }
};
