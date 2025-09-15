import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { SiteHeader } from "@/components/site-header"
import { ChatPage } from '@/components/modules/chat';
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

/**
 * Chat loading component shown during authentication checks
 */
function ChatLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-600">Loading chat...</p>
        <p className="text-sm text-gray-500">Verifying authentication</p>
      </div>
    </div>
  );
}

/**
 * Protected chat content component
 */
function ChatContent() {
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
        <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))] overflow-hidden chat-page-container">
          <ChatPage />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Chat() {
  return (
    <AuthGuard 
      fallback={<ChatLoading />}
      redirectTo="/"
    >
      <ChatContent />
    </AuthGuard>
  );
}

export const metadata = {
  title: 'AI Chat Assistant - Devorch Suite',
  description: 'AI-powered chat assistant for code analysis and development insights',
};