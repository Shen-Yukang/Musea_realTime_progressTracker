import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // 连接状态
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
  
  // 用户角色和房间信息
  userRole: null, // 'owner' | 'viewer'
  currentRoom: null,
  roomInfo: {
    shareToken: null,
    title: '',
    description: '',
    owner: '',
    viewerCount: 0,
    isLive: false
  },
  
  // 实时更新数据
  liveUpdates: [],
  comments: [],
  
  // 在线状态
  onlineUsers: [],
  ownerStatus: {
    isOnline: false,
    lastActivity: null,
    currentActivity: ''
  },
  
  // 实时数据
  liveProgress: null,
  liveGoals: [],
  liveReflections: [],
  
  // UI 状态
  showComments: true,
  showLiveUpdates: true,
  notificationSettings: {
    comments: true,
    updates: true,
    statusChanges: true
  }
};

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    // 连接状态管理
    setConnectionStatus: (state, action) => {
      const { connected, error, reconnectAttempts } = action.payload;
      state.isConnected = connected;
      state.connectionError = error || null;
      state.reconnectAttempts = reconnectAttempts || 0;
    },
    
    setConnectionError: (state, action) => {
      state.connectionError = action.payload;
    },
    
    clearConnectionError: (state) => {
      state.connectionError = null;
    },
    
    // 用户角色和房间管理
    setUserRole: (state, action) => {
      state.userRole = action.payload;
    },
    
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload;
    },
    
    updateRoomInfo: (state, action) => {
      state.roomInfo = { ...state.roomInfo, ...action.payload };
    },
    
    clearRoomInfo: (state) => {
      state.currentRoom = null;
      state.userRole = null;
      state.roomInfo = initialState.roomInfo;
      state.liveUpdates = [];
      state.comments = [];
      state.onlineUsers = [];
    },
    
    // 实时更新管理
    addLiveUpdate: (state, action) => {
      const update = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.liveUpdates.unshift(update);
      
      // 限制更新数量，保留最近50条
      if (state.liveUpdates.length > 50) {
        state.liveUpdates = state.liveUpdates.slice(0, 50);
      }
    },
    
    clearLiveUpdates: (state) => {
      state.liveUpdates = [];
    },
    
    // 评论管理
    addComment: (state, action) => {
      const comment = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.comments.push(comment);
      
      // 限制评论数量，保留最近100条
      if (state.comments.length > 100) {
        state.comments = state.comments.slice(-100);
      }
    },
    
    clearComments: (state) => {
      state.comments = [];
    },
    
    removeComment: (state, action) => {
      state.comments = state.comments.filter(comment => comment.id !== action.payload);
    },
    
    // 在线用户管理
    updateOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    
    addOnlineUser: (state, action) => {
      const user = action.payload;
      if (!state.onlineUsers.find(u => u.id === user.id)) {
        state.onlineUsers.push(user);
      }
    },
    
    removeOnlineUser: (state, action) => {
      const userId = action.payload;
      state.onlineUsers = state.onlineUsers.filter(user => user.id !== userId);
    },
    
    // 所有者状态管理
    updateOwnerStatus: (state, action) => {
      state.ownerStatus = { ...state.ownerStatus, ...action.payload };
    },
    
    // 实时数据更新
    updateLiveProgress: (state, action) => {
      state.liveProgress = action.payload;
      
      // 同时添加到实时更新列表
      state.liveUpdates.unshift({
        id: Date.now() + Math.random(),
        type: 'progress',
        data: action.payload,
        timestamp: new Date().toISOString()
      });
    },
    
    updateLiveGoals: (state, action) => {
      const { type, data } = action.payload;
      
      switch (type) {
        case 'create':
          state.liveGoals.push(data);
          break;
        case 'update':
          const updateIndex = state.liveGoals.findIndex(goal => goal.id === data.id);
          if (updateIndex !== -1) {
            state.liveGoals[updateIndex] = { ...state.liveGoals[updateIndex], ...data };
          }
          break;
        case 'delete':
          state.liveGoals = state.liveGoals.filter(goal => goal.id !== data.id);
          break;
        case 'set':
          state.liveGoals = data;
          break;
      }
      
      // 添加到实时更新列表
      state.liveUpdates.unshift({
        id: Date.now() + Math.random(),
        type: 'goal',
        action: type,
        data,
        timestamp: new Date().toISOString()
      });
    },
    
    updateLiveReflections: (state, action) => {
      const { type, data } = action.payload;
      
      switch (type) {
        case 'create':
          state.liveReflections.unshift(data);
          break;
        case 'update':
          const updateIndex = state.liveReflections.findIndex(reflection => reflection.id === data.id);
          if (updateIndex !== -1) {
            state.liveReflections[updateIndex] = { ...state.liveReflections[updateIndex], ...data };
          }
          break;
        case 'delete':
          state.liveReflections = state.liveReflections.filter(reflection => reflection.id !== data.id);
          break;
        case 'set':
          state.liveReflections = data;
          break;
      }
      
      // 添加到实时更新列表
      state.liveUpdates.unshift({
        id: Date.now() + Math.random(),
        type: 'reflection',
        action: type,
        data,
        timestamp: new Date().toISOString()
      });
    },
    
    // UI 状态管理
    toggleComments: (state) => {
      state.showComments = !state.showComments;
    },
    
    toggleLiveUpdates: (state) => {
      state.showLiveUpdates = !state.showLiveUpdates;
    },
    
    updateNotificationSettings: (state, action) => {
      state.notificationSettings = { ...state.notificationSettings, ...action.payload };
    },
    
    // 初始化数据
    setInitialData: (state, action) => {
      const { share, progress, goals, reflections } = action.payload;
      
      if (share) {
        state.roomInfo = { ...state.roomInfo, ...share };
      }
      
      if (progress) {
        state.liveProgress = progress;
      }
      
      if (goals) {
        state.liveGoals = goals;
      }
      
      if (reflections) {
        state.liveReflections = reflections;
      }
    },
    
    // 重置状态
    resetRealtimeState: (state) => {
      return { ...initialState };
    }
  }
});

export const {
  setConnectionStatus,
  setConnectionError,
  clearConnectionError,
  setUserRole,
  setCurrentRoom,
  updateRoomInfo,
  clearRoomInfo,
  addLiveUpdate,
  clearLiveUpdates,
  addComment,
  clearComments,
  removeComment,
  updateOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateOwnerStatus,
  updateLiveProgress,
  updateLiveGoals,
  updateLiveReflections,
  toggleComments,
  toggleLiveUpdates,
  updateNotificationSettings,
  setInitialData,
  resetRealtimeState
} = realtimeSlice.actions;

// 选择器
export const selectRealtimeState = (state) => state.realtime;
export const selectConnectionStatus = (state) => state.realtime.isConnected;
export const selectUserRole = (state) => state.realtime.userRole;
export const selectRoomInfo = (state) => state.realtime.roomInfo;
export const selectLiveUpdates = (state) => state.realtime.liveUpdates;
export const selectComments = (state) => state.realtime.comments;
export const selectOnlineUsers = (state) => state.realtime.onlineUsers;
export const selectOwnerStatus = (state) => state.realtime.ownerStatus;
export const selectLiveData = (state) => ({
  progress: state.realtime.liveProgress,
  goals: state.realtime.liveGoals,
  reflections: state.realtime.liveReflections
});

export default realtimeSlice.reducer;
