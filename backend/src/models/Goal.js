const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Goal = sequelize.define('Goal', {
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 3000]
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true
      }
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterStartDate(value) {
          if (value && this.startDate && new Date(value) <= new Date(this.startDate)) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
        isInt: true
      }
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'paused', 'cancelled'),
      allowNull: false,
      defaultValue: 'not_started'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    milestones: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidMilestones(value) {
          if (!Array.isArray(value)) {
            throw new Error('Milestones must be an array');
          }
        }
      }
    },
    metrics: {
      type: DataTypes.JSON,
      defaultValue: {},
      validate: {
        isValidMetrics(value) {
          if (typeof value !== 'object' || value === null) {
            throw new Error('Metrics must be a valid JSON object');
          }
        }
      }
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'goals',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['startDate']
      },
      {
        fields: ['endDate']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['status']
      },
      {
        fields: ['category']
      },
      {
        fields: ['isPublic']
      }
    ],
    hooks: {
      beforeUpdate: (goal) => {
        // 自动设置完成时间
        if (goal.changed('status') && goal.status === 'completed' && !goal.completedAt) {
          goal.completedAt = new Date();
        }
        // 自动设置进度为100%当状态为完成时
        if (goal.changed('status') && goal.status === 'completed') {
          goal.progress = 100;
        }
      }
    }
  });

  return Goal;
};
