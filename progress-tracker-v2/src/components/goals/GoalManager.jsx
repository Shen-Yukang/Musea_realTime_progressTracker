import { useState, useEffect } from 'react';
import goalService from '../../services/goalService';
import { showError, showSuccess, withErrorHandling } from '../../utils/errorHandler';

const GoalManager = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium'
  });
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 加载目标列表
  const loadGoals = async () => {
    try {
      const result = await goalService.getAllGoals();
      setGoals(result);
    } catch (error) {
      showError(error, '加载目标列表');
    }
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 添加目标
  const handleAddGoal = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      showError(new Error('请填写目标名称和日期'), '表单验证');
      return;
    }

    setLoading(true);
    try {
      const newGoal = {
        ...formData,
        progress: 0,
        completed: false,
        status: 'not_started'
      };

      const result = await withErrorHandling(
        () => goalService.createGoal(newGoal),
        '添加目标',
        result.message
      );

      // 清空表单
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        priority: 'medium'
      });

      // 重新加载目标列表
      await loadGoals();

    } catch (error) {
      // 错误已经在 withErrorHandling 中处理了
    } finally {
      setLoading(false);
    }
  };

  // 更新目标进度
  const updateGoalProgress = async (goalId, currentProgress) => {
    const newProgress = prompt(`请输入新的进度 (0-100):`, currentProgress);
    if (newProgress === null) return;

    const progress = parseInt(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      showError(new Error('请输入0-100之间的数字'), '输入验证');
      return;
    }

    try {
      const result = await withErrorHandling(
        () => goalService.updateGoalProgress(goalId, progress),
        '更新目标进度',
        result.message
      );

      await loadGoals();
    } catch (error) {
      // 错误已经在 withErrorHandling 中处理了
    }
  };

  // 切换目标完成状态
  const toggleGoalCompletion = async (goalId, currentCompleted) => {
    try {
      const newProgress = !currentCompleted ? 100 : 0;

      const result = await withErrorHandling(
        () => goalService.updateGoalProgress(goalId, newProgress),
        '更新目标状态',
        `目标已标记为${!currentCompleted ? '完成' : '未完成'}`
      );

      await loadGoals();
    } catch (error) {
      // 错误已经在 withErrorHandling 中处理了
    }
  };

  // 删除目标
  const deleteGoal = async (goalId, goalName) => {
    if (!confirm(`确定要删除目标"${goalName}"吗？`)) return;

    try {
      const result = await withErrorHandling(
        () => goalService.deleteGoal(goalId),
        '删除目标',
        result.message
      );

      await loadGoals();
    } catch (error) {
      // 错误已经在 withErrorHandling 中处理了
    }
  };

  // 计算时间进度
  const calculateTimeProgress = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    
    return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  };

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadGoals();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 添加新目标表单 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>➕</span>
          添加新目标
        </h2>

        <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              目标名称
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="输入目标名称..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              目标描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="详细描述这个目标..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                开始日期
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                目标截止日期
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              优先级
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>➕</span>
            {loading ? '添加中...' : '添加目标'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: message.includes('成功') || message.includes('已添加') || message.includes('已更新') || message.includes('已删除')
              ? '#f0fdf4' : '#fef2f2',
            color: message.includes('成功') || message.includes('已添加') || message.includes('已更新') || message.includes('已删除')
              ? '#166534' : '#991b1b',
            border: `1px solid ${message.includes('成功') || message.includes('已添加') || message.includes('已更新') || message.includes('已删除')
              ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message}
          </div>
        )}
      </div>

      {/* 当前目标列表 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>📋</span>
          当前目标列表
        </h2>

        {goals.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {goals.map((goal) => {
              const timeProgress = calculateTimeProgress(goal.startDate, goal.endDate);
              return (
                <div
                  key={goal.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: goal.completed ? '#f0fdf4' : '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#374151', 
                        fontSize: '1.2rem',
                        textDecoration: goal.completed ? 'line-through' : 'none'
                      }}>
                        {goal.name}
                      </h3>
                      <p style={{ margin: '0 0 10px 0', color: '#6b7280', lineHeight: '1.5' }}>
                        {goal.description}
                      </p>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        <span>{goal.startDate} 至 {goal.endDate}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: getPriorityColor(goal.priority),
                        color: 'white'
                      }}>
                        {getPriorityText(goal.priority)}优先级
                      </span>
                      {goal.completed && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: '#22c55e',
                          color: 'white'
                        }}>
                          已完成
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                      <span style={{ color: '#374151', fontWeight: '500' }}>目标进度</span>
                      <span style={{ color: '#6b7280' }}>{goal.progress}%</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '10px', height: '8px' }}>
                      <div style={{
                        width: `${goal.progress}%`,
                        backgroundColor: '#4f46e5',
                        height: '100%',
                        borderRadius: '10px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.8rem', color: '#6b7280' }}>
                      <span>时间进度: {timeProgress}%</span>
                      <span>{goal.progress >= timeProgress ? '进度正常' : '需要加快'}</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateGoalProgress(goal.id, goal.progress)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      ✏️ 更新进度
                    </button>
                    <button
                      onClick={() => toggleGoalCompletion(goal.id, goal.completed)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: goal.completed ? '#f59e0b' : '#22c55e',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {goal.completed ? '↩️ 标记未完成' : '✅ 标记完成'}
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id, goal.name)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎯</div>
            <p>暂无目标，开始添加您的第一个目标吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalManager;
