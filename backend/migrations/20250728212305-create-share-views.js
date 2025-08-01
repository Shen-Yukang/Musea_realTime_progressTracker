'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('share_views', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      shareId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shares',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      viewerIp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      viewerUserAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      viewedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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
    await queryInterface.addIndex('share_views', ['shareId']);
    await queryInterface.addIndex('share_views', ['viewedAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('share_views');
  }
};
