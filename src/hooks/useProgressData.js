import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { progressService } from '../db/progressService.js'
import { 
  setLoading, 
  setProgressData, 
  addProgress, 
  updateProgress, 
  deleteProgress, 
  setError 
} from '../store/progressSlice.js'

export const useProgressData = () => {
  const dispatch = useDispatch()
  const { data, loading, error } = useSelector(state => state.progress)
  
  // 加载所有进展数据
  const loadProgressData = async () => {
    try {
      dispatch(setLoading(true))
      const progressData = await progressService.getAll()
      dispatch(setProgressData(progressData))
    } catch (error) {
      dispatch(setError(error.message))
    }
  }
  
  // 添加新的进展记录
  const createProgress = async (progressData) => {
    try {
      dispatch(setLoading(true))
      await progressService.add(progressData)
      dispatch(addProgress(progressData))
      return { success: true }
    } catch (error) {
      dispatch(setError(error.message))
      return { success: false, error: error.message }
    }
  }
  
  // 更新进展记录
  const modifyProgress = async (date, progressData) => {
    try {
      dispatch(setLoading(true))
      await progressService.update(date, progressData)
      dispatch(updateProgress({ ...progressData, date }))
      return { success: true }
    } catch (error) {
      dispatch(setError(error.message))
      return { success: false, error: error.message }
    }
  }
  
  // 删除进展记录
  const removeProgress = async (date) => {
    try {
      dispatch(setLoading(true))
      await progressService.delete(date)
      dispatch(deleteProgress(date))
      return { success: true }
    } catch (error) {
      dispatch(setError(error.message))
      return { success: false, error: error.message }
    }
  }
  
  // 获取最近的进展数据
  const getRecentProgress = async (days = 7) => {
    try {
      return await progressService.getRecent(days)
    } catch (error) {
      console.error('Failed to get recent progress:', error)
      return []
    }
  }
  
  // 初始化时加载数据
  useEffect(() => {
    loadProgressData()
  }, [])
  
  return {
    data,
    loading,
    error,
    loadProgressData,
    createProgress,
    modifyProgress,
    removeProgress,
    getRecentProgress
  }
}
