import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import ToastContainer from './components/common/ToastContainer';
import authService from './services/authService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          // 验证 token 是否有效
          const profileResponse = await authService.getProfile();
          if (profileResponse && profileResponse.success) {
            setIsAuthenticated(true);
          } else {
            authService.logout();
          }
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <div className="App">
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <AuthPage onAuthSuccess={handleLogin} />
        )}
        <ToastContainer />
      </div>
    </Provider>
  );
}

export default App;


