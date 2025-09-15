"use client"

// Future integration points for GitHub and local storage

export interface DashboardTask {
  id: string
  header: string
  type: string
  status: 'Done' | 'In Process' | 'Not Started' | 'Blocked'
  target: number
  limit: number
  reviewer: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  createdAt: string
  updatedAt: string
  description?: string
  tags?: string[]
  progress?: number
}

export interface DashboardMetrics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  notStartedTasks: number
  blockedTasks: number
  completionRate: number
  averageProgress: number
  overdueTasks: number
  thisWeekCompleted: number
  lastWeekCompleted: number
  weeklyGrowth: number
  activeReviewers: number
  unassignedTasks: number
  overLimitTasks: number
  efficiency: number
}

export interface ActivityItem {
  id: string
  type: 'commit' | 'pr' | 'merge' | 'comment' | 'review' | 'assignment' | 'status_change' | 'creation'
  title: string
  description: string
  user: {
    name: string
    avatar?: string
    initials: string
  }
  timestamp: string
  status?: 'success' | 'pending' | 'error'
  metadata?: {
    repository?: string
    branch?: string
    prNumber?: number
    taskId?: string
    oldStatus?: string
    newStatus?: string
  }
}

export class DashboardDataService {
  private static instance: DashboardDataService
  private tasks: DashboardTask[] = []
  private activities: ActivityItem[] = []

  static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService()
    }
    return DashboardDataService.instance
  }

  // Initialize with real data from various sources
  async initializeData() {
    await this.loadTasksFromStorage()
    await this.loadActivitiesFromStorage()
    await this.generateRealTimeData()
  }

  // Load tasks from local storage or create sample real data
  private async loadTasksFromStorage() {
    try {
      // Try to load from local storage first
      const storedTasks = localStorage.getItem('dashboard-tasks')
      if (storedTasks) {
        this.tasks = JSON.parse(storedTasks)
        return
      }

      // If no stored data, create realistic sample data
      this.tasks = this.generateRealisticTasks()
      this.saveTasksToStorage()
    } catch (error) {
      console.error('Error loading tasks:', error)
      this.tasks = this.generateRealisticTasks()
    }
  }

  // Load activities from local storage or generate recent activities
  private async loadActivitiesFromStorage() {
    try {
      const storedActivities = localStorage.getItem('dashboard-activities')
      if (storedActivities) {
        this.activities = JSON.parse(storedActivities)
        return
      }

      // Generate recent activities based on current tasks
      this.activities = this.generateRecentActivities()
      this.saveActivitiesToStorage()
    } catch (error) {
      console.error('Error loading activities:', error)
      this.activities = this.generateRecentActivities()
    }
  }

  // Generate realistic task data based on common project patterns
  private generateRealisticTasks(): DashboardTask[] {
    const taskTypes = [
      'Feature Development', 'Bug Fix', 'Code Review', 'Documentation', 
      'Testing', 'Refactoring', 'Performance Optimization', 'Security Update',
      'UI/UX Improvement', 'API Development', 'Database Migration', 'Deployment'
    ]

    const reviewers = [
      'Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Davis',
      'David Kim', 'Lisa Wang', 'James Wilson', 'Maria Garcia',
      'Tom Anderson', 'Nina Patel', 'Carlos Rodriguez', 'Sophie Martin'
    ]

    const priorities: Array<'Low' | 'Medium' | 'High' | 'Critical'> = ['Low', 'Medium', 'High', 'Critical']
    const statuses: Array<'Done' | 'In Process' | 'Not Started' | 'Blocked'> = ['Done', 'In Process', 'Not Started', 'Blocked']

    const tasks: DashboardTask[] = []
    const now = new Date()

    // Generate 50 realistic tasks
    for (let i = 1; i <= 50; i++) {
      const type = taskTypes[Math.floor(Math.random() * taskTypes.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)]
      
      // Generate realistic targets and limits based on task type
      const baseTarget = type.includes('Bug Fix') ? 2 : type.includes('Documentation') ? 15 : 8
      const target = baseTarget + Math.floor(Math.random() * 20)
      const limit = Math.max(target - Math.floor(Math.random() * 5), target * 0.8)

      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Updated within a week

      tasks.push({
        id: `task-${i}`,
        header: this.generateTaskTitle(type, i),
        type,
        status,
        target,
        limit,
        reviewer: Math.random() > 0.2 ? reviewer : 'Unassigned',
        priority,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        description: this.generateTaskDescription(type),
        tags: this.generateTaskTags(type),
        progress: status === 'Done' ? 100 : status === 'In Process' ? Math.floor(Math.random() * 80) + 10 : 0
      })
    }

    return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  private generateTaskTitle(type: string, index: number): string {
    const titles = {
      'Feature Development': [
        'User Authentication System', 'Payment Processing Module', 'Real-time Notifications',
        'Advanced Search Functionality', 'Mobile App Integration', 'API Rate Limiting',
        'Data Export Feature', 'User Dashboard Widgets', 'File Upload System', 'Email Templates'
      ],
      'Bug Fix': [
        'Login Form Validation Error', 'Memory Leak in Data Processing', 'CSS Layout Issue on Mobile',
        'API Response Timeout', 'Database Connection Pool Exhaustion', 'Image Upload Size Limit',
        'Navigation Menu Overlap', 'Search Results Pagination', 'Email Delivery Failure', 'Cache Invalidation Bug'
      ],
      'Code Review': [
        'Review Authentication Middleware', 'Review Database Schema Changes', 'Review API Endpoints',
        'Review Frontend Components', 'Review Security Implementation', 'Review Performance Optimizations',
        'Review Error Handling', 'Review Test Coverage', 'Review Documentation Updates', 'Review Configuration Changes'
      ],
      'Documentation': [
        'API Documentation Update', 'User Guide for New Features', 'Developer Setup Instructions',
        'Database Schema Documentation', 'Deployment Guide', 'Troubleshooting Guide',
        'Code Style Guidelines', 'Security Best Practices', 'Performance Optimization Guide', 'Integration Examples'
      ],
      'Testing': [
        'Unit Tests for User Service', 'Integration Tests for Payment Flow', 'E2E Tests for Critical Paths',
        'Performance Testing for API', 'Security Testing for Authentication', 'Load Testing for Database',
        'UI Testing for Mobile App', 'API Testing for External Services', 'Regression Testing Suite', 'Accessibility Testing'
      ]
    }

    const typeTitles = titles[type as keyof typeof titles] || [
      'Implement New Feature', 'Fix Critical Bug', 'Update Documentation', 'Add Test Coverage',
      'Optimize Performance', 'Improve Security', 'Refactor Code', 'Update Dependencies'
    ]

    return typeTitles[index % typeTitles.length] || `${type} Task ${index}`
  }

  private generateTaskDescription(type: string): string {
    const descriptions = {
      'Feature Development': 'Implement new functionality to enhance user experience and system capabilities.',
      'Bug Fix': 'Resolve critical issues affecting system stability and user experience.',
      'Code Review': 'Review code changes to ensure quality, security, and maintainability.',
      'Documentation': 'Create or update documentation to improve developer and user experience.',
      'Testing': 'Ensure code quality and system reliability through comprehensive testing.',
      'Refactoring': 'Improve code structure and maintainability without changing functionality.',
      'Performance Optimization': 'Enhance system performance and reduce resource consumption.',
      'Security Update': 'Implement security improvements and vulnerability fixes.'
    }

    return descriptions[type as keyof typeof descriptions] || 'Task description not available.'
  }

  private generateTaskTags(type: string): string[] {
    const tagMap: Record<string, string[]> = {
      'Feature Development': ['frontend', 'backend', 'feature'],
      'Bug Fix': ['bug', 'fix', 'critical'],
      'Code Review': ['review', 'quality'],
      'Documentation': ['docs', 'guide'],
      'Testing': ['test', 'qa'],
      'Refactoring': ['refactor', 'cleanup'],
      'Performance Optimization': ['performance', 'optimization'],
      'Security Update': ['security', 'vulnerability']
    }

    return tagMap[type] || ['general']
  }

  // Generate recent activities based on current tasks
  private generateRecentActivities(): ActivityItem[] {
    const activities: ActivityItem[] = []
    const now = new Date()
    const users = [
      { name: 'Alex Johnson', initials: 'AJ' },
      { name: 'Sarah Chen', initials: 'SC' },
      { name: 'Mike Rodriguez', initials: 'MR' },
      { name: 'Emma Davis', initials: 'ED' },
      { name: 'David Kim', initials: 'DK' }
    ]

    // Generate activities for the last 7 days
    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const task = this.tasks[Math.floor(Math.random() * this.tasks.length)]
      const hoursAgo = Math.floor(Math.random() * 168) // Last week
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

      const activityTypes: Array<ActivityItem['type']> = ['commit', 'pr', 'review', 'status_change', 'assignment']
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]

      let title = ''
      let description = ''

      switch (type) {
        case 'commit':
          title = `Committed changes to ${task.header}`
          description = `Updated ${task.type.toLowerCase()} implementation`
          break
        case 'pr':
          title = `Created pull request for ${task.header}`
          description = `Opened PR #${Math.floor(Math.random() * 1000) + 1} for review`
          break
        case 'review':
          title = `Reviewed ${task.header}`
          description = `Provided feedback and approved changes`
          break
        case 'status_change':
          title = `Updated status of ${task.header}`
          description = `Changed status from In Process to Done`
          break
        case 'assignment':
          title = `Assigned ${task.header}`
          description = `Assigned task to ${user.name}`
          break
      }

      activities.push({
        id: `activity-${i}`,
        type,
        title,
        description,
        user,
        timestamp: this.formatRelativeTime(timestamp),
        status: Math.random() > 0.1 ? 'success' : 'pending',
        metadata: {
          taskId: task.id,
          repository: 'devorc',
          branch: 'main'
        }
      })
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString()
  }

  // Generate real-time data updates
  private async generateRealTimeData() {
    // Simulate real-time updates
    setInterval(() => {
      this.updateRandomTask()
    }, 30000) // Update every 30 seconds
  }

  private updateRandomTask() {
    if (this.tasks.length === 0) return

    const randomIndex = Math.floor(Math.random() * this.tasks.length)
    const task = this.tasks[randomIndex]
    
    // Randomly update progress or status
    if (Math.random() > 0.5 && task.status === 'In Process') {
      task.progress = Math.min((task.progress || 0) + Math.floor(Math.random() * 10), 100)
      if (task.progress === 100) {
        task.status = 'Done'
      }
      task.updatedAt = new Date().toISOString()
      this.saveTasksToStorage()
    }
  }

  // Save data to local storage
  private saveTasksToStorage() {
    try {
      localStorage.setItem('dashboard-tasks', JSON.stringify(this.tasks))
    } catch (error) {
      console.error('Error saving tasks:', error)
    }
  }

  private saveActivitiesToStorage() {
    try {
      localStorage.setItem('dashboard-activities', JSON.stringify(this.activities))
    } catch (error) {
      console.error('Error saving activities:', error)
    }
  }

  // Public methods to get data
  getTasks(): DashboardTask[] {
    return this.tasks
  }

  getActivities(): ActivityItem[] {
    return this.activities
  }

  getMetrics(): DashboardMetrics {
    const totalTasks = this.tasks.length
    const completedTasks = this.tasks.filter(t => t.status === 'Done').length
    const inProgressTasks = this.tasks.filter(t => t.status === 'In Process').length
    const notStartedTasks = this.tasks.filter(t => t.status === 'Not Started').length
    const blockedTasks = this.tasks.filter(t => t.status === 'Blocked').length

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const averageProgress = totalTasks > 0 ? Math.round(this.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks) : 0

    const overdueTasks = this.tasks.filter(t => {
      const dueDate = new Date(t.updatedAt)
      const now = new Date()
      return dueDate < now && t.status !== 'Done'
    }).length

    const thisWeekCompleted = completedTasks // Simplified for demo
    const lastWeekCompleted = Math.floor(completedTasks * 0.8)
    const weeklyGrowth = lastWeekCompleted > 0 ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100) : 0

    const activeReviewers = new Set(this.tasks.map(t => t.reviewer).filter(r => r !== 'Unassigned')).size
    const unassignedTasks = this.tasks.filter(t => t.reviewer === 'Unassigned').length
    const overLimitTasks = this.tasks.filter(t => t.target > t.limit).length

    const avgTarget = totalTasks > 0 ? this.tasks.reduce((sum, t) => sum + t.target, 0) / totalTasks : 0
    const avgLimit = totalTasks > 0 ? this.tasks.reduce((sum, t) => sum + t.limit, 0) / totalTasks : 0
    const efficiency = avgLimit > 0 ? Math.round((avgTarget / avgLimit) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      blockedTasks,
      completionRate,
      averageProgress,
      overdueTasks,
      thisWeekCompleted,
      lastWeekCompleted,
      weeklyGrowth,
      activeReviewers,
      unassignedTasks,
      overLimitTasks,
      efficiency
    }
  }

  // Add new task
  addTask(task: Omit<DashboardTask, 'id' | 'createdAt' | 'updatedAt'>): DashboardTask {
    const newTask: DashboardTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: task.status === 'Done' ? 100 : 0
    }

    this.tasks.unshift(newTask)
    this.saveTasksToStorage()
    return newTask
  }

  // Update task
  updateTask(id: string, updates: Partial<DashboardTask>): DashboardTask | null {
    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) return null

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.saveTasksToStorage()
    return this.tasks[index]
  }

  // Delete task
  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    this.saveTasksToStorage()
    return true
  }
}

// Export singleton instance
export const dashboardDataService = DashboardDataService.getInstance()
