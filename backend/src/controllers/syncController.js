const { User, Progress, Reflection, Goal } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class SyncController {
  /**
   * 获取用户的所有数据（用于初始同步）
   */
  getFullData = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const [progress, reflections, goals] = await Promise.all([
        Progress.findAll({ 
          where: { userId },
          order: [['date', 'DESC']]
        }),
        Reflection.findAll({ 
          where: { userId },
          order: [['date', 'DESC']]
        }),
        Goal.findAll({ 
          where: { userId },
          order: [['startDate', 'DESC']]
        })
      ]);

      const syncData = {
        progress,
        reflections,
        goals,
        lastSyncTime: new Date().toISOString()
      };

      res.json(successResponse(syncData, '数据同步成功'));
    } catch (error) {
      res.status(500).json(errorResponse('数据同步失败'));
    }
  });

  /**
   * 增量数据同步（获取指定时间后的更新）
   */
  getIncrementalData = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { lastSyncTime } = req.query;

    try {
      if (!lastSyncTime) {
        return res.status(400).json(errorResponse('缺少 lastSyncTime 参数'));
      }

      const syncDate = new Date(lastSyncTime);
      const whereClause = {
        userId,
        updatedAt: { [Op.gt]: syncDate }
      };

      const [progress, reflections, goals] = await Promise.all([
        Progress.findAll({ 
          where: whereClause,
          order: [['updatedAt', 'DESC']]
        }),
        Reflection.findAll({ 
          where: whereClause,
          order: [['updatedAt', 'DESC']]
        }),
        Goal.findAll({ 
          where: whereClause,
          order: [['updatedAt', 'DESC']]
        })
      ]);

      const syncData = {
        progress,
        reflections,
        goals,
        lastSyncTime: new Date().toISOString()
      };

      res.json(successResponse(syncData, '增量同步成功'));
    } catch (error) {
      res.status(500).json(errorResponse('增量同步失败'));
    }
  });

  /**
   * 批量上传数据
   */
  uploadData = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { progress = [], reflections = [], goals = [] } = req.body;

    try {
      const results = {
        progress: { created: 0, updated: 0, errors: [] },
        reflections: { created: 0, updated: 0, errors: [] },
        goals: { created: 0, updated: 0, errors: [] }
      };

      // 处理进展记录
      for (const item of progress) {
        try {
          const [record, created] = await Progress.upsert({
            ...item,
            userId
          });
          
          if (created) {
            results.progress.created++;
          } else {
            results.progress.updated++;
          }
        } catch (error) {
          results.progress.errors.push({
            item,
            error: error.message
          });
        }
      }

      // 处理反思记录
      for (const item of reflections) {
        try {
          const [record, created] = await Reflection.upsert({
            ...item,
            userId
          });
          
          if (created) {
            results.reflections.created++;
          } else {
            results.reflections.updated++;
          }
        } catch (error) {
          results.reflections.errors.push({
            item,
            error: error.message
          });
        }
      }

      // 处理目标
      for (const item of goals) {
        try {
          const [record, created] = await Goal.upsert({
            ...item,
            userId
          });
          
          if (created) {
            results.goals.created++;
          } else {
            results.goals.updated++;
          }
        } catch (error) {
          results.goals.errors.push({
            item,
            error: error.message
          });
        }
      }

      res.json(successResponse(results, '数据上传完成'));
    } catch (error) {
      res.status(500).json(errorResponse('数据上传失败'));
    }
  });

  /**
   * 获取同步状态
   */
  getSyncStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const [progressCount, reflectionCount, goalCount] = await Promise.all([
        Progress.count({ where: { userId } }),
        Reflection.count({ where: { userId } }),
        Goal.count({ where: { userId } })
      ]);

      // 获取最后更新时间
      const lastUpdated = await Promise.all([
        Progress.findOne({ 
          where: { userId },
          order: [['updatedAt', 'DESC']],
          attributes: ['updatedAt']
        }),
        Reflection.findOne({ 
          where: { userId },
          order: [['updatedAt', 'DESC']],
          attributes: ['updatedAt']
        }),
        Goal.findOne({ 
          where: { userId },
          order: [['updatedAt', 'DESC']],
          attributes: ['updatedAt']
        })
      ]);

      const status = {
        counts: {
          progress: progressCount,
          reflections: reflectionCount,
          goals: goalCount,
          total: progressCount + reflectionCount + goalCount
        },
        lastUpdated: {
          progress: lastUpdated[0]?.updatedAt || null,
          reflections: lastUpdated[1]?.updatedAt || null,
          goals: lastUpdated[2]?.updatedAt || null
        },
        serverTime: new Date().toISOString()
      };

      res.json(successResponse(status, '获取同步状态成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取同步状态失败'));
    }
  });

  /**
   * 数据备份
   */
  backupData = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const user = await User.findByPk(userId, {
        include: [
          { model: Progress, as: 'progressRecords' },
          { model: Reflection, as: 'reflections' },
          { model: Goal, as: 'goals' }
        ]
      });

      if (!user) {
        return res.status(404).json(errorResponse('用户不存在'));
      }

      const backup = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          createdAt: user.createdAt
        },
        data: {
          progress: user.progressRecords,
          reflections: user.reflections,
          goals: user.goals
        },
        metadata: {
          backupTime: new Date().toISOString(),
          version: '1.0',
          totalRecords: user.progressRecords.length + user.reflections.length + user.goals.length
        }
      };

      // 设置下载头
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="progress-tracker-backup-${user.username}-${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(backup);
    } catch (error) {
      res.status(500).json(errorResponse('数据备份失败'));
    }
  });
}

module.exports = new SyncController();
