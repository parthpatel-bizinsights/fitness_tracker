module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('WorkoutSessions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      workoutPlanId: {
        type: Sequelize.UUID,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      durationMins: {
        type: Sequelize.INTEGER,
      },
      completed: {
        type: Sequelize.BOOLEAN,
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('WorkoutSessions');
  }
};
