const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Progress = sequelize.define('Progress', {
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
      },
      get() {
        const rawValue = this.getDataValue('date');
        return rawValue ? rawValue.toString() : null;
      }
    },
    mainTasks: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 2000],
        notEmpty: true
      }
    },
    challenges: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    learnings: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    nextDayPlan: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000]
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
        isInt: true
      }
    },
    mood: {
      type: DataTypes.ENUM('excellent', 'good', 'neutral', 'challenging', 'difficult'),
      allowNull: true,
      defaultValue: 'neutral'
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
      validate: {
        isValidTags(value) {
          if (!Array.isArray(value)) {
            throw new Error('Tags must be an array');
          }
          if (value.some(tag => typeof tag !== 'string')) {
            throw new Error('All tags must be strings');
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
    tableName: 'progress',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date']
      },
      {
        fields: ['date']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['isPublic']
      },
      {
        fields: ['mood']
      }
    ]
  });

  return Progress;
};
