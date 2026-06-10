module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('WorkoutPlans', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      goal: {
        type: Sequelize.STRING,
      },
      daysPerWeek: {
        type: Sequelize.INTEGER,
      },
      isAiGenerated: {
        type: Sequelize.BOOLEAN,
      },
      schedule: {
        type: Sequelize.JSONB,
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
    await queryInterface.dropTable('WorkoutPlans');
  }
};
