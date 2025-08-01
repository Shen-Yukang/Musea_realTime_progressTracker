'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('goals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'completed', 'paused', 'cancelled'),
        allowNull: false,
        defaultValue: 'not_started'
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      milestones: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      metrics: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 添加索引
    await queryInterface.addIndex('goals', ['userId']);
    await queryInterface.addIndex('goals', ['startDate']);
    await queryInterface.addIndex('goals', ['endDate']);
    await queryInterface.addIndex('goals', ['priority']);
    await queryInterface.addIndex('goals', ['status']);
    await queryInterface.addIndex('goals', ['category']);
    await queryInterface.addIndex('goals', ['isPublic']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('goals');
  }
};
