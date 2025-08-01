const { Reflection } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class ReflectionController {
  /**
   * 获取用户的所有反思记录
   */
  getReflections = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, type, status, startDate, endDate } = req.query;
    const userId = req.user.id;

    try {
      const whereClause = { userId };

      // 类型过滤
      if (type) whereClause.type = type;
      
      // 状态过滤
      if (status) whereClause.status = status;

      // 日期范围过滤
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = startDate;
        if (endDate) whereClause.date[Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Reflection.findAndCountAll({
        where: whereClause,
        order: [['date', 'DESC'], ['priority', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(successResponse({
        reflections: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }, '获取反思记录成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取反思记录失败'));
    }
  });

  /**
   * 根据ID获取特定反思记录
   */
  getReflectionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const reflection = await Reflection.findOne({
        where: { id, userId }
      });

      if (!reflection) {
        return res.status(404).json(errorResponse('反思记录未找到'));
      }

      res.json(successResponse({ reflection }, '获取反思记录成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取反思记录失败'));
    }
  });

  /**
   * 创建新的反思记录
   */
  createReflection = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const reflectionData = { ...req.body, userId };

    try {
      const reflection = await Reflection.create(reflectionData);

      res.status(201).json(successResponse({ reflection }, '反思记录创建成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 更新反思记录
   */
  updateReflection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const [updated] = await Reflection.update(req.body, {
        where: { id, userId }
      });

      if (!updated) {
        return res.status(404).json(errorResponse('反思记录未找到'));
      }

      const reflection = await Reflection.findOne({
        where: { id, userId }
      });

      res.json(successResponse({ reflection }, '反思记录更新成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 删除反思记录
   */
  deleteReflection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const deleted = await Reflection.destroy({
        where: { id, userId }
      });

      if (!deleted) {
        return res.status(404).json(errorResponse('反思记录未找到'));
      }

      res.json(successResponse(null, '反思记录删除成功'));
    } catch (error) {
      res.status(500).json(errorResponse('删除反思记录失败'));
    }
  });

  /**
   * 获取反思统计
   */
  getReflectionStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const reflections = await Reflection.findAll({
        where: {
          userId,
          date: { [Op.gte]: startDate.toISOString().split('T')[0] }
        },
        order: [['date', 'ASC']]
      });

      const stats = {
        totalReflections: reflections.length,
        typeDistribution: {},
        priorityDistribution: {},
        statusDistribution: {},
        completionRate: 0
      };

      // 计算各种分布
      reflections.forEach(r => {
        // 类型分布
        stats.typeDistribution[r.type] = (stats.typeDistribution[r.type] || 0) + 1;
        
        // 优先级分布
        stats.priorityDistribution[r.priority] = (stats.priorityDistribution[r.priority] || 0) + 1;
        
        // 状态分布
        stats.statusDistribution[r.status] = (stats.statusDistribution[r.status] || 0) + 1;
      });

      // 计算完成率
      const completedCount = stats.statusDistribution.completed || 0;
      stats.completionRate = reflections.length > 0 
        ? ((completedCount / reflections.length) * 100).toFixed(1)
        : 0;

      res.json(successResponse({ stats }, '获取统计数据成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取统计数据失败'));
    }
  });

  /**
   * 批量更新反思状态
   */
  batchUpdateStatus = asyncHandler(async (req, res) => {
    const { ids, status } = req.body;
    const userId = req.user.id;

    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(errorResponse('请提供有效的ID列表'));
      }

      const [updated] = await Reflection.update(
        { status },
        {
          where: {
            id: { [Op.in]: ids },
            userId
          }
        }
      );

      res.json(successResponse({ 
        updatedCount: updated 
      }, `成功更新 ${updated} 条反思记录`));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });
}

module.exports = new ReflectionController();
