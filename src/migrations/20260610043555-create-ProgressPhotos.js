module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ProgressPhotos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      imageUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      photoType: {
        type: Sequelize.ENUM,
        allowNull: false,
      },
      uploadedAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProgressPhotos');
  }
};
