const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const bcrypt = require('bcryptjs');

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.NODE_ENV = 'test';

describe('认证功能测试', () => {
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

  describe('POST /api/auth/register', () => {
    test('应该能成功注册新用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        profile: {
          name: 'Test User'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    test('应该拒绝重复的邮箱', async () => {
      // 先创建一个用户
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123', 12)
      });

      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已被注册');
    });

    test('应该拒绝重复的用户名', async () => {
      // 先创建一个用户
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123', 12)
      });

      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名已被使用');
    });

    test('应该验证密码强度', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: await bcrypt.hash('Password123', 12)
      });
    });

    test('应该能成功登录', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    test('应该拒绝错误的密码', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    test('应该拒绝不存在的邮箱', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      // 注册用户并获取令牌
      const userData = {
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'Password123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      authToken = registerResponse.body.data.token;
      testUser = registerResponse.body.data.user;
    });

    test('应该能获取用户资料', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe('profile@example.com');
    });

    test('应该拒绝无令牌的请求', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('需要认证令牌');
    });

    test('应该拒绝无效令牌', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的认证令牌');
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      const userData = {
        username: 'passworduser',
        email: 'password@example.com',
        password: 'OldPassword123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      authToken = registerResponse.body.data.token;
    });

    test('应该能修改密码', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密码修改成功');
    });

    test('应该拒绝错误的当前密码', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('当前密码错误');
    });
  });
});
