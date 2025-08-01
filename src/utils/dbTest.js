// IndexedDB 验证测试
import Dexie from 'dexie'

// 创建测试数据库
const testDB = new Dexie('ProgressTrackerTestDB')

testDB.version(1).stores({
  testProgress: 'date, mainTasks, rating'
})

export const testIndexedDBFunctionality = async () => {
  const results = []
  
  try {
    // 1. 测试数据库打开
    await testDB.open()
    results.push('✅ Dexie 数据库打开成功')
    
    // 2. 测试添加数据
    const testData = {
      date: '2025-07-28-test',
      mainTasks: '测试 IndexedDB 功能',
      rating: 9
    }
    
    await testDB.testProgress.add(testData)
    results.push('✅ 数据添加成功')
    
    // 3. 测试读取数据
    const retrieved = await testDB.testProgress.get('2025-07-28-test')
    if (retrieved && retrieved.mainTasks === testData.mainTasks) {
      results.push('✅ 数据读取成功')
    } else {
      results.push('❌ 数据读取失败')
    }
    
    // 4. 测试更新数据
    await testDB.testProgress.update('2025-07-28-test', { rating: 10 })
    const updated = await testDB.testProgress.get('2025-07-28-test')
    if (updated && updated.rating === 10) {
      results.push('✅ 数据更新成功')
    } else {
      results.push('❌ 数据更新失败')
    }
    
    // 5. 测试删除数据
    await testDB.testProgress.delete('2025-07-28-test')
    const deleted = await testDB.testProgress.get('2025-07-28-test')
    if (!deleted) {
      results.push('✅ 数据删除成功')
    } else {
      results.push('❌ 数据删除失败')
    }
    
    // 6. 测试批量操作
    const batchData = [
      { date: 'test-1', mainTasks: '批量测试1', rating: 8 },
      { date: 'test-2', mainTasks: '批量测试2', rating: 9 }
    ]
    
    await testDB.testProgress.bulkAdd(batchData)
    const count = await testDB.testProgress.count()
    if (count === 2) {
      results.push('✅ 批量添加成功')
    } else {
      results.push('❌ 批量添加失败')
    }
    
    // 清理测试数据
    await testDB.testProgress.clear()
    results.push('✅ 测试数据清理完成')
    
    // 关闭测试数据库
    testDB.close()
    
    // 删除测试数据库
    await testDB.delete()
    results.push('✅ 测试数据库删除完成')
    
  } catch (error) {
    results.push('❌ IndexedDB 测试失败: ' + error.message)
  }
  
  return results
}
