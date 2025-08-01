'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('progress', {
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
      mainTasks: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      challenges: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      learnings: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      nextDayPlan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      mood: {
        type: Sequelize.ENUM('excellent', 'good', 'neutral', 'challenging', 'difficult'),
        allowNull: true,
        defaultValue: 'neutral'
      },
      tags: {
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
    await queryInterface.addIndex('progress', ['userId', 'date'], { unique: true });
    await queryInterface.addIndex('progress', ['date']);
    await queryInterface.addIndex('progress', ['rating']);
    await queryInterface.addIndex('progress', ['isPublic']);
    await queryInterface.addIndex('progress', ['mood']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('progress');
  }
};
