const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { validateProgress } = require('../middleware/validation');

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 速率限制 - 开发环境更宽松
const generalRateLimit = rateLimitMiddleware(200, 15 * 60 * 1000);

/**
 * @route   GET /api/progress
 * @desc    获取用户的所有进展记录
 * @access  Private
 * @query   page, limit, startDate, endDate
 */
router.get('/', 
  generalRateLimit,
  progressController.getProgress
);

/**
 * @route   GET /api/progress/stats
 * @desc    获取进展统计数据
 * @access  Private
 * @query   days (默认30天)
 */
router.get('/stats', 
  generalRateLimit,
  progressController.getProgressStats
);

/**
 * @route   GET /api/progress/:date
 * @desc    根据日期获取特定进展记录
 * @access  Private
 * @param   date - 日期 (YYYY-MM-DD)
 */
router.get('/:date', 
  generalRateLimit,
  progressController.getProgressByDate
);

/**
 * @route   POST /api/progress
 * @desc    创建新的进展记录
 * @access  Private
 */
router.post('/', 
  generalRateLimit,
  validateProgress,
  progressController.createProgress
);

/**
 * @route   PUT /api/progress/:date
 * @desc    更新进展记录
 * @access  Private
 * @param   date - 日期 (YYYY-MM-DD)
 */
router.put('/:date', 
  generalRateLimit,
  validateProgress,
  progressController.updateProgress
);

/**
 * @route   DELETE /api/progress/:date
 * @desc    删除进展记录
 * @access  Private
 * @param   date - 日期 (YYYY-MM-DD)
 */
router.delete('/:date', 
  generalRateLimit,
  progressController.deleteProgress
);

module.exports = router;
