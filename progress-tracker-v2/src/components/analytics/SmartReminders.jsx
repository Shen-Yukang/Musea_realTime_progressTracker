import { useState, useEffect } from 'react';
import progressService from '../../services/progressService';
import reflectionService from '../../services/reflectionService';
import goalService from '../../services/goalService';
import { showError, showSuccess } from '../../utils/errorHandler';

const SmartReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedReminders, setDismissedReminders] = useState(new Set());

  // 生成智能提醒
  const generateSmartReminders = async () => {
    setLoading(true);
    try {
      const [progressList, goals, reflections] = await Promise.all([
        progressService.getProgressList(7), // 最近7天
        goalService.getAllGoals(),
        reflectionService.getReflections ? reflectionService.getReflections({ limit: 7 }) : Promise.resolve({ reflections: [] })
      ]);

      const reminders = [];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // 1. 检查今日是否记录进展
      const todayProgress = progressList.find(p => p.date === todayStr);
      if (!todayProgress) {
        reminders.push({
          id: 'daily-progress',
          type: 'progress',
          priority: 'high',
          title: '记录今日进展',
          message: '您今天还没有记录进展，花几分钟总结一下今天的学习成果吧！',
          action: '立即记录',
          icon: '📝',
          color: 'blue'
        });
      }

      // 2. 检查今日是否写反思
      const todayReflection = reflections.reflections?.find(r => r.date === todayStr);
      if (!todayReflection) {
        reminders.push({
          id: 'daily-reflection',
          type: 'reflection',
          priority: 'medium',
          title: '今日反思提醒',
          message: '反思是成长的关键，记录一下今天的学习心得和感悟吧！',
          action: '写反思',
          icon: '💭',
          color: 'purple'
        });
      }

      // 3. 检查连续记录天数
      const consecutiveDays = calculateConsecutiveDays(progressList);
      if (consecutiveDays >= 7) {
        reminders.push({
          id: 'streak-celebration',
          type: 'achievement',
          priority: 'low',
          title: '连续记录成就',
          message: `太棒了！您已经连续记录了 ${consecutiveDays} 天，保持这个好习惯！`,
          action: '查看统计',
          icon: '🔥',
          color: 'orange'
        });
      } else if (consecutiveDays === 0 && progressList.length > 0) {
        reminders.push({
          id: 'streak-broken',
          type: 'motivation',
          priority: 'medium',
          title: '重新开始',
          message: '记录习惯中断了，没关系！重新开始，每一天都是新的机会。',
          action: '重新开始',
          icon: '🌟',
          color: 'green'
        });
      }

      // 4. 检查即将到期的目标
      const upcomingGoals = goals.filter(goal => {
        const endDate = new Date(goal.endDate);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 3 && goal.progress < 100;
      });

      upcomingGoals.forEach(goal => {
        const endDate = new Date(goal.endDate);
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        reminders.push({
          id: `goal-deadline-${goal.id}`,
          type: 'deadline',
          priority: 'high',
          title: '目标即将到期',
          message: `目标"${goal.name}"还有 ${daysLeft} 天到期，当前进度 ${goal.progress}%`,
          action: '查看目标',
          icon: '⏰',
          color: 'red',
          goalId: goal.id
        });
      });

      // 5. 检查低评分提醒
      const recentLowRatings = progressList.filter(p => p.rating && p.rating < 6);
      if (recentLowRatings.length >= 3) {
        reminders.push({
          id: 'low-ratings',
          type: 'improvement',
          priority: 'medium',
          title: '学习状态提醒',
          message: '最近几天的评分偏低，建议调整学习方法或休息一下。',
          action: '查看分析',
          icon: '📊',
          color: 'yellow'
        });
      }

      // 6. 检查长时间未设置目标
      if (goals.length === 0) {
        reminders.push({
          id: 'no-goals',
          type: 'suggestion',
          priority: 'medium',
          title: '设置学习目标',
          message: '设置明确的学习目标可以帮助您更好地规划和跟踪进展。',
          action: '设置目标',
          icon: '🎯',
          color: 'indigo'
        });
      }

      // 7. 检查高效学习提醒
      const highRatingDays = progressList.filter(p => p.rating && p.rating >= 8).length;
      if (highRatingDays >= 5) {
        reminders.push({
          id: 'high-performance',
          type: 'achievement',
          priority: 'low',
          title: '学习状态优秀',
          message: `您最近有 ${highRatingDays} 天的评分达到8分以上，学习状态很棒！`,
          action: '保持状态',
          icon: '⭐',
          color: 'green'
        });
      }

      // 8. 周末总结提醒
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 周末
        reminders.push({
          id: 'weekend-summary',
          type: 'reflection',
          priority: 'low',
          title: '周末总结',
          message: '周末是回顾本周学习成果的好时机，写一份周总结吧！',
          action: '写总结',
          icon: '📋',
          color: 'blue'
        });
      }

      // 按优先级排序
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      reminders.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      setReminders(reminders);
    } catch (error) {
      showError(error, '生成智能提醒');
    } finally {
      setLoading(false);
    }
  };

  // 计算连续记录天数
  const calculateConsecutiveDays = (progressList) => {
    if (progressList.length === 0) return 0;

    const sortedProgress = progressList.sort((a, b) => new Date(b.date) - new Date(a.date));
    let consecutiveDays = 0;
    const today = new Date();

    for (let i = 0; i < sortedProgress.length; i++) {
      const progressDate = new Date(sortedProgress[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (progressDate.toDateString() === expectedDate.toDateString()) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  };

  // 处理提醒操作
  const handleReminderAction = (reminder) => {
    switch (reminder.type) {
      case 'progress':
        // 跳转到进展记录页面
        showSuccess('正在跳转到进展记录页面...');
        break;
      case 'reflection':
        // 跳转到反思页面
        showSuccess('正在跳转到反思页面...');
        break;
      case 'deadline':
        // 跳转到目标详情
        showSuccess('正在跳转到目标详情...');
        break;
      case 'improvement':
        // 跳转到分析页面
        showSuccess('正在跳转到数据分析页面...');
        break;
      case 'suggestion':
        // 跳转到目标设置
        showSuccess('正在跳转到目标设置页面...');
        break;
      default:
        showSuccess('操作已记录');
    }
  };

  // 忽略提醒
  const dismissReminder = (reminderId) => {
    setDismissedReminders(prev => new Set([...prev, reminderId]));
  };

  // 获取提醒颜色样式
  const getReminderStyle = (color, priority) => {
    const baseStyles = 'border-l-4 rounded-lg p-4 mb-4 shadow-sm';
    const colorStyles = {
      blue: 'bg-blue-50 border-blue-400 text-blue-800',
      purple: 'bg-purple-50 border-purple-400 text-purple-800',
      orange: 'bg-orange-50 border-orange-400 text-orange-800',
      green: 'bg-green-50 border-green-400 text-green-800',
      red: 'bg-red-50 border-red-400 text-red-800',
      yellow: 'bg-yellow-50 border-yellow-400 text-yellow-800',
      indigo: 'bg-indigo-50 border-indigo-400 text-indigo-800'
    };

    const priorityStyles = {
      high: 'ring-2 ring-opacity-50',
      medium: 'ring-1 ring-opacity-30',
      low: ''
    };

    return `${baseStyles} ${colorStyles[color]} ${priorityStyles[priority]}`;
  };

  useEffect(() => {
    generateSmartReminders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">生成智能提醒...</span>
      </div>
    );
  }

  const visibleReminders = reminders.filter(r => !dismissedReminders.has(r.id));

  return (
    <div className="smart-reminders">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="text-yellow-500 mr-2">💡</span>
          智能提醒
        </h2>
        <button
          onClick={generateSmartReminders}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 text-sm"
        >
          刷新提醒
        </button>
      </div>

      {visibleReminders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">太棒了！</h3>
          <p className="text-gray-600">目前没有需要关注的提醒，继续保持良好的学习习惯！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleReminders.map((reminder) => (
            <div key={reminder.id} className={getReminderStyle(reminder.color, reminder.priority)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{reminder.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{reminder.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reminder.priority === 'high' ? 'bg-red-100 text-red-700' :
                        reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {reminder.priority === 'high' ? '高优先级' : 
                         reminder.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{reminder.message}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReminderAction(reminder)}
                        className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded text-sm hover:bg-gray-50 transition duration-200"
                      >
                        {reminder.action}
                      </button>
                      <button
                        onClick={() => dismissReminder(reminder.id)}
                        className="px-3 py-1 text-gray-500 text-sm hover:text-gray-700 transition duration-200"
                      >
                        忽略
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提醒统计 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">提醒统计</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {reminders.filter(r => r.priority === 'high').length}
            </div>
            <div className="text-xs text-gray-600">高优先级</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {reminders.filter(r => r.priority === 'medium').length}
            </div>
            <div className="text-xs text-gray-600">中优先级</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">
              {reminders.filter(r => r.priority === 'low').length}
            </div>
            <div className="text-xs text-gray-600">低优先级</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartReminders;
