# Milestone 4: 实时功能开发

**目标**: 集成 WebSocket 实现实时数据推送和互动功能
**预计时间**: 1-2 周
**状态**: 待开始
**前置条件**: Milestone 3 完成

## 目标概述

实现完整的实时功能，包括实时数据推送、在线状态显示、观看者互动等功能，让分享变成真正的"直播"体验。

## 详细步骤

### Phase 4.1: WebSocket 服务端实现 (2-3 天)

#### 步骤 4.1.1: Socket.io 服务器配置
```javascript
// src/socket/index.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Share } = require('../models');

class SocketServer {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
      }
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  setupMiddleware() {
    // 认证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findByPk(decoded.userId);
          socket.user = user;
        }
        next();
      } catch (err) {
        // 允许匿名用户（观看者）
        next();
      }
    });
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('用户连接:', socket.id);
      
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
      
      // 观看者评论
      socket.on('viewer-comment', async (data) => {
        await this.handleViewerComment(socket, data);
      });
      
      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  async handleJoinShare(socket, { shareToken, password }) {
    try {
      // 验证分享是否存在和有效
      const share = await Share.findOne({
        where: { shareToken, isActive: true },
        include: [{ model: User, attributes: ['id', 'username'] }]
      });
      
      if (!share) {
        socket.emit('error', { message: '分享不存在或已失效' });
        return;
      }
      
      // 检查密码（如果需要）
      if (share.shareType === 'password' && password) {
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, share.password);
        if (!isValid) {
          socket.emit('error', { message: '密码错误' });
          return;
        }
      }
      
      // 加入房间
      const roomName = `share-${shareToken}`;
      socket.join(roomName);
      socket.shareToken = shareToken;
      socket.shareId = share.id;
      
      // 确定用户角色
      const isOwner = socket.user && socket.user.id === share.userId;
      socket.role = isOwner ? 'owner' : 'viewer';
      
      // 通知房间有新用户加入
      const roomInfo = await this.getRoomInfo(roomName);
      this.io.to(roomName).emit('room-update', roomInfo);
      
      // 发送当前数据给新加入的用户
      if (!isOwner) {
        const shareData = await this.getShareData(share);
        socket.emit('initial-data', shareData);
      }
      
      socket.emit('join-success', { 
        role: socket.role,
        roomInfo 
      });
      
    } catch (error) {
      socket.emit('error', { message: '加入失败' });
    }
  }
  
  handleLeaveShare(socket, { shareToken }) {
    const roomName = `share-${shareToken}`;
    socket.leave(roomName);
    
    // 更新房间信息
    this.getRoomInfo(roomName).then(roomInfo => {
      this.io.to(roomName).emit('room-update', roomInfo);
    });
  }
  
  async handleProgressUpdate(socket, data) {
    // 只有所有者可以更新进展
    if (socket.role !== 'owner') {
      socket.emit('error', { message: '无权限操作' });
      return;
    }
    
    const roomName = `share-${socket.shareToken}`;
    
    // 广播更新给房间内的所有观看者
    socket.to(roomName).emit('progress-updated', {
      type: data.type, // 'progress', 'reflection', 'goal'
      data: data.data,
      timestamp: new Date()
    });
  }
  
  async handleViewerComment(socket, { message, shareToken }) {
    const roomName = `share-${shareToken}`;
    
    // 创建评论对象
    const comment = {
      id: Date.now(),
      message,
      author: socket.user ? socket.user.username : '匿名观看者',
      timestamp: new Date(),
      isAnonymous: !socket.user
    };
    
    // 广播评论给房间内所有用户
    this.io.to(roomName).emit('new-comment', comment);
    
    // 可选：保存评论到数据库
    // await this.saveComment(socket.shareId, comment);
  }
  
  handleDisconnect(socket) {
    console.log('用户断开连接:', socket.id);
    
    if (socket.shareToken) {
      const roomName = `share-${socket.shareToken}`;
      this.getRoomInfo(roomName).then(roomInfo => {
        socket.to(roomName).emit('room-update', roomInfo);
      });
    }
  }
  
  async getRoomInfo(roomName) {
    const sockets = await this.io.in(roomName).fetchSockets();
    
    const viewers = sockets.filter(s => s.role === 'viewer').length;
    const owners = sockets.filter(s => s.role === 'owner').length;
    
    return {
      totalViewers: viewers,
      ownerOnline: owners > 0,
      onlineUsers: sockets.map(s => ({
        id: s.id,
        role: s.role,
        username: s.user?.username || '匿名用户'
      }))
    };
  }
  
  async getShareData(share) {
    // 根据分享设置获取数据
    // 这里复用 Milestone 3 中的数据获取逻辑
    const ShareViewController = require('../controllers/shareViewController');
    const controller = new ShareViewController();
    return await controller.getFilteredData(share);
  }
}

module.exports = SocketServer;
```

#### 步骤 4.1.2: 集成到主应用
```javascript
// src/app.js
const express = require('express');
const http = require('http');
const SocketServer = require('./socket');

const app = express();
const server = http.createServer(app);

// 初始化 Socket.io
const socketServer = new SocketServer(server);

// 将 socket 实例添加到 app 中，供其他地方使用
app.set('socketio', socketServer.io);

module.exports = { app, server };
```

**验收标准**:
- [ ] WebSocket 服务器正常启动
- [ ] 用户认证机制工作
- [ ] 房间管理功能完成
- [ ] 基础事件处理实现

### Phase 4.2: 前端实时功能集成 (2-3 天)

#### 步骤 4.2.1: Socket.io 客户端配置
```javascript
// src/services/socketService.js
import io from 'socket.io-client';
import { store } from '../store';
import { updateRoomInfo, addComment, updateProgress } from '../store/realtimeSlice';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }
  
  connect(token = null) {
    const auth = token ? { token } : {};
    
    this.socket = io(process.env.REACT_APP_API_URL, {
      auth,
      transports: ['websocket', 'polling']
    });
    
    this.setupEventListeners();
    
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Socket 连接成功');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket 连接失败:', error);
        reject(error);
      });
    });
  }
  
  setupEventListeners() {
    // 房间信息更新
    this.socket.on('room-update', (roomInfo) => {
      store.dispatch(updateRoomInfo(roomInfo));
    });
    
    // 新评论
    this.socket.on('new-comment', (comment) => {
      store.dispatch(addComment(comment));
    });
    
    // 进展更新
    this.socket.on('progress-updated', (update) => {
      store.dispatch(updateProgress(update));
    });
    
    // 初始数据（观看者）
    this.socket.on('initial-data', (data) => {
      store.dispatch(setInitialData(data));
    });
    
    // 错误处理
    this.socket.on('error', (error) => {
      console.error('Socket 错误:', error);
      // 可以显示错误提示
    });
    
    // 加入成功
    this.socket.on('join-success', (data) => {
      store.dispatch(setUserRole(data.role));
      store.dispatch(updateRoomInfo(data.roomInfo));
    });
  }
  
  joinShare(shareToken, password = null) {
    if (!this.socket) return;
    
    this.socket.emit('join-share', { shareToken, password });
  }
  
  leaveShare(shareToken) {
    if (!this.socket) return;
    
    this.socket.emit('leave-share', { shareToken });
  }
  
  sendProgressUpdate(type, data) {
    if (!this.socket) return;
    
    this.socket.emit('progress-update', { type, data });
  }
  
  sendComment(message, shareToken) {
    if (!this.socket) return;
    
    this.socket.emit('viewer-comment', { message, shareToken });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export default new SocketService();
```

#### 步骤 4.2.2: 实时状态管理
```javascript
// src/store/realtimeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState: {
    isConnected: false,
    userRole: null, // 'owner' | 'viewer'
    roomInfo: {
      totalViewers: 0,
      ownerOnline: false,
      onlineUsers: []
    },
    comments: [],
    liveUpdates: []
  },
  reducers: {
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setUserRole: (state, action) => {
      state.userRole = action.payload;
    },
    updateRoomInfo: (state, action) => {
      state.roomInfo = action.payload;
    },
    addComment: (state, action) => {
      state.comments.push(action.payload);
      // 保持最近50条评论
      if (state.comments.length > 50) {
        state.comments = state.comments.slice(-50);
      }
    },
    updateProgress: (state, action) => {
      state.liveUpdates.unshift({
        ...action.payload,
        id: Date.now()
      });
      // 保持最近20条更新
      if (state.liveUpdates.length > 20) {
        state.liveUpdates = state.liveUpdates.slice(0, 20);
      }
    },
    clearComments: (state) => {
      state.comments = [];
    },
    clearLiveUpdates: (state) => {
      state.liveUpdates = [];
    }
  }
});

export const {
  setConnectionStatus,
  setUserRole,
  updateRoomInfo,
  addComment,
  updateProgress,
  clearComments,
  clearLiveUpdates
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
```

**验收标准**:
- [ ] Socket.io 客户端连接正常
- [ ] 实时状态管理完成
- [ ] 事件监听和分发工作
- [ ] 错误处理机制完善

### Phase 4.3: 实时界面组件开发 (2-3 天)

#### 步骤 4.3.1: 在线状态显示组件
```jsx
// components/realtime/OnlineStatus.jsx
import React from 'react';
import { useSelector } from 'react-redux';

const OnlineStatus = () => {
  const { roomInfo, isConnected } = useSelector(state => state.realtime);
  
  if (!isConnected) {
    return (
      <div className="flex items-center text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
        <span className="text-sm">离线</span>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">在线状态</h3>
      
      <div className="space-y-2">
        {/* 观看者数量 */}
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">
            {roomInfo.totalViewers} 人正在观看
          </span>
        </div>
        
        {/* 所有者状态 */}
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            roomInfo.ownerOnline ? 'bg-blue-500' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm">
            分享者 {roomInfo.ownerOnline ? '在线' : '离线'}
          </span>
        </div>
      </div>
      
      {/* 在线用户列表 */}
      {roomInfo.onlineUsers.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">在线用户</h4>
          <div className="space-y-1">
            {roomInfo.onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center text-sm">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                  user.role === 'owner' ? 'bg-blue-500' : 'bg-green-500'
                }`}></span>
                <span>{user.username}</span>
                {user.role === 'owner' && (
                  <span className="ml-1 text-xs text-blue-600">(分享者)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineStatus;
```

#### 步骤 4.3.2: 实时评论组件
```jsx
// components/realtime/LiveComments.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socketService from '../../services/socketService';

const LiveComments = ({ shareToken }) => {
  const [newComment, setNewComment] = useState('');
  const { comments, userRole } = useSelector(state => state.realtime);
  const { user } = useSelector(state => state.auth);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    socketService.sendComment(newComment, shareToken);
    setNewComment('');
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">实时评论</h3>
      
      {/* 评论列表 */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            还没有评论，来说点什么吧！
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-blue-200 pl-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-blue-600">
                  {comment.author}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-800">{comment.message}</p>
            </div>
          ))
        )}
      </div>
      
      {/* 评论输入 */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "写下你的鼓励..." : "匿名评论..."}
          className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          发送
        </button>
      </form>
      
      <p className="text-xs text-gray-500 mt-2">
        {user ? `以 ${user.username} 身份评论` : '匿名评论'}
      </p>
    </div>
  );
};

export default LiveComments;
```

#### 步骤 4.3.3: 实时更新提醒组件
```jsx
// components/realtime/LiveUpdates.jsx
import React from 'react';
import { useSelector } from 'react-redux';

const LiveUpdates = () => {
  const { liveUpdates } = useSelector(state => state.realtime);
  
  if (liveUpdates.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">实时更新</h3>
      
      <div className="space-y-2">
        {liveUpdates.map((update) => (
          <div key={update.id} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-800">
                {getUpdateTypeText(update.type)}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(update.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getUpdateTypeText = (type) => {
  switch (type) {
    case 'progress':
      return '📈 更新了进展记录';
    case 'reflection':
      return '💭 添加了新的反思';
    case 'goal':
      return '🎯 更新了目标进度';
    default:
      return '📝 有新的更新';
  }
};

export default LiveUpdates;
```

**验收标准**:
- [ ] 在线状态显示正常
- [ ] 实时评论功能工作
- [ ] 更新提醒及时显示
- [ ] 界面响应式适配

### Phase 4.4: 集成和优化 (1-2 天)

#### 步骤 4.4.1: 性能优化
```javascript
// 连接池管理
class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.maxConnections = 1000;
  }
  
  addConnection(socketId, shareToken) {
    if (this.connections.size >= this.maxConnections) {
      // 清理最老的连接
      const oldestKey = this.connections.keys().next().value;
      this.connections.delete(oldestKey);
    }
    
    this.connections.set(socketId, {
      shareToken,
      connectedAt: new Date()
    });
  }
  
  removeConnection(socketId) {
    this.connections.delete(socketId);
  }
  
  getConnectionCount(shareToken) {
    return Array.from(this.connections.values())
      .filter(conn => conn.shareToken === shareToken).length;
  }
}
```

#### 步骤 4.4.2: 错误处理和重连机制
```javascript
// 自动重连逻辑
class ReconnectManager {
  constructor(socketService) {
    this.socketService = socketService;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数');
      return false;
    }
    
    this.reconnectAttempts++;
    
    try {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      await this.socketService.connect();
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      this.reconnectDelay *= 2; // 指数退避
      return this.attemptReconnect();
    }
  }
}
```

**验收标准**:
- [ ] 连接管理优化完成
- [ ] 自动重连机制工作
- [ ] 内存使用优化
- [ ] 错误处理完善

## 验收标准总结

### 功能验收
- [ ] 实时数据推送正常
- [ ] 在线状态准确显示
- [ ] 评论功能流畅
- [ ] 更新提醒及时

### 性能验收
- [ ] 支持100+并发连接
- [ ] 消息延迟 < 500ms
- [ ] 内存使用合理
- [ ] 自动重连稳定

### 用户体验验收
- [ ] 界面响应及时
- [ ] 错误提示友好
- [ ] 移动端体验良好
- [ ] 网络异常处理

## 风险和缓解措施

### 主要风险
1. **性能风险**: 大量并发连接影响服务器性能
2. **稳定性风险**: WebSocket 连接不稳定
3. **安全风险**: 实时通信安全问题

### 缓解措施
1. 实现连接池和负载均衡
2. 添加心跳检测和自动重连
3. 实施消息验证和频率限制

## 下一步计划

完成 Milestone 4 后，将进入 Milestone 5: 部署和优化阶段，完成整个项目的最终部署和性能优化。

---

**开始时间**: TBD  
**预计完成时间**: TBD  
**负责人**: [Your Name]  
**状态**: 待开始
