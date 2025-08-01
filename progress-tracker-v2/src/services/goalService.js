import authService from './authService';

const API_BASE = 'http://localhost:3001/api';

class GoalService {
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
  async getGoals(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // 添加查询参数
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.category) queryParams.append('category', params.category);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const url = `${API_BASE}/goals${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...authService.getAuthHeaders()
        }
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
  async getGoalById(goalId) {
    try {
      const response = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'GET',
        headers: {
          ...authService.getAuthHeaders()
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取目标详情失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取目标详情失败:', error);
      throw new Error(error.message || '获取目标详情失败');
    }
  }

  // 更新目标
  async updateGoal(goalId, goalData) {
    try {
      const response = await fetch(`${API_BASE}/goals/${goalId}`, {
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
  async updateGoalProgress(goalId, progress) {
    try {
      const response = await fetch(`${API_BASE}/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify({ progress })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新目标进度失败');
      }

      return { success: true, data: result.data, message: result.message || '目标进度已更新' };
    } catch (error) {
      console.error('更新目标进度失败:', error);
      throw new Error(error.message || '更新目标进度失败');
    }
  }

  // 删除目标
  async deleteGoal(goalId) {
    try {
      const response = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          ...authService.getAuthHeaders()
        }
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
        method: 'GET',
        headers: {
          ...authService.getAuthHeaders()
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取目标统计失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取目标统计失败:', error);
      throw new Error(error.message || '获取目标统计失败');
    }
  }

  // 获取目标分类列表
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE}/goals/categories`, {
        method: 'GET',
        headers: {
          ...authService.getAuthHeaders()
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取分类列表失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw new Error(error.message || '获取分类列表失败');
    }
  }

  // 兼容旧接口的方法
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
      const result = await this.getGoals({ limit: 1000 });
      return result.goals || [];
    } catch (error) {
      console.error('获取所有目标失败:', error);
      throw new Error(error.message || '获取所有目标失败');
    }
  }
}

export default new GoalService();
