"use client"

import { useState, useEffect, useCallback } from 'react'
import { dashboardDataService, DashboardTask, DashboardMetrics, ActivityItem } from '@/lib/dashboard-data-service'

export function useDashboardData() {
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      await dashboardDataService.initializeData()
      
      const loadedTasks = dashboardDataService.getTasks()
      const loadedActivities = dashboardDataService.getActivities()
      const loadedMetrics = dashboardDataService.getMetrics()
      
      setTasks(loadedTasks)
      setActivities(loadedActivities)
      setMetrics(loadedMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addTask = useCallback((task: Omit<DashboardTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = dashboardDataService.addTask(task)
      setTasks(prev => [newTask, ...prev])
      setMetrics(dashboardDataService.getMetrics())
      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task')
      throw err
    }
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<DashboardTask>) => {
    try {
      const updatedTask = dashboardDataService.updateTask(id, updates)
      if (updatedTask) {
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
        setMetrics(dashboardDataService.getMetrics())
      }
      return updatedTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  const deleteTask = useCallback((id: string) => {
    try {
      const success = dashboardDataService.deleteTask(id)
      if (success) {
        setTasks(prev => prev.filter(t => t.id !== id))
        setMetrics(dashboardDataService.getMetrics())
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }, [])

  const refreshData = useCallback(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    tasks,
    activities,
    metrics,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refreshData
  }
}
