"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  IconBrandGithub,
  IconChartBar,
  IconLayoutDashboard,
  IconLayoutKanban,
  IconPalette,
  IconMessageCircle,
  IconHelpCircle,
  IconSettings,
  IconSearch,
  IconCode,
  IconGitBranch,
  IconBug,
  IconGitPullRequest,
  IconUsers,
  IconPlus,
  IconHome,
  IconDatabase,
  IconActivity,
  IconTrendingUp,
  IconGitCommit,
  IconUserPlus,
} from "@tabler/icons-react"

import { Logo } from "@/components/logo"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavBoards } from "@/components/nav-boards"
import { useGitHubAuth } from "@/contexts/GitHubAuthContext"
import { Badge } from "@/components/ui/badge"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarInput,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isAuthenticated, user } = useGitHubAuth()

  const data = {
    navMain: [
      {
        title: "Overview",
        url: "/overview",
        icon: IconHome,
        isActive: pathname === "/overview",
      },
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconLayoutDashboard,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Smart Kanban",
        url: "/kanban",
        icon: IconLayoutKanban,
        isActive: pathname === "/kanban",
      },
      {
        title: "Project Canvas",
        url: "/canvas",
        icon: IconPalette,
        isActive: pathname === "/canvas",
      },
      {
        title: "AI Chat",
        url: "/chat",
        icon: IconMessageCircle,
        isActive: pathname === "/chat",
      },
    ],
    navGitHub: [
      {
        title: "Repositories",
        icon: IconBrandGithub,
        isActive: pathname.startsWith("/dashboard/github"),
        url: "/dashboard/github",
        items: [
          {
            title: "All Repositories",
            url: "/dashboard/github",
            icon: IconDatabase,
          },
          {
            title: "Branches",
            url: "#",
            icon: IconGitBranch,
          },
          {
            title: "Issues",
            url: "#",
            icon: IconBug,
          },
          {
            title: "Pull Requests",
            url: "#",
            icon: IconGitPullRequest,
          },
        ],
      },
      {
        title: "Analytics",
        icon: IconTrendingUp,
        url: "#",
        items: [
          {
            title: "Code Metrics",
            url: "#",
            icon: IconActivity,
          },
          {
            title: "Team Performance",
            url: "#",
            icon: IconUsers,
          },
          {
            title: "Project Health",
            url: "#",
            icon: IconChartBar,
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "#",
        icon: IconHelpCircle,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
    quickActions: [
      {
        name: "Create Issue",
        url: "#",
        icon: IconPlus,
      },
      {
        name: "New Branch",
        url: "#",
        icon: IconGitCommit,
      },
      {
        name: "Team Invite",
        url: "#",
        icon: IconUserPlus,
      },
    ],
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <Logo variant="icon" size="sm" />
                <span className="text-base font-semibold">DevOrch</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 px-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* Main Navigation */}
        <div className="px-2 py-2">
          <NavMain items={data.navMain} />
        </div>
        
        {/* Contextual boards list when in Kanban */}
        {pathname.startsWith("/kanban") && (
          <div className="px-2 py-2">
            <NavBoards />
          </div>
        )}
        
        {/* GitHub Integration Section */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-sidebar-foreground/70 text-xs font-medium">GitHub Integration</span>
            <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-[10px] px-1.5 py-0.5">
              {isAuthenticated ? (user?.login ? `@${user.login}` : "Connected") : "Disconnected"}
            </Badge>
          </div>
          <NavDocuments items={data.navGitHub} />
        </div>
        
        {/* Quick Actions Section */}
        <div className="px-2 py-2">
          <NavDocuments title="Quick Actions" items={data.quickActions} />
        </div>
        
        {/* Secondary Navigation - pushed to bottom */}
        <div className="mt-auto px-2 py-2">
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
