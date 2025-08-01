import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ShareForm = ({ share, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: share?.title || '我的学习进展',
    description: share?.description || '',
    shareType: share?.shareType || 'private',
    password: '',
    settings: share?.settings || {
      showProgress: true,
      showReflections: true,
      showGoals: true,
      showPersonalInfo: false,
      dateRange: 'all',
      customStartDate: null,
      customEndDate: null
    },
    expiresAt: share?.expiresAt ? new Date(share.expiresAt).toISOString().slice(0, 16) : ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '分享标题不能为空';
    }

    if (formData.shareType === 'password' && !formData.password.trim()) {
      newErrors.password = '密码保护类型需要设置密码';
    }

    if (formData.settings.dateRange === 'custom') {
      if (!formData.settings.customStartDate) {
        newErrors.customStartDate = '自定义时间范围需要设置开始日期';
      }
      if (!formData.settings.customEndDate) {
        newErrors.customEndDate = '自定义时间范围需要设置结束日期';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 清理数据
    const submitData = { ...formData };

    // 如果不是密码保护类型，清除密码
    if (submitData.shareType !== 'password') {
      delete submitData.password;
    }

    // 如果没有过期时间，清除该字段
    if (!submitData.expiresAt) {
      delete submitData.expiresAt;
    }

    // 清理 settings 中的自定义日期字段
    if (submitData.settings.dateRange !== 'custom') {
      delete submitData.settings.customStartDate;
      delete submitData.settings.customEndDate;
    }

    onSubmit(submitData);
  };

  return (
    <div className="share-form-overlay">
      <div className="share-form-modal">
        <div className="form-header">
          <h3 className="text-lg font-semibold">
            {share ? '编辑分享' : '创建分享'}
          </h3>
          <button onClick={onCancel} className="btn-icon">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          {/* 基本信息 */}
          <div className="form-section">
            <h4 className="section-title">基本信息</h4>
            
            <div className="form-group">
              <label htmlFor="title">分享标题 *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="输入分享标题"
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">描述</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows="3"
                placeholder="分享描述（可选）"
              />
            </div>
          </div>

          {/* 分享设置 */}
          <div className="form-section">
            <h4 className="section-title">分享设置</h4>
            
            <div className="form-group">
              <label htmlFor="shareType">分享类型</label>
              <select
                id="shareType"
                name="shareType"
                value={formData.shareType}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="private">私密链接</option>
                <option value="public">公开</option>
                <option value="password">密码保护</option>
              </select>
            </div>

            {formData.shareType === 'password' && (
              <div className="form-group">
                <label htmlFor="password">访问密码 *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="设置访问密码"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="expiresAt">过期时间（可选）</label>
              <input
                type="datetime-local"
                id="expiresAt"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          {/* 内容设置 */}
          <div className="form-section">
            <h4 className="section-title">分享内容</h4>
            
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="settings.showProgress"
                  checked={formData.settings.showProgress}
                  onChange={handleInputChange}
                />
                <span>进展记录</span>
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="settings.showReflections"
                  checked={formData.settings.showReflections}
                  onChange={handleInputChange}
                />
                <span>反思记录</span>
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="settings.showGoals"
                  checked={formData.settings.showGoals}
                  onChange={handleInputChange}
                />
                <span>目标管理</span>
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="settings.showPersonalInfo"
                  checked={formData.settings.showPersonalInfo}
                  onChange={handleInputChange}
                />
                <span>个人信息</span>
              </label>
            </div>
          </div>

          {/* 时间范围 */}
          <div className="form-section">
            <h4 className="section-title">时间范围</h4>
            
            <div className="form-group">
              <select
                name="settings.dateRange"
                value={formData.settings.dateRange}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="all">全部</option>
                <option value="last7days">最近7天</option>
                <option value="last30days">最近30天</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            {formData.settings.dateRange === 'custom' && (
              <div className="date-range-group">
                <div className="form-group">
                  <label>开始日期</label>
                  <input
                    type="date"
                    name="settings.customStartDate"
                    value={formData.settings.customStartDate || ''}
                    onChange={handleInputChange}
                    className={`form-input ${errors.customStartDate ? 'error' : ''}`}
                  />
                  {errors.customStartDate && <span className="error-text">{errors.customStartDate}</span>}
                </div>
                
                <div className="form-group">
                  <label>结束日期</label>
                  <input
                    type="date"
                    name="settings.customEndDate"
                    value={formData.settings.customEndDate || ''}
                    onChange={handleInputChange}
                    className={`form-input ${errors.customEndDate ? 'error' : ''}`}
                  />
                  {errors.customEndDate && <span className="error-text">{errors.customEndDate}</span>}
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              {share ? '更新分享' : '创建分享'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareForm;
