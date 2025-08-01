import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import progressService from '../../services/progressService';

const OverviewDashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [statistics, setStatistics] = useState({
    totalRecords: 0,
    averageRating: 0,
    highestRating: 0,
    lowestRating: 0,
    recentTrend: 'stable'
  });
  const [recentProgress, setRecentProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const [chartResult, statsResult, progressResult] = await Promise.all([
        progressService.getRecentRatings(),
        progressService.getStatistics(),
        progressService.getProgressList(5)
      ]);
      
      setChartData(chartResult);
      setStatistics(statsResult);
      setRecentProgress(progressResult);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#22c55e';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
        <p>正在加载数据...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#374151' }}>总记录数</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', margin: 0 }}>
            {statistics.totalRecords}
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⭐</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#374151' }}>平均评分</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', margin: 0 }}>
            {statistics.averageRating}/10
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏆</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#374151' }}>最高评分</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>
            {statistics.highestRating}/10
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{getTrendIcon(statistics.recentTrend)}</div>
          <h3 style={{ margin: '0 0 5px 0', color: '#374151' }}>近期趋势</h3>
          <p style={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            color: getTrendColor(statistics.recentTrend), 
            margin: 0 
          }}>
            {statistics.recentTrend === 'up' ? '上升' : 
             statistics.recentTrend === 'down' ? '下降' : '稳定'}
          </p>
        </div>
      </div>

      {/* 进展趋势图表 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>📈</span>
          最近7天进展趋势
        </h2>
        
        {chartData.length > 0 ? (
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip 
                  formatter={(value) => [`${value}/10`, '评分']}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
            <p>暂无数据，开始记录进展后这里将显示趋势图表</p>
          </div>
        )}
      </div>

      {/* 最近进展概览 */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>📋</span>
          最近进展记录
        </h2>
        
        {recentProgress.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {recentProgress.map((progress, index) => (
              <div
                key={progress.date}
                style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderLeft: '4px solid #4f46e5',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>
                    {progress.date}
                  </h3>
                  <span style={{
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {progress.rating}/10
                  </span>
                </div>
                <p style={{ margin: '5px 0', color: '#6b7280' }}>
                  <strong>主要任务:</strong> {progress.mainTasks || '无记录'}
                </p>
                {progress.challenges && (
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>
                    <strong>挑战:</strong> {progress.challenges}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📝</div>
            <p>暂无进展记录，去"今日进展"页面开始记录吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewDashboard;
