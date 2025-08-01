const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Progress } = require('../src/models');

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

describe('Progress API 调试测试', () => {
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
    await Progress.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户并获取令牌
    const userData = {
      username: 'debuguser',
      email: 'debug@example.com',
      password: 'Password123'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    authToken = registerResponse.body.data.token;
    testUser = registerResponse.body.data.user;
  });

  test('调试 Progress API 创建和查询', async () => {
    // 1. 创建进展记录
    const progressData = {
      date: '2025-07-28',
      mainTasks: '调试测试',
      rating: 8
    };

    console.log('创建进展记录:', progressData);

    const createResponse = await request(app)
      .post('/api/progress')
      .set('Authorization', `Bearer ${authToken}`)
      .send(progressData);

    console.log('创建响应状态:', createResponse.status);
    console.log('创建响应体:', JSON.stringify(createResponse.body, null, 2));

    expect(createResponse.status).toBe(201);

    // 2. 直接查询数据库
    const dbProgress = await Progress.findAll({
      where: { userId: testUser.id }
    });

    console.log('数据库中的记录:', JSON.stringify(dbProgress, null, 2));

    // 3. 通过 API 获取所有记录
    const getAllResponse = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('获取所有记录响应:', JSON.stringify(getAllResponse.body, null, 2));

    // 4. 通过日期查询
    const getByDateResponse = await request(app)
      .get('/api/progress/2025-07-28')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('按日期查询状态:', getByDateResponse.status);
    console.log('按日期查询响应:', JSON.stringify(getByDateResponse.body, null, 2));

    if (getByDateResponse.status !== 200) {
      // 尝试不同的日期格式
      const altDateResponse = await request(app)
        .get(`/api/progress/${dbProgress[0]?.date}`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('使用数据库日期格式查询:', altDateResponse.status);
      console.log('使用数据库日期格式响应:', JSON.stringify(altDateResponse.body, null, 2));
    }
  });
});
