/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * 验证邮箱格式
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 生成随机字符串
 * @param {number} length 
 * @returns {string}
 */
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 清理用户对象，移除敏感信息
 * @param {Object} user 
 * @returns {Object}
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...sanitized } = user.toJSON ? user.toJSON() : user;
  return sanitized;
}

/**
 * 创建成功响应
 * @param {*} data 
 * @param {string} message 
 * @returns {Object}
 */
function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data
  };
}

/**
 * 创建错误响应
 * @param {string} message 
 * @param {*} error 
 * @returns {Object}
 */
function errorResponse(message, error = null) {
  return {
    success: false,
    message,
    ...(error && process.env.NODE_ENV === 'development' && { error })
  };
}

module.exports = {
  formatDate,
  isValidEmail,
  generateRandomString,
  sanitizeUser,
  successResponse,
  errorResponse
};
