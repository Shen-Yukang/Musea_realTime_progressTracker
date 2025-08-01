const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 速率限制 - 同步操作限制更严格
const syncRateLimit = rateLimitMiddleware(20, 15 * 60 * 1000); // 15分钟内最多20次
const generalRateLimit = rateLimitMiddleware(100, 15 * 60 * 1000);

// 批量上传数据验证
const uploadDataValidation = Joi.object({
  progress: Joi.array()
    .items(Joi.object({
      id: Joi.string().uuid().optional(),
      date: Joi.date().iso().required(),
      mainTasks: Joi.string().min(1).max(2000).required(),
      challenges: Joi.string().max(2000).allow('').optional(),
      learnings: Joi.string().max(2000).allow('').optional(),
      nextDayPlan: Joi.string().max(2000).allow('').optional(),
      rating: Joi.number().integer().min(1).max(10).required(),
      mood: Joi.string().valid('excellent', 'good', 'neutral', 'challenging', 'difficult').optional(),
      tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
      isPublic: Joi.boolean().optional()
    }))
    .max(100)
    .optional(),
  reflections: Joi.array()
    .items(Joi.object({
      id: Joi.string().uuid().optional(),
      date: Joi.date().iso().required(),
      content: Joi.string().min(1).max(5000).required(),
      adjustments: Joi.string().max(3000).allow('').optional(),
      type: Joi.string().valid('daily', 'weekly', 'monthly', 'milestone').optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
      status: Joi.string().valid('draft', 'completed', 'archived').optional(),
      insights: Joi.array().items(Joi.string().max(500)).max(20).optional(),
      actionItems: Joi.array().items(Joi.string().max(200)).max(20).optional(),
      isPublic: Joi.boolean().optional()
    }))
    .max(100)
    .optional(),
  goals: Joi.array()
    .items(Joi.object({
      id: Joi.string().uuid().optional(),
      name: Joi.string().min(1).max(200).required(),
      description: Joi.string().max(3000).allow('').optional(),
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
      progress: Joi.number().integer().min(0).max(100).optional(),
      status: Joi.string().valid('not_started', 'in_progress', 'completed', 'paused', 'cancelled').optional(),
      category: Joi.string().max(100).optional(),
      milestones: Joi.array().max(50).optional(),
      metrics: Joi.object().optional(),
      isPublic: Joi.boolean().optional()
    }))
    .max(50)
    .optional()
});

/**
 * @route   GET /api/sync/full
 * @desc    获取用户的所有数据（完整同步）
 * @access  Private
 */
router.get('/full', 
  syncRateLimit,
  syncController.getFullData
);

/**
 * @route   GET /api/sync/incremental
 * @desc    获取增量数据更新
 * @access  Private
 * @query   lastSyncTime - 上次同步时间 (ISO string)
 */
router.get('/incremental', 
  syncRateLimit,
  syncController.getIncrementalData
);

/**
 * @route   POST /api/sync/upload
 * @desc    批量上传数据到服务器
 * @access  Private
 */
router.post('/upload', 
  syncRateLimit,
  validate(uploadDataValidation),
  syncController.uploadData
);

/**
 * @route   GET /api/sync/status
 * @desc    获取同步状态信息
 * @access  Private
 */
router.get('/status', 
  generalRateLimit,
  syncController.getSyncStatus
);

/**
 * @route   GET /api/sync/backup
 * @desc    下载完整数据备份
 * @access  Private
 */
router.get('/backup', 
  syncRateLimit,
  syncController.backupData
);

module.exports = router;
