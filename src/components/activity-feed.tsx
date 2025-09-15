"use client"

import * as React from "react"
import {
  IconGitCommit,
  IconGitPullRequest,
  IconGitMerge,
  IconMessageCircle,
  IconCheck,
  IconClock,
  IconUser,
  IconAlertCircle,
} from "@tabler/icons-react"
import { ActivityItem } from "@/lib/dashboard-data-service"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'commit':
        return <IconGitCommit className="h-4 w-4" />
      case 'pr':
        return <IconGitPullRequest className="h-4 w-4" />
      case 'merge':
        return <IconGitMerge className="h-4 w-4" />
      case 'comment':
        return <IconMessageCircle className="h-4 w-4" />
      case 'review':
        return <IconCheck className="h-4 w-4" />
      case 'assignment':
        return <IconUser className="h-4 w-4" />
      default:
        return <IconClock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status?: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return <IconCheck className="h-3 w-3" />
      case 'pending':
        return <IconClock className="h-3 w-3" />
      case 'error':
        return <IconAlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest updates from your team and projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full bg-muted ${getStatusColor(activity.status)}`}>
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    {activity.metadata && (
                      <div className="flex items-center gap-2 mt-2">
                        {activity.metadata.repository && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.repository}
                          </Badge>
                        )}
                        {activity.metadata.branch && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.metadata.branch}
                          </Badge>
                        )}
                        {activity.metadata.prNumber && (
                          <Badge variant="outline" className="text-xs">
                            PR #{activity.metadata.prNumber}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {activity.status && (
                      <div className={`flex items-center gap-1 ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {activity.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {activity.user.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
