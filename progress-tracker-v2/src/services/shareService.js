import authService from './authService';

const API_BASE = 'http://localhost:3001/api';

class ShareService {
  // 创建分享
  async createShare(shareData) {
    const response = await fetch(`${API_BASE}/share/manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      },
      body: JSON.stringify(shareData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '创建分享失败');
    }

    return response.json();
  }

  // 获取我的分享列表
  async getMyShares() {
    const response = await fetch(`${API_BASE}/share/manage`, {
      headers: authService.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取分享列表失败');
    }

    return response.json();
  }

  // 获取分享详情
  async getShare(shareId) {
    const response = await fetch(`${API_BASE}/share/manage/${shareId}`, {
      headers: authService.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取分享详情失败');
    }

    return response.json();
  }

  // 更新分享
  async updateShare(shareId, shareData) {
    const response = await fetch(`${API_BASE}/share/manage/${shareId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders()
      },
      body: JSON.stringify(shareData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新分享失败');
    }

    return response.json();
  }

  // 删除分享
  async deleteShare(shareId) {
    const response = await fetch(`${API_BASE}/share/manage/${shareId}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '删除分享失败');
    }

    return response.json();
  }

  // 切换分享状态
  async toggleShareStatus(shareId) {
    const response = await fetch(`${API_BASE}/share/manage/${shareId}/toggle`, {
      method: 'PATCH',
      headers: authService.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '切换分享状态失败');
    }

    return response.json();
  }

  // 获取分享统计
  async getShareStats(shareId) {
    const response = await fetch(`${API_BASE}/share/manage/${shareId}/stats`, {
      headers: authService.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取分享统计失败');
    }

    return response.json();
  }

  // 检查分享状态（公开接口）
  async checkShareStatus(shareToken) {
    const response = await fetch(`${API_BASE}/share/${shareToken}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '检查分享状态失败');
    }

    return response.json();
  }

  // 获取分享数据（公开接口）
  async getShareData(shareToken, password = '') {
    const response = await fetch(`${API_BASE}/share/${shareToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取分享数据失败');
    }

    return response.json();
  }

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }

  // 生成分享URL
  generateShareUrl(shareToken) {
    return `${window.location.origin}/share/${shareToken}`;
  }
}

export default new ShareService();
