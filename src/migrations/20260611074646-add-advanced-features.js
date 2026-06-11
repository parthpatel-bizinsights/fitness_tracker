'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add subscriptionTier to Users
    await queryInterface.addColumn('Users', 'subscriptionTier', {
      type: Sequelize.ENUM('free', 'pro'),
      defaultValue: 'free',
      allowNull: false,
    });

    // 2. Add micronutrients to FoodLogs
    await queryInterface.addColumn('FoodLogs', 'fiber', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('FoodLogs', 'sugar', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('FoodLogs', 'sodium', {
      type: Sequelize.DECIMAL(6, 2),
      allowNull: true,
    });

    // 3. Create Recipes table
    await queryInterface.createTable('Recipes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      recipeName: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      calories: {
        type: Sequelize.DECIMAL(7, 2),
        allowNull: true,
      },
      protein: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      carbs: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      fats: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      fiber: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      sugar: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      sodium: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      ingredients: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Recipes');
    await queryInterface.removeColumn('FoodLogs', 'sodium');
    await queryInterface.removeColumn('FoodLogs', 'sugar');
    await queryInterface.removeColumn('FoodLogs', 'fiber');
    await queryInterface.removeColumn('Users', 'subscriptionTier');
  }
};
