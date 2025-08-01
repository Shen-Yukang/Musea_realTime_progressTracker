const logger = require('../utils/logger');
const { errorResponse } = require('../utils/helpers');

/**
 * 全局错误处理中间件
 */
const errorHandler = (error, req, res, next) => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Sequelize 验证错误
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map(err => err.message);
    return res.status(400).json(errorResponse('验证失败', messages));
  }

  // Sequelize 唯一约束错误
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json(errorResponse('数据已存在'));
  }

  // JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('无效的认证令牌'));
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('认证令牌已过期'));
  }

  // 默认错误
  const status = error.status || error.statusCode || 500;
  const message = error.message || '服务器内部错误';

  res.status(status).json(errorResponse(message, 
    process.env.NODE_ENV === 'development' ? error.stack : null
  ));
};

/**
 * 404 错误处理
 */
const notFoundHandler = (req, res) => {
  res.status(404).json(errorResponse('请求的资源未找到'));
};

/**
 * 异步错误包装器
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
