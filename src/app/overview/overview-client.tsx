"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  IconBrandGithub,
  IconLayoutKanban,
  IconPalette,
  IconMessageCircle,
  IconArrowRight,
  IconSparkles,
  IconTrendingUp,
  IconUsers,
  IconCode,
  IconRefresh,
} from "@tabler/icons-react";
import { useOverviewData } from "@/hooks/useOverviewData";

export function OverviewClient() {
  const { stats, isLoading, hasErrors, refreshData } = useOverviewData();
  
  // Debug authentication state
  React.useEffect(() => {
    console.log('Overview: Component mounted, checking auth state...');
  }, []);

  const modules = [
    {
      title: "GitHub Dashboard",
      description:
        "Unified view of repositories, commits, PRs, and issues with smart insights.",
      href: "/dashboard",
      icon: <IconBrandGithub className="size-6" />,
      cta: "Open Dashboard",
      gradient: "from-blue-500 to-purple-600",
      badge: "Popular",
      stats: stats.repositories.loading 
        ? "Loading..." 
        : `${stats.repositories.count} ${stats.repositories.count === 1 ? 'repo' : 'repos'}`,
    },
    {
      title: "Smart Kanban",
      description:
        "AI-assisted planning with templates, GitHub sync, and conflict resolution.",
      href: "/kanban",
      icon: <IconLayoutKanban className="size-6" />,
      cta: "Open Kanban",
      gradient: "from-emerald-500 to-teal-600",
      badge: "AI-Powered",
      stats: stats.kanbanBoards.loading 
        ? "Loading..." 
        : `${stats.kanbanBoards.count} ${stats.kanbanBoards.count === 1 ? 'board' : 'boards'}`,
    },
    {
      title: "Project Canvas",
      description:
        "Freeform canvas for brainstorming, architecture, and project context mapping.",
      href: "/canvas",
      icon: <IconPalette className="size-6" />,
      cta: "Open Canvas",
      gradient: "from-pink-500 to-rose-600",
      badge: "Creative",
      stats: stats.canvasProjects.loading 
        ? "Loading..." 
        : `${stats.canvasProjects.count} ${stats.canvasProjects.count === 1 ? 'canvas' : 'canvases'}`,
    },
    {
      title: "AI Chat",
      description:
        "Context-aware assistant for code analysis, PR reviews, and troubleshooting.",
      href: "/chat",
      icon: <IconMessageCircle className="size-6" />,
      cta: "Open Chat",
      gradient: "from-orange-500 to-red-600",
      badge: "AI-Powered",
      stats: stats.chatSessions.loading 
        ? "Loading..." 
        : `${stats.chatSessions.count} ${stats.chatSessions.count === 1 ? 'chat' : 'chats'}`,
    },
  ];

  const statsCards = [
    { 
      label: "Active Projects", 
      value: stats.repositories.loading ? "..." : stats.repositories.count.toString(), 
      icon: IconTrendingUp,
      loading: stats.repositories.loading,
      error: stats.repositories.error
    },
    { 
      label: "Team Members", 
      value: "1", // This would need to be fetched from GitHub API or user management
      icon: IconUsers,
      loading: false,
      error: null
    },
    { 
      label: "Code Commits", 
      value: stats.totalCommits.loading ? "..." : formatNumber(stats.totalCommits.count), 
      icon: IconCode,
      loading: stats.totalCommits.loading,
      error: stats.totalCommits.error
    },
  ];

  // Helper function to format numbers
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
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

        <div className="flex flex-1 flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20" />
            <div className="relative px-4 py-12 lg:px-6 lg:py-16">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 mb-6">
                  <IconSparkles className="size-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Welcome to DevOrc Suite
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent mb-4">
                  Your AI-Powered
                  <br />
                  Development Hub
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                  Streamline your development workflow with intelligent tools for GitHub management, 
                  project planning, creative collaboration, and AI-assisted coding.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="px-4 lg:px-6 -mt-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Your Activity
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <IconRefresh className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statsCards.map((stat, index) => (
                  <Card key={stat.label} className="relative overflow-hidden border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <stat.icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {stat.loading ? (
                              <span className="animate-pulse">...</span>
                            ) : stat.error ? (
                              <span className="text-red-500" title={stat.error}>Error</span>
                            ) : (
                              stat.value
                            )}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                          {stat.error && (
                            <p className="text-xs text-red-500 mt-1" title={stat.error}>
                              Failed to load
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {hasErrors && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Some data couldn&apos;t be loaded. Click refresh to try again.
                  </p>
                </div>
              )}
              
            </div>
          </div>

          {/* Modules Section */}
          <div className="px-4 lg:px-6 pb-12">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Explore Your Tools
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Choose from our suite of powerful development tools designed to enhance your productivity
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {modules.map((module, index) => (
                  <Card 
                    key={module.title} 
                    className="group relative overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${module.gradient} text-white shadow-lg`}>
                          {module.icon}
                        </div>
                        <Badge variant="secondary" className="text-xs font-medium">
                          {module.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                        <div className={`w-2 h-2 rounded-full ${
                          module.stats === "Loading..." 
                            ? "bg-yellow-500 animate-pulse" 
                            : "bg-green-500"
                        }`} />
                        <span className={module.stats === "Loading..." ? "animate-pulse" : ""}>
                          {module.stats}
                        </span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        asChild 
                        className={`w-full bg-gradient-to-r ${module.gradient} hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 group/btn`}
                      >
                        <a href={module.href} className="flex items-center justify-center gap-2">
                          {module.cta}
                          <IconArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

