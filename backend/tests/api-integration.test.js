const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Progress, Reflection, Goal } = require('../src/models');

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

describe('API 集成测试', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await Goal.destroy({ where: {}, force: true });
    await Reflection.destroy({ where: {}, force: true });
    await Progress.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户并获取令牌
    const userData = {
      username: 'integrationuser',
      email: 'integration@example.com',
      password: 'Password123'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    authToken = registerResponse.body.data.token;
    testUser = registerResponse.body.data.user;
  });

  describe('Progress API 集成测试', () => {
    test('应该能完整地管理进展记录', async () => {
      // 1. 创建进展记录
      const progressData = {
        date: '2025-07-28',
        mainTasks: '完成 API 集成测试',
        challenges: '测试数据准备比较复杂',
        learnings: '学会了完整的测试流程',
        nextDayPlan: '继续优化测试',
        rating: 9,
        mood: 'excellent',
        tags: ['testing', 'api'],
        isPublic: false
      };

      const createResponse = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.progress.mainTasks).toBe(progressData.mainTasks);

      // 2. 获取进展记录
      const getResponse = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.progress).toHaveLength(1);

      // 3. 根据日期获取特定记录
      const getByDateResponse = await request(app)
        .get('/api/progress/2025-07-28')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getByDateResponse.body.data.progress.rating).toBe(9);

      // 4. 更新进展记录
      const updateData = { rating: 10, mood: 'excellent' };
      
      const updateResponse = await request(app)
        .put('/api/progress/2025-07-28')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.progress.rating).toBe(10);

      // 5. 获取统计数据
      const statsResponse = await request(app)
        .get('/api/progress/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.data.stats.totalRecords).toBe(1);
      expect(statsResponse.body.data.stats.averageRating).toBe('10.0');
    });
  });

  describe('Reflection API 集成测试', () => {
    test('应该能完整地管理反思记录', async () => {
      // 1. 创建反思记录
      const reflectionData = {
        date: '2025-07-28',
        content: '今天的开发工作很顺利，完成了所有计划的功能',
        adjustments: '明天需要更专注于测试',
        type: 'daily',
        priority: 'high',
        status: 'completed',
        insights: ['测试很重要', '代码质量需要持续关注'],
        actionItems: ['增加测试覆盖率', '优化代码结构'],
        isPublic: false
      };

      const createResponse = await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reflectionData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const reflectionId = createResponse.body.data.reflection.id;

      // 2. 获取反思记录
      const getResponse = await request(app)
        .get('/api/reflections')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.reflections).toHaveLength(1);

      // 3. 根据ID获取特定记录
      const getByIdResponse = await request(app)
        .get(`/api/reflections/${reflectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getByIdResponse.body.data.reflection.content).toBe(reflectionData.content);

      // 4. 更新反思记录
      const updateData = { priority: 'critical', status: 'archived' };
      
      const updateResponse = await request(app)
        .put(`/api/reflections/${reflectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.reflection.priority).toBe('critical');

      // 5. 获取统计数据
      const statsResponse = await request(app)
        .get('/api/reflections/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.data.stats.totalReflections).toBe(1);
    });
  });

  describe('Goal API 集成测试', () => {
    test('应该能完整地管理目标', async () => {
      // 1. 创建目标
      const goalData = {
        name: '完成 Progress Tracker 项目',
        description: '开发一个完整的进展跟踪应用',
        startDate: '2025-07-01',
        endDate: '2025-08-31',
        priority: 'high',
        progress: 0,
        status: 'not_started',
        category: '项目开发',
        milestones: [
          { name: '完成后端 API', description: '实现所有核心 API', targetDate: '2025-07-31', completed: false }
        ],
        metrics: { estimatedHours: 100, actualHours: 0 },
        isPublic: false
      };

      const createResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const goalId = createResponse.body.data.goal.id;

      // 2. 获取目标列表
      const getResponse = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.goals).toHaveLength(1);

      // 3. 根据ID获取特定目标
      const getByIdResponse = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getByIdResponse.body.data.goal.name).toBe(goalData.name);

      // 4. 更新目标进度
      const progressResponse = await request(app)
        .patch(`/api/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress: 50 })
        .expect(200);

      expect(progressResponse.body.data.goal.progress).toBe(50);
      expect(progressResponse.body.data.goal.status).toBe('in_progress');

      // 5. 完成目标
      const completeResponse = await request(app)
        .patch(`/api/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress: 100 })
        .expect(200);

      expect(completeResponse.body.data.goal.progress).toBe(100);
      expect(completeResponse.body.data.goal.status).toBe('completed');
      expect(completeResponse.body.data.goal.completedAt).toBeDefined();

      // 6. 获取统计数据
      const statsResponse = await request(app)
        .get('/api/goals/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.data.stats.totalGoals).toBe(1);
      expect(statsResponse.body.data.stats.completionRate).toBe('100.0');

      // 7. 获取分类列表
      const categoriesResponse = await request(app)
        .get('/api/goals/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(categoriesResponse.body.data.categories).toContain('项目开发');
    });
  });

  describe('跨模块数据一致性测试', () => {
    test('用户删除应该级联删除所有相关数据', async () => {
      // 创建各种数据
      await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2025-07-28',
          mainTasks: '测试数据',
          rating: 8
        })
        .expect(201);

      await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2025-07-28',
          content: '测试反思',
          type: 'daily'
        })
        .expect(201);

      await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试目标',
          startDate: '2025-07-28'
        })
        .expect(201);

      // 验证数据存在
      const progressCount = await Progress.count({ where: { userId: testUser.id } });
      const reflectionCount = await Reflection.count({ where: { userId: testUser.id } });
      const goalCount = await Goal.count({ where: { userId: testUser.id } });

      expect(progressCount).toBe(1);
      expect(reflectionCount).toBe(1);
      expect(goalCount).toBe(1);

      // 删除用户账户
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'Password123' })
        .expect(200);

      // 验证相关数据被删除
      const progressCountAfter = await Progress.count({ where: { userId: testUser.id } });
      const reflectionCountAfter = await Reflection.count({ where: { userId: testUser.id } });
      const goalCountAfter = await Goal.count({ where: { userId: testUser.id } });

      expect(progressCountAfter).toBe(0);
      expect(reflectionCountAfter).toBe(0);
      expect(goalCountAfter).toBe(0);
    });
  });
});
