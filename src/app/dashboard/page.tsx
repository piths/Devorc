'use client';

import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { GitHubStatus, GitHubRepositories } from "@/components/github-status"
import { SiteHeader } from "@/components/site-header"
import { DashboardQuickActions } from "@/components/dashboard-quick-actions"
import { ActivityFeed } from "@/components/activity-feed"
import { ProjectProgress } from "@/components/project-progress"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { DashboardCustomization } from "@/components/dashboard-customization"
import { useDashboardData } from "@/hooks/useDashboardData"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

/**
 * Dashboard loading component shown during authentication checks
 */
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-600">Loading dashboard...</p>
        <p className="text-sm text-gray-500">Verifying authentication</p>
      </div>
    </div>
  );
}

/**
 * Protected dashboard content component
 */
function DashboardContent() {
  const { tasks, activities, metrics, loading, error } = useDashboardData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
          <p className="text-sm text-gray-500">Fetching real-time information</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <p className="text-lg text-gray-600">Error loading dashboard</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Welcome Section */}
              <div className="px-4 lg:px-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Welcome back! Here&apos;s what&apos;s happening with your projects.
                    </p>
                  </div>
                  <DashboardCustomization />
                </div>
              </div>

              {/* Enhanced Metrics */}
              <div className="px-4 lg:px-6">
                <DashboardMetrics data={tasks} metrics={metrics} />
              </div>

              {/* GitHub Integration Status */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <GitHubStatus />
                  <GitHubRepositories />
                </div>
              </div>

              {/* Quick Actions */}
              <DashboardQuickActions />

              {/* Project Progress */}
              <div className="px-4 lg:px-6">
                <ProjectProgress data={tasks} metrics={metrics} />
              </div>

              {/* Activity Feed and Charts */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <ActivityFeed activities={activities} />
                  <ChartAreaInteractive data={tasks} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Dashboard page with authentication protection
 * Redirects unauthenticated users to the landing page
 */
export default function Page() {
  return (
    <AuthGuard 
      fallback={<DashboardLoading />}
      redirectTo="/"
    >
      <DashboardContent />
    </AuthGuard>
  );
}
