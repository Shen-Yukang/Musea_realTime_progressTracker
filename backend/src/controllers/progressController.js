const { Progress } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class ProgressController {
  /**
   * 获取用户的所有进展记录
   */
  getProgress = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const userId = req.user.id;

    try {
      const whereClause = { userId };

      // 日期范围过滤
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = startDate;
        if (endDate) whereClause.date[Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Progress.findAndCountAll({
        where: whereClause,
        order: [['date', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(successResponse({
        progress: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }, '获取进展记录成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取进展记录失败'));
    }
  });

  /**
   * 根据日期获取特定进展记录
   */
  getProgressByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const userId = req.user.id;

    try {
      const progress = await Progress.findOne({
        where: { userId, date }
      });

      if (!progress) {
        return res.status(404).json(errorResponse('该日期没有进展记录'));
      }

      res.json(successResponse({ progress }, '获取进展记录成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取进展记录失败'));
    }
  });

  /**
   * 创建新的进展记录
   */
  createProgress = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const progressData = { ...req.body, userId };

    try {
      // 检查该日期是否已有记录
      const existingProgress = await Progress.findOne({
        where: { userId, date: progressData.date }
      });

      if (existingProgress) {
        return res.status(409).json(errorResponse('该日期已有进展记录，请使用更新功能'));
      }

      const progress = await Progress.create(progressData);

      res.status(201).json(successResponse({ progress }, '进展记录创建成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 更新进展记录
   */
  updateProgress = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const userId = req.user.id;

    try {
      const [updated] = await Progress.update(req.body, {
        where: { userId, date }
      });

      if (!updated) {
        return res.status(404).json(errorResponse('进展记录未找到'));
      }

      const progress = await Progress.findOne({
        where: { userId, date }
      });

      res.json(successResponse({ progress }, '进展记录更新成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 删除进展记录
   */
  deleteProgress = asyncHandler(async (req, res) => {
    const { date } = req.params;
    const userId = req.user.id;

    try {
      const deleted = await Progress.destroy({
        where: { userId, date }
      });

      if (!deleted) {
        return res.status(404).json(errorResponse('进展记录未找到'));
      }

      res.json(successResponse(null, '进展记录删除成功'));
    } catch (error) {
      res.status(500).json(errorResponse('删除进展记录失败'));
    }
  });

  /**
   * 获取进展统计
   */
  getProgressStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const progress = await Progress.findAll({
        where: {
          userId,
          date: { [Op.gte]: startDate.toISOString().split('T')[0] }
        },
        order: [['date', 'ASC']]
      });

      const stats = {
        totalRecords: progress.length,
        averageRating: progress.length > 0 
          ? (progress.reduce((sum, p) => sum + p.rating, 0) / progress.length).toFixed(1)
          : 0,
        moodDistribution: {},
        ratingTrend: progress.map(p => ({
          date: p.date,
          rating: p.rating
        }))
      };

      // 计算心情分布
      progress.forEach(p => {
        if (p.mood) {
          stats.moodDistribution[p.mood] = (stats.moodDistribution[p.mood] || 0) + 1;
        }
      });

      res.json(successResponse({ stats }, '获取统计数据成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取统计数据失败'));
    }
  });
}

module.exports = new ProgressController();
