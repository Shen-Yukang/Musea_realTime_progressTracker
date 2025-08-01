import { io } from 'socket.io-client';
import authService from './authService';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  // 连接到 Socket.io 服务器
  connect(token = null) {
    if (this.socket && this.isConnected) {
      console.log('Socket 已连接');
      return Promise.resolve();
    }

    const auth = {};
    if (token) {
      auth.token = token;
    } else {
      const currentToken = authService.getToken();
      if (currentToken) {
        auth.token = currentToken;
      }
    }
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    
    this.setupEventListeners();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('连接超时'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ Socket 连接成功:', this.socket.id);
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Socket 连接失败:', error);
        reject(error);
      });
    });
  }
  
  // 设置事件监听器
  setupEventListeners() {
    if (!this.socket) return;

    // 连接状态事件
    this.socket.on('disconnect', (reason) => {
      console.log('Socket 断开连接:', reason);
      this.isConnected = false;
      this.emit('connection-status', { connected: false, reason });
      
      // 自动重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，不自动重连
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket 重连成功:', attemptNumber);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true, reconnected: true });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket 重连失败:', error);
      this.reconnectAttempts++;
    });

    // 房间相关事件
    this.socket.on('join-success', (data) => {
      console.log('加入房间成功:', data);
      this.currentRoom = data.roomInfo.shareToken;
      this.emit('join-success', data);
    });

    this.socket.on('join-error', (error) => {
      console.error('加入房间失败:', error);
      this.emit('join-error', error);
    });

    this.socket.on('room-update', (update) => {
      console.log('房间更新:', update);
      this.emit('room-update', update);
    });

    // 实时数据更新事件
    this.socket.on('progress-updated', (update) => {
      console.log('进展更新:', update);
      this.emit('progress-updated', update);
    });

    this.socket.on('goal-updated', (update) => {
      console.log('目标更新:', update);
      this.emit('goal-updated', update);
    });

    this.socket.on('reflection-updated', (update) => {
      console.log('反思更新:', update);
      this.emit('reflection-updated', update);
    });

    this.socket.on('new-comment', (comment) => {
      console.log('新评论:', comment);
      this.emit('new-comment', comment);
    });

    this.socket.on('status-updated', (status) => {
      console.log('状态更新:', status);
      this.emit('status-updated', status);
    });

    this.socket.on('initial-data', (data) => {
      console.log('接收初始数据:', data);
      this.emit('initial-data', data);
    });

    // 错误处理
    this.socket.on('error', (error) => {
      console.error('Socket 错误:', error);
      this.emit('error', error);
    });
  }

  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      this.emit('connection-status', { connected: false, maxRetriesReached: true });
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`${delay}ms 后尝试重连 (第 ${this.reconnectAttempts + 1} 次)`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.reconnectAttempts++;
        this.socket.connect();
      }
    }, delay);
  }
  
  // 加入分享房间
  joinShare(shareToken, password = null) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket 未连接');
    }
    
    console.log('加入分享房间:', shareToken);
    this.socket.emit('join-share', { shareToken, password });
  }
  
  // 离开分享房间
  leaveShare(shareToken) {
    if (!this.socket || !this.currentRoom) return;
    
    console.log('离开分享房间:', shareToken);
    this.socket.emit('leave-share', { shareToken });
    this.currentRoom = null;
  }
  
  // 发送进展更新
  sendProgressUpdate(type, data) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.warn('无法发送进展更新: Socket 未连接或不在房间中');
      return;
    }
    
    console.log('发送进展更新:', { type, data });
    this.socket.emit('progress-update', { type, progressData: data });
  }
  
  // 发送目标更新
  sendGoalUpdate(type, data) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.warn('无法发送目标更新: Socket 未连接或不在房间中');
      return;
    }
    
    console.log('发送目标更新:', { type, data });
    this.socket.emit('goal-update', { type, goalData: data });
  }
  
  // 发送反思更新
  sendReflectionUpdate(type, data) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.warn('无法发送反思更新: Socket 未连接或不在房间中');
      return;
    }
    
    console.log('发送反思更新:', { type, data });
    this.socket.emit('reflection-update', { type, reflectionData: data });
  }
  
  // 发送评论
  sendComment(message) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      throw new Error('无法发送评论: Socket 未连接或不在房间中');
    }
    
    console.log('发送评论:', message);
    this.socket.emit('viewer-comment', { message });
  }
  
  // 发送状态更新
  sendStatusUpdate(status, activity) {
    if (!this.socket || !this.isConnected || !this.currentRoom) return;
    
    this.socket.emit('status-update', { status, activity });
  }
  
  // 断开连接
  disconnect() {
    if (this.socket) {
      console.log('主动断开 Socket 连接');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
      this.eventListeners.clear();
    }
  }
  
  // 事件监听器管理
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }
  
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器错误 (${event}):`, error);
        }
      });
    }
  }
  
  // 获取连接状态
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      currentRoom: this.currentRoom,
      reconnectAttempts: this.reconnectAttempts
    };
  }
  
  // 检查是否在房间中
  isInRoom() {
    return this.isConnected && this.currentRoom !== null;
  }
}

// 创建单例实例
const socketService = new SocketService();

export default socketService;
