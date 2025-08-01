const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class AuthController {
  /**
   * 用户注册
   */
  register = asyncHandler(async (req, res) => {
    const { username, email, password, profile } = req.body;
    
    try {
      const result = await authService.register({
        username,
        email,
        password,
        profile
      });
      
      res.status(201).json(successResponse(result, '注册成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 用户登录
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const result = await authService.login(email, password);
      
      res.json(successResponse(result, '登录成功'));
    } catch (error) {
      res.status(401).json(errorResponse(error.message));
    }
  });

  /**
   * 获取当前用户信息
   */
  getProfile = asyncHandler(async (req, res) => {
    try {
      // req.user 由认证中间件设置
      const user = req.user;
      
      res.json(successResponse({ user }, '获取用户信息成功'));
    } catch (error) {
      res.status(500).json(errorResponse('获取用户信息失败'));
    }
  });

  /**
   * 刷新令牌
   */
  refreshToken = asyncHandler(async (req, res) => {
    try {
      const userId = req.user.id;
      const token = await authService.refreshToken(userId);
      
      res.json(successResponse({ token }, '令牌刷新成功'));
    } catch (error) {
      res.status(401).json(errorResponse(error.message));
    }
  });

  /**
   * 修改密码
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      
      res.json(successResponse(null, '密码修改成功'));
    } catch (error) {
      res.status(400).json(errorResponse(error.message));
    }
  });

  /**
   * 更新用户资料
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { profile } = req.body;
    
    try {
      const user = req.user;
      
      // 更新用户资料
      await user.update({
        profile: {
          ...user.profile,
          ...profile
        }
      });
      
      // 重新获取用户信息
      await user.reload();
      
      res.json(successResponse({ 
        user: require('../utils/helpers').sanitizeUser(user) 
      }, '资料更新成功'));
    } catch (error) {
      res.status(400).json(errorResponse('资料更新失败'));
    }
  });

  /**
   * 验证令牌（用于前端检查令牌有效性）
   */
  verifyToken = asyncHandler(async (req, res) => {
    try {
      // 如果能到达这里，说明令牌有效（通过了认证中间件）
      res.json(successResponse({ 
        valid: true, 
        user: require('../utils/helpers').sanitizeUser(req.user) 
      }, '令牌有效'));
    } catch (error) {
      res.status(401).json(errorResponse('令牌无效'));
    }
  });

  /**
   * 登出（客户端处理，服务端记录日志）
   */
  logout = asyncHandler(async (req, res) => {
    try {
      logger.info('User logged out', { userId: req.user.id });
      
      res.json(successResponse(null, '登出成功'));
    } catch (error) {
      res.status(500).json(errorResponse('登出失败'));
    }
  });

  /**
   * 删除账户
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;
    
    try {
      const user = req.user;
      
      // 验证密码
      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json(errorResponse('密码错误'));
      }
      
      // 软删除用户（由于设置了 paranoid: true）
      await user.destroy();
      
      logger.info('User account deleted', { userId: user.id });
      
      res.json(successResponse(null, '账户删除成功'));
    } catch (error) {
      res.status(500).json(errorResponse('账户删除失败'));
    }
  });
}

module.exports = new AuthController();
