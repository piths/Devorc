"use client"

import * as React from "react"
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
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: true,
    },
    {
      title: "Smart Kanban",
      url: "#",
      icon: IconKarate,
      badge: "Coming Soon",
    },
    {
      title: "Project Canvas",
      url: "#",
      icon: IconPalette,
      badge: "Coming Soon",
    },
    {
      title: "AI Assistant",
      url: "#",
      icon: IconRobot,
      badge: "Coming Soon",
    },
  ],
  navGitHub: [
    {
      title: "Repositories",
      icon: IconBrandGithub,
      isActive: false,
      url: "#",
      items: [
        {
          title: "All Repositories",
          url: "#",
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments title="GitHub Integration" items={data.navGitHub} />
        <NavDocuments title="Quick Actions" items={data.quickActions} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
