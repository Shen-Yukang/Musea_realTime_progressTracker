const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization 令牌
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 获取令牌
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    if (!token) {
      return res.status(401).json(errorResponse('访问被拒绝，需要认证令牌'));
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json(errorResponse('无效的认证令牌'));
    }
    
    if (!user.isActive) {
      return res.status(401).json(errorResponse('账户已被禁用'));
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { 
      error: error.message, 
      url: req.url,
      method: req.method,
      ip: req.ip 
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(errorResponse('无效的认证令牌'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('认证令牌已过期'));
    }
    
    return res.status(500).json(errorResponse('认证验证失败'));
  }
};

/**
 * 可选认证中间件
 * 如果有令牌则验证，没有令牌则继续执行
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    if (!token) {
      // 没有令牌，继续执行
      return next();
    }
    
    // 有令牌，尝试验证
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    // 令牌无效，但不阻止请求继续
    logger.warn('Optional auth middleware warning', { 
      error: error.message, 
      url: req.url 
    });
    next();
  }
};

/**
 * 管理员权限中间件
 * 需要先通过 authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(errorResponse('需要认证'));
  }
  
  if (!req.user.profile || req.user.profile.role !== 'admin') {
    return res.status(403).json(errorResponse('需要管理员权限'));
  }
  
  next();
};

/**
 * 用户所有权验证中间件
 * 验证用户是否有权限访问特定资源
 */
const ownershipMiddleware = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('需要认证'));
    }
    
    // 从路径参数或请求体中获取资源的用户ID
    const resourceUserId = req.params[resourceUserIdField] || 
                          req.body[resourceUserIdField] || 
                          req.query[resourceUserIdField];
    
    // 如果是管理员，允许访问所有资源
    if (req.user.profile && req.user.profile.role === 'admin') {
      return next();
    }
    
    // 检查用户是否拥有该资源
    if (resourceUserId && resourceUserId !== req.user.id) {
      return res.status(403).json(errorResponse('无权限访问该资源'));
    }
    
    next();
  };
};

/**
 * 速率限制中间件（简单实现）
 */
const rateLimitMap = new Map();

const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // 开发环境跳过限流
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const key = req.ip;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const limit = rateLimitMap.get(key);

    if (now > limit.resetTime) {
      // 重置计数器
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }

    if (limit.count >= maxRequests) {
      return res.status(429).json(errorResponse('请求过于频繁，请稍后再试'));
    }

    limit.count++;
    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  ownershipMiddleware,
  rateLimitMiddleware
};
