import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { SiteHeader } from "@/components/site-header"
import { GitHubDashboard } from "@/components/github"
import { GitHubErrorBoundary } from "@/components/github/github-error-boundary"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

/**
 * GitHub Dashboard loading component
 */
function GitHubDashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-600">Loading GitHub dashboard...</p>
        <p className="text-sm text-gray-500">Verifying authentication</p>
      </div>
    </div>
  );
}

/**
 * Protected GitHub dashboard content component
 */
function GitHubDashboardContent() {
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
              <div className="px-4 lg:px-6">
                <GitHubErrorBoundary>
                  <GitHubDashboard />
                </GitHubErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * GitHub Dashboard page with authentication protection
 * Provides comprehensive GitHub repository management interface
 */
export default function GitHubDashboardPage() {
  return (
    <AuthGuard 
      fallback={<GitHubDashboardLoading />}
      redirectTo="/"
    >
      <GitHubDashboardContent />
    </AuthGuard>
  );
}