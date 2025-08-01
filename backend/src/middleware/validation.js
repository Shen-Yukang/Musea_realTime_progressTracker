const Joi = require('joi');
const { errorResponse } = require('../utils/helpers');

/**
 * 通用验证中间件
 * @param {Object} schema - Joi 验证模式
 * @param {string} property - 要验证的属性 ('body', 'params', 'query')
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json(errorResponse('数据验证失败', errorMessages));
    }
    
    // 使用验证后的值替换原始值
    req[property] = value;
    next();
  };
};

// 用户注册验证
const registerValidation = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少需要3个字符',
      'string.max': '用户名不能超过50个字符',
      'any.required': '用户名是必填项'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': '密码至少需要6个字符',
      'string.max': '密码不能超过128个字符',
      'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母和一个数字',
      'any.required': '密码是必填项'
    }),
  profile: Joi.object({
    name: Joi.string().max(100),
    bio: Joi.string().max(500),
    avatar: Joi.string().uri(),
    timezone: Joi.string().max(50),
    language: Joi.string().max(10)
  }).optional()
});

// 用户登录验证
const loginValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码是必填项'
    })
});

// 修改密码验证
const changePasswordValidation = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': '当前密码是必填项'
    }),
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': '新密码至少需要6个字符',
      'string.max': '新密码不能超过128个字符',
      'string.pattern.base': '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
      'any.required': '新密码是必填项'
    })
});

// 进展记录验证
const progressValidation = Joi.object({
  date: Joi.date()
    .iso()
    .required()
    .messages({
      'date.iso': '请输入有效的日期格式',
      'any.required': '日期是必填项'
    }),
  mainTasks: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': '主要任务不能为空',
      'string.max': '主要任务不能超过2000个字符',
      'any.required': '主要任务是必填项'
    }),
  challenges: Joi.string()
    .max(2000)
    .allow('')
    .optional(),
  learnings: Joi.string()
    .max(2000)
    .allow('')
    .optional(),
  nextDayPlan: Joi.string()
    .max(2000)
    .allow('')
    .optional(),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required()
    .messages({
      'number.min': '评分不能低于1',
      'number.max': '评分不能高于10',
      'any.required': '评分是必填项'
    }),
  mood: Joi.string()
    .valid('excellent', 'good', 'neutral', 'challenging', 'difficult')
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),
  isPublic: Joi.boolean()
    .optional()
});

// 反思记录验证
const reflectionValidation = Joi.object({
  date: Joi.date()
    .iso()
    .required()
    .messages({
      'date.iso': '请输入有效的日期格式',
      'any.required': '日期是必填项'
    }),
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': '反思内容不能为空',
      'string.max': '反思内容不能超过5000个字符',
      'any.required': '反思内容是必填项'
    }),
  adjustments: Joi.string()
    .max(3000)
    .allow('')
    .optional(),
  type: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'milestone')
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional(),
  status: Joi.string()
    .valid('draft', 'completed', 'archived')
    .optional(),
  insights: Joi.array()
    .items(Joi.string().max(500))
    .max(20)
    .optional(),
  actionItems: Joi.array()
    .items(Joi.string().max(200))
    .max(20)
    .optional(),
  isPublic: Joi.boolean()
    .optional()
});

// 目标验证
const goalValidation = Joi.object({
  name: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': '目标名称不能为空',
      'string.max': '目标名称不能超过200个字符',
      'any.required': '目标名称是必填项'
    }),
  description: Joi.string()
    .max(3000)
    .allow('')
    .optional(),
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.iso': '请输入有效的开始日期格式',
      'any.required': '开始日期是必填项'
    }),
  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.greater': '结束日期必须晚于开始日期'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional(),
  progress: Joi.number()
    .integer()
    .min(0)
    .max(100)
    .optional(),
  status: Joi.string()
    .valid('not_started', 'in_progress', 'completed', 'paused', 'cancelled')
    .optional(),
  category: Joi.string()
    .max(100)
    .optional(),
  milestones: Joi.array()
    .items(Joi.object({
      name: Joi.string().max(200).required(),
      description: Joi.string().max(500),
      targetDate: Joi.date().iso(),
      completed: Joi.boolean().default(false)
    }))
    .max(50)
    .optional(),
  metrics: Joi.object()
    .optional(),
  isPublic: Joi.boolean()
    .optional()
});

// 分享验证
const shareValidation = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': '分享标题不能为空',
      'string.max': '分享标题不能超过200个字符',
      'any.required': '分享标题是必填项'
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
  shareType: Joi.string()
    .valid('public', 'private', 'password')
    .required()
    .messages({
      'any.only': '分享类型必须是 public、private 或 password',
      'any.required': '分享类型是必填项'
    }),
  password: Joi.string()
    .min(4)
    .max(50)
    .when('shareType', {
      is: 'password',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': '密码至少需要4个字符',
      'string.max': '密码不能超过50个字符',
      'any.required': '密码保护类型需要设置密码'
    }),
  settings: Joi.object({
    showProgress: Joi.boolean().default(true),
    showReflections: Joi.boolean().default(true),
    showGoals: Joi.boolean().default(true),
    showPersonalInfo: Joi.boolean().default(false),
    dateRange: Joi.string()
      .valid('all', 'last7days', 'last30days', 'custom')
      .default('all'),
    customStartDate: Joi.when('dateRange', {
      is: 'custom',
      then: Joi.date().iso().optional(),
      otherwise: Joi.optional()
    }),
    customEndDate: Joi.when('dateRange', {
      is: 'custom',
      then: Joi.date().iso().greater(Joi.ref('customStartDate')).optional(),
      otherwise: Joi.optional()
    }).messages({
      'date.greater': '结束日期必须晚于开始日期'
    })
  }).optional(),
  expiresAt: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.greater': '过期时间必须是未来时间'
    })
});

module.exports = {
  validate,
  validateRegister: validate(registerValidation),
  validateLogin: validate(loginValidation),
  validateChangePassword: validate(changePasswordValidation),
  validateProgress: validate(progressValidation),
  validateReflection: validate(reflectionValidation),
  validateGoal: validate(goalValidation),
  validateShare: validate(shareValidation)
};
