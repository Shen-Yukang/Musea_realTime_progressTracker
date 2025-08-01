import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectComments, selectUserRole, selectConnectionStatus } from '../../store/realtimeSlice';
import socketService from '../../services/socketService';
import { useNotification } from '../common/NotificationSystem';

const LiveComments = () => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef(null);
  
  const comments = useSelector(selectComments);
  const userRole = useSelector(selectUserRole);
  const isConnected = useSelector(selectConnectionStatus);
  const { showError, showSuccess } = useNotification();

  // 自动滚动到最新评论
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!isConnected) {
      showError('未连接到服务器，无法发送评论');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await socketService.sendComment(newComment.trim());
      setNewComment('');
      showSuccess('评论发送成功');
    } catch (error) {
      console.error('发送评论失败:', error);
      showError('发送评论失败: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!userRole) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">实时评论</h3>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>加入分享房间后可以查看和发送评论</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-96">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          实时评论
        </h3>
        <span className="text-sm text-gray-500">
          {comments.length} 条评论
        </span>
      </div>

      {/* 评论列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">还没有评论，来发表第一条吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              {/* 头像 */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                comment.isOwner ? 'bg-blue-600' : 'bg-gray-500'
              }`}>
                {comment.user.charAt(0).toUpperCase()}
              </div>
              
              {/* 评论内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    comment.isOwner ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {comment.user}
                    {comment.isOwner && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        主播
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(comment.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 break-words">
                  {comment.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* 评论输入框 */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmitComment} className="flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isConnected ? "发表评论..." : "连接中..."}
            disabled={!isConnected || isSubmitting}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || !isConnected || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
          >
            {isSubmitting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {/* 字数统计 */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>
            {isConnected ? '实时同步' : '离线模式'}
          </span>
          <span>
            {newComment.length}/200
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveComments;
