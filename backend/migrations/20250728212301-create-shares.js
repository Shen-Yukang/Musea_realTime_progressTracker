'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('shares', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      shareToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '我的学习进展'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      shareType: {
        type: Sequelize.ENUM('public', 'private', 'password'),
        defaultValue: 'private'
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {
          showProgress: true,
          showReflections: true,
          showGoals: true,
          showPersonalInfo: false,
          dateRange: 'all',
          customStartDate: null,
          customEndDate: null
        }
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('shares', ['userId']);
    await queryInterface.addIndex('shares', ['shareToken']);
    await queryInterface.addIndex('shares', ['isActive']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('shares');
  }
};
