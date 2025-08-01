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
import RealtimeShare from '../realtime/RealtimeShare';
import { ResponsiveTabs } from '../layout/ResponsiveLayout';
import { NotificationProvider } from '../common/NotificationSystem';
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

  const tabs = [
    { id: 'progress', label: '今日进展', icon: '📝' },
    { id: 'overview', label: '概览', icon: '📊' },
    { id: 'goals', label: '目标管理', icon: '🎯' },
    { id: 'reflections', label: '反思记录', icon: '💭' },
    { id: 'analytics', label: '数据分析', icon: '📈' },
    { id: 'goal-analytics', label: '目标分析', icon: '🎯' },
    { id: 'reminders', label: '智能提醒', icon: '💡' },
    { id: 'share', label: '分享管理', icon: '🔗' },
    { id: 'realtime', label: '实时分享', icon: '📡' }
  ];

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 头部 */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">进展追踪器</h1>
                </div>
                {user && (
                  <div className="hidden md:block ml-6">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">欢迎回来，</span>
                      <span className="text-sm font-medium text-gray-900">{user.username}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {user && (
                  <div className="hidden md:block text-xs text-gray-500">
                    注册时间: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 标签页导航 */}
          <div className="mb-6">
            <ResponsiveTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* 内容区域 */}
          <div className="bg-white rounded-lg shadow-sm min-h-[600px]">
            {activeTab === 'progress' && <ProgressTracker />}
            {activeTab === 'overview' && <OverviewDashboard />}
            {activeTab === 'goals' && <GoalManager />}
            {activeTab === 'reflections' && <ReflectionManager />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'goal-analytics' && <GoalAnalytics />}
            {activeTab === 'reminders' && <SmartReminders />}
            {activeTab === 'share' && <ShareManager />}
            {activeTab === 'realtime' && <RealtimeShare />}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default Dashboard;
