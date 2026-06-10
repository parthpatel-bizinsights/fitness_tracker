module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Exercises', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM,
        allowNull: false,
      },
      instructions: {
        type: Sequelize.JSONB,
      },
      videoUrl: {
        type: Sequelize.TEXT,
      },
      imageUrl: {
        type: Sequelize.TEXT,
      },
      muscleGroup: {
        type: Sequelize.STRING,
      },
      difficulty: {
        type: Sequelize.ENUM,
      },
      equipment: {
        type: Sequelize.STRING,
      },
      commonMistakes: {
        type: Sequelize.JSONB,
      },
      muscleActivationIndex: {
        type: Sequelize.JSONB,
      },
      targetMusclePhoto: {
        type: Sequelize.TEXT,
      },
      videoThumbnailUrl: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Exercises');
  }
};
