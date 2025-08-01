const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reflection = sequelize.define('Reflection', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000],
        notEmpty: true
      }
    },
    adjustments: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 3000]
      }
    },
    type: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'milestone'),
      allowNull: false,
      defaultValue: 'daily'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('draft', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    insights: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidInsights(value) {
          if (!Array.isArray(value)) {
            throw new Error('Insights must be an array');
          }
        }
      }
    },
    actionItems: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidActionItems(value) {
          if (!Array.isArray(value)) {
            throw new Error('Action items must be an array');
          }
        }
      }
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'reflections',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'date']
      },
      {
        fields: ['date']
      },
      {
        fields: ['type']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['status']
      },
      {
        fields: ['isPublic']
      }
    ]
  });

  return Reflection;
};
