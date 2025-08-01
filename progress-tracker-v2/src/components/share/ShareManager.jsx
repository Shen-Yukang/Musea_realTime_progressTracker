import { useState, useEffect } from 'react';
import { PlusIcon, ShareIcon, EyeIcon, TrashIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import shareService from '../../services/shareService';
import ShareForm from './ShareForm';
import ShareList from './ShareList';

const ShareManager = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShare, setEditingShare] = useState(null);
  const [error, setError] = useState(null);

  // 加载分享列表
  const loadShares = async () => {
    try {
      setLoading(true);
      const data = await shareService.getMyShares();
      setShares(data);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 创建分享
  const handleCreateShare = async (shareData) => {
    try {
      await shareService.createShare(shareData);
      await loadShares();
      setShowForm(false);
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // 更新分享
  const handleUpdateShare = async (shareData) => {
    try {
      await shareService.updateShare(editingShare.id, shareData);
      await loadShares();
      setShowForm(false);
      setEditingShare(null);
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // 删除分享
  const handleDeleteShare = async (shareId) => {
    if (!confirm('确定要删除这个分享吗？')) return;

    try {
      await shareService.deleteShare(shareId);
      await loadShares();
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // 切换分享状态
  const handleToggleStatus = async (shareId) => {
    try {
      await shareService.toggleShareStatus(shareId);
      await loadShares();
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  // 复制分享链接
  const handleCopyLink = async (shareToken) => {
    const shareUrl = shareService.generateShareUrl(shareToken);
    const success = await shareService.copyToClipboard(shareUrl);
    
    if (success) {
      // 这里可以显示成功提示
      alert('链接已复制到剪贴板');
    } else {
      alert('复制失败，请手动复制链接');
    }
  };

  // 编辑分享
  const handleEditShare = (share) => {
    setEditingShare(share);
    setShowForm(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingShare(null);
  };

  useEffect(() => {
    loadShares();
  }, []);

  return (
    <div className="share-manager">
      <div className="share-header">
        <div className="header-content">
          <div className="header-info">
            <ShareIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">分享管理</h2>
              <p className="text-gray-600">创建和管理你的学习进展分享</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            创建分享
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {showForm && (
        <ShareForm
          share={editingShare}
          onSubmit={editingShare ? handleUpdateShare : handleCreateShare}
          onCancel={handleCancelEdit}
        />
      )}

      <div className="share-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载分享列表...</p>
          </div>
        ) : shares.length === 0 ? (
          <div className="empty-state">
            <ShareIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有分享</h3>
            <p className="text-gray-600 mb-4">创建你的第一个分享，与他人展示你的学习进展</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              创建分享
            </button>
          </div>
        ) : (
          <ShareList
            shares={shares}
            onEdit={handleEditShare}
            onDelete={handleDeleteShare}
            onToggleStatus={handleToggleStatus}
            onCopyLink={handleCopyLink}
          />
        )}
      </div>
    </div>
  );
};

export default ShareManager;
