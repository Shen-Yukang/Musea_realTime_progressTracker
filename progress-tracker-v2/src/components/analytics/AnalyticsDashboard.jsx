import { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import progressService from '../../services/progressService';
import reflectionService from '../../services/reflectionService';
import goalService from '../../services/goalService';
import { showError } from '../../utils/errorHandler';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // 30, 60, 90 days
  const [analyticsData, setAnalyticsData] = useState({
    progressTrend: [],
    ratingDistribution: [],
    weeklyPattern: [],
    goalProgress: [],
    reflectionFrequency: [],
    productivityMetrics: {},
    insights: []
  });

  // 颜色主题
  const colors = {
    primary: '#4f46e5',
    secondary: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  // 加载分析数据
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [progressStats, reflectionStats, goalStats] = await Promise.all([
        progressService.getStatistics(),
        reflectionService.getReflectionStats ? reflectionService.getReflectionStats() : Promise.resolve({}),
        goalService.getGoalStats ? goalService.getGoalStats() : Promise.resolve({})
      ]);

      // 获取详细的进展数据
      const progressList = await progressService.getProgressList(parseInt(timeRange));
      
      // 处理进展趋势数据
      const progressTrend = processProgressTrend(progressList);
      
      // 处理评分分布数据
      const ratingDistribution = processRatingDistribution(progressList);
      
      // 处理周模式数据
      const weeklyPattern = processWeeklyPattern(progressList);
      
      // 处理目标进度数据
      const goalProgress = await processGoalProgress();
      
      // 处理反思频率数据
      const reflectionFrequency = processReflectionFrequency(reflectionStats);
      
      // 计算生产力指标
      const productivityMetrics = calculateProductivityMetrics(progressList, goalStats);
      
      // 生成洞察
      const insights = generateInsights(progressStats, goalStats, reflectionStats);

      setAnalyticsData({
        progressTrend,
        ratingDistribution,
        weeklyPattern,
        goalProgress,
        reflectionFrequency,
        productivityMetrics,
        insights
      });
    } catch (error) {
      showError(error, '加载分析数据');
    } finally {
      setLoading(false);
    }
  };

  // 处理进展趋势数据
  const processProgressTrend = (progressList) => {
    const last30Days = [];
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      const progress = progressList.find(p => p.date === dateString);
      last30Days.push({
        date: formattedDate,
        fullDate: dateString,
        rating: progress ? progress.rating : null,
        hasData: !!progress,
        challenges: progress ? (progress.challenges ? progress.challenges.length : 0) : 0,
        learnings: progress ? (progress.learnings ? progress.learnings.length : 0) : 0
      });
    }
    return last30Days;
  };

  // 处理评分分布数据
  const processRatingDistribution = (progressList) => {
    const distribution = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }
    
    progressList.forEach(progress => {
      if (progress.rating) {
        distribution[progress.rating]++;
      }
    });
    
    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating}分`,
      count,
      percentage: progressList.length > 0 ? (count / progressList.length * 100).toFixed(1) : 0
    }));
  };

  // 处理周模式数据
  const processWeeklyPattern = (progressList) => {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const pattern = weekDays.map(day => ({ day, avgRating: 0, count: 0, total: 0 }));
    
    progressList.forEach(progress => {
      if (progress.rating && progress.date) {
        const dayOfWeek = new Date(progress.date).getDay();
        pattern[dayOfWeek].total += progress.rating;
        pattern[dayOfWeek].count++;
      }
    });
    
    return pattern.map(item => ({
      ...item,
      avgRating: item.count > 0 ? (item.total / item.count).toFixed(1) : 0
    }));
  };

  // 处理目标进度数据
  const processGoalProgress = async () => {
    try {
      const goals = await goalService.getAllGoals();
      return goals.slice(0, 5).map(goal => ({
        name: goal.name.length > 15 ? goal.name.substring(0, 15) + '...' : goal.name,
        progress: goal.progress || 0,
        status: goal.status,
        priority: goal.priority
      }));
    } catch (error) {
      return [];
    }
  };

  // 处理反思频率数据
  const processReflectionFrequency = (reflectionStats) => {
    // 模拟数据，实际应该从 API 获取
    return [
      { month: '1月', count: 8 },
      { month: '2月', count: 12 },
      { month: '3月', count: 15 },
      { month: '4月', count: 10 },
      { month: '5月', count: 18 },
      { month: '6月', count: 14 }
    ];
  };

  // 计算生产力指标
  const calculateProductivityMetrics = (progressList, goalStats) => {
    const totalDays = progressList.length;
    const activeDays = progressList.filter(p => p.rating > 0).length;
    const avgRating = progressList.length > 0 
      ? progressList.reduce((sum, p) => sum + (p.rating || 0), 0) / progressList.length 
      : 0;
    
    const highProductivityDays = progressList.filter(p => p.rating >= 8).length;
    const consistency = totalDays > 0 ? (activeDays / totalDays * 100).toFixed(1) : 0;
    
    return {
      consistency: parseFloat(consistency),
      avgRating: parseFloat(avgRating.toFixed(1)),
      highProductivityDays,
      totalActiveDays: activeDays,
      completedGoals: goalStats?.completedGoals || 0,
      totalGoals: goalStats?.totalGoals || 0
    };
  };

  // 生成洞察
  const generateInsights = (progressStats, goalStats, reflectionStats) => {
    const insights = [];
    
    if (progressStats.averageRating >= 8) {
      insights.push({
        type: 'success',
        title: '表现优秀',
        message: `您的平均评分达到 ${progressStats.averageRating.toFixed(1)} 分，保持这个势头！`
      });
    } else if (progressStats.averageRating < 6) {
      insights.push({
        type: 'warning',
        title: '需要改进',
        message: '最近的进展评分偏低，建议回顾和调整学习策略。'
      });
    }
    
    if (progressStats.recentTrend === 'up') {
      insights.push({
        type: 'success',
        title: '上升趋势',
        message: '您的进展呈现上升趋势，继续保持！'
      });
    } else if (progressStats.recentTrend === 'down') {
      insights.push({
        type: 'warning',
        title: '下降趋势',
        message: '最近进展有所下降，建议分析原因并调整方法。'
      });
    }
    
    return insights;
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">加载分析数据...</span>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard space-y-6">
      {/* 头部控制 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="text-indigo-600 mr-2">📊</span>
          数据分析仪表板
        </h2>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="30">最近30天</option>
          <option value="60">最近60天</option>
          <option value="90">最近90天</option>
        </select>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="一致性"
          value={`${analyticsData.productivityMetrics.consistency}%`}
          icon="🎯"
          color={colors.primary}
          description="记录进展的天数比例"
        />
        <MetricCard
          title="平均评分"
          value={analyticsData.productivityMetrics.avgRating}
          icon="⭐"
          color={colors.success}
          description="整体表现水平"
        />
        <MetricCard
          title="高效天数"
          value={analyticsData.productivityMetrics.highProductivityDays}
          icon="🚀"
          color={colors.warning}
          description="评分≥8分的天数"
        />
        <MetricCard
          title="目标完成率"
          value={`${analyticsData.productivityMetrics.totalGoals > 0 
            ? (analyticsData.productivityMetrics.completedGoals / analyticsData.productivityMetrics.totalGoals * 100).toFixed(0) 
            : 0}%`}
          icon="🎯"
          color={colors.purple}
          description="已完成目标比例"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 进展趋势图 */}
        <ChartCard title="进展趋势" icon="📈">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analyticsData.progressTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="rating"
                fill={colors.primary}
                fillOpacity={0.3}
                stroke={colors.primary}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke={colors.primary}
                strokeWidth={3}
                dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 评分分布 */}
        <ChartCard title="评分分布" icon="📊">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip formatter={(value) => [value, '次数']} />
              <Bar dataKey="count" fill={colors.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 周模式分析 */}
        <ChartCard title="周模式分析" icon="📅">
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart data={analyticsData.weeklyPattern} innerRadius="30%" outerRadius="90%">
              <RadialBar dataKey="avgRating" cornerRadius={10} fill={colors.success} />
              <Tooltip formatter={(value) => [`${value}分`, '平均评分']} />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 目标进度 */}
        <ChartCard title="目标进度" icon="🎯">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.goalProgress} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip formatter={(value) => [`${value}%`, '完成度']} />
              <Bar dataKey="progress" fill={colors.purple} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 洞察和建议 */}
      {analyticsData.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="text-yellow-500 mr-2">💡</span>
            智能洞察
          </h3>
          <div className="space-y-3">
            {analyticsData.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'success' 
                    ? 'bg-green-50 border-green-400 text-green-800'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                }`}
              >
                <h4 className="font-semibold">{insight.title}</h4>
                <p className="text-sm mt-1">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 指标卡片组件
const MetricCard = ({ title, value, icon, color, description }) => (
  <div className="bg-white rounded-lg shadow-md p-6 text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </div>
);

// 图表卡片组件
const ChartCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
      <span className="mr-2">{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

export default AnalyticsDashboard;
