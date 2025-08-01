import authService from './authService';

const API_BASE = 'http://localhost:3001/api';

class ReflectionService {
  // 创建反思记录
  async createReflection(reflectionData) {
    try {
      const response = await fetch(`${API_BASE}/reflections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(reflectionData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '创建反思记录失败');
      }

      return { success: true, data: result.data, message: result.message || '反思记录已保存' };
    } catch (error) {
      console.error('创建反思记录失败:', error);
      throw new Error(error.message || '创建反思记录失败');
    }
  }

  // 获取反思记录列表
  async getReflections(options = {}) {
    try {
      const { page = 1, limit = 10, type, status, startDate, endDate } = options;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${API_BASE}/reflections?${params}`, {
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取反思记录失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取反思记录失败:', error);
      throw new Error(error.message || '获取反思记录失败');
    }
  }

  // 根据ID获取反思记录
  async getReflectionById(id) {
    try {
      const response = await fetch(`${API_BASE}/reflections/${id}`, {
        headers: authService.getAuthHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取反思记录失败');
      }

      return result.data.reflection;
    } catch (error) {
      console.error('获取反思记录失败:', error);
      throw new Error(error.message || '获取反思记录失败');
    }
  }

  // 更新反思记录
  async updateReflection(id, reflectionData) {
    try {
      const response = await fetch(`${API_BASE}/reflections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(reflectionData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新反思记录失败');
      }

      return { success: true, data: result.data, message: result.message || '反思记录已更新' };
    } catch (error) {
      console.error('更新反思记录失败:', error);
      throw new Error(error.message || '更新反思记录失败');
    }
  }

  // 删除反思记录
  async deleteReflection(id) {
    try {
      const response = await fetch(`${API_BASE}/reflections/${id}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '删除反思记录失败');
      }

      return { success: true, message: result.message || '反思记录已删除' };
    } catch (error) {
      console.error('删除反思记录失败:', error);
      throw new Error(error.message || '删除反思记录失败');
    }
  }

  // 获取反思统计数据
  async getReflectionStats(days = 30) {
    try {
      const response = await fetch(`${API_BASE}/reflections/stats?days=${days}`, {
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

  // 批量更新反思状态
  async batchUpdateStatus(ids, status) {
    try {
      const response = await fetch(`${API_BASE}/reflections/batch-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify({ ids, status })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '批量更新失败');
      }

      return { success: true, message: result.message || '批量更新成功' };
    } catch (error) {
      console.error('批量更新失败:', error);
      throw new Error(error.message || '批量更新失败');
    }
  }

  // 保存反思记录（兼容旧接口）
  async saveReflection(reflectionData) {
    if (reflectionData.id) {
      return await this.updateReflection(reflectionData.id, reflectionData);
    } else {
      return await this.createReflection(reflectionData);
    }
  }

  // 获取最近的反思记录（兼容旧接口）
  async getRecentReflections(limit = 5) {
    try {
      const result = await this.getReflections({ limit });
      return result.reflections || [];
    } catch (error) {
      console.error('获取最近反思记录失败:', error);
      throw new Error(error.message || '获取最近反思记录失败');
    }
  }
}

export default new ReflectionService();
