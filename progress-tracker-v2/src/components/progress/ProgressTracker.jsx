import { useState, useEffect } from 'react';
import progressService from '../../services/progressService';
import LoadingSpinner from '../common/LoadingSpinner';
import { showError, showSuccess, withErrorHandling } from '../../utils/errorHandler';

const ProgressTracker = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mainTasks: '',
    challenges: '',
    learnings: '',
    nextDayPlan: '',
    rating: 5
  });
  
  const [recentProgress, setRecentProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 加载最近的进展记录
  const loadRecentProgress = async () => {
    try {
      const progress = await progressService.getProgressList(5);
      setRecentProgress(progress);
    } catch (error) {
      showError(error, '加载进展记录');
    }
  };

  // 加载特定日期的进展记录
  const loadProgressByDate = async (date) => {
    try {
      const progress = await progressService.getProgressByDate(date);
      if (progress) {
        setFormData({
          date: progress.date,
          mainTasks: progress.mainTasks || '',
          challenges: progress.challenges || '',
          learnings: progress.learnings || '',
          nextDayPlan: progress.nextDayPlan || '',
          rating: progress.rating || 5
        });
      } else {
        // 重置表单为新记录
        setFormData({
          date,
          mainTasks: '',
          challenges: '',
          learnings: '',
          nextDayPlan: '',
          rating: 5
        });
      }
    } catch (error) {
      showError(error, '加载进展记录');
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理日期变化
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFormData(prev => ({ ...prev, date: newDate }));
    loadProgressByDate(newDate);
  };

  // 保存进展记录
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.date) {
      showError(new Error('请选择日期'), '表单验证');
      return;
    }

    setLoading(true);
    try {
      const result = await withErrorHandling(
        () => progressService.saveProgress(formData),
        '保存进展记录',
        result.message
      );

      // 重新加载最近记录
      await loadRecentProgress();

      // 清空表单（除了日期）
      setFormData(prev => ({
        ...prev,
        mainTasks: '',
        challenges: '',
        learnings: '',
        nextDayPlan: '',
        rating: 5
      }));

      setMessage('');
    } catch (error) {
      // 错误已经在 withErrorHandling 中处理了
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadRecentProgress();
    loadProgressByDate(formData.date);
  }, []);

  return (
    <div className="progress-tracker">
      {/* 今日进展记录表单 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <span className="text-indigo-600 mr-2">📅</span>
          今日进展记录
        </h2>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">日期</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleDateChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">今日完成的主要任务</label>
            <textarea
              name="mainTasks"
              value={formData.mainTasks}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="列出今天完成的主要任务..."
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">遇到的问题和挑战</label>
            <textarea
              name="challenges"
              value={formData.challenges}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="描述今天遇到的问题和挑战..."
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">学到的经验或新知识</label>
            <textarea
              name="learnings"
              value={formData.learnings}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="记录今天学到的经验或新知识..."
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">明日计划</label>
            <textarea
              name="nextDayPlan"
              value={formData.nextDayPlan}
              onChange={handleInputChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="计划明天要完成的任务..."
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">今日进展评分 (1-10分)</label>
            <input
              type="range"
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (很差)</span>
              <span className="font-medium">{formData.rating}</span>
              <span>10 (很好)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md transition duration-300 flex items-center"
          >
            <span className="mr-2">💾</span>
            {loading ? '保存中...' : '保存今日进展'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('成功') || message.includes('已保存') || message.includes('已更新')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* 最近进展记录 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <span className="text-indigo-600 mr-2">📊</span>
          最近进展记录
        </h2>
        
        {loading ? (
          <LoadingSpinner text="加载进展记录..." />
        ) : (
          <div className="space-y-4">
            {recentProgress.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无进展记录</p>
            ) : (
            recentProgress.map((progress) => (
              <div
                key={progress.date}
                className="border-l-4 border-indigo-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{progress.date}</h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                    {progress.rating}/10
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  {progress.mainTasks || '无主要任务记录'}
                </p>
                {progress.challenges && (
                  <p className="text-gray-500 text-sm mt-1">
                    <strong>挑战:</strong> {progress.challenges}
                  </p>
                )}
              </div>
            ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;
