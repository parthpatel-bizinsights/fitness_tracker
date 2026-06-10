module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('WeightLogs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      weightKg: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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
    await queryInterface.dropTable('WeightLogs');
  }
};
