import authService from './authService';

const API_BASE = 'http://localhost:3001/api';

class ProgressService {
  // 保存进展记录
  async saveProgress(progressData) {
    try {
      // 先检查是否已存在该日期的记录
      const existingProgress = await this.getProgressByDate(progressData.date);

      if (existingProgress) {
        // 更新现有记录
        return await this.updateProgress(progressData.date, progressData);
      } else {
        // 创建新记录
        return await this.createProgress(progressData);
      }
    } catch (error) {
      console.error('保存进展记录失败:', error);
      throw new Error(error.message || '保存进展记录失败');
    }
  }

  // 创建新的进展记录
  async createProgress(progressData) {
    try {
      const response = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(progressData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '创建进展记录失败');
      }

      return { success: true, message: result.message || '进展记录已保存' };
    } catch (error) {
      console.error('创建进展记录失败:', error);
      throw new Error(error.message || '创建进展记录失败');
    }
  }

  // 更新进展记录
  async updateProgress(date, progressData) {
    try {
      const response = await fetch(`${API_BASE}/progress/${date}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(progressData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新进展记录失败');
      }

      return { success: true, message: result.message || '进展记录已更新' };
    } catch (error) {
      console.error('更新进展记录失败:', error);
      throw new Error(error.message || '更新进展记录失败');
    }
  }

  // 获取进展记录列表
  async getProgressList(limit = 10) {
    try {
      const response = await fetch(`${API_BASE}/progress?limit=${limit}`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取进展记录失败');
      }

      return result.data.progress || [];
    } catch (error) {
      console.error('获取进展记录失败:', error);
      throw new Error(error.message || '获取进展记录失败');
    }
  }

  // 获取特定日期的进展记录
  async getProgressByDate(date) {
    try {
      const response = await fetch(`${API_BASE}/progress/${date}`, {
        headers: authService.getAuthHeaders()
      });

      if (response.status === 404) {
        return null; // 该日期没有记录
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取进展记录失败');
      }

      return result.data.progress || null;
    } catch (error) {
      if (error.message.includes('该日期没有进展记录')) {
        return null;
      }
      console.error('获取进展记录失败:', error);
      throw new Error(error.message || '获取进展记录失败');
    }
  }

  // 删除进展记录
  async deleteProgress(date) {
    try {
      const response = await fetch(`${API_BASE}/progress/${date}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '删除进展记录失败');
      }

      return { success: true, message: result.message || '进展记录已删除' };
    } catch (error) {
      console.error('删除进展记录失败:', error);
      throw new Error(error.message || '删除进展记录失败');
    }
  }

  // 获取最近7天的评分数据（用于图表）
  async getRecentRatings() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await fetch(`${API_BASE}/progress?startDate=${startDate}&endDate=${endDate}&limit=100`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取评分数据失败');
      }

      const progressList = result.data.progress || [];

      // 生成最近7天的数据
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

        const progress = progressList.find(p => p.date === dateString);
        chartData.push({
          date: formattedDate,
          rating: progress ? progress.rating : 0
        });
      }

      return chartData;
    } catch (error) {
      console.error('获取评分数据失败:', error);
      throw new Error(error.message || '获取评分数据失败');
    }
  }

  // 获取统计数据
  async getStatistics() {
    try {
      const response = await fetch(`${API_BASE}/progress/stats?days=30`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取统计数据失败');
      }

      const stats = result.data.stats;

      // 如果没有数据，返回默认值
      if (stats.totalRecords === 0) {
        return {
          totalRecords: 0,
          averageRating: 0,
          highestRating: 0,
          lowestRating: 0,
          recentTrend: 'stable'
        };
      }

      // 计算趋势（基于最近的评分数据）
      let recentTrend = 'stable';
      if (stats.ratingTrend && stats.ratingTrend.length >= 6) {
        const recent3 = stats.ratingTrend.slice(-3);
        const previous3 = stats.ratingTrend.slice(-6, -3);

        if (recent3.length >= 2 && previous3.length >= 2) {
          const recentAvg = recent3.reduce((sum, p) => sum + p.rating, 0) / recent3.length;
          const previousAvg = previous3.reduce((sum, p) => sum + p.rating, 0) / previous3.length;

          if (recentAvg > previousAvg + 0.5) recentTrend = 'up';
          else if (recentAvg < previousAvg - 0.5) recentTrend = 'down';
        }
      }

      const ratings = stats.ratingTrend.map(p => p.rating).filter(r => r > 0);

      return {
        totalRecords: stats.totalRecords,
        averageRating: parseFloat(stats.averageRating),
        highestRating: ratings.length > 0 ? Math.max(...ratings) : 0,
        lowestRating: ratings.length > 0 ? Math.min(...ratings) : 0,
        recentTrend
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw new Error(error.message || '获取统计数据失败');
    }
  }
}

export default new ProgressService();
