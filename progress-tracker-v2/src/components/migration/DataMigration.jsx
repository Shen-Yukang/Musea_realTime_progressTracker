import { useState, useEffect } from 'react';
import dataMigrationService from '../../utils/dataMigration';

const DataMigration = ({ onComplete }) => {
  const [localDataInfo, setLocalDataInfo] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle, checking, migrating, completed, error
  const [migrationProgress, setMigrationProgress] = useState({});
  const [migrationResults, setMigrationResults] = useState(null);
  const [error, setError] = useState(null);

  // 检查本地数据
  useEffect(() => {
    checkLocalData();
  }, []);

  const checkLocalData = async () => {
    setMigrationStatus('checking');
    try {
      const dataInfo = await dataMigrationService.checkLocalData();
      setLocalDataInfo(dataInfo);
      setMigrationStatus('idle');
    } catch (error) {
      setError('检查本地数据失败: ' + error.message);
      setMigrationStatus('error');
    }
  };

  const handleExportData = async () => {
    try {
      const result = await dataMigrationService.exportLocalData();
      if (result.success) {
        alert('数据导出成功！备份文件已下载。');
      } else {
        alert('数据导出失败: ' + result.message);
      }
    } catch (error) {
      alert('数据导出失败: ' + error.message);
    }
  };

  const handleMigration = async () => {
    setMigrationStatus('migrating');
    setError(null);
    dataMigrationService.resetMigrationStatus();

    try {
      const results = await dataMigrationService.migrateAllData((type, progress) => {
        setMigrationProgress(prev => ({
          ...prev,
          [type]: progress
        }));
      });

      setMigrationResults(results);
      
      if (results.success && results.summary.totalErrors === 0) {
        setMigrationStatus('completed');
        // 询问是否清理本地数据
        if (window.confirm('迁移成功！是否清理本地 IndexedDB 数据？')) {
          await dataMigrationService.cleanupLocalData();
        }
        if (onComplete) onComplete();
      } else {
        setMigrationStatus('completed');
      }
    } catch (error) {
      setError('迁移失败: ' + error.message);
      setMigrationStatus('error');
    }
  };

  const handleSkipMigration = () => {
    if (window.confirm('确定跳过数据迁移吗？本地数据将不会同步到服务器。')) {
      if (onComplete) onComplete();
    }
  };

  if (migrationStatus === 'checking') {
    return (
      <div className="migration-container">
        <div className="migration-card">
          <h2>🔍 检查本地数据...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!localDataInfo?.hasData) {
    return (
      <div className="migration-container">
        <div className="migration-card">
          <h2>✅ 无需迁移</h2>
          <p>未发现本地数据，可以直接开始使用云端同步功能。</p>
          <button onClick={onComplete} className="btn-primary">
            开始使用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-container">
      <div className="migration-card">
        <h2>📦 数据迁移向导</h2>
        
        {migrationStatus === 'idle' && (
          <>
            <div className="data-summary">
              <h3>发现本地数据：</h3>
              <ul>
                <li>进展记录: {localDataInfo.counts.progress} 条</li>
                <li>反思记录: {localDataInfo.counts.reflections} 条</li>
                <li>目标记录: {localDataInfo.counts.goals} 条</li>
              </ul>
            </div>

            <div className="migration-options">
              <p>我们发现您有本地数据，建议迁移到云端以便在多设备间同步。</p>
              
              <div className="button-group">
                <button onClick={handleExportData} className="btn-secondary">
                  📥 导出备份
                </button>
                <button onClick={handleMigration} className="btn-primary">
                  🚀 开始迁移
                </button>
                <button onClick={handleSkipMigration} className="btn-outline">
                  ⏭️ 跳过迁移
                </button>
              </div>
            </div>
          </>
        )}

        {migrationStatus === 'migrating' && (
          <div className="migration-progress">
            <h3>🔄 正在迁移数据...</h3>
            
            {Object.entries(migrationProgress).map(([type, progress]) => (
              <div key={type} className="progress-item">
                <div className="progress-header">
                  <span>{type === 'progress' ? '进展记录' : type === 'reflections' ? '反思记录' : '目标记录'}</span>
                  <span>{progress.migrated}/{progress.total}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress.total > 0 ? (progress.migrated / progress.total) * 100 : 0}%` }}
                  ></div>
                </div>
                {progress.errors.length > 0 && (
                  <div className="progress-errors">
                    ⚠️ {progress.errors.length} 个错误
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {migrationStatus === 'completed' && migrationResults && (
          <div className="migration-results">
            <h3>✅ 迁移完成</h3>
            
            <div className="results-summary">
              <div className="summary-item">
                <span>总计项目:</span>
                <span>{migrationResults.summary.totalItems}</span>
              </div>
              <div className="summary-item">
                <span>成功迁移:</span>
                <span>{migrationResults.summary.totalMigrated}</span>
              </div>
              <div className="summary-item">
                <span>失败项目:</span>
                <span>{migrationResults.summary.totalErrors}</span>
              </div>
              <div className="summary-item">
                <span>成功率:</span>
                <span>{migrationResults.summary.successRate}%</span>
              </div>
            </div>

            {migrationResults.summary.totalErrors > 0 && (
              <div className="error-details">
                <h4>⚠️ 迁移错误详情:</h4>
                {Object.entries(migrationResults.details).map(([type, result]) => 
                  result.errors.length > 0 && (
                    <div key={type} className="error-group">
                      <h5>{type === 'progress' ? '进展记录' : type === 'reflections' ? '反思记录' : '目标记录'}:</h5>
                      {result.errors.slice(0, 3).map((error, index) => (
                        <div key={index} className="error-item">
                          {error.error}
                        </div>
                      ))}
                      {result.errors.length > 3 && (
                        <div className="error-more">
                          还有 {result.errors.length - 3} 个错误...
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            <button onClick={onComplete} className="btn-primary">
              开始使用
            </button>
          </div>
        )}

        {migrationStatus === 'error' && (
          <div className="migration-error">
            <h3>❌ 迁移失败</h3>
            <p>{error}</p>
            <div className="button-group">
              <button onClick={handleMigration} className="btn-primary">
                重试迁移
              </button>
              <button onClick={handleSkipMigration} className="btn-outline">
                跳过迁移
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .migration-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .migration-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .migration-card h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }

        .data-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .data-summary ul {
          list-style: none;
          padding: 0;
        }

        .data-summary li {
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .button-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary, .btn-outline {
          padding: 12px 24px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a6fd8;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-outline {
          background: transparent;
          color: #6c757d;
          border: 1px solid #6c757d;
        }

        .progress-item {
          margin-bottom: 20px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .progress-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #667eea;
          transition: width 0.3s;
        }

        .progress-errors {
          color: #dc3545;
          font-size: 14px;
          margin-top: 4px;
        }

        .results-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .error-details {
          background: #fff3cd;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .error-group {
          margin-bottom: 15px;
        }

        .error-item {
          background: #f8d7da;
          padding: 8px;
          border-radius: 4px;
          margin: 4px 0;
          font-size: 14px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DataMigration;
