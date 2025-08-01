import Dexie from 'dexie'

export const db = new Dexie('ProgressTrackerDB')

// 定义数据库结构
db.version(1).stores({
  progress: 'date, mainTasks, challenges, learnings, nextDayPlan, rating, createdAt, updatedAt',
  reflections: '++id, date, content, adjustments, createdAt, updatedAt',
  goals: '++id, name, description, startDate, endDate, priority, progress, completed, createdAt, updatedAt',
  settings: 'key, value'
})

// 数据库初始化和错误处理
db.open().catch(err => {
  console.error('Failed to open database:', err)
})

// 数据库事件监听
db.on('ready', () => {
  console.log('Database is ready')
})

db.on('error', (err) => {
  console.error('Database error:', err)
})

export default db
