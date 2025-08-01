import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, Treemap
} from 'recharts';
import goalService from '../../services/goalService';
import { showError } from '../../utils/errorHandler';

const GoalAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [analytics, setAnalytics] = useState({
    statusDistribution: [],
    priorityDistribution: [],
    progressOverTime: [],
    categoryBreakdown: [],
    completionRate: 0,
    avgProgress: 0,
    upcomingDeadlines: []
  });

  const colors = {
    completed: '#10b981',
    inProgress: '#3b82f6',
    notStarted: '#6b7280',
    overdue: '#ef4444',
    high: '#dc2626',
    medium: '#f59e0b',
    low: '#10b981'
  };

  const loadGoalAnalytics = async () => {
    setLoading(true);
    try {
      const goalsList = await goalService.getAllGoals();
      setGoals(goalsList);
      
      const analytics = processGoalAnalytics(goalsList);
      setAnalytics(analytics);
    } catch (error) {
      showError(error, '加载目标分析数据');
    } finally {
      setLoading(false);
    }
  };

  const processGoalAnalytics = (goalsList) => {
    // 状态分布
    const statusCounts = {
      completed: 0,
      in_progress: 0,
      not_started: 0,
      overdue: 0
    };

    // 优先级分布
    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0
    };

    // 分类统计
    const categoryStats = {};

    const today = new Date();
    let totalProgress = 0;
    const upcomingDeadlines = [];

    goalsList.forEach(goal => {
      // 状态统计
      const endDate = new Date(goal.endDate);
      if (goal.progress >= 100) {
        statusCounts.completed++;
      } else if (endDate < today && goal.progress < 100) {
        statusCounts.overdue++;
      } else if (goal.progress > 0) {
        statusCounts.in_progress++;
      } else {
        statusCounts.not_started++;
      }

      // 优先级统计
      priorityCounts[goal.priority] = (priorityCounts[goal.priority] || 0) + 1;

      // 分类统计
      const category = goal.category || '未分类';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, totalProgress: 0, avgProgress: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].totalProgress += goal.progress || 0;

      totalProgress += goal.progress || 0;

      // 即将到期的目标
      const daysUntilDeadline = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline > 0 && daysUntilDeadline <= 7 && goal.progress < 100) {
        upcomingDeadlines.push({
          ...goal,
          daysLeft: daysUntilDeadline
        });
      }
    });

    // 计算分类平均进度
    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].avgProgress = 
        categoryStats[category].count > 0 
          ? categoryStats[category].totalProgress / categoryStats[category].count 
          : 0;
    });

    // 状态分布数据
    const statusDistribution = [
      { name: '已完成', value: statusCounts.completed, color: colors.completed },
      { name: '进行中', value: statusCounts.in_progress, color: colors.inProgress },
      { name: '未开始', value: statusCounts.not_started, color: colors.notStarted },
      { name: '已逾期', value: statusCounts.overdue, color: colors.overdue }
    ].filter(item => item.value > 0);

    // 优先级分布数据
    const priorityDistribution = [
      { name: '高优先级', value: priorityCounts.high, color: colors.high },
      { name: '中优先级', value: priorityCounts.medium, color: colors.medium },
      { name: '低优先级', value: priorityCounts.low, color: colors.low }
    ].filter(item => item.value > 0);

    // 分类数据
    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
      name: category,
      count: stats.count,
      avgProgress: Math.round(stats.avgProgress),
      totalProgress: stats.totalProgress
    }));

    // 进度随时间变化（模拟数据，实际应该从历史记录获取）
    const progressOverTime = generateProgressOverTime(goalsList);

    return {
      statusDistribution,
      priorityDistribution,
      categoryBreakdown,
      progressOverTime,
      completionRate: goalsList.length > 0 ? (statusCounts.completed / goalsList.length * 100).toFixed(1) : 0,
      avgProgress: goalsList.length > 0 ? (totalProgress / goalsList.length).toFixed(1) : 0,
      upcomingDeadlines: upcomingDeadlines.sort((a, b) => a.daysLeft - b.daysLeft)
    };
  };

  const generateProgressOverTime = (goalsList) => {
    // 模拟最近30天的进度数据
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // 模拟进度增长
      const baseProgress = Math.max(0, 100 - i * 2);
      data.push({
        date: dateStr,
        avgProgress: Math.min(100, baseProgress + Math.random() * 10),
        completedGoals: Math.floor(baseProgress / 20)
      });
    }
    return data;
  };

  useEffect(() => {
    loadGoalAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">加载目标分析...</span>
      </div>
    );
  }

  return (
    <div className="goal-analytics space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <span className="text-indigo-600 mr-2">🎯</span>
        目标分析
      </h2>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">总目标数</h3>
          <p className="text-2xl font-bold text-indigo-600">{goals.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">完成率</h3>
          <p className="text-2xl font-bold text-green-600">{analytics.completionRate}%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">平均进度</h3>
          <p className="text-2xl font-bold text-blue-600">{analytics.avgProgress}%</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">即将到期</h3>
          <p className="text-2xl font-bold text-orange-600">{analytics.upcomingDeadlines.length}</p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 状态分布饼图 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            目标状态分布
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 优先级分布 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            优先级分布
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.priorityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {analytics.priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 进度趋势 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📈</span>
            进度趋势
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.progressOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgProgress" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="平均进度"
              />
              <Line 
                type="monotone" 
                dataKey="completedGoals" 
                stroke="#10b981" 
                strokeWidth={2}
                name="完成目标数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 分类统计 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📂</span>
            分类统计
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgProgress" fill="#8b5cf6" name="平均进度%" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 即将到期的目标 */}
      {analytics.upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">⏰</span>
            即将到期的目标
          </h3>
          <div className="space-y-3">
            {analytics.upcomingDeadlines.map((goal, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <div>
                  <h4 className="font-semibold text-gray-800">{goal.name}</h4>
                  <p className="text-sm text-gray-600">进度: {goal.progress}%</p>
                </div>
                <div className="text-right">
                  <span className="text-orange-600 font-semibold">
                    {goal.daysLeft} 天后到期
                  </span>
                  <p className="text-sm text-gray-500">{goal.endDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 目标详情列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📋</span>
          目标详情
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  目标名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  进度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  优先级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  截止日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {goals.slice(0, 10).map((goal, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {goal.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${goal.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{goal.progress || 0}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                      goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {goal.priority === 'high' ? '高' : goal.priority === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {goal.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      goal.progress >= 100 ? 'bg-green-100 text-green-800' :
                      goal.progress > 0 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {goal.progress >= 100 ? '已完成' : goal.progress > 0 ? '进行中' : '未开始'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GoalAnalytics;
