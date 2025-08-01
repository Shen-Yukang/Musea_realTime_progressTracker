// 错误处理工具函数

// 网络错误处理
export const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    return '网络连接已断开，请检查网络设置';
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return '无法连接到服务器，请稍后重试';
  }
  
  return error.message || '网络请求失败';
};

// API 错误处理
export const handleApiError = (error, response) => {
  // 认证错误
  if (response?.status === 401) {
    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 重定向到登录页面
    window.location.href = '/login';
    return '登录已过期，请重新登录';
  }
  
  // 权限错误
  if (response?.status === 403) {
    return '没有权限执行此操作';
  }
  
  // 资源不存在
  if (response?.status === 404) {
    return '请求的资源不存在';
  }
  
  // 服务器错误
  if (response?.status >= 500) {
    return '服务器内部错误，请稍后重试';
  }
  
  // 请求错误
  if (response?.status >= 400) {
    return error.message || '请求参数错误';
  }
  
  return error.message || '未知错误';
};

// 表单验证错误处理
export const handleValidationError = (errors) => {
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).flat().join(', ');
  }
  
  return errors || '表单验证失败';
};

// 通用错误处理函数
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  // 网络错误
  if (error.name === 'TypeError' || !navigator.onLine) {
    return handleNetworkError(error);
  }
  
  // API 错误
  if (error.response) {
    return handleApiError(error, error.response);
  }
  
  // 验证错误
  if (error.validation) {
    return handleValidationError(error.validation);
  }
  
  // 默认错误
  return error.message || '操作失败，请重试';
};

// 显示错误提示
export const showError = (error, context = '') => {
  const message = handleError(error, context);
  
  if (window.showToast) {
    window.showToast(message, 'error');
  } else {
    alert(message);
  }
};

// 显示成功提示
export const showSuccess = (message) => {
  if (window.showToast) {
    window.showToast(message, 'success');
  } else {
    alert(message);
  }
};

// 显示警告提示
export const showWarning = (message) => {
  if (window.showToast) {
    window.showToast(message, 'warning');
  } else {
    alert(message);
  }
};

// 显示信息提示
export const showInfo = (message) => {
  if (window.showToast) {
    window.showToast(message, 'info');
  } else {
    alert(message);
  }
};

// 异步操作包装器
export const withErrorHandling = async (asyncFn, context = '', showSuccessMessage = null) => {
  try {
    const result = await asyncFn();
    
    if (showSuccessMessage) {
      showSuccess(showSuccessMessage);
    }
    
    return result;
  } catch (error) {
    showError(error, context);
    throw error;
  }
};

// 重试机制
export const withRetry = async (asyncFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      // 如果是认证错误或客户端错误，不重试
      if (error.response?.status === 401 || (error.response?.status >= 400 && error.response?.status < 500)) {
        throw error;
      }
      
      // 最后一次重试失败
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError;
};
