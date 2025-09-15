'use client';

import { useEffect, useState, useRef } from 'react';
import { ChatInterface } from './chat-interface';
import { ChatSessions } from './chat-sessions';
import { CodeInsightsPanel } from './code-insights-panel';
import { GitHubRepositorySelector } from './github-repository-selector';
import { RepositoryCodebaseLoader } from './repository-codebase-loader';
import { GitHubFileExplorer } from './github-file-explorer';
import { CodeViewer } from './code-viewer';
import { FileNavigationToolbar } from './file-navigation-toolbar';
import { StorageWarning } from './storage-warning';
import { ResizablePanels } from '@/components/ui/resizable-panels';
import { useAIChat } from '@/hooks/useAIChat';
import { useRepositoryCodebase } from '@/hooks/useRepositoryCodebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFileNavigation } from '@/hooks/useFileNavigation';
import { useFileNavigationShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageSquare, Code, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { GitHubFileContent } from '@/types/github';
import { CurrentFileContext, CodebaseContext } from '@/types/chat';
import { toast } from 'sonner';

export function ChatPage() {
  const { activeSession, createNewSession, sendMessage, setCurrentFile, sessions, isLoading, updateSessionCodebase } = useAIChat();
  const { fetchCodebase, isLoading: isLoadingCodebase } = useRepositoryCodebase();
  const isMobile = useIsMobile();
  const [showCodeView, setShowCodeView] = useState(false);
  const [showChatView, setShowChatView] = useState(true);
  const [showInsightsView, setShowInsightsView] = useState(false);
  const [showChatSessions, setShowChatSessions] = useState(true);
  const hasCreatedInitialSession = useRef(false);
  const hasLoadedSessions = useRef(false);
  const isFirstLoad = useRef(true);
  
  const {
    selectedRepository,
    selectedFile,
    selectedFilePath,
    isLoading: fileLoading,
    error: fileError,
    setSelectedRepository,
    setSelectedFile,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    retryFileLoad,
  } = useFileNavigation();

  // Enable keyboard shortcuts for file navigation
  useFileNavigationShortcuts(
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    true
  );

  // Track when sessions have been loaded
  useEffect(() => {
    if (!isLoading) {
      hasLoadedSessions.current = true;
    }
  }, [isLoading]);

  // Create initial session only on very first app load when no sessions exist
  useEffect(() => {
    if (!isLoading && hasLoadedSessions.current && sessions.length === 0 && !hasCreatedInitialSession.current && isFirstLoad.current) {
      hasCreatedInitialSession.current = true;
      isFirstLoad.current = false;
      createNewSession('Welcome Chat').catch(error => {
        console.error('Failed to create initial session:', error);
      });
    }
  }, [isLoading, sessions.length, createNewSession]);

  // Update AI chat context when file selection changes
  useEffect(() => {
    if (selectedRepository && selectedFile && selectedFile.content && selectedFile.encoding === 'base64') {
      try {
        const decodedContent = atob(selectedFile.content);
        const fileLanguage = getFileLanguage(selectedFile.name);
        
        const fileContext: CurrentFileContext = {
          repository: {
            name: selectedRepository.name,
            full_name: selectedRepository.full_name,
            default_branch: selectedRepository.default_branch,
          },
          filePath: selectedFile.path,
          content: decodedContent,
          language: fileLanguage,
          size: selectedFile.size,
        };
        
        setCurrentFile(fileContext);
      } catch (error) {
        console.error('Failed to decode file content:', error);
        setCurrentFile(null);
      }
    } else {
      setCurrentFile(null);
    }
  }, [selectedRepository, selectedFile, setCurrentFile]);

  const handleFileSelect = (file: GitHubFileContent) => {
    setSelectedFile(file);
  };

  const getFileLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'markup',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'markup',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'dockerfile': 'docker',
      'makefile': 'makefile',
      'gitignore': 'git',
      'env': 'bash',
      'ini': 'ini',
      'toml': 'toml',
      'vue': 'markup',
      'svelte': 'markup',
    };

    return languageMap[extension || ''] || 'text';
  };

  const handleInsightClick = (insight: { type: string; filePath: string; lineStart: number; description: string }) => {
    // Send a message asking about the specific insight
    const message = `Can you explain more about this ${insight.type} in ${insight.filePath} at line ${insight.lineStart}? ${insight.description}`;
    sendMessage(message);
  };

  // Track the last loaded codebase to prevent duplicate processing
  const lastLoadedCodebaseRef = useRef<string | null>(null);

  // Reset codebase tracking when repository changes
  useEffect(() => {
    lastLoadedCodebaseRef.current = null;
  }, [selectedRepository]);

  const handleCodebaseLoaded = async (codebaseContext: CodebaseContext) => {
    // Create a unique identifier for this codebase
    const codebaseId = `${selectedRepository?.full_name}-${codebaseContext.files.length}`;
    
    // Prevent duplicate processing of the same codebase
    if (lastLoadedCodebaseRef.current === codebaseId) {
      return;
    }
    
    lastLoadedCodebaseRef.current = codebaseId;
    
    try {
      if (activeSession) {
        // Update existing session with codebase context
        await updateSessionCodebase(codebaseContext);
      } else {
        // Create a new session with the codebase context
        const sessionName = `${selectedRepository?.name} - Code Analysis`;
        await createNewSession(sessionName, codebaseContext);
      }
      
      // Show success notification with auto-dismiss
      toast.success(`Codebase loaded successfully! ${codebaseContext.files.length} files are now available for AI analysis.`, {
        duration: 3000, // Auto-dismiss after 3 seconds
      });
      
      // Force a re-render by switching to chat view to show the updated state
      if (!showChatView) {
        handleViewSwitch('chat');
      }
    } catch (error) {
      console.error('Failed to update session with codebase:', error);
      toast.error('Failed to load codebase into chat. Please try again.');
      // Reset the ref on error so user can retry
      lastLoadedCodebaseRef.current = null;
    }
  };

  // Handle loading repository codebase from chat interface
  const handleLoadRepositoryCodebase = async () => {
    console.log('handleLoadRepositoryCodebase called');
    
    if (!selectedRepository) {
      console.error('No repository selected');
      toast.error('No repository selected. Please select a repository first.');
      return;
    }

    console.log('Selected repository:', selectedRepository);
    console.log('Is loading codebase:', isLoadingCodebase);

    try {
      console.log('Starting codebase fetch for:', selectedRepository.full_name);
      
      // Show immediate feedback
      toast.info('Loading repository codebase...', { duration: 2000 });
      
      const codebaseContext = await fetchCodebase(selectedRepository);
      console.log('Codebase fetched successfully:', codebaseContext);
      
      // Show progress feedback
      toast.info('Preparing AI analysis...', { duration: 1000 });
      
      console.log('Calling handleCodebaseLoaded...');
      await handleCodebaseLoaded(codebaseContext);
      console.log('Codebase loaded to chat successfully');
    } catch (error) {
      console.error('Failed to load repository codebase:', error);
      
      // Show more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          toast.error('GitHub authentication required. Please connect your GitHub account first.');
        } else if (error.message.includes('rate limit')) {
          toast.error('GitHub API rate limit exceeded. Please try again later.');
        } else {
          toast.error(`Failed to load codebase: ${error.message}`);
        }
      } else {
        toast.error('Failed to load repository codebase. Please try again.');
      }
    }
  };

  // Handle view switching between chat, code, and insights
  const handleViewSwitch = (view: 'chat' | 'code' | 'insights') => {
    setShowChatView(view === 'chat');
    setShowCodeView(view === 'code');
    setShowInsightsView(view === 'insights');
    
    // Collapse chat sessions for code and insights views to save space
    setShowChatSessions(view === 'chat');
  };


  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <StorageWarning className="mx-2 mt-2" />
        <Tabs defaultValue="files" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="files" className="flex-1 mt-4 flex flex-col space-y-4">
            <GitHubRepositorySelector
              selectedRepository={selectedRepository}
              onRepositorySelect={setSelectedRepository}
            />
            <RepositoryCodebaseLoader
              repository={selectedRepository}
              onCodebaseLoaded={handleCodebaseLoaded}
            />
            <GitHubFileExplorer
              repository={selectedRepository}
              onFileSelect={handleFileSelect}
              selectedFilePath={selectedFilePath}
            />
            {selectedFilePath && (
              <FileNavigationToolbar
                currentFilePath={selectedFilePath}
                repositoryName={selectedRepository?.name}
                canNavigateBack={canNavigateBack}
                canNavigateForward={canNavigateForward}
                onNavigateBack={navigateBack}
                onNavigateForward={navigateForward}
                isLoading={fileLoading}
              />
            )}
          </TabsContent>
          
          <TabsContent value="main" className="flex-1 mt-4 flex flex-col">
            {/* Toggle Header for Mobile */}
            <div className="flex items-center justify-between p-3 border-b bg-background/50 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">View:</span>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={showChatView ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewSwitch('chat')}
                    className="h-7 px-3 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button
                    variant={showCodeView ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewSwitch('code')}
                    className="h-7 px-3 text-xs"
                    disabled={!selectedFile}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Code
                  </Button>
                  {activeSession?.codebaseContext && (
                    <Button
                      variant={showInsightsView ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewSwitch('insights')}
                      className="h-7 px-3 text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Insights
                    </Button>
                  )}
                </div>
              </div>
              {selectedFile && (
                <div className="text-xs text-muted-foreground truncate max-w-32">
                  {selectedFile.name}
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {showChatView ? (
                <div className="flex-1 min-h-0">
                  <ChatInterface 
                    key={`mobile-${activeSession?.id}`} 
                    className="h-full"
                    selectedRepository={selectedRepository}
                    onLoadRepositoryCodebase={handleLoadRepositoryCodebase}
                    isLoadingCodebase={isLoadingCodebase}
                  />
                </div>
              ) : showCodeView && selectedFile ? (
                <div className="flex-1 min-h-0 w-full">
                  <CodeViewer 
                    file={selectedFile} 
                    isLoading={fileLoading}
                    error={fileError}
                    onRetry={retryFileLoad}
                    isFullScreen={true}
                  />
                </div>
              ) : showInsightsView && activeSession?.codebaseContext ? (
                <div className="flex-1 min-h-0 w-full">
                  <CodeInsightsPanel 
                    codebaseContext={activeSession.codebaseContext}
                    onInsightClick={handleInsightClick}
                    className="h-full"
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to view its code</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="sessions" className="flex-1 mt-4">
            <ChatSessions />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <StorageWarning className="mx-4 mt-2" />
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Sessions Sidebar - Hidden on smaller screens, shown on large screens */}
        {showChatSessions && (
          <div className="hidden lg:block w-80 flex-shrink-0 flex flex-col">
            {/* Collapse Button at Top */}
            <div className="flex justify-end p-2 border-b bg-background/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChatSessions(false)}
                className="h-8 w-8 p-0"
                title="Hide chat sessions"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            {/* Chat Sessions Content */}
            <div className="flex-1 min-h-0">
              <ChatSessions />
            </div>
          </div>
        )}
      
      {/* Expand Button - Show when chat sessions are hidden */}
      {!showChatSessions && (
        <div className="hidden lg:flex flex-col justify-start pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChatSessions(true)}
            className="h-8 w-8 p-0"
            title="Show chat sessions"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Content Area with Resizable Panels */}
      <div className="flex-1 min-h-0">
        {/* Main Layout with Resizable Panels */}
        <ResizablePanels
          defaultLeftWidth={35}
          minLeftWidth={25}
          maxLeftWidth={60}
          className="h-full"
        >
          {/* Left Panel: File Explorer */}
          <div className="h-full p-4 bg-background flex flex-col space-y-4">
            <GitHubRepositorySelector
              selectedRepository={selectedRepository}
              onRepositorySelect={setSelectedRepository}
            />
            <RepositoryCodebaseLoader
              repository={selectedRepository}
              onCodebaseLoaded={handleCodebaseLoaded}
            />
            <GitHubFileExplorer
              repository={selectedRepository}
              onFileSelect={handleFileSelect}
              selectedFilePath={selectedFilePath}
            />
            {selectedFilePath && (
              <FileNavigationToolbar
                currentFilePath={selectedFilePath}
                repositoryName={selectedRepository?.name}
                canNavigateBack={canNavigateBack}
                canNavigateForward={canNavigateForward}
                onNavigateBack={navigateBack}
                onNavigateForward={navigateForward}
                isLoading={fileLoading}
              />
            )}
          </div>

          {/* Right Panel: Toggle between Chat, Code, and Insights View */}
          <div className="h-full flex flex-col">
            {/* Toggle Header */}
            <div className="flex items-center justify-between p-3 border-b bg-background/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Main View:</span>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={showChatView ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewSwitch('chat')}
                    className="h-7 px-3 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button
                    variant={showCodeView ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewSwitch('code')}
                    className="h-7 px-3 text-xs"
                    disabled={!selectedFile}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Code
                  </Button>
                  {activeSession?.codebaseContext && (
                    <Button
                      variant={showInsightsView ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewSwitch('insights')}
                      className="h-7 px-3 text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Insights
                    </Button>
                  )}
                </div>
              </div>
              {selectedFile && (
                <div className="text-xs text-muted-foreground">
                  {selectedFile.name}
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {showChatView ? (
                <div className="flex-1 min-h-0">
                  <ChatInterface 
                    key={`desktop-${activeSession?.id}`} 
                    className="h-full"
                    selectedRepository={selectedRepository}
                    onLoadRepositoryCodebase={handleLoadRepositoryCodebase}
                    isLoadingCodebase={isLoadingCodebase}
                  />
                </div>
              ) : showCodeView && selectedFile ? (
                <div className="flex-1 min-h-0 w-full">
                  <CodeViewer 
                    file={selectedFile} 
                    isLoading={fileLoading}
                    error={fileError}
                    onRetry={retryFileLoad}
                    isFullScreen={true}
                  />
                </div>
              ) : showInsightsView && activeSession?.codebaseContext ? (
                <div className="flex-1 min-h-0 w-full">
                  <CodeInsightsPanel 
                    codebaseContext={activeSession.codebaseContext}
                    onInsightClick={handleInsightClick}
                    className="h-full"
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file to view its code</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanels>
      </div>
    </div>
    </div>
  );
}