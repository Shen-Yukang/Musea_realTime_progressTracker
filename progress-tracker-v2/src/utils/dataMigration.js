import { db } from '../db/index.js';
import progressService from '../services/progressService';
import reflectionService from '../services/reflectionService';
import goalService from '../services/goalService';

class DataMigrationService {
  constructor() {
    this.migrationStatus = {
      progress: { total: 0, migrated: 0, errors: [] },
      reflections: { total: 0, migrated: 0, errors: [] },
      goals: { total: 0, migrated: 0, errors: [] }
    };
  }

  // 检查是否有本地数据需要迁移
  async checkLocalData() {
    try {
      const progressCount = await db.progress.count();
      const reflectionsCount = await db.reflections.count();
      const goalsCount = await db.goals.count();

      return {
        hasData: progressCount > 0 || reflectionsCount > 0 || goalsCount > 0,
        counts: {
          progress: progressCount,
          reflections: reflectionsCount,
          goals: goalsCount
        }
      };
    } catch (error) {
      console.warn('检查本地数据失败:', error);
      return { hasData: false, counts: { progress: 0, reflections: 0, goals: 0 } };
    }
  }

  // 导出本地数据
  async exportLocalData() {
    try {
      const [progressData, reflectionsData, goalsData] = await Promise.all([
        db.progress.toArray().catch(() => []),
        db.reflections.toArray().catch(() => []),
        db.goals.toArray().catch(() => [])
      ]);

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          progress: progressData,
          reflections: reflectionsData,
          goals: goalsData
        }
      };

      // 创建下载链接
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `progress-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, message: '数据导出成功' };
    } catch (error) {
      console.error('导出数据失败:', error);
      return { success: false, message: '导出数据失败: ' + error.message };
    }
  }

  // 迁移进展记录
  async migrateProgress(onProgress) {
    try {
      const progressData = await db.progress.toArray();
      this.migrationStatus.progress.total = progressData.length;

      for (const progress of progressData) {
        try {
          // 转换数据格式以匹配 API
          const apiData = {
            date: progress.date,
            mainTasks: progress.mainTasks || '',
            challenges: progress.challenges || '',
            learnings: progress.learnings || '',
            nextDayPlan: progress.nextDayPlan || '',
            rating: progress.rating || 5
          };

          await progressService.saveProgress(apiData);
          this.migrationStatus.progress.migrated++;
          
          if (onProgress) {
            onProgress('progress', this.migrationStatus.progress);
          }
        } catch (error) {
          this.migrationStatus.progress.errors.push({
            item: progress,
            error: error.message
          });
        }
      }

      return this.migrationStatus.progress;
    } catch (error) {
      console.error('迁移进展记录失败:', error);
      throw error;
    }
  }

  // 迁移反思记录
  async migrateReflections(onProgress) {
    try {
      const reflectionsData = await db.reflections.toArray();
      this.migrationStatus.reflections.total = reflectionsData.length;

      for (const reflection of reflectionsData) {
        try {
          // 转换数据格式以匹配 API
          const apiData = {
            date: reflection.date,
            content: reflection.content || '',
            adjustments: reflection.adjustments || '',
            type: 'daily'
          };

          await reflectionService.saveReflection(apiData);
          this.migrationStatus.reflections.migrated++;
          
          if (onProgress) {
            onProgress('reflections', this.migrationStatus.reflections);
          }
        } catch (error) {
          this.migrationStatus.reflections.errors.push({
            item: reflection,
            error: error.message
          });
        }
      }

      return this.migrationStatus.reflections;
    } catch (error) {
      console.error('迁移反思记录失败:', error);
      throw error;
    }
  }

  // 迁移目标记录
  async migrateGoals(onProgress) {
    try {
      const goalsData = await db.goals.toArray();
      this.migrationStatus.goals.total = goalsData.length;

      for (const goal of goalsData) {
        try {
          // 转换数据格式以匹配 API
          const apiData = {
            name: goal.name || '',
            description: goal.description || '',
            startDate: goal.startDate || new Date().toISOString().split('T')[0],
            endDate: goal.endDate || new Date().toISOString().split('T')[0],
            priority: goal.priority || 'medium',
            progress: goal.progress || 0,
            status: goal.completed ? 'completed' : 'not_started'
          };

          await goalService.createGoal(apiData);
          this.migrationStatus.goals.migrated++;
          
          if (onProgress) {
            onProgress('goals', this.migrationStatus.goals);
          }
        } catch (error) {
          this.migrationStatus.goals.errors.push({
            item: goal,
            error: error.message
          });
        }
      }

      return this.migrationStatus.goals;
    } catch (error) {
      console.error('迁移目标记录失败:', error);
      throw error;
    }
  }

  // 完整迁移流程
  async migrateAllData(onProgress) {
    try {
      const results = {
        progress: await this.migrateProgress(onProgress),
        reflections: await this.migrateReflections(onProgress),
        goals: await this.migrateGoals(onProgress)
      };

      // 计算总体统计
      const totalItems = results.progress.total + results.reflections.total + results.goals.total;
      const totalMigrated = results.progress.migrated + results.reflections.migrated + results.goals.migrated;
      const totalErrors = results.progress.errors.length + results.reflections.errors.length + results.goals.errors.length;

      return {
        success: true,
        summary: {
          totalItems,
          totalMigrated,
          totalErrors,
          successRate: totalItems > 0 ? (totalMigrated / totalItems * 100).toFixed(1) : 100
        },
        details: results
      };
    } catch (error) {
      console.error('数据迁移失败:', error);
      return {
        success: false,
        error: error.message,
        details: this.migrationStatus
      };
    }
  }

  // 清理本地数据（迁移成功后）
  async cleanupLocalData() {
    try {
      await Promise.all([
        db.progress.clear(),
        db.reflections.clear(),
        db.goals.clear()
      ]);
      
      return { success: true, message: '本地数据清理完成' };
    } catch (error) {
      console.error('清理本地数据失败:', error);
      return { success: false, message: '清理本地数据失败: ' + error.message };
    }
  }

  // 重置迁移状态
  resetMigrationStatus() {
    this.migrationStatus = {
      progress: { total: 0, migrated: 0, errors: [] },
      reflections: { total: 0, migrated: 0, errors: [] },
      goals: { total: 0, migrated: 0, errors: [] }
    };
  }
}

export default new DataMigrationService();
