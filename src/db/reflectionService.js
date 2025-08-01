import { db } from './index.js'

export const reflectionService = {
  // 获取所有反思记录
  async getAll() {
    try {
      return await db.reflections.orderBy('date').reverse().toArray()
    } catch (error) {
      console.error('Failed to get reflection data:', error)
      throw error
    }
  },

  // 根据ID获取反思记录
  async getById(id) {
    try {
      return await db.reflections.get(id)
    } catch (error) {
      console.error('Failed to get reflection by id:', error)
      throw error
    }
  },

  // 添加反思记录
  async add(reflectionData) {
    try {
      const now = new Date()
      const data = {
        ...reflectionData,
        createdAt: now,
        updatedAt: now
      }
      return await db.reflections.add(data)
    } catch (error) {
      console.error('Failed to add reflection:', error)
      throw error
    }
  },

  // 更新反思记录
  async update(id, reflectionData) {
    try {
      const data = {
        ...reflectionData,
        id,
        updatedAt: new Date()
      }
      return await db.reflections.put(data)
    } catch (error) {
      console.error('Failed to update reflection:', error)
      throw error
    }
  },

  // 删除反思记录
  async delete(id) {
    try {
      return await db.reflections.delete(id)
    } catch (error) {
      console.error('Failed to delete reflection:', error)
      throw error
    }
  },

  // 根据日期范围获取反思记录
  async getByDateRange(startDate, endDate) {
    try {
      return await db.reflections
        .where('date')
        .between(startDate, endDate, true, true)
        .reverse()
        .toArray()
    } catch (error) {
      console.error('Failed to get reflections by date range:', error)
      throw error
    }
  },

  // 批量添加（用于数据迁移）
  async bulkAdd(reflectionArray) {
    try {
      const now = new Date()
      const dataWithTimestamps = reflectionArray.map(item => ({
        ...item,
        createdAt: item.createdAt || now,
        updatedAt: item.updatedAt || now
      }))
      return await db.reflections.bulkAdd(dataWithTimestamps)
    } catch (error) {
      console.error('Failed to bulk add reflections:', error)
      throw error
    }
  }
}
