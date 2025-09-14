'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Kanban, 
  Palette, 
  Bot, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Users,
  BarChart3
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading, login } = useGitHubAuth();
  const router = useRouter();

  // Check authentication status on mount and redirect if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-8 space-y-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <Skeleton className="h-16 w-64" />
            </div>
            <Skeleton className="h-10 w-96 mx-auto" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render landing page if authenticated (redirect is in progress)
  if (isAuthenticated) {
    return null;
  }

  // Render landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
          <div className="text-center space-y-8 sm:space-y-12 max-w-6xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-12 animate-fade-in">
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Logo variant="full" size="xl" />
              </div>
            </div>
            
            {/* Badge */}
            <div className="animate-fade-in-up delay-200">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 text-sm font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
                AI-Powered Developer Platform
                <Zap className="w-4 h-4 ml-2 text-yellow-400" />
              </div>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-8 animate-fade-in-up delay-300">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.9]">
                <span className="block text-white mb-2">Ship Code</span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  10x Faster
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light px-4">
                The only developer platform that transforms your GitHub workflow into a 
                <span className="text-purple-400 font-medium"> supercharged development experience</span>. 
                Build, manage, and deploy with 
                <span className="text-blue-400 font-medium"> AI-powered intelligence</span> and 
                <span className="text-pink-400 font-medium"> seamless collaboration</span>.
              </p>
              
              {/* Social proof */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-black"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-black"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-blue-400 border-2 border-black"></div>
                  </div>
                  <span>Trusted by 10,000+ developers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span>4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="pt-12 space-y-8 animate-fade-in-up delay-500">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
                <Button 
                  onClick={login}
                  size="lg"
                  className="group relative w-full sm:w-auto px-8 py-5 h-auto text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 min-w-[200px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center">
                    <Github className="w-5 h-5 mr-3" />
                    Start Building Now
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-5 h-auto text-lg font-semibold bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-2xl transition-all duration-300 min-w-[200px]"
                >
                  <div className="flex items-center justify-center">
                    Watch Demo
                  </div>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-gray-400 px-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Setup in 60 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Enterprise ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 sm:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in-up px-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 text-sm font-medium text-purple-300 mb-8">
              <Zap className="w-4 h-4 mr-2" />
              Four Integrated Modules
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Everything You Need.
              <span className="block text-gray-400 font-light mt-2">Nothing You Don&apos;t.</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Four powerful modules that work together seamlessly to transform how you build, manage, and ship software.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-7xl mx-auto px-4">
            {/* GitHub Dashboard */}
            <div className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm">
                    <Github className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs sm:text-sm">
                    Core
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">GitHub Dashboard</h3>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                  Transform your GitHub workflow into a powerful command center. Get real-time insights, 
                  automated code reviews, and AI-powered project analytics that help you ship faster.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-300 bg-purple-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Real-time Analytics
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-300 bg-purple-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    Smart Automation
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Kanban */}
            <div className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up delay-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm">
                    <Kanban className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs sm:text-sm">
                    Smart
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Smart Kanban</h3>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                  Project management that thinks ahead. Auto-sync with GitHub issues, AI-powered task prioritization, 
                  and intelligent sprint planning that adapts to your team&apos;s velocity.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300 bg-blue-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Team Sync
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300 bg-blue-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                    AI Planning
                  </div>
                </div>
              </div>
            </div>

            {/* Project Canvas */}
            <div className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-pink-500/50 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up delay-400">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-sm">
                    <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
                  </div>
                  <Badge variant="secondary" className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs sm:text-sm">
                    Visual
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Project Canvas</h3>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                  Turn ideas into reality with an infinite visual workspace. Design system architecture, 
                  brainstorm features, and create living documentation that evolves with your project.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-pink-300 bg-pink-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                    Visual Design
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-pink-300 bg-pink-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    Live Collab
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up delay-500">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm">
                    <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs sm:text-sm">
                    AI
                  </Badge>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">AI Assistant</h3>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                  Your 24/7 coding partner that never sleeps. Get instant code reviews, smart refactoring suggestions, 
                  and proactive bug detection that learns from your codebase.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-300 bg-green-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                    Code Review
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-300 bg-green-500/10 px-2 sm:px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    Auto-Fix
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-fade-in-up">
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 text-sm font-medium text-green-300 mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Join the Developer Revolution
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                Ready to Ship 10x Faster?
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Join 10,000+ developers who&apos;ve already transformed their workflow. 
                <span className="text-purple-400 font-medium"> Start building the future</span> in under 60 seconds.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              <Button 
                onClick={login}
                size="lg"
                className="group relative w-full sm:w-auto px-8 sm:px-10 py-5 h-auto text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 rounded-2xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 min-w-[250px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center">
                  <Github className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                  Launch Your Journey
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500 px-4">
              <span>✓ No credit card required</span>
              <span>✓ Free forever</span>
              <span>✓ Enterprise ready</span>
            </div>
            
            {/* Trust indicators */}
            <div className="pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-4">Trusted by developers at</p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                <div className="text-gray-500 font-semibold">GitHub</div>
                <div className="text-gray-500 font-semibold">Microsoft</div>
                <div className="text-gray-500 font-semibold">Google</div>
                <div className="text-gray-500 font-semibold">Meta</div>
                <div className="text-gray-500 font-semibold">Netflix</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
