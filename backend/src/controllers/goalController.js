const { Goal } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class GoalController {
  /**
   * 获取用户的所有目标
   */
  getGoals = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, priority, category, startDate, endDate } = req.query;
    const userId = req.user.id;

    try {
      const whereClause = { userId };

      // 状态过滤
      if (status) whereClause.status = status;
      
      // 优先级过滤
      if (priority) whereClause.priority = priority;
      
      // 分类过滤
      if (category) whereClause.category = category;

      // 日期范围过滤
      if (startDate || endDate) {
        whereClause.startDate = {};
        if (startDate) whereClause.startDate[Op.gte] = startDate;
        if (endDate) whereClause.startDate[Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Goal.findAndCountAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['startDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(successResponse({
        goals: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }, '获取目标列表成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取目标列表失败'));
    }
  });

  /**
   * 根据ID获取特定目标
   */
  getGoalById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const goal = await Goal.findOne({
        where: { id, userId }
      });

      if (!goal) {
        return res.status(404).json(errorResponse('目标未找到'));
      }

      res.json(successResponse({ goal }, '获取目标成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取目标失败'));
    }
  });

  /**
   * 创建新目标
   */
  createGoal = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goalData = { ...req.body, userId };

    try {
      const goal = await Goal.create(goalData);

      res.status(201).json(successResponse({ goal }, '目标创建成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 更新目标
   */
  updateGoal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const [updated] = await Goal.update(req.body, {
        where: { id, userId }
      });

      if (!updated) {
        return res.status(404).json(errorResponse('目标未找到'));
      }

      const goal = await Goal.findOne({
        where: { id, userId }
      });

      res.json(successResponse({ goal }, '目标更新成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 删除目标
   */
  deleteGoal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const deleted = await Goal.destroy({
        where: { id, userId }
      });

      if (!deleted) {
        return res.status(404).json(errorResponse('目标未找到'));
      }

      res.json(successResponse(null, '目标删除成功'));
    } catch (error) {
      res.status(500).json(errorResponse('删除目标失败'));
    }
  });

  /**
   * 更新目标进度
   */
  updateProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    try {
      if (progress < 0 || progress > 100) {
        return res.status(400).json(errorResponse('进度必须在0-100之间'));
      }

      const goal = await Goal.findOne({
        where: { id, userId }
      });

      if (!goal) {
        return res.status(404).json(errorResponse('目标未找到'));
      }

      // 自动更新状态
      let newStatus = goal.status;
      if (progress === 100 && goal.status !== 'completed') {
        newStatus = 'completed';
      } else if (progress > 0 && goal.status === 'not_started') {
        newStatus = 'in_progress';
      }

      await goal.update({ 
        progress, 
        status: newStatus,
        ...(progress === 100 && { completedAt: new Date() })
      });

      res.json(successResponse({ goal }, '进度更新成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 获取目标统计
   */
  getGoalStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const goals = await Goal.findAll({
        where: { userId }
      });

      const stats = {
        totalGoals: goals.length,
        statusDistribution: {},
        priorityDistribution: {},
        categoryDistribution: {},
        averageProgress: 0,
        completionRate: 0,
        activeGoals: 0,
        overdue: 0
      };

      const now = new Date();
      let totalProgress = 0;

      goals.forEach(goal => {
        // 状态分布
        stats.statusDistribution[goal.status] = (stats.statusDistribution[goal.status] || 0) + 1;
        
        // 优先级分布
        stats.priorityDistribution[goal.priority] = (stats.priorityDistribution[goal.priority] || 0) + 1;
        
        // 分类分布
        if (goal.category) {
          stats.categoryDistribution[goal.category] = (stats.categoryDistribution[goal.category] || 0) + 1;
        }

        // 累计进度
        totalProgress += goal.progress;

        // 活跃目标
        if (['not_started', 'in_progress'].includes(goal.status)) {
          stats.activeGoals++;
        }

        // 逾期目标
        if (goal.endDate && new Date(goal.endDate) < now && goal.status !== 'completed') {
          stats.overdue++;
        }
      });

      // 平均进度
      stats.averageProgress = goals.length > 0 
        ? (totalProgress / goals.length).toFixed(1)
        : 0;

      // 完成率
      const completedCount = stats.statusDistribution.completed || 0;
      stats.completionRate = goals.length > 0 
        ? ((completedCount / goals.length) * 100).toFixed(1)
        : 0;

      res.json(successResponse({ stats }, '获取统计数据成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取统计数据失败'));
    }
  });

  /**
   * 获取目标分类列表
   */
  getCategories = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const categories = await Goal.findAll({
        where: { 
          userId,
          category: { [Op.not]: null }
        },
        attributes: ['category'],
        group: ['category'],
        raw: true
      });

      const categoryList = categories.map(c => c.category).filter(Boolean);

      res.json(successResponse({ categories: categoryList }, '获取分类列表成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取分类列表失败'));
    }
  });
}

module.exports = new GoalController();
