import { useState, useEffect } from 'react';
import reflectionService from '../../services/reflectionService';
import progressService from '../../services/progressService';
import { showError, showSuccess, withErrorHandling } from '../../utils/errorHandler';

const ReflectionManager = () => {
  const [formData, setFormData] = useState({
    dailyReflection: '',
    adjustments: ''
  });
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [alertInfo, setAlertInfo] = useState(null);

  // 加载反思历史
  const loadReflectionHistory = async () => {
    try {
      const reflections = await reflectionService.getRecentReflections(5);
      setReflectionHistory(reflections);
    } catch (error) {
      showError(error, '加载反思历史');
    }
  };

  // 生成反思提醒
  const generateReflectionAlert = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 检查今天是否已有反思记录
      let todayReflection = null;
      try {
        const reflections = await reflectionService.getReflections({
          startDate: today,
          endDate: today,
          limit: 1
        });
        todayReflection = reflections.reflections && reflections.reflections.length > 0 ? reflections.reflections[0] : null;
      } catch (error) {
        console.warn('检查今日反思记录失败:', error);
      }

      // 获取最近的进展记录
      let recentProgress = [];
      try {
        recentProgress = await progressService.getProgressList(3);
      } catch (error) {
        console.warn('获取最近进展记录失败:', error);
      }

      let alertClass = 'info';
      let alertTitle = '建议进行反思';
      let alertMessage = '定期反思可以帮助您确认方向是否正确，避免瞎忙。';
      let alertIcon = '💭';

      // 检查今天是否有低评分
      const todayProgress = recentProgress.find(p => p.date === today);
      if (todayProgress && todayProgress.rating <= 5) {
        alertClass = 'warning';
        alertTitle = '进展评分较低，建议深入反思';
        alertMessage = '您今天的进展评分较低，建议反思原因并调整策略。';
        alertIcon = '⚠️';
      }

      // 检查是否连续多天没有反思
      if (reflectionHistory.length > 0) {
        const lastReflection = new Date(reflectionHistory[0].date);
        const daysSinceReflection = Math.ceil((new Date() - lastReflection) / (1000 * 60 * 60 * 24));
        
        if (daysSinceReflection > 3) {
          alertClass = 'danger';
          alertTitle = '已多天未进行反思';
          alertMessage = `您已经 ${daysSinceReflection} 天没有进行反思了，强烈建议立即反思以调整方向。`;
          alertIcon = '🚨';
        }
      }

      // 检查进展评分是否连续下降
      if (recentProgress.length >= 3) {
        const ratings = recentProgress.slice(0, 3).map(p => p.rating);
        if (ratings[0] < ratings[1] && ratings[1] < ratings[2]) {
          alertClass = 'warning';
          alertTitle = '进展评分连续下降';
          alertMessage = '最近三天的进展评分持续下降，可能需要调整策略或休息。';
          alertIcon = '📉';
        }
      }

      setAlertInfo({
        class: alertClass,
        title: alertTitle,
        message: alertMessage,
        icon: alertIcon,
        hasTodayReflection: !!todayReflection
      });
    } catch (error) {
      console.error('生成反思提醒失败:', error);
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

  // 保存反思记录
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.dailyReflection.trim()) {
      showError(new Error('请填写今日反思'), '表单验证');
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const reflectionData = {
        date: today,
        content: formData.dailyReflection,
        adjustments: formData.adjustments,
        type: 'daily'
      };

      const result = await withErrorHandling(
        () => reflectionService.saveReflection(reflectionData),
        '保存反思记录',
        result.message
      );

      // 清空表单
      setFormData({
        dailyReflection: '',
        adjustments: ''
      });

      // 重新加载数据
      await loadReflectionHistory();
      await generateReflectionAlert();

    } catch (error) {
      // 错误已经在 withErrorHandling 中处理了
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadReflectionHistory();
    generateReflectionAlert();
  }, []);

  const getAlertStyle = (alertClass) => {
    const baseStyle = {
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px',
      borderLeft: '4px solid'
    };

    switch (alertClass) {
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: '#fef2f2',
          borderLeftColor: '#ef4444',
          color: '#991b1b'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fffbeb',
          borderLeftColor: '#f59e0b',
          color: '#92400e'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#eff6ff',
          borderLeftColor: '#3b82f6',
          color: '#1e40af'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 反思提醒 */}
      {alertInfo && (
        <div style={getAlertStyle(alertInfo.class)}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.5rem', marginRight: '15px' }}>
              {alertInfo.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {alertInfo.title}
              </h3>
              <p style={{ margin: '0 0 15px 0', lineHeight: '1.5' }}>
                {alertInfo.message}
              </p>
              <button
                onClick={() => document.getElementById('daily-reflection').focus()}
                style={{
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                立即反思
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 反思记录表单 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>🧠</span>
          今日反思记录
        </h2>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              今日反思
            </label>
            <textarea
              id="daily-reflection"
              name="dailyReflection"
              value={formData.dailyReflection}
              onChange={handleInputChange}
              rows="6"
              placeholder="记录今天的反思，包括：是否在正确的方向上？是否有瞎忙的情况？需要调整什么？..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                lineHeight: '1.5',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              需要调整的方向或策略
            </label>
            <textarea
              name="adjustments"
              value={formData.adjustments}
              onChange={handleInputChange}
              rows="4"
              placeholder="列出需要调整的方向或策略..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                lineHeight: '1.5',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
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
            <span>💾</span>
            {loading ? '保存中...' : '保存反思记录'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: message.includes('成功') || message.includes('已保存') || message.includes('已更新')
              ? '#f0fdf4' : '#fef2f2',
            color: message.includes('成功') || message.includes('已保存') || message.includes('已更新')
              ? '#166534' : '#991b1b',
            border: `1px solid ${message.includes('成功') || message.includes('已保存') || message.includes('已更新')
              ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message}
          </div>
        )}
      </div>

      {/* 历史反思记录 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>📚</span>
          历史反思记录
        </h2>

        {reflectionHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reflectionHistory.map((reflection) => (
              <div
                key={reflection.id}
                style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '1.1rem' }}>
                  {reflection.date}
                </h3>
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>
                    反思内容：
                  </h4>
                  <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>
                    {reflection.content}
                  </p>
                </div>
                {reflection.adjustments && (
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '600', color: '#6b7280' }}>
                      调整方向：
                    </h4>
                    <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>
                      {reflection.adjustments}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💭</div>
            <p>暂无反思记录，开始记录您的思考和调整吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReflectionManager;
