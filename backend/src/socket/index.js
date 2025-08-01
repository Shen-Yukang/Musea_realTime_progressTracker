const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Share } = require('../models');

class SocketServer {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.rooms = new Map(); // 房间管理
    this.userSockets = new Map(); // 用户socket映射
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('🔌 Socket.io 服务器已启动');
  }
  
  setupMiddleware() {
    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findByPk(decoded.userId);
          if (user) {
            socket.user = user;
            socket.isAuthenticated = true;
          }
        }
        // 允许匿名用户（观看者）
        socket.isAuthenticated = socket.isAuthenticated || false;
        next();
      } catch (err) {
        console.error('Socket 认证失败:', err.message);
        // 允许匿名用户继续连接
        socket.isAuthenticated = false;
        next();
      }
    });
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`用户连接: ${socket.id} (认证: ${socket.isAuthenticated})`);
      
      // 存储用户socket映射
      if (socket.user) {
        this.userSockets.set(socket.user.id, socket);
      }
      
      // 加入分享房间
      socket.on('join-share', async (data) => {
        await this.handleJoinShare(socket, data);
      });
      
      // 离开分享房间
      socket.on('leave-share', (data) => {
        this.handleLeaveShare(socket, data);
      });
      
      // 进展更新
      socket.on('progress-update', async (data) => {
        await this.handleProgressUpdate(socket, data);
      });
      
      // 目标更新
      socket.on('goal-update', async (data) => {
        await this.handleGoalUpdate(socket, data);
      });
      
      // 反思更新
      socket.on('reflection-update', async (data) => {
        await this.handleReflectionUpdate(socket, data);
      });
      
      // 观看者评论
      socket.on('viewer-comment', async (data) => {
        await this.handleViewerComment(socket, data);
      });
      
      // 实时状态更新
      socket.on('status-update', (data) => {
        this.handleStatusUpdate(socket, data);
      });
      
      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  async handleJoinShare(socket, data) {
    try {
      const { shareToken, password } = data;
      
      // 验证分享是否存在且有效
      const share = await Share.findOne({
        where: { shareToken, isActive: true },
        include: [{ model: User, as: 'owner' }]
      });
      
      if (!share) {
        socket.emit('join-error', { message: '分享不存在或已失效' });
        return;
      }
      
      // 检查密码保护
      if (share.shareType === 'password' && share.password !== password) {
        socket.emit('join-error', { message: '密码错误' });
        return;
      }
      
      // 检查过期时间
      if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
        socket.emit('join-error', { message: '分享已过期' });
        return;
      }
      
      // 加入房间
      const roomId = `share-${shareToken}`;
      socket.join(roomId);
      socket.currentRoom = roomId;
      socket.shareToken = shareToken;
      
      // 确定用户角色
      const isOwner = socket.user && socket.user.id === share.userId;
      const role = isOwner ? 'owner' : 'viewer';
      
      // 更新房间信息
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          shareToken,
          owner: share.owner,
          viewers: new Set(),
          lastActivity: new Date()
        });
      }
      
      const room = this.rooms.get(roomId);
      if (!isOwner) {
        room.viewers.add(socket.id);
      }
      room.lastActivity = new Date();
      
      // 发送加入成功消息
      socket.emit('join-success', {
        role,
        roomInfo: {
          shareToken,
          title: share.title,
          description: share.description,
          owner: share.owner.username,
          viewerCount: room.viewers.size,
          isLive: isOwner && socket.isAuthenticated
        }
      });
      
      // 通知房间内其他用户
      socket.to(roomId).emit('room-update', {
        type: 'user-joined',
        viewerCount: room.viewers.size,
        message: `${socket.user?.username || '匿名用户'} 加入了房间`
      });
      
      // 如果是观看者，发送当前数据
      if (!isOwner) {
        await this.sendInitialData(socket, share);
      }
      
      console.log(`用户 ${socket.id} 加入房间 ${roomId} (角色: ${role})`);
      
    } catch (error) {
      console.error('加入分享房间失败:', error);
      socket.emit('join-error', { message: '加入房间失败' });
    }
  }
  
  handleLeaveShare(socket, data) {
    const { shareToken } = data;
    const roomId = `share-${shareToken}`;
    
    socket.leave(roomId);
    
    // 更新房间信息
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      room.viewers.delete(socket.id);
      
      // 通知房间内其他用户
      socket.to(roomId).emit('room-update', {
        type: 'user-left',
        viewerCount: room.viewers.size,
        message: `${socket.user?.username || '匿名用户'} 离开了房间`
      });
      
      // 如果房间为空，清理房间
      if (room.viewers.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    socket.currentRoom = null;
    socket.shareToken = null;
    
    console.log(`用户 ${socket.id} 离开房间 ${roomId}`);
  }
  
  async handleProgressUpdate(socket, data) {
    if (!socket.isAuthenticated || !socket.currentRoom) return;
    
    try {
      const { type, progressData } = data;
      
      // 广播进展更新到房间内所有观看者
      socket.to(socket.currentRoom).emit('progress-updated', {
        type,
        data: progressData,
        timestamp: new Date().toISOString(),
        user: socket.user.username
      });
      
      console.log(`进展更新广播到房间 ${socket.currentRoom}`);
      
    } catch (error) {
      console.error('处理进展更新失败:', error);
    }
  }
  
  async handleGoalUpdate(socket, data) {
    if (!socket.isAuthenticated || !socket.currentRoom) return;
    
    try {
      const { type, goalData } = data;
      
      // 广播目标更新到房间内所有观看者
      socket.to(socket.currentRoom).emit('goal-updated', {
        type,
        data: goalData,
        timestamp: new Date().toISOString(),
        user: socket.user.username
      });
      
      console.log(`目标更新广播到房间 ${socket.currentRoom}`);
      
    } catch (error) {
      console.error('处理目标更新失败:', error);
    }
  }
  
  async handleReflectionUpdate(socket, data) {
    if (!socket.isAuthenticated || !socket.currentRoom) return;
    
    try {
      const { type, reflectionData } = data;
      
      // 广播反思更新到房间内所有观看者
      socket.to(socket.currentRoom).emit('reflection-updated', {
        type,
        data: reflectionData,
        timestamp: new Date().toISOString(),
        user: socket.user.username
      });
      
      console.log(`反思更新广播到房间 ${socket.currentRoom}`);
      
    } catch (error) {
      console.error('处理反思更新失败:', error);
    }
  }
  
  async handleViewerComment(socket, data) {
    if (!socket.currentRoom) return;
    
    try {
      const { message } = data;
      
      const comment = {
        id: Date.now() + Math.random(),
        message,
        user: socket.user?.username || '匿名用户',
        timestamp: new Date().toISOString(),
        isOwner: socket.user && socket.shareToken && 
                 this.rooms.get(socket.currentRoom)?.owner?.id === socket.user.id
      };
      
      // 广播评论到房间内所有用户（包括发送者）
      this.io.to(socket.currentRoom).emit('new-comment', comment);
      
      console.log(`新评论在房间 ${socket.currentRoom}: ${message}`);
      
    } catch (error) {
      console.error('处理观看者评论失败:', error);
    }
  }
  
  handleStatusUpdate(socket, data) {
    if (!socket.isAuthenticated || !socket.currentRoom) return;
    
    const { status, activity } = data;
    
    // 广播状态更新
    socket.to(socket.currentRoom).emit('status-updated', {
      user: socket.user.username,
      status,
      activity,
      timestamp: new Date().toISOString()
    });
  }
  
  handleDisconnect(socket) {
    console.log(`用户断开连接: ${socket.id}`);
    
    // 清理用户socket映射
    if (socket.user) {
      this.userSockets.delete(socket.user.id);
    }
    
    // 如果用户在房间中，处理离开逻辑
    if (socket.currentRoom && socket.shareToken) {
      this.handleLeaveShare(socket, { shareToken: socket.shareToken });
    }
  }
  
  async sendInitialData(socket, share) {
    try {
      // 这里可以发送分享的初始数据给观看者
      // 根据分享设置决定发送哪些数据
      const initialData = {
        share: {
          title: share.title,
          description: share.description,
          settings: share.settings
        },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('initial-data', initialData);
      
    } catch (error) {
      console.error('发送初始数据失败:', error);
    }
  }
  
  // 获取房间统计信息
  getRoomStats() {
    const stats = {};
    for (const [roomId, room] of this.rooms.entries()) {
      stats[roomId] = {
        viewerCount: room.viewers.size,
        lastActivity: room.lastActivity
      };
    }
    return stats;
  }
  
  // 向特定用户发送消息
  sendToUser(userId, event, data) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }
  
  // 向房间广播消息
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }
}

module.exports = SocketServer;
