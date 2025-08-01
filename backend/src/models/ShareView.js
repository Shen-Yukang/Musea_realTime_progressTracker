const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShareView = sequelize.define('ShareView', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shareId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shares',
        key: 'id'
      }
    },
    viewerIp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    viewerUserAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    viewedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'share_views',
    timestamps: true
  });

  return ShareView;
};
