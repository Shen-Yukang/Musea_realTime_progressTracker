import { useState } from 'react';

const LoginForm = ({ onLogin, onSwitchToRegister, loading = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 基础验证
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onLogin(formData);
  };

  return (
    <div className="auth-form">
      <h2>登录</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">邮箱</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="请输入邮箱"
            disabled={loading}
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="请输入密码"
            disabled={loading}
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="auth-switch">
        还没有账户？
        <button 
          type="button" 
          onClick={onSwitchToRegister}
          className="btn-link"
          disabled={loading}
        >
          立即注册
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
