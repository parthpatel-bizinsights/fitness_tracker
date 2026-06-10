module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ExerciseLogs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      workoutSessionId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      exerciseId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      sets: {
        type: Sequelize.INTEGER,
      },
      reps: {
        type: Sequelize.INTEGER,
      },
      weightKg: {
        type: Sequelize.DECIMAL,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      setData: {
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
    await queryInterface.dropTable('ExerciseLogs');
  }
};
