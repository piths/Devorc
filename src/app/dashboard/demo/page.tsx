"use client"

import { useDashboardData } from "@/hooks/useDashboardData"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Plus, Trash2, Edit } from "lucide-react"

export default function DashboardDemo() {
  const { tasks, activities, metrics, loading, error, addTask, updateTask, deleteTask, refreshData } = useDashboardData()

  const handleAddTask = () => {
    const newTask = {
      header: `New Task ${Date.now()}`,
      type: 'Feature Development',
      status: 'Not Started' as const,
      target: Math.floor(Math.random() * 20) + 5,
      limit: Math.floor(Math.random() * 15) + 10,
      reviewer: 'Unassigned',
      priority: 'Medium' as const,
      description: 'A new task created for demonstration',
      tags: ['demo', 'feature']
    }
    addTask(newTask)
  }

  const handleUpdateTask = (taskId: string) => {
    const statuses = ['Not Started', 'In Process', 'Done', 'Blocked'] as const
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    updateTask(taskId, { 
      status: randomStatus,
      progress: randomStatus === 'Done' ? 100 : randomStatus === 'In Process' ? Math.floor(Math.random() * 80) + 10 : 0
    })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Loading real dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={refreshData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real Data Dashboard Demo</h1>
          <p className="text-muted-foreground">Live data with real-time updates and CRUD operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.completedTasks} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completionRate}%</div>
              <Progress value={metrics.completionRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Reviewers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeReviewers}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.unassignedTasks} unassigned
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.efficiency}%</div>
              <p className="text-xs text-muted-foreground">
                Target vs Limit ratio
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
          <CardDescription>Real-time task management with live updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.slice(0, 10).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{task.header}</h3>
                    <Badge variant={task.status === 'Done' ? 'default' : task.status === 'In Process' ? 'secondary' : 'outline'}>
                      {task.status}
                    </Badge>
                    <Badge variant="outline">{task.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Target: {task.target}</span>
                    <span>Limit: {task.limit}</span>
                    <span>Reviewer: {task.reviewer}</span>
                    <span>Priority: {task.priority}</span>
                    {task.progress !== undefined && (
                      <div className="flex items-center gap-2">
                        <span>Progress: {task.progress}%</span>
                        <Progress value={task.progress} className="w-20" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateTask(task.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities ({activities.length})</CardTitle>
          <CardDescription>Live activity feed with real-time updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  {activity.user.initials}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
