"use client"

import * as React from "react"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconTarget,
  IconCircleCheck,
  IconCalendar,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DashboardTask, DashboardMetrics as DashboardMetricsType } from "@/lib/dashboard-data-service"

interface DashboardMetricsProps {
  data: DashboardTask[]
  metrics?: DashboardMetricsType | null
}

export function DashboardMetrics({ data, metrics }: DashboardMetricsProps) {
  // Use provided metrics or calculate from data
  const total = metrics?.totalTasks ?? data?.length ?? 0
  const completed = metrics?.completedTasks ?? data?.filter((d) => d.status === "Done").length ?? 0
  const inProgress = metrics?.inProgressTasks ?? data?.filter((d) => d.status === "In Process").length ?? 0
  const unassigned = metrics?.unassignedTasks ?? data?.filter((d) => d.reviewer === "Unassigned").length ?? 0
  const overLimit = metrics?.overLimitTasks ?? data?.filter((d) => d.target > d.limit).length ?? 0

  const completionRate = metrics?.completionRate ?? (total ? Math.round((completed / total) * 100) : 0)
  const efficiency = metrics?.efficiency ?? 0
  const activeReviewers = metrics?.activeReviewers ?? 0
  const thisWeekCompleted = metrics?.thisWeekCompleted ?? 0
  const weeklyGrowth = metrics?.weeklyGrowth ?? 0
  
  // Calculate averages for target and limit
  const avgTarget = data?.length ? data.reduce((sum, task) => sum + (task.target || 0), 0) / data.length : 0
  const avgLimit = data?.length ? data.reduce((sum, task) => sum + (task.limit || 0), 0) / data.length : 0

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          <IconTarget className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Progress value={completionRate} className="flex-1" />
            <span>{completed}/{total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completed} completed, {inProgress} in progress
          </p>
        </CardContent>
      </Card>

      {/* This Week's Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{thisWeekCompleted}</div>
          <div className="flex items-center space-x-1 text-xs">
            {weeklyGrowth >= 0 ? (
              <IconTrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <IconTrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={weeklyGrowth >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(weeklyGrowth)}%
            </span>
            <span className="text-muted-foreground">from last week</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Items completed this week
          </p>
        </CardContent>
      </Card>

      {/* Active Reviewers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeReviewers}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Badge variant={unassigned > 0 ? "destructive" : "secondary"}>
              {unassigned} unassigned
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {activeReviewers > 0 ? `${activeReviewers} active reviewers` : "No reviewers assigned"}
          </p>
        </CardContent>
      </Card>

      {/* Efficiency Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{efficiency}%</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>Target vs Limit ratio</span>
            {overLimit > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overLimit} over limit
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Avg: {avgTarget.toFixed(1)} target, {avgLimit.toFixed(1)} limit
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
