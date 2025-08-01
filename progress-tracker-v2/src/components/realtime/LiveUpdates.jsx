import { useSelector } from 'react-redux';
import { selectLiveUpdates, selectUserRole } from '../../store/realtimeSlice';

const LiveUpdates = () => {
  const liveUpdates = useSelector(selectLiveUpdates);
  const userRole = useSelector(selectUserRole);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'progress':
        return '📊';
      case 'goal':
        return '🎯';
      case 'reflection':
        return '💭';
      default:
        return '📝';
    }
  };

  const getUpdateColor = (type) => {
    switch (type) {
      case 'progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'goal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'reflection':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActionText = (type, action) => {
    if (type === 'progress') {
      return '更新了进展记录';
    }
    
    if (type === 'goal') {
      switch (action) {
        case 'create':
          return '创建了新目标';
        case 'update':
          return '更新了目标';
        case 'delete':
          return '删除了目标';
        default:
          return '修改了目标';
      }
    }
    
    if (type === 'reflection') {
      switch (action) {
        case 'create':
          return '写了新反思';
        case 'update':
          return '更新了反思';
        case 'delete':
          return '删除了反思';
        default:
          return '修改了反思';
      }
    }
    
    return '进行了更新';
  };

  const renderUpdateContent = (update) => {
    const { type, action, data } = update;
    
    switch (type) {
      case 'progress':
        return (
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>评分:</span>
              <div className="flex items-center">
                <span className="font-medium text-blue-600">{data.rating}/10</span>
                <div className="ml-2 flex">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full mr-1 ${
                        i < data.rating ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {data.mainTasks && (
              <div className="mt-1">
                <span className="text-gray-500">主要任务:</span>
                <span className="ml-1">{data.mainTasks}</span>
              </div>
            )}
          </div>
        );
        
      case 'goal':
        return (
          <div className="mt-2 text-sm text-gray-600">
            <div className="font-medium">{data.name}</div>
            {data.progress !== undefined && (
              <div className="flex items-center mt-1">
                <span className="text-gray-500">进度:</span>
                <div className="ml-2 flex-1 max-w-24">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${data.progress}%` }}
                    />
                  </div>
                </div>
                <span className="ml-2 text-sm font-medium">{data.progress}%</span>
              </div>
            )}
          </div>
        );
        
      case 'reflection':
        return (
          <div className="mt-2 text-sm text-gray-600">
            {data.title && (
              <div className="font-medium">{data.title}</div>
            )}
            {data.content && (
              <div className="mt-1 text-gray-500 line-clamp-2">
                {data.content.substring(0, 100)}
                {data.content.length > 100 && '...'}
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!userRole) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">实时更新</h3>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p>加入分享房间后可以查看实时更新</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          实时更新
        </h3>
        <span className="text-sm text-gray-500">
          {liveUpdates.length} 条更新
        </span>
      </div>

      {/* 更新列表 */}
      <div className="max-h-96 overflow-y-auto">
        {liveUpdates.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm">暂无实时更新</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {liveUpdates.map((update) => (
              <div key={update.id} className="p-4 hover:bg-gray-50 transition duration-200">
                <div className="flex items-start space-x-3">
                  {/* 图标 */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${getUpdateColor(update.type)}`}>
                    <span className="text-sm">{getUpdateIcon(update.type)}</span>
                  </div>
                  
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {update.user && (
                          <span className="text-blue-600">{update.user} </span>
                        )}
                        {getActionText(update.type, update.action)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTime(update.timestamp)}
                      </span>
                    </div>
                    
                    {/* 更新详情 */}
                    {renderUpdateContent(update)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部状态 */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>实时同步中</span>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            <span>在线</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveUpdates;
