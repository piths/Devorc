"use client"

import * as React from "react"
import {
  IconCalendar,
  IconCheck,
  IconTarget,
} from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardTask, DashboardMetrics as DashboardMetricsType } from "@/lib/dashboard-data-service"

interface ProjectProgressProps {
  data: DashboardTask[]
  metrics?: DashboardMetricsType | null
}

export function ProjectProgress({ data, metrics }: ProjectProgressProps) {
  const total = metrics?.totalTasks ?? data?.length ?? 0
  const completed = metrics?.completedTasks ?? data?.filter((d) => d.status === "Done").length ?? 0
  const inProgress = metrics?.inProgressTasks ?? data?.filter((d) => d.status === "In Process").length ?? 0
  const notStarted = metrics?.notStartedTasks ?? data?.filter((d) => d.status === "Not Started").length ?? 0

  const completionRate = metrics?.completionRate ?? (total ? Math.round((completed / total) * 100) : 0)

  // Calculate estimated completion based on current progress
  const estimatedDaysToComplete = inProgress > 0 ? Math.ceil((total - completed) / (inProgress * 0.3)) : 0
  const estimatedCompletionDate = new Date()
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedDaysToComplete)

  // Get status distribution
  const statusDistribution = [
    { status: 'Done', count: completed, color: 'bg-green-500', percentage: Math.round((completed / total) * 100) },
    { status: 'In Progress', count: inProgress, color: 'bg-blue-500', percentage: Math.round((inProgress / total) * 100) },
    { status: 'Not Started', count: notStarted, color: 'bg-gray-500', percentage: Math.round((notStarted / total) * 100) },
  ]

  // Get recent completions (mock data)
  const recentCompletions = data?.filter((d) => d.status === "Done").slice(0, 3) || []

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTarget className="h-5 w-5" />
            Project Progress
          </CardTitle>
          <CardDescription>
            Overall completion status and timeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completed} completed</span>
              <span>{total - completed} remaining</span>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Status Distribution</h4>
            <div className="space-y-2">
              {statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Estimate */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estimated Completion</span>
            </div>
            <div className="text-2xl font-bold">
              {estimatedDaysToComplete > 0 ? `${estimatedDaysToComplete} days` : 'Complete'}
            </div>
            <p className="text-xs text-muted-foreground">
              {estimatedDaysToComplete > 0 
                ? `Target: ${estimatedCompletionDate.toLocaleDateString()}`
                : 'All tasks completed!'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCheck className="h-5 w-5" />
            Recent Completions
          </CardTitle>
          <CardDescription>
            Latest completed tasks and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCompletions.length > 0 ? (
            <div className="space-y-3">
              {recentCompletions.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <IconCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.header}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.reviewer !== "Assign reviewer" ? `by ${item.reviewer}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {index === 0 ? 'Just now' : `${index + 1}h ago`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent completions</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full">
              View All Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
