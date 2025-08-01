const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 安全中间件 - 为演示页面放宽 CSP 限制
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 日志中间件
app.use(morgan('combined'));

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/public', express.static('public'));

// 根路径欢迎页面
app.get('/', (req, res) => {
  res.json({
    message: 'Progress Tracker API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      progress: '/api/progress/*',
      reflections: '/api/reflections/*',
      goals: '/api/goals/*',
      sync: '/api/sync/*',
      share: '/api/share/*',
      docs: 'API documentation coming soon'
    },
    timestamp: new Date().toISOString()
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API 路由
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const reflectionRoutes = require('./routes/reflection');
const goalRoutes = require('./routes/goal');
const syncRoutes = require('./routes/sync');
const shareRoutes = require('./routes/share');

app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reflections', reflectionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/share', shareRoutes);

// API 根路由
app.use('/api', (req, res) => {
  res.json({ message: 'Progress Tracker API v1.0' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '路由未找到' });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  const status = error.status || 500;
  const message = error.message || '服务器内部错误';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;
