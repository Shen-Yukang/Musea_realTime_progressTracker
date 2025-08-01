// 防抖函数
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 延迟加载函数
export const lazyLoad = (importFunc) => {
  return React.lazy(importFunc);
};

// 内存化函数
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// 批量处理函数
export const batchProcess = (items, batchSize = 10, delay = 0) => {
  return new Promise((resolve) => {
    const results = [];
    let index = 0;

    const processBatch = () => {
      const batch = items.slice(index, index + batchSize);
      results.push(...batch);
      index += batchSize;

      if (index < items.length) {
        setTimeout(processBatch, delay);
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
};

// 虚拟滚动辅助函数
export const calculateVirtualScrollItems = (
  containerHeight,
  itemHeight,
  totalItems,
  scrollTop
) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, totalItems);
  
  return {
    startIndex: Math.max(0, startIndex - 1),
    endIndex,
    visibleCount,
    offsetY: startIndex * itemHeight
  };
};

// 图片懒加载
export const createImageLazyLoader = () => {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  return {
    observe: (img) => imageObserver.observe(img),
    unobserve: (img) => imageObserver.unobserve(img),
    disconnect: () => imageObserver.disconnect()
  };
};

// 性能监控
export const performanceMonitor = {
  // 测量函数执行时间
  measureFunction: (fn, name) => {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
      return result;
    };
  },

  // 测量组件渲染时间
  measureRender: (componentName) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} 渲染时间: ${(end - start).toFixed(2)}ms`);
    };
  },

  // 内存使用监控
  checkMemoryUsage: () => {
    if (performance.memory) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  },

  // FPS 监控
  startFPSMonitor: (callback) => {
    let frames = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        callback(fps);
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  }
};

// 缓存管理
export class CacheManager {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 默认5分钟TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // 清理过期项
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 创建全局缓存实例
export const globalCache = new CacheManager();

// 自动清理过期缓存
setInterval(() => {
  globalCache.cleanup();
}, 60000); // 每分钟清理一次

// 网络状态监控
export const networkMonitor = {
  // 检查网络状态
  isOnline: () => navigator.onLine,

  // 监听网络状态变化
  onStatusChange: (callback) => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  // 测试网络延迟
  measureLatency: async (url = '/api/health') => {
    const start = performance.now();
    try {
      await fetch(url, { method: 'HEAD' });
      return performance.now() - start;
    } catch (error) {
      return -1; // 网络错误
    }
  }
};

// 数据预加载
export const preloader = {
  // 预加载图片
  preloadImages: (urls) => {
    return Promise.all(
      urls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(url);
          img.onerror = () => reject(url);
          img.src = url;
        });
      })
    );
  },

  // 预加载数据
  preloadData: async (apiCalls) => {
    const results = {};
    await Promise.allSettled(
      Object.entries(apiCalls).map(async ([key, apiCall]) => {
        try {
          results[key] = await apiCall();
        } catch (error) {
          results[key] = { error: error.message };
        }
      })
    );
    return results;
  }
};

// 错误边界辅助函数
export const createErrorBoundary = (fallbackComponent) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error Boundary caught an error:', error, errorInfo);
      
      // 可以在这里发送错误报告到监控服务
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.toString(),
          fatal: false
        });
      }
    }

    render() {
      if (this.state.hasError) {
        return fallbackComponent ? 
          React.createElement(fallbackComponent, { error: this.state.error }) :
          React.createElement('div', { 
            style: { padding: '20px', textAlign: 'center' } 
          }, '出现了一些问题，请刷新页面重试。');
      }

      return this.props.children;
    }
  };
};
