import { db } from './index.js'

export const goalsService = {
  // 获取所有目标
  async getAll() {
    try {
      return await db.goals.orderBy('priority').reverse().toArray()
    } catch (error) {
      console.error('Failed to get goals data:', error)
      throw error
    }
  },

  // 根据ID获取目标
  async getById(id) {
    try {
      return await db.goals.get(id)
    } catch (error) {
      console.error('Failed to get goal by id:', error)
      throw error
    }
  },

  // 添加目标
  async add(goalData) {
    try {
      const now = new Date()
      const data = {
        ...goalData,
        createdAt: now,
        updatedAt: now,
        completed: false,
        progress: goalData.progress || 0
      }
      return await db.goals.add(data)
    } catch (error) {
      console.error('Failed to add goal:', error)
      throw error
    }
  },

  // 更新目标
  async update(id, goalData) {
    try {
      const data = {
        ...goalData,
        id,
        updatedAt: new Date()
      }
      return await db.goals.put(data)
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  },

  // 删除目标
  async delete(id) {
    try {
      return await db.goals.delete(id)
    } catch (error) {
      console.error('Failed to delete goal:', error)
      throw error
    }
  },

  // 获取活跃目标（未完成）
  async getActive() {
    try {
      return await db.goals
        .where('completed')
        .equals(false)
        .toArray()
    } catch (error) {
      console.error('Failed to get active goals:', error)
      throw error
    }
  },

  // 获取已完成目标
  async getCompleted() {
    try {
      return await db.goals
        .where('completed')
        .equals(true)
        .toArray()
    } catch (error) {
      console.error('Failed to get completed goals:', error)
      throw error
    }
  },

  // 更新目标进度
  async updateProgress(id, progress) {
    try {
      const goal = await db.goals.get(id)
      if (!goal) throw new Error('Goal not found')
      
      const completed = progress >= 100
      return await db.goals.update(id, { 
        progress, 
        completed,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to update goal progress:', error)
      throw error
    }
  },

  // 批量添加（用于数据迁移）
  async bulkAdd(goalsArray) {
    try {
      const now = new Date()
      const dataWithTimestamps = goalsArray.map(item => ({
        ...item,
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now,
        completed: item.completed || false,
        progress: item.progress || 0
      }))
      return await db.goals.bulkAdd(dataWithTimestamps)
    } catch (error) {
      console.error('Failed to bulk add goals:', error)
      throw error
    }
  }
}
