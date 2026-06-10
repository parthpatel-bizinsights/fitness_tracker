module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
      },
      age: {
        type: Sequelize.INTEGER,
      },
      gender: {
        type: Sequelize.ENUM,
      },
      height: {
        type: Sequelize.DECIMAL,
      },
      currentWeight: {
        type: Sequelize.DECIMAL,
      },
      goal: {
        type: Sequelize.ENUM,
      },
      experienceLevel: {
        type: Sequelize.ENUM,
      },
      equipment: {
        type: Sequelize.ENUM,
      },
      unitSystem: {
        type: Sequelize.ENUM,
      },
      avatarUrl: {
        type: Sequelize.TEXT,
      },
      currentStreak: {
        type: Sequelize.INTEGER,
      },
      longestStreak: {
        type: Sequelize.INTEGER,
      },
      lastActiveDate: {
        type: Sequelize.DATEONLY,
      },
      onboardingComplete: {
        type: Sequelize.BOOLEAN,
      },
      role: {
        type: Sequelize.ENUM,
        allowNull: false,
      },
      isBanned: {
        type: Sequelize.BOOLEAN,
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
      },
      verificationToken: {
        type: Sequelize.STRING,
      },
      authProvider: {
        type: Sequelize.ENUM,
        allowNull: false,
      },
      googleId: {
        type: Sequelize.STRING,
        unique: true,
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
    await queryInterface.dropTable('Users');
  }
};
