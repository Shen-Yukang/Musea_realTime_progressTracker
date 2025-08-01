const request = require('supertest');
const app = require('../src/app');

describe('基础服务器测试', () => {
  test('健康检查端点应该返回 OK', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.environment).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  test('API 根端点应该返回欢迎消息', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);
    
    expect(response.body.message).toBe('Progress Tracker API v1.0');
  });

  test('不存在的路由应该返回 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body.error).toBe('路由未找到');
  });

  test('CORS 头应该正确设置', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
