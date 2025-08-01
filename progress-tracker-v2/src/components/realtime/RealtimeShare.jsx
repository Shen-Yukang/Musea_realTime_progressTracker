import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import shareService from '../../services/shareService';
import socketService from '../../services/socketService';
import authService from '../../services/authService';
import { 
  setConnectionStatus, 
  setUserRole, 
  updateRoomInfo, 
  clearRoomInfo,
  addLiveUpdate,
  addComment
} from '../../store/realtimeSlice';
import { useNotification } from '../common/NotificationSystem';
import OnlineStatus from './OnlineStatus';
import LiveComments from './LiveComments';
import LiveUpdates from './LiveUpdates';

const RealtimeShare = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinToken, setJoinToken] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('my-shares');

  const dispatch = useDispatch();
  const { showError, showSuccess, showInfo } = useNotification();
  const realtimeState = useSelector(state => state.realtime);

  useEffect(() => {
    loadShares();
    initializeSocket();
    
    return () => {
      // 清理 socket 连接
      socketService.disconnect();
      dispatch(clearRoomInfo());
    };
  }, []);

  // 初始化 Socket 连接
  const initializeSocket = async () => {
    try {
      await socketService.connect();
      dispatch(setConnectionStatus({ connected: true }));
      
      // 设置事件监听器
      setupSocketListeners();
      
    } catch (error) {
      console.error('Socket 连接失败:', error);
      dispatch(setConnectionStatus({ connected: false, error: error.message }));
    }
  };

  // 设置 Socket 事件监听器
  const setupSocketListeners = () => {
    socketService.on('join-success', (data) => {
      dispatch(setUserRole(data.role));
      dispatch(updateRoomInfo(data.roomInfo));
      showSuccess(`成功加入房间: ${data.roomInfo.title}`);
    });

    socketService.on('join-error', (error) => {
      showError(`加入房间失败: ${error.message}`);
      setIsJoining(false);
    });

    socketService.on('room-update', (update) => {
      dispatch(updateRoomInfo(update));
      if (update.message) {
        showInfo(update.message);
      }
    });

    socketService.on('progress-updated', (update) => {
      dispatch(addLiveUpdate({
        type: 'progress',
        user: update.user,
        data: update.data,
        timestamp: update.timestamp
      }));
    });

    socketService.on('goal-updated', (update) => {
      dispatch(addLiveUpdate({
        type: 'goal',
        action: update.type,
        user: update.user,
        data: update.data,
        timestamp: update.timestamp
      }));
    });

    socketService.on('reflection-updated', (update) => {
      dispatch(addLiveUpdate({
        type: 'reflection',
        action: update.type,
        user: update.user,
        data: update.data,
        timestamp: update.timestamp
      }));
    });

    socketService.on('new-comment', (comment) => {
      dispatch(addComment(comment));
    });

    socketService.on('connection-status', (status) => {
      dispatch(setConnectionStatus(status));
    });
  };

  // 加载我的分享
  const loadShares = async () => {
    try {
      setLoading(true);
      const data = await shareService.getMyShares();
      setShares(data);
    } catch (error) {
      showError('加载分享列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 开始直播
  const startLiveShare = async (shareToken) => {
    try {
      if (!realtimeState.isConnected) {
        await initializeSocket();
      }
      
      await socketService.joinShare(shareToken);
      showInfo('正在启动直播...');
      
    } catch (error) {
      showError('启动直播失败: ' + error.message);
    }
  };

  // 停止直播
  const stopLiveShare = () => {
    if (realtimeState.currentRoom) {
      socketService.leaveShare(realtimeState.roomInfo.shareToken);
      dispatch(clearRoomInfo());
      showSuccess('已停止直播');
    }
  };

  // 加入分享房间
  const joinShare = async (e) => {
    e.preventDefault();
    
    if (!joinToken.trim()) {
      showError('请输入分享令牌');
      return;
    }

    setIsJoining(true);
    
    try {
      if (!realtimeState.isConnected) {
        await initializeSocket();
      }
      
      await socketService.joinShare(joinToken.trim(), joinPassword || null);
      
    } catch (error) {
      showError('加入房间失败: ' + error.message);
      setIsJoining(false);
    }
  };

  // 离开房间
  const leaveRoom = () => {
    if (realtimeState.currentRoom) {
      socketService.leaveShare(realtimeState.roomInfo.shareToken);
      dispatch(clearRoomInfo());
      setJoinToken('');
      setJoinPassword('');
      showSuccess('已离开房间');
    }
  };

  // 复制分享链接
  const copyShareLink = (shareToken) => {
    const link = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(link);
    showSuccess('分享链接已复制到剪贴板');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部状态 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">实时分享</h2>
          <OnlineStatus />
        </div>
        
        {realtimeState.currentRoom && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">
                  {realtimeState.roomInfo.title || '实时房间'}
                </h3>
                <p className="text-sm text-blue-700">
                  角色: {realtimeState.userRole === 'owner' ? '主播' : '观看者'} | 
                  观看者: {realtimeState.roomInfo.viewerCount}
                </p>
              </div>
              <button
                onClick={leaveRoom}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
              >
                离开房间
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('my-shares')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-shares'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              我的分享
            </button>
            <button
              onClick={() => setActiveTab('join-share')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'join-share'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              加入分享
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'my-shares' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">我的分享列表</h3>
              
              {shares.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <p>还没有创建分享，去分享管理页面创建一个吧！</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {shares.map((share) => (
                    <div key={share.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{share.title}</h4>
                          <p className="text-sm text-gray-600">{share.description}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span>令牌: {share.shareToken}</span>
                            <span>类型: {share.shareType}</span>
                            <span>状态: {share.isActive ? '活跃' : '已停用'}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyShareLink(share.shareToken)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition duration-200"
                          >
                            复制链接
                          </button>
                          {share.isActive && (
                            <button
                              onClick={() => startLiveShare(share.shareToken)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                            >
                              开始直播
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'join-share' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">加入分享房间</h3>
              
              <form onSubmit={joinShare} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分享令牌
                  </label>
                  <input
                    type="text"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    placeholder="输入分享令牌"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isJoining}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码 (如果需要)
                  </label>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isJoining}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isJoining || !joinToken.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                >
                  {isJoining ? '加入中...' : '加入房间'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 实时功能区域 */}
      {realtimeState.currentRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveUpdates />
          <LiveComments />
        </div>
      )}
    </div>
  );
};

export default RealtimeShare;
