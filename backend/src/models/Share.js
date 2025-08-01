const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Share = sequelize.define('Share', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    shareToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '我的学习进展'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shareType: {
      type: DataTypes.ENUM('public', 'private', 'password'),
      defaultValue: 'private'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        showProgress: true,
        showReflections: true,
        showGoals: true,
        showPersonalInfo: false,
        dateRange: 'all', // 'all', 'last7days', 'last30days', 'custom'
        customStartDate: null,
        customEndDate: null
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'shares',
    timestamps: true
  });

  return Share;
};
