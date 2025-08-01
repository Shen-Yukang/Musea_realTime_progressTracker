import { db } from './index.js'

export const progressService = {
  // 获取所有进展记录
  async getAll() {
    try {
      return await db.progress.orderBy('date').reverse().toArray()
    } catch (error) {
      console.error('Failed to get progress data:', error)
      throw error
    }
  },

  // 根据日期获取进展记录
  async getByDate(date) {
    try {
      return await db.progress.get(date)
    } catch (error) {
      console.error('Failed to get progress by date:', error)
      throw error
    }
  },

  // 添加进展记录
  async add(progressData) {
    try {
      const now = new Date()
      const data = {
        ...progressData,
        createdAt: now,
        updatedAt: now
      }
      return await db.progress.add(data)
    } catch (error) {
      console.error('Failed to add progress:', error)
      throw error
    }
  },

  // 更新进展记录
  async update(date, progressData) {
    try {
      const data = {
        ...progressData,
        date,
        updatedAt: new Date()
      }
      return await db.progress.put(data)
    } catch (error) {
      console.error('Failed to update progress:', error)
      throw error
    }
  },

  // 删除进展记录
  async delete(date) {
    try {
      return await db.progress.delete(date)
    } catch (error) {
      console.error('Failed to delete progress:', error)
      throw error
    }
  },

  // 获取最近N天的进展记录
  async getRecent(days = 7) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      return await db.progress
        .where('date')
        .above(startDate.toISOString().split('T')[0])
        .reverse()
        .toArray()
    } catch (error) {
      console.error('Failed to get recent progress:', error)
      throw error
    }
  },

  // 批量添加（用于数据迁移）
  async bulkAdd(progressArray) {
    try {
      const now = new Date()
      const dataWithTimestamps = progressArray.map(item => ({
        ...item,
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now
      }))
      return await db.progress.bulkAdd(dataWithTimestamps)
    } catch (error) {
      console.error('Failed to bulk add progress:', error)
      throw error
    }
  }
}
