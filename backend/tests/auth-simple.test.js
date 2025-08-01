const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

describe('认证功能基础测试', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await User.destroy({ where: {}, force: true });
  });

  test('应该能成功注册新用户', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    console.log('注册响应:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.token).toBeDefined();
  });

  test('应该能成功登录', async () => {
    // 先注册用户
    const userData = {
      username: 'loginuser',
      email: 'login@example.com',
      password: 'Password123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // 然后登录
    const loginData = {
      email: 'login@example.com',
      password: 'Password123'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    console.log('登录响应:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('应该能获取用户资料', async () => {
    // 先注册用户
    const userData = {
      username: 'profileuser',
      email: 'profile@example.com',
      password: 'Password123'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    const token = registerResponse.body.data.token;

    // 获取用户资料
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    console.log('资料响应:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
  });
});
