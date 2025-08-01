const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true
      }
    },
    profile: {
      type: DataTypes.JSON,
      defaultValue: {},
      validate: {
        isValidProfile(value) {
          if (typeof value !== 'object' || value === null) {
            throw new Error('Profile must be a valid JSON object');
          }
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // 软删除
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['isActive']
      }
    ],
    hooks: {
      beforeCreate: (user) => {
        // 确保邮箱小写
        user.email = user.email.toLowerCase();
      },
      beforeUpdate: (user) => {
        if (user.changed('email')) {
          user.email = user.email.toLowerCase();
        }
      }
    }
  });

  return User;
};
