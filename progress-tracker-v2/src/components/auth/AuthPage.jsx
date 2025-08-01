import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import authService from '../../services/authService';
import './AuthPage.css';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        showMessage('登录成功！', 'success');
        
        // 获取用户资料
        const profile = await authService.getProfile();
        
        // 通知父组件认证成功
        onAuthSuccess(profile.data.user);
      } else {
        showMessage(result.message || '登录失败', 'error');
      }
    } catch (error) {
      showMessage(error.message || '登录失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        showMessage('注册成功！正在为您登录...', 'success');
        
        // 获取用户资料
        const profile = await authService.getProfile();
        
        // 通知父组件认证成功
        onAuthSuccess(profile.data.user);
      } else {
        showMessage(result.message || '注册失败', 'error');
      }
    } catch (error) {
      showMessage(error.message || '注册失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Progress Tracker</h1>
          <p>现代化的进展追踪应用</p>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="auth-content">
          {isLogin ? (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setIsLogin(false)}
              loading={loading}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              onSwitchToLogin={() => setIsLogin(true)}
              loading={loading}
            />
          )}
        </div>

        <div className="auth-footer">
          <p>Milestone 2: 后端服务开发完成 ✅</p>
          <p>正在测试用户认证功能</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
