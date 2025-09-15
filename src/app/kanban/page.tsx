'use client';

import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { KanbanBoard, BoardSwitcher } from '@/components/modules/kanban';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Kanban loading component shown during authentication checks
 */
function KanbanLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-600">Loading Kanban board...</p>
        <p className="text-sm text-gray-500">Verifying authentication</p>
      </div>
    </div>
  );
}

/**
 * Protected Kanban content component
 */
function KanbanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get('board') || 'default-board';

  const handleSelectBoard = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('board', id);
    router.replace(url.pathname + url.search);
  };

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
        <div className="flex flex-col gap-3 px-4 pt-2">
          <BoardSwitcher selectedBoardId={selected} onSelectBoard={handleSelectBoard} />
        </div>
        <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))]">
          <KanbanBoard boardId={selected} onBoardUpdate={(board) => { console.log('Board updated:', board); }} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Kanban page with authentication protection
 * Redirects unauthenticated users to the landing page
 */
export default function KanbanPage() {
  return (
    <AuthGuard 
      fallback={<KanbanLoading />}
      redirectTo="/"
    >
      <KanbanContent />
    </AuthGuard>
  );
}
