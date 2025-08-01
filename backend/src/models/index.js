const { Sequelize } = require('sequelize');

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 导入模型
const UserModel = require('./User');
const ProgressModel = require('./Progress');
const ReflectionModel = require('./Reflection');
const GoalModel = require('./Goal');
const ShareModel = require('./Share');
const ShareViewModel = require('./ShareView');

// 初始化模型
const models = {
  User: UserModel(sequelize),
  Progress: ProgressModel(sequelize),
  Reflection: ReflectionModel(sequelize),
  Goal: GoalModel(sequelize),
  Share: ShareModel(sequelize),
  ShareView: ShareViewModel(sequelize)
};

// 设置模型关联关系
const setupAssociations = () => {
  const { User, Progress, Reflection, Goal, Share, ShareView } = models;

  // 用户与进展记录的关系 (一对多)
  User.hasMany(Progress, {
    foreignKey: 'userId',
    as: 'progressRecords',
    onDelete: 'CASCADE'
  });
  Progress.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // 用户与反思记录的关系 (一对多)
  User.hasMany(Reflection, {
    foreignKey: 'userId',
    as: 'reflections',
    onDelete: 'CASCADE'
  });
  Reflection.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // 用户与目标的关系 (一对多)
  User.hasMany(Goal, {
    foreignKey: 'userId',
    as: 'goals',
    onDelete: 'CASCADE'
  });
  Goal.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // 用户与分享的关系 (一对多)
  User.hasMany(Share, {
    foreignKey: 'userId',
    as: 'shares',
    onDelete: 'CASCADE'
  });
  Share.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // 分享与分享访问记录的关系 (一对多)
  Share.hasMany(ShareView, {
    foreignKey: 'shareId',
    as: 'views',
    onDelete: 'CASCADE'
  });
  ShareView.belongsTo(Share, {
    foreignKey: 'shareId',
    as: 'share'
  });
};

// 执行关联设置
setupAssociations();

// 导出
module.exports = {
  sequelize,
  Sequelize,
  ...models
};
