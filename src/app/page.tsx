export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-primary">
          Welcome to Devorch Suite
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          AI-powered developer productivity platform with GitHub integration, 
          Kanban boards, project canvas, and intelligent code analysis
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
        <p className="text-sm text-muted-foreground mt-8">
          Project foundation setup complete. Ready for module implementation.
        </p>
      </div>
    </div>
  );
}
