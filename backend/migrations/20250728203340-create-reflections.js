'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reflections', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      adjustments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'milestone'),
        allowNull: false,
        defaultValue: 'daily'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('draft', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      insights: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      actionItems: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
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
    await queryInterface.addIndex('reflections', ['userId', 'date']);
    await queryInterface.addIndex('reflections', ['date']);
    await queryInterface.addIndex('reflections', ['type']);
    await queryInterface.addIndex('reflections', ['priority']);
    await queryInterface.addIndex('reflections', ['status']);
    await queryInterface.addIndex('reflections', ['isPublic']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('reflections');
  }
};
