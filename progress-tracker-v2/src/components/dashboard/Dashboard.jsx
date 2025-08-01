import { useState, useEffect } from 'react';
import authService from '../../services/authService';
import ShareManager from '../share/ShareManager';
import ProgressTracker from '../progress/ProgressTracker';
import OverviewDashboard from '../overview/OverviewDashboard';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import GoalAnalytics from '../analytics/GoalAnalytics';
import SmartReminders from '../analytics/SmartReminders';
import GoalManager from '../goals/GoalManager';
import ReflectionManager from '../reflection/ReflectionManager';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [apiTest, setApiTest] = useState({
    progress: null,
    reflections: null,
    goals: null,
    sync: null,
    share: null
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('progress');

  const testAPI = async (endpoint, name) => {
    try {
      const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
        headers: authService.getAuthHeaders()
      });
      
      const data = await response.json();
      
      setApiTest(prev => ({
        ...prev,
        [name]: {
          success: response.ok,
          status: response.status,
          message: data.message || (response.ok ? '成功' : '失败')
        }
      }));
    } catch (error) {
      setApiTest(prev => ({
        ...prev,
        [name]: {
          success: false,
          status: 'ERROR',
          message: error.message
        }
      }));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    await Promise.all([
      testAPI('progress', 'progress'),
      testAPI('reflections', 'reflections'),
      testAPI('goals', 'goals'),
      testAPI('sync/status', 'sync'),
      testAPI('share/manage', 'share')
    ]);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout();
    } catch (error) {
      console.error('登出错误:', error);
      onLogout(); // 即使出错也要登出
    }
  };

  // 获取用户信息
  const loadUserInfo = async () => {
    try {
      const profile = await authService.getProfile();
      if (profile && profile.success) {
        setUser(profile.data.user);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    // 组件加载时获取用户信息
    loadUserInfo();
    // 延迟测试 API，避免频繁请求
    const timer = setTimeout(() => {
      runAllTests();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          {user ? (
            <>
              <h1>欢迎回来，{user.username}!</h1>
              <p>邮箱: {user.email}</p>
              <p>注册时间: {new Date(user.createdAt).toLocaleDateString()}</p>
            </>
          ) : (
            <h1>加载中...</h1>
          )}
        </div>
        <button onClick={handleLogout} className="btn-logout">
          登出
        </button>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          📝 今日进展
        </button>
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 概览
        </button>
        <button
          className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 目标管理
        </button>
        <button
          className={`tab-button ${activeTab === 'reflections' ? 'active' : ''}`}
          onClick={() => setActiveTab('reflections')}
        >
          💭 反思记录
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 数据分析
        </button>
        <button
          className={`tab-button ${activeTab === 'goal-analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('goal-analytics')}
        >
          🎯 目标分析
        </button>
        <button
          className={`tab-button ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          💡 智能提醒
        </button>
        <button
          className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
          onClick={() => setActiveTab('share')}
        >
          🔗 分享管理
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'progress' && (
          <ProgressTracker />
        )}

        {activeTab === 'overview' && (
          <OverviewDashboard />
        )}

        {activeTab === 'goals' && (
          <GoalManager />
        )}

        {activeTab === 'reflections' && (
          <ReflectionManager />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {activeTab === 'goal-analytics' && (
          <GoalAnalytics />
        )}

        {activeTab === 'reminders' && (
          <SmartReminders />
        )}

        {activeTab === 'share' && (
          <ShareManager />
        )}

        {activeTab === 'system-status' && (
          <>
            <div className="milestone-status">
          <h2>🎉 Milestone 2 完成状态</h2>
          <div className="status-grid">
            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <span>用户认证系统</span>
            </div>
            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <span>数据库设计</span>
            </div>
            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <span>RESTful API</span>
            </div>
            <div className="status-item completed">
              <span className="status-icon">✅</span>
              <span>数据同步机制</span>
            </div>
          </div>
        </div>

        <div className="api-test-section">
          <div className="section-header">
            <h2>🧪 API 连接测试</h2>
            <button 
              onClick={runAllTests} 
              disabled={loading}
              className="btn-test"
            >
              {loading ? '测试中...' : '重新测试'}
            </button>
          </div>

          <div className="api-test-grid">
            {Object.entries(apiTest).map(([name, result]) => (
              <div key={name} className={`api-test-item ${result?.success ? 'success' : 'error'}`}>
                <div className="api-name">
                  {name === 'progress' && '📊 进展记录 API'}
                  {name === 'reflections' && '💭 反思记录 API'}
                  {name === 'goals' && '🎯 目标管理 API'}
                  {name === 'sync' && '🔄 数据同步 API'}
                  {name === 'share' && '🔗 分享功能 API'}
                </div>
                <div className="api-status">
                  {result ? (
                    <>
                      <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
                        {result.success ? '✅ 正常' : '❌ 异常'}
                      </span>
                      <span className="status-code">{result.status}</span>
                    </>
                  ) : (
                    <span className="status-badge loading">⏳ 测试中</span>
                  )}
                </div>
                {result?.message && (
                  <div className="api-message">{result.message}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="next-steps">
          <h2>🚀 下一步计划</h2>
          <div className="steps-list">
            <div className="step-item">
              <span className="step-number">1</span>
              <span>完善前端界面和用户体验</span>
            </div>
            <div className="step-item">
              <span className="step-number">2</span>
              <span>实现数据可视化和统计功能</span>
            </div>
            <div className="step-item completed">
              <span className="step-number">3</span>
              <span>✅ 开发分享功能 (Milestone 3) - 已完成</span>
            </div>
            <div className="step-item">
              <span className="step-number">4</span>
              <span>添加实时功能 (Milestone 4)</span>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
