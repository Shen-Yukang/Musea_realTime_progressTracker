const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, rateLimitMiddleware } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validateChangePassword,
  validate 
} = require('../middleware/validation');
const Joi = require('joi');

// 速率限制配置 - 开发环境更宽松
const authRateLimit = rateLimitMiddleware(50, 15 * 60 * 1000); // 15分钟内最多50次请求
const generalRateLimit = rateLimitMiddleware(200, 15 * 60 * 1000); // 15分钟内最多200次请求

// 用户资料更新验证
const profileUpdateValidation = Joi.object({
  profile: Joi.object({
    name: Joi.string().max(100),
    bio: Joi.string().max(500),
    avatar: Joi.string().uri(),
    timezone: Joi.string().max(50),
    language: Joi.string().max(10),
    theme: Joi.string().valid('light', 'dark', 'auto'),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean()
    })
  }).required()
});

// 删除账户验证
const deleteAccountValidation = Joi.object({
  password: Joi.string().required().messages({
    'any.required': '请输入密码以确认删除账户'
  })
});

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', 
  authRateLimit,
  validateRegister,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', 
  authRateLimit,
  validateLogin,
  authController.login
);

/**
 * @route   GET /api/auth/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', 
  generalRateLimit,
  authMiddleware,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户资料
 * @access  Private
 */
router.put('/profile', 
  generalRateLimit,
  authMiddleware,
  validate(profileUpdateValidation),
  authController.updateProfile
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    刷新JWT令牌
 * @access  Private
 */
router.post('/refresh-token', 
  generalRateLimit,
  authMiddleware,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post('/change-password', 
  authRateLimit,
  authMiddleware,
  validateChangePassword,
  authController.changePassword
);

/**
 * @route   POST /api/auth/verify-token
 * @desc    验证令牌有效性
 * @access  Private
 */
router.post('/verify-token', 
  generalRateLimit,
  authMiddleware,
  authController.verifyToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', 
  generalRateLimit,
  authMiddleware,
  authController.logout
);

/**
 * @route   DELETE /api/auth/account
 * @desc    删除用户账户
 * @access  Private
 */
router.delete('/account', 
  authRateLimit,
  authMiddleware,
  validate(deleteAccountValidation),
  authController.deleteAccount
);

module.exports = router;
