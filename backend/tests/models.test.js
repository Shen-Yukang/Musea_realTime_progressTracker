const { sequelize, User, Progress, Reflection, Goal } = require('../src/models');
const bcrypt = require('bcryptjs');

describe('数据库模型测试', () => {
  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // 清理测试数据
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理所有表数据
    await Goal.destroy({ where: {}, force: true });
    await Reflection.destroy({ where: {}, force: true });
    await Progress.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('User 模型', () => {
    test('应该能创建用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        profile: { name: 'Test User', bio: 'Test bio' }
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.profile.name).toBe('Test User');
      expect(user.isActive).toBe(true);
    });

    test('应该验证邮箱唯一性', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12)
      };

      await User.create(userData);

      // 尝试创建相同邮箱的用户
      const duplicateUserData = {
        username: 'testuser2',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12)
      };

      await expect(User.create(duplicateUserData)).rejects.toThrow();
    });

    test('应该验证用户名唯一性', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        password: await bcrypt.hash('password123', 12)
      };

      await User.create(userData);

      // 尝试创建相同用户名的用户
      const duplicateUserData = {
        username: 'testuser',
        email: 'test2@example.com',
        password: await bcrypt.hash('password123', 12)
      };

      await expect(User.create(duplicateUserData)).rejects.toThrow();
    });
  });

  describe('Progress 模型', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'progressuser',
        email: 'progress@example.com',
        password: await bcrypt.hash('password123', 12)
      });
    });

    test('应该能创建进展记录', async () => {
      const progressData = {
        userId: testUser.id,
        date: '2025-07-28',
        mainTasks: '完成数据库模型设计',
        challenges: '遇到了一些关联关系的问题',
        learnings: '学会了 Sequelize 的高级用法',
        nextDayPlan: '继续开发 API',
        rating: 8,
        mood: 'good',
        tags: ['database', 'sequelize'],
        isPublic: false
      };

      const progress = await Progress.create(progressData);

      expect(progress.id).toBeDefined();
      expect(progress.userId).toBe(testUser.id);
      expect(progress.date).toBe('2025-07-28');
      expect(progress.rating).toBe(8);
      expect(progress.mood).toBe('good');
      expect(progress.tags).toEqual(['database', 'sequelize']);
    });

    test('应该验证用户和日期的唯一性', async () => {
      const progressData = {
        userId: testUser.id,
        date: '2025-07-28',
        mainTasks: '第一条记录',
        rating: 8
      };

      await Progress.create(progressData);

      // 尝试创建相同用户相同日期的记录
      const duplicateProgressData = {
        userId: testUser.id,
        date: '2025-07-28',
        mainTasks: '第二条记录',
        rating: 9
      };

      await expect(Progress.create(duplicateProgressData)).rejects.toThrow();
    });
  });

  describe('模型关联关系', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'relationuser',
        email: 'relation@example.com',
        password: await bcrypt.hash('password123', 12)
      });
    });

    test('应该能通过用户查询进展记录', async () => {
      // 创建进展记录
      await Progress.create({
        userId: testUser.id,
        date: '2025-07-28',
        mainTasks: '测试关联查询',
        rating: 9
      });

      // 通过用户查询进展记录
      const userWithProgress = await User.findByPk(testUser.id, {
        include: [{ model: Progress, as: 'progressRecords' }]
      });

      expect(userWithProgress.progressRecords).toHaveLength(1);
      expect(userWithProgress.progressRecords[0].mainTasks).toBe('测试关联查询');
    });

    test('应该能通过进展记录查询用户', async () => {
      // 创建进展记录
      const progress = await Progress.create({
        userId: testUser.id,
        date: '2025-07-28',
        mainTasks: '测试反向关联查询',
        rating: 8
      });

      // 通过进展记录查询用户
      const progressWithUser = await Progress.findByPk(progress.id, {
        include: [{ model: User, as: 'user' }]
      });

      expect(progressWithUser.user.username).toBe('relationuser');
      expect(progressWithUser.user.email).toBe('relation@example.com');
    });
  });
});
