import { progressService } from '../db/progressService.js'
import { reflectionService } from '../db/reflectionService.js'
import { goalsService } from '../db/goalsService.js'

// 从 localStorage 迁移数据到 IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    console.log('开始数据迁移...')
    
    // 从 localStorage 读取旧数据
    const oldProgressData = JSON.parse(localStorage.getItem('progressData') || '[]')
    const oldReflectionData = JSON.parse(localStorage.getItem('reflectionData') || '[]')
    const oldGoalsData = JSON.parse(localStorage.getItem('goalsData') || '[]')
    
    let migratedCount = 0
    
    // 迁移进展数据
    if (oldProgressData.length > 0) {
      await progressService.bulkAdd(oldProgressData)
      migratedCount += oldProgressData.length
      console.log(`迁移了 ${oldProgressData.length} 条进展记录`)
    }
    
    // 迁移反思数据
    if (oldReflectionData.length > 0) {
      await reflectionService.bulkAdd(oldReflectionData)
      migratedCount += oldReflectionData.length
      console.log(`迁移了 ${oldReflectionData.length} 条反思记录`)
    }
    
    // 迁移目标数据
    if (oldGoalsData.length > 0) {
      await goalsService.bulkAdd(oldGoalsData)
      migratedCount += oldGoalsData.length
      console.log(`迁移了 ${oldGoalsData.length} 条目标记录`)
    }
    
    console.log(`数据迁移完成，共迁移 ${migratedCount} 条记录`)
    
    return { 
      success: true, 
      message: `数据迁移完成，共迁移 ${migratedCount} 条记录`,
      counts: {
        progress: oldProgressData.length,
        reflections: oldReflectionData.length,
        goals: oldGoalsData.length
      }
    }
  } catch (error) {
    console.error('数据迁移失败:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

// 导出数据到 JSON
export const exportToJSON = async () => {
  try {
    const [progressData, reflectionData, goalsData] = await Promise.all([
      progressService.getAll(),
      reflectionService.getAll(),
      goalsService.getAll()
    ])
    
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      data: {
        progress: progressData,
        reflections: reflectionData,
        goals: goalsData
      }
    }
    
    return exportData
  } catch (error) {
    console.error('数据导出失败:', error)
    throw error
  }
}

// 从 JSON 导入数据
export const importFromJSON = async (jsonData) => {
  try {
    const { data } = jsonData
    
    if (data.progress && data.progress.length > 0) {
      await progressService.bulkAdd(data.progress)
    }
    
    if (data.reflections && data.reflections.length > 0) {
      await reflectionService.bulkAdd(data.reflections)
    }
    
    if (data.goals && data.goals.length > 0) {
      await goalsService.bulkAdd(data.goals)
    }
    
    return { success: true, message: '数据导入成功' }
  } catch (error) {
    console.error('数据导入失败:', error)
    return { success: false, error: error.message }
  }
}

// 检查是否有 localStorage 数据需要迁移
export const checkForLegacyData = () => {
  const progressData = localStorage.getItem('progressData')
  const reflectionData = localStorage.getItem('reflectionData')
  const goalsData = localStorage.getItem('goalsData')
  
  return !!(progressData || reflectionData || goalsData)
}
