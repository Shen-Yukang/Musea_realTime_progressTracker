import { useSelector } from 'react-redux';
import { selectConnectionStatus, selectRoomInfo, selectOwnerStatus } from '../../store/realtimeSlice';

const OnlineStatus = () => {
  const isConnected = useSelector(selectConnectionStatus);
  const roomInfo = useSelector(selectRoomInfo);
  const ownerStatus = useSelector(selectOwnerStatus);

  if (!isConnected) {
    return (
      <div className="flex items-center text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
        <span className="text-sm">连接中...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* 连接状态 */}
      <div className="flex items-center text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        <span className="text-sm font-medium">在线</span>
      </div>

      {/* 房间信息 */}
      {roomInfo.shareToken && (
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm">{roomInfo.viewerCount} 观看者</span>
        </div>
      )}

      {/* 所有者状态 */}
      {roomInfo.shareToken && ownerStatus.isOnline && (
        <div className="flex items-center text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">
            {ownerStatus.currentActivity || '在线'}
          </span>
        </div>
      )}
    </div>
  );
};

export default OnlineStatus;
