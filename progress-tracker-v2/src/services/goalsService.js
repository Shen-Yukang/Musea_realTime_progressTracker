import authService from './authService';

const API_BASE = 'http://localhost:3001/api';

class GoalsService {
  // 创建目标
  async createGoal(goalData) {
    try {
      const response = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(goalData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '创建目标失败');
      }

      return { success: true, data: result.data, message: result.message || '目标已创建' };
    } catch (error) {
      console.error('创建目标失败:', error);
      throw new Error(error.message || '创建目标失败');
    }
  }

  // 获取目标列表
  async getGoals(options = {}) {
    try {
      const { page = 1, limit = 10, status, priority, category, startDate, endDate } = options;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (category) params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${API_BASE}/goals?${params}`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取目标列表失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取目标列表失败:', error);
      throw new Error(error.message || '获取目标列表失败');
    }
  }

  // 根据ID获取目标
  async getGoalById(id) {
    try {
      const response = await fetch(`${API_BASE}/goals/${id}`, {
        headers: authService.getAuthHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取目标失败');
      }

      return result.data.goal;
    } catch (error) {
      console.error('获取目标失败:', error);
      throw new Error(error.message || '获取目标失败');
    }
  }

  // 更新目标
  async updateGoal(id, goalData) {
    try {
      const response = await fetch(`${API_BASE}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(goalData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新目标失败');
      }

      return { success: true, data: result.data, message: result.message || '目标已更新' };
    } catch (error) {
      console.error('更新目标失败:', error);
      throw new Error(error.message || '更新目标失败');
    }
  }

  // 更新目标进度
  async updateProgress(id, progress) {
    try {
      const response = await fetch(`${API_BASE}/goals/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify({ progress })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新进度失败');
      }

      return { success: true, data: result.data, message: result.message || '进度已更新' };
    } catch (error) {
      console.error('更新进度失败:', error);
      throw new Error(error.message || '更新进度失败');
    }
  }

  // 删除目标
  async deleteGoal(id) {
    try {
      const response = await fetch(`${API_BASE}/goals/${id}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '删除目标失败');
      }

      return { success: true, message: result.message || '目标已删除' };
    } catch (error) {
      console.error('删除目标失败:', error);
      throw new Error(error.message || '删除目标失败');
    }
  }

  // 获取目标统计数据
  async getGoalStats() {
    try {
      const response = await fetch(`${API_BASE}/goals/stats`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取统计数据失败');
      }

      return result.data.stats;
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw new Error(error.message || '获取统计数据失败');
    }
  }

  // 获取目标分类
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE}/goals/categories`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取分类失败');
      }

      return result.data.categories;
    } catch (error) {
      console.error('获取分类失败:', error);
      throw new Error(error.message || '获取分类失败');
    }
  }

  // 保存目标（兼容旧接口）
  async saveGoal(goalData) {
    if (goalData.id) {
      return await this.updateGoal(goalData.id, goalData);
    } else {
      return await this.createGoal(goalData);
    }
  }

  // 获取所有目标（兼容旧接口）
  async getAllGoals() {
    try {
      const result = await this.getGoals({ limit: 100 });
      return result.goals || [];
    } catch (error) {
      console.error('获取所有目标失败:', error);
      throw new Error(error.message || '获取所有目标失败');
    }
  }

  // 获取活跃目标（兼容旧接口）
  async getActiveGoals() {
    try {
      const result = await this.getGoals({ status: 'active', limit: 100 });
      return result.goals || [];
    } catch (error) {
      console.error('获取活跃目标失败:', error);
      throw new Error(error.message || '获取活跃目标失败');
    }
  }
}

export default new GoalsService();
