const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { validateGoal, validate } = require('../middleware/validation');
const Joi = require('joi');

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 速率限制 - 开发环境更宽松
const generalRateLimit = rateLimitMiddleware(200, 15 * 60 * 1000);

// 进度更新验证
const progressUpdateValidation = Joi.object({
  progress: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .required()
    .messages({
      'number.min': '进度不能小于0',
      'number.max': '进度不能大于100',
      'any.required': '进度是必填项'
    })
});

/**
 * @route   GET /api/goals
 * @desc    获取用户的所有目标
 * @access  Private
 * @query   page, limit, status, priority, category, startDate, endDate
 */
router.get('/', 
  generalRateLimit,
  goalController.getGoals
);

/**
 * @route   GET /api/goals/stats
 * @desc    获取目标统计数据
 * @access  Private
 */
router.get('/stats', 
  generalRateLimit,
  goalController.getGoalStats
);

/**
 * @route   GET /api/goals/categories
 * @desc    获取目标分类列表
 * @access  Private
 */
router.get('/categories', 
  generalRateLimit,
  goalController.getCategories
);

/**
 * @route   GET /api/goals/:id
 * @desc    根据ID获取特定目标
 * @access  Private
 * @param   id - 目标ID (UUID)
 */
router.get('/:id', 
  generalRateLimit,
  goalController.getGoalById
);

/**
 * @route   POST /api/goals
 * @desc    创建新目标
 * @access  Private
 */
router.post('/', 
  generalRateLimit,
  validateGoal,
  goalController.createGoal
);

/**
 * @route   PUT /api/goals/:id
 * @desc    更新目标
 * @access  Private
 * @param   id - 目标ID (UUID)
 */
router.put('/:id', 
  generalRateLimit,
  validateGoal,
  goalController.updateGoal
);

/**
 * @route   PATCH /api/goals/:id/progress
 * @desc    更新目标进度
 * @access  Private
 * @param   id - 目标ID (UUID)
 */
router.patch('/:id/progress', 
  generalRateLimit,
  validate(progressUpdateValidation),
  goalController.updateProgress
);

/**
 * @route   DELETE /api/goals/:id
 * @desc    删除目标
 * @access  Private
 * @param   id - 目标ID (UUID)
 */
router.delete('/:id', 
  generalRateLimit,
  goalController.deleteGoal
);

module.exports = router;
