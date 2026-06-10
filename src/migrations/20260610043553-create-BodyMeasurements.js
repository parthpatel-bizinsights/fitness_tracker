module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BodyMeasurements', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      waistCm: {
        type: Sequelize.DECIMAL,
      },
      chestCm: {
        type: Sequelize.DECIMAL,
      },
      hipsCm: {
        type: Sequelize.DECIMAL,
      },
      armsCm: {
        type: Sequelize.DECIMAL,
      },
      thighsCm: {
        type: Sequelize.DECIMAL,
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
    await queryInterface.dropTable('BodyMeasurements');
  }
};
