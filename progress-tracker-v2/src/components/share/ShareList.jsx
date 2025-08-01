import { PencilIcon, TrashIcon, ClipboardIcon, EyeIcon, PowerIcon } from '@heroicons/react/24/outline';

const ShareList = ({ shares, onEdit, onDelete, onToggleStatus, onCopyLink }) => {
  const getShareTypeLabel = (type) => {
    switch (type) {
      case 'public': return '🌐 公开';
      case 'private': return '🔒 私密链接';
      case 'password': return '🔐 密码保护';
      default: return type;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="status-badge active">✅ 启用</span>
    ) : (
      <span className="status-badge inactive">❌ 禁用</span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="share-list">
      {shares.map((share) => (
        <div key={share.id} className="share-item">
          <div className="share-main">
            <div className="share-info">
              <h3 className="share-title">{share.title}</h3>
              {share.description && (
                <p className="share-description">{share.description}</p>
              )}
              <div className="share-meta">
                <span className="share-type">{getShareTypeLabel(share.shareType)}</span>
                {getStatusBadge(share.isActive)}
                <span className="share-views">👁️ {share.viewCount} 次访问</span>
                <span className="share-date">📅 {formatDate(share.createdAt)}</span>
              </div>
            </div>
            
            <div className="share-actions">
              <button
                onClick={() => onCopyLink(share.shareToken)}
                className="action-btn copy"
                title="复制链接"
              >
                <ClipboardIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onEdit(share)}
                className="action-btn edit"
                title="编辑"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onToggleStatus(share.id)}
                className={`action-btn toggle ${share.isActive ? 'active' : 'inactive'}`}
                title={share.isActive ? '禁用分享' : '启用分享'}
              >
                <PowerIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onDelete(share.id)}
                className="action-btn delete"
                title="删除"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 分享设置预览 */}
          <div className="share-settings">
            <div className="settings-row">
              <span className="settings-label">分享内容:</span>
              <div className="settings-tags">
                {share.settings.showProgress && <span className="tag">📊 进展</span>}
                {share.settings.showReflections && <span className="tag">💭 反思</span>}
                {share.settings.showGoals && <span className="tag">🎯 目标</span>}
                {share.settings.showPersonalInfo && <span className="tag">👤 个人信息</span>}
              </div>
            </div>
            
            <div className="settings-row">
              <span className="settings-label">时间范围:</span>
              <span className="settings-value">
                {share.settings.dateRange === 'all' && '全部'}
                {share.settings.dateRange === 'last7days' && '最近7天'}
                {share.settings.dateRange === 'last30days' && '最近30天'}
                {share.settings.dateRange === 'custom' && '自定义范围'}
              </span>
            </div>

            {share.expiresAt && (
              <div className="settings-row">
                <span className="settings-label">过期时间:</span>
                <span className="settings-value expire-time">
                  ⏰ {formatDate(share.expiresAt)}
                </span>
              </div>
            )}
          </div>

          {/* 分享链接 */}
          <div className="share-url-section">
            <label className="url-label">分享链接:</label>
            <div className="url-container">
              <input
                type="text"
                value={`${window.location.origin}/share/${share.shareToken}`}
                readOnly
                className="url-input"
              />
              <button
                onClick={() => onCopyLink(share.shareToken)}
                className="url-copy-btn"
              >
                <ClipboardIcon className="w-4 h-4" />
                复制
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShareList;
