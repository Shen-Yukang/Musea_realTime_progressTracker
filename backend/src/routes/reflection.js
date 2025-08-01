const express = require('express');
const router = express.Router();
const reflectionController = require('../controllers/reflectionController');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { validateReflection, validate } = require('../middleware/validation');
const Joi = require('joi');

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 速率限制 - 开发环境更宽松
const generalRateLimit = rateLimitMiddleware(200, 15 * 60 * 1000);

// 批量更新验证
const batchUpdateValidation = Joi.object({
  ids: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少需要选择一条记录',
      'array.max': '最多只能同时更新50条记录',
      'any.required': 'ID列表是必填项'
    }),
  status: Joi.string()
    .valid('draft', 'completed', 'archived')
    .required()
    .messages({
      'any.only': '状态必须是 draft、completed 或 archived 之一',
      'any.required': '状态是必填项'
    })
});

/**
 * @route   GET /api/reflections
 * @desc    获取用户的所有反思记录
 * @access  Private
 * @query   page, limit, type, status, startDate, endDate
 */
router.get('/', 
  generalRateLimit,
  reflectionController.getReflections
);

/**
 * @route   GET /api/reflections/stats
 * @desc    获取反思统计数据
 * @access  Private
 * @query   days (默认30天)
 */
router.get('/stats', 
  generalRateLimit,
  reflectionController.getReflectionStats
);

/**
 * @route   POST /api/reflections/batch-update
 * @desc    批量更新反思状态
 * @access  Private
 */
router.post('/batch-update', 
  generalRateLimit,
  validate(batchUpdateValidation),
  reflectionController.batchUpdateStatus
);

/**
 * @route   GET /api/reflections/:id
 * @desc    根据ID获取特定反思记录
 * @access  Private
 * @param   id - 反思记录ID (UUID)
 */
router.get('/:id', 
  generalRateLimit,
  reflectionController.getReflectionById
);

/**
 * @route   POST /api/reflections
 * @desc    创建新的反思记录
 * @access  Private
 */
router.post('/', 
  generalRateLimit,
  validateReflection,
  reflectionController.createReflection
);

/**
 * @route   PUT /api/reflections/:id
 * @desc    更新反思记录
 * @access  Private
 * @param   id - 反思记录ID (UUID)
 */
router.put('/:id', 
  generalRateLimit,
  validateReflection,
  reflectionController.updateReflection
);

/**
 * @route   DELETE /api/reflections/:id
 * @desc    删除反思记录
 * @access  Private
 * @param   id - 反思记录ID (UUID)
 */
router.delete('/:id', 
  generalRateLimit,
  reflectionController.deleteReflection
);

module.exports = router;
