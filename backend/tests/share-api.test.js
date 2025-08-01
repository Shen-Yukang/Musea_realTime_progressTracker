const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Share, ShareView } = require('../src/models');

// 设置测试环境变量
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

describe('Share API', () => {
  let authToken;
  let userId;
  let shareId;
  let shareToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据
    await ShareView.destroy({ where: {}, force: true });
    await Share.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    // 创建测试用户并获取认证令牌
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123'
      });

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;
  });

  describe('POST /api/share/manage', () => {
    test('should create a new share', async () => {
      const shareData = {
        title: '我的学习进展',
        description: '这是一个测试分享',
        shareType: 'private',
        settings: {
          showProgress: true,
          showReflections: false,
          showGoals: true,
          dateRange: 'last30days'
        }
      };

      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(shareData.title);
      expect(response.body.shareToken).toBeDefined();
      expect(response.body.shareUrl).toContain('/share/');
      expect(response.body.password).toBeUndefined();

      shareId = response.body.id;
      shareToken = response.body.shareToken;
    });

    test('should create a password-protected share', async () => {
      const shareData = {
        title: '密码保护的分享',
        shareType: 'password',
        password: 'secret123'
      };

      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData);

      expect(response.status).toBe(201);
      expect(response.body.shareType).toBe('password');
      expect(response.body.password).toBeUndefined();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .send({
          title: '测试分享',
          shareType: 'private'
        });

      expect(response.status).toBe(401);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/share/manage', () => {
    beforeEach(async () => {
      // 创建测试分享
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '测试分享1',
          shareType: 'private'
        });
      shareId = response.body.id;
    });

    test('should get user shares', async () => {
      const response = await request(app)
        .get('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('测试分享1');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/share/manage');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/share/manage/:shareId', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '测试分享详情',
          shareType: 'private'
        });
      shareId = response.body.id;
    });

    test('should get share details', async () => {
      const response = await request(app)
        .get(`/api/share/manage/${shareId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('测试分享详情');
      expect(response.body.shareUrl).toBeDefined();
    });

    test('should return 404 for non-existent share', async () => {
      const response = await request(app)
        .get('/api/share/manage/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/share/manage/:shareId', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '原始标题',
          shareType: 'private'
        });
      shareId = response.body.id;
    });

    test('should update share', async () => {
      const updateData = {
        title: '更新后的标题',
        description: '更新后的描述',
        shareType: 'private'
      };

      const response = await request(app)
        .put(`/api/share/manage/${shareId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/share/manage/:shareId', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '待删除的分享',
          shareType: 'private'
        });
      shareId = response.body.id;
    });

    test('should delete share', async () => {
      const response = await request(app)
        .delete(`/api/share/manage/${shareId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('分享已删除');
    });
  });

  describe('GET /api/share/:shareToken/status', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '公开分享测试',
          shareType: 'public'
        });
      shareToken = response.body.shareToken;
    });

    test('should check share status without authentication', async () => {
      const response = await request(app)
        .get(`/api/share/${shareToken}/status`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('公开分享测试');
      expect(response.body.requirePassword).toBe(false);
    });

    test('should return 404 for non-existent share', async () => {
      const response = await request(app)
        .get('/api/share/non-existent-token/status');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/share/:shareToken', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/share/manage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '数据访问测试',
          shareType: 'public'
        });
      shareToken = response.body.shareToken;
    });

    test('should get share data without password', async () => {
      const response = await request(app)
        .post(`/api/share/${shareToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.share.title).toBe('数据访问测试');
      expect(response.body.data).toBeDefined();
    });

    test('should return 404 for non-existent share', async () => {
      const response = await request(app)
        .post('/api/share/non-existent-token')
        .send({});

      expect(response.status).toBe(404);
    });
  });
});
