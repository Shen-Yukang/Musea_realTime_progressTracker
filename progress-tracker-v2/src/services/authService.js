const API_BASE_URL = 'http://localhost:3001/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // 设置认证头
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // 保存令牌
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // 清除令牌
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // 用户注册
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('注册错误:', error);
      throw error;
    }
  }

  // 用户登录
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
      }

      return data;
    } catch (error) {
      console.error('登录错误:', error);
      throw error;
    }
  }

  // 获取用户资料
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
        }
        throw new Error(data.message || '获取用户资料失败');
      }

      return data;
    } catch (error) {
      console.error('获取用户资料错误:', error);
      throw error;
    }
  }

  // 验证令牌
  async verifyToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.clearToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('令牌验证错误:', error);
      this.clearToken();
      return false;
    }
  }

  // 登出
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error('登出错误:', error);
    } finally {
      this.clearToken();
    }
  }

  // 检查是否已登录
  isAuthenticated() {
    return !!this.token;
  }

  // 获取当前令牌
  getToken() {
    return this.token;
  }
}

export default new AuthService();
