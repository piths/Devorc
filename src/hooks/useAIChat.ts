import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, ChatMessage, CodebaseContext, ChatError, TypingIndicator, CodeReference, CurrentFileContext } from '@/types/chat';
import { ChatStorageManager } from '@/lib/storage/ChatStorageManager';
import { FileUploadHandler } from '@/lib/chat/FileUploadHandler';
import { CodeAnalysisService } from '@/lib/chat/CodeAnalysisService';

export function useAIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({ isVisible: false });
  const [currentFileContext, setCurrentFileContext] = useState<CurrentFileContext | null>(null);
  
  const storageManager = useRef(new ChatStorageManager());
  const analysisService = useRef<CodeAnalysisService | null>(null);

  // Initialize analysis service lazily (without OpenAI client for local analysis)
  const getAnalysisService = useCallback(() => {
    if (!analysisService.current) {
      analysisService.current = new CodeAnalysisService();
    }
    return analysisService.current;
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedSessions = await storageManager.current.loadChatSessions();
      setSessions(loadedSessions);

      // Load active session
      const activeSessionId = await storageManager.current.getActiveSessionId();
      if (activeSessionId) {
        const active = loadedSessions.find(s => s.id === activeSessionId);
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setError({
        type: 'unknown',
        message: 'Failed to load chat sessions',
        retryable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createNewSession = useCallback(async (name?: string, codebaseContext?: CodebaseContext) => {
    try {
      const session = await storageManager.current.createNewSession(name, codebaseContext);
      setSessions(prev => [session, ...prev]);
      setActiveSession(session);
      return session;
    } catch (error) {
      console.error('Failed to create new session:', error);
      throw error;
    }
  }, []);

  const switchToSession = useCallback(async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setActiveSession(session);
        await storageManager.current.setActiveSession(sessionId);
      }
    } catch (error) {
      console.error('Failed to switch session:', error);
    }
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await storageManager.current.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (activeSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSession(remainingSessions[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }, [sessions, activeSession]);

  const deleteAllSessions = useCallback(async () => {
    try {
      // Delete all sessions from storage
      for (const session of sessions) {
        await storageManager.current.deleteChatSession(session.id);
      }
      
      // Clear all sessions from state
      setSessions([]);
      setActiveSession(null);
      
      // Clear active session from storage
      await storageManager.current.clearActiveSession();
    } catch (error) {
      console.error('Failed to delete all sessions:', error);
      throw error;
    }
  }, [sessions]);

  const sendMessage = useCallback(async (content: string) => {
    let session = activeSession;
    
    // Create a new session if none exists
    if (!session) {
      console.log('No active session, creating new one...');
      session = await createNewSession('New Chat');
    }

    const analysisService = getAnalysisService();

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    try {
      // Add user message
      await storageManager.current.addMessageToSession(session.id, userMessage);
      
      // Update local state
      const updatedSession = {
        ...session,
        messages: [...session.messages, userMessage],
      };
      setActiveSession(updatedSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === session.id ? updatedSession : s));

      // Show typing indicator
      setTypingIndicator({ isVisible: true, message: 'Analyzing your code...' });
      setError(null);

      let response: { content: string; codeReferences?: CodeReference[] };

      // Enhance user message with current file context if available
      let enhancedContent = content;
      if (currentFileContext) {
        enhancedContent = analysisService.enhanceQueryWithFileContext(
          content,
          currentFileContext.filePath,
          currentFileContext.content,
          currentFileContext.language
        );
      }

      // Use API route for all OpenAI requests
      if (session.codebaseContext) {
        // Use enhanced contextual response with code analysis
        const relevantFiles = analysisService.findRelevantFiles(enhancedContent, session.codebaseContext);
        
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'contextual',
            messages: updatedSession.messages,
            query: enhancedContent,
            context: session.codebaseContext,
            relevantFiles: relevantFiles.map(f => f.path),
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || 'Failed to get AI response');
        }

        response = await apiResponse.json();
      } else {
        // Fallback to basic chat completion with enhanced content
        const messagesWithContext = [...updatedSession.messages];
        // Replace the last user message with enhanced content
        messagesWithContext[messagesWithContext.length - 1] = {
          ...userMessage,
          content: enhancedContent
        };
        
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'chat',
            messages: messagesWithContext,
            context: session.codebaseContext,
          }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || 'Failed to get AI response');
        }

        response = await apiResponse.json();
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        codeReferences: response.codeReferences || [],
      };

      // Add assistant message
      await storageManager.current.addMessageToSession(session.id, assistantMessage);
      
      // Update local state
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      };
      setActiveSession(finalSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === session.id ? finalSession : s));

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError({
        type: 'unknown',
        message: errorMessage,
        retryable: true,
      });
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. You can try again.`,
        timestamp: new Date(),
      };

      if (activeSession) {
        await storageManager.current.addMessageToSession(activeSession.id, errorChatMessage);
        
        const errorSession = {
          ...activeSession,
          messages: [...activeSession.messages, userMessage, errorChatMessage],
        };
        setActiveSession(errorSession);
        setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? errorSession : s));
      }
    } finally {
      setTypingIndicator({ isVisible: false });
    }
  }, [activeSession, currentFileContext, getAnalysisService, createNewSession]);

  const uploadFiles = useCallback(async (files: FileList) => {
    try {
      setIsLoading(true);
      const result = await FileUploadHandler.handleFileUpload(files);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const codebaseContext = FileUploadHandler.createCodebaseContext(result.files);
      
      // Create new session with codebase context
      const sessionName = `Code Analysis - ${new Date().toLocaleDateString()}`;
      const session = await createNewSession(sessionName, codebaseContext);
      
      // Add initial system message about uploaded files
      const systemMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'system',
        content: `Uploaded ${result.files.length} files for analysis. You can now ask questions about your codebase.`,
        timestamp: new Date(),
      };

      await storageManager.current.addMessageToSession(session.id, systemMessage);
      
      const updatedSession = {
        ...session,
        messages: [systemMessage],
      };
      setActiveSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === session.id ? updatedSession : s));

      return result;
    } catch (error) {
      console.error('Failed to upload files:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createNewSession]);

  const analyzeCodebase = useCallback(async () => {
    if (!activeSession?.codebaseContext) {
      return;
    }

    const analysisService = getAnalysisService();

    try {
      setIsLoading(true);
      setTypingIndicator({ isVisible: true, message: 'Analyzing codebase structure and patterns...' });
      
      // Perform comprehensive analysis using local analysis service
      // This doesn't require OpenAI API calls for basic structure analysis
      const analysis = await analysisService.analyzeCodebase(activeSession.codebaseContext);

      // Update codebase context with analysis
      const updatedContext = {
        ...activeSession.codebaseContext,
        analysis,
      };

      const updatedSession = {
        ...activeSession,
        codebaseContext: updatedContext,
      };

      await storageManager.current.saveChatSession(updatedSession);
      setActiveSession(updatedSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? updatedSession : s));

      // Add analysis summary message
      const analysisMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: `🔍 **Codebase Analysis Complete**

${analysis.summary}

**Technologies Detected:** ${analysis.technologies.join(', ') || 'None detected'}
**Architecture Patterns:** ${analysis.patterns.join(', ') || 'None detected'}
**Complexity Level:** ${analysis.complexity}
**Maintainability Score:** ${analysis.maintainability}/100

**Key Suggestions:**
${analysis.suggestions.map(s => `• ${s}`).join('\n')}

You can now ask me specific questions about your code, request refactoring suggestions, or get help with implementation details!`,
        timestamp: new Date(),
      };

      await storageManager.current.addMessageToSession(activeSession.id, analysisMessage);
      
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, analysisMessage],
      };
      setActiveSession(finalSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? finalSession : s));

      return analysis;
    } catch (error) {
      console.error('Failed to analyze codebase:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: 'I encountered an issue while analyzing your codebase. The files have been uploaded successfully, and you can still ask questions about your code.',
        timestamp: new Date(),
      };

      await storageManager.current.addMessageToSession(activeSession.id, errorMessage);
      
      const errorSession = {
        ...activeSession,
        messages: [...activeSession.messages, errorMessage],
      };
      setActiveSession(errorSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? errorSession : s));
      
      throw error;
    } finally {
      setIsLoading(false);
      setTypingIndicator({ isVisible: false });
    }
  }, [activeSession, getAnalysisService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (!activeSession || activeSession.messages.length === 0) {
      return;
    }

    const lastUserMessage = [...activeSession.messages]
      .reverse()
      .find(msg => msg.role === 'user');

    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content);
    }
  }, [activeSession, sendMessage]);

  const findCodeReferences = useCallback((query: string) => {
    if (!activeSession?.codebaseContext) {
      return [];
    }

    const analysisService = getAnalysisService();
    return analysisService.findCodeReferences(query, activeSession.codebaseContext);
  }, [activeSession, getAnalysisService]);

  const generateInsights = useCallback(async () => {
    if (!activeSession?.codebaseContext) {
      return [];
    }

    const analysisService = getAnalysisService();
    try {
      return await analysisService.generateInsights(activeSession.codebaseContext);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }, [activeSession, getAnalysisService]);

  const getContextualSuggestions = useCallback(async (query: string) => {
    if (!activeSession?.codebaseContext) {
      return [];
    }

    const analysisService = getAnalysisService();
    try {
      return await analysisService.generateContextualSuggestions(query, activeSession.codebaseContext);
    } catch (error) {
      console.error('Failed to get contextual suggestions:', error);
      return [
        'Upload code files to get personalized suggestions',
        'Ask specific questions about your code',
        'Request code reviews or refactoring advice',
      ];
    }
  }, [activeSession, getAnalysisService]);

  const setCurrentFile = useCallback((fileContext: CurrentFileContext | null) => {
    setCurrentFileContext(fileContext);
  }, []);

  const updateSessionCodebase = useCallback(async (codebaseContext: CodebaseContext) => {
    if (!activeSession) {
      throw new Error('No active session to update');
    }

    const updatedSession = {
      ...activeSession,
      codebaseContext,
      name: activeSession.name.includes('Code Analysis') 
        ? activeSession.name 
        : `${activeSession.name} - Code Analysis`,
      updatedAt: new Date(),
    };

    // Persist the session update first
    await storageManager.current.saveChatSession(updatedSession);

    // Add a small system message so the chat history explicitly reflects
    // that the AI now has access to the loaded codebase. This helps steer
    // the model away from disclaimers and gives users a clear signal.
    const contextIntroMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content: `Repository codebase attached: ${codebaseContext.files.length} files available for analysis. Ask about specific files, components, or patterns.`,
      timestamp: new Date(),
    };

    await storageManager.current.addMessageToSession(updatedSession.id, contextIntroMessage);

    // Update local state
    setActiveSession({
      ...updatedSession,
      messages: [...updatedSession.messages, contextIntroMessage],
    });
    setSessions(prev => prev.map(s => s.id === activeSession.id ? {
      ...updatedSession,
      messages: [...updatedSession.messages, contextIntroMessage],
    } : s));
    
    return updatedSession;
  }, [activeSession]);

  const analyzeCurrentFile = useCallback(async () => {
    if (!currentFileContext) {
      throw new Error('No file is currently selected');
    }
    
    try {
      setIsLoading(true);
      setTypingIndicator({ isVisible: true, message: 'Analyzing current file...' });
      
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'analysis',
          code: currentFileContext.content,
          filePath: currentFileContext.filePath,
          context: activeSession?.codebaseContext,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to analyze file');
      }

      const analysis = await apiResponse.json();
      return analysis;
    } catch (error) {
      console.error('Failed to analyze current file:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setTypingIndicator({ isVisible: false });
    }
  }, [currentFileContext, activeSession]);

  const getFileSpecificSuggestions = useCallback(async (query?: string) => {
    if (!currentFileContext) {
      return [];
    }

    const analysisService = getAnalysisService();
    
    try {
      return await analysisService.generateFileSpecificSuggestions(
        currentFileContext.filePath,
        currentFileContext.content,
        currentFileContext.language,
        query
      );
    } catch (error) {
      console.error('Failed to get file-specific suggestions:', error);
      return [
        'Select a file to get specific suggestions',
        'Ask questions about the current file',
        'Request code review or refactoring advice',
      ];
    }
  }, [currentFileContext, getAnalysisService]);

  return {
    // State
    sessions,
    activeSession,
    isLoading,
    error,
    typingIndicator,
    currentFileContext,
    
    // Actions
    createNewSession,
    switchToSession,
    deleteSession,
    deleteAllSessions,
    sendMessage,
    uploadFiles,
    analyzeCodebase,
    clearError,
    retryLastMessage,
    loadSessions,
    setCurrentFile,
    updateSessionCodebase,
    
    // Analysis features
    findCodeReferences,
    generateInsights,
    getContextualSuggestions,
    analyzeCurrentFile,
    getFileSpecificSuggestions,
  };
}
