"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  IconBrandGithub,
  IconChartBar,
  IconDashboard,
  IconKarate,
  IconPalette,
  IconRobot,
  IconHelp,
  IconSettings,
  IconSearch,
  IconCode,
  IconGitBranch,
  IconBug,
  IconGitPullRequest,
  IconUsers,
  IconBolt,
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
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
        isActive: pathname === "/dashboard",
      },
      {
        title: "Smart Kanban",
        url: "/kanban",
        icon: IconKarate,
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
        icon: IconRobot,
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
            icon: IconCode,
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
        icon: IconChartBar,
        url: "#",
        items: [
          {
            title: "Code Metrics",
            url: "#",
          },
          {
            title: "Team Performance",
            url: "#",
          },
          {
            title: "Project Health",
            url: "#",
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
        icon: IconHelp,
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
        icon: IconBolt,
      },
      {
        name: "New Branch",
        url: "#",
        icon: IconGitBranch,
      },
      {
        name: "Team Invite",
        url: "#",
        icon: IconUsers,
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
          <SidebarInput placeholder="Quick search..." />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Contextual boards list when in Kanban */}
        {pathname.startsWith("/kanban") && <NavBoards />}
        {/* GitHub Integration with connection status */}
        <div className="flex items-center justify-between pr-2 group-data-[collapsible=icon]:hidden">
          <span className="text-sidebar-foreground/70 px-2 text-xs font-medium">GitHub Integration</span>
          <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-[10px]">
            {isAuthenticated ? (user?.login ? `@${user.login}` : "Connected") : "Disconnected"}
          </Badge>
        </div>
        <NavDocuments items={data.navGitHub} />
        <NavDocuments title="Quick Actions" items={data.quickActions} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
