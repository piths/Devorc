import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { SiteHeader } from "@/components/site-header"
import { CanvasPage } from '@/components/modules/canvas';
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

/**
 * Canvas loading component shown during authentication checks
 */
function CanvasLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-600">Loading canvas...</p>
        <p className="text-sm text-gray-500">Verifying authentication</p>
      </div>
    </div>
  );
}

/**
 * Protected canvas content component
 */
function CanvasContent() {
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
          <CanvasPage />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Canvas page with authentication protection
 * Redirects unauthenticated users to the landing page
 */
export default function Canvas() {
  return (
    <AuthGuard 
      fallback={<CanvasLoading />}
      redirectTo="/"
    >
      <CanvasContent />
    </AuthGuard>
  );
}

export const metadata = {
  title: 'Project Canvas - Devorch Suite',
  description: 'Interactive project canvas for brainstorming and architecture visualization',
};