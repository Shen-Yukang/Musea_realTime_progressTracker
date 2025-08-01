const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sanitizeUser } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthService {
  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Object} 用户信息和令牌
   */
  async register(userData) {
    const { username, email, password, profile = {} } = userData;
    
    try {
      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { email: email.toLowerCase() },
            { username }
          ]
        }
      });
      
      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          throw new Error('邮箱已被注册');
        }
        if (existingUser.username === username) {
          throw new Error('用户名已被使用');
        }
      }
      
      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // 创建用户
      const user = await User.create({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        profile
      });
      
      // 生成 JWT
      const token = this.generateToken(user.id);
      
      logger.info('User registered successfully', { userId: user.id, username, email });
      
      return { 
        user: sanitizeUser(user), 
        token 
      };
    } catch (error) {
      logger.error('Registration failed', { error: error.message, email, username });
      throw error;
    }
  }
  
  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Object} 用户信息和令牌
   */
  async login(email, password) {
    try {
      const user = await User.findOne({ 
        where: { email: email.toLowerCase() } 
      });
      
      if (!user) {
        throw new Error('邮箱或密码错误');
      }
      
      if (!user.isActive) {
        throw new Error('账户已被禁用');
      }
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('邮箱或密码错误');
      }
      
      // 更新最后登录时间
      await user.update({ lastLoginAt: new Date() });
      
      // 生成 JWT
      const token = this.generateToken(user.id);
      
      logger.info('User logged in successfully', { userId: user.id, email });
      
      return { 
        user: sanitizeUser(user), 
        token 
      };
    } catch (error) {
      logger.error('Login failed', { error: error.message, email });
      throw error;
    }
  }
  
  /**
   * 验证令牌
   * @param {string} token - JWT 令牌
   * @returns {Object} 解码的用户信息
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('无效的认证令牌');
      }
      
      return sanitizeUser(user);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的认证令牌');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('认证令牌已过期');
      }
      throw error;
    }
  }
  
  /**
   * 生成 JWT 令牌
   * @param {string} userId - 用户ID
   * @returns {string} JWT 令牌
   */
  generateToken(userId) {
    return jwt.sign(
      { userId }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
  
  /**
   * 刷新令牌
   * @param {string} userId - 用户ID
   * @returns {string} 新的 JWT 令牌
   */
  async refreshToken(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.isActive) {
        throw new Error('用户不存在或已被禁用');
      }
      
      const token = this.generateToken(user.id);
      
      logger.info('Token refreshed successfully', { userId });
      
      return token;
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message, userId });
      throw error;
    }
  }
  
  /**
   * 修改密码
   * @param {string} userId - 用户ID
   * @param {string} currentPassword - 当前密码
   * @param {string} newPassword - 新密码
   * @returns {boolean} 是否成功
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('当前密码错误');
      }
      
      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      
      // 更新密码
      await user.update({ password: hashedNewPassword });
      
      logger.info('Password changed successfully', { userId });
      
      return true;
    } catch (error) {
      logger.error('Password change failed', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = new AuthService();
