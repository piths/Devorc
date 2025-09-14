import { GitHubDemo } from '@/components/github-demo';
import { Logo } from '@/components/logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8 space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <Logo variant="full" size="xl" />
          </div>
          <h1 className="text-4xl font-bold text-primary">
            Welcome to Devorc Suite
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered developer productivity platform with GitHub integration, 
            Kanban boards, project canvas, and intelligent code analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-left">
            <h3 className="font-semibold text-primary mb-2">🚀 GitHub Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Manage repositories, track issues, and monitor project activity
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-left">
            <h3 className="font-semibold text-accent mb-2">📋 Smart Kanban</h3>
            <p className="text-sm text-muted-foreground">
              Visual task management with GitHub issue synchronization
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-left">
            <h3 className="font-semibold text-primary mb-2">🎨 Project Canvas</h3>
            <p className="text-sm text-muted-foreground">
              Interactive brainstorming and architecture visualization
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-left">
            <h3 className="font-semibold text-accent mb-2">🤖 AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent code analysis and development insights
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">GitHub Integration Demo</h2>
          <GitHubDemo />
        </div>
      </div>
    </div>
  );
}
