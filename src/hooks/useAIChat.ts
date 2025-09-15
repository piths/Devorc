import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, ChatMessage, CodebaseContext, ChatError, TypingIndicator, CodeReference } from '@/types/chat';
import { ChatStorageManager } from '@/lib/storage/ChatStorageManager';
import { OpenAIApiClient } from '@/lib/openai/OpenAIApiClient';
import { FileUploadHandler } from '@/lib/chat/FileUploadHandler';
import { CodeAnalysisService } from '@/lib/chat/CodeAnalysisService';

export function useAIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({ isVisible: false });
  
  const storageManager = useRef(new ChatStorageManager());
  const openaiClient = useRef<OpenAIApiClient | null>(null);
  const analysisService = useRef<CodeAnalysisService | null>(null);

  // Initialize clients lazily
  const getOpenAIClient = useCallback(() => {
    if (!openaiClient.current) {
      try {
        openaiClient.current = new OpenAIApiClient();
      } catch (error) {
        console.warn('OpenAI client initialization failed:', error);
        return null;
      }
    }
    return openaiClient.current;
  }, []);

  const getAnalysisService = useCallback(() => {
    if (!analysisService.current) {
      const client = getOpenAIClient();
      analysisService.current = new CodeAnalysisService(client || undefined);
    }
    return analysisService.current;
  }, [getOpenAIClient]);

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

  const sendMessage = useCallback(async (content: string) => {
    if (!activeSession) {
      throw new Error('No active session');
    }

    const client = getOpenAIClient();
    const analysisService = getAnalysisService();

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    try {
      // Add user message
      await storageManager.current.addMessageToSession(activeSession.id, userMessage);
      
      // Update local state
      const updatedSession = {
        ...activeSession,
        messages: [...activeSession.messages, userMessage],
      };
      setActiveSession(updatedSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? updatedSession : s));

      // Show typing indicator
      setTypingIndicator({ isVisible: true, message: 'Analyzing your code...' });
      setError(null);

      let response: { content: string; codeReferences?: CodeReference[] };
      let codeReferences: CodeReference[] = [];

      if (client && activeSession.codebaseContext) {
        // Use enhanced contextual response with code analysis
        const relevantFiles = analysisService.findRelevantFiles(content, activeSession.codebaseContext);
        response = await client.generateContextualResponse(
          content,
          activeSession.codebaseContext,
          relevantFiles.map(f => f.path)
        );
        codeReferences = response.codeReferences || [];
      } else if (client) {
        // Fallback to basic chat completion
        const basicResponse = await client.chatCompletion(
          updatedSession.messages,
          activeSession.codebaseContext
        );
        response = { content: basicResponse.content, codeReferences: basicResponse.codeReferences };
        codeReferences = basicResponse.codeReferences || [];
      } else {
        // No AI client available
        response = {
          content: 'AI features are not available. Please configure your OpenAI API key to enable intelligent code analysis and suggestions.',
          codeReferences: [],
        };
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        codeReferences,
      };

      // Add assistant message
      await storageManager.current.addMessageToSession(activeSession.id, assistantMessage);
      
      // Update local state
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      };
      setActiveSession(finalSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? finalSession : s));

    } catch (error) {
      console.error('Failed to send message:', error);
      const chatError = error as ChatError;
      setError(chatError);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${chatError.message}. ${chatError.retryable ? 'You can try again.' : ''}`,
        timestamp: new Date(),
      };

      await storageManager.current.addMessageToSession(activeSession.id, errorMessage);
      
      const errorSession = {
        ...activeSession,
        messages: [...activeSession.messages, userMessage, errorMessage],
      };
      setActiveSession(errorSession);
      setSessions(prev => prev.map((s: ChatSession) => s.id === activeSession.id ? errorSession : s));
    } finally {
      setTypingIndicator({ isVisible: false });
    }
  }, [activeSession, getOpenAIClient, getAnalysisService]);

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
      
      // Perform comprehensive analysis
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

  return {
    // State
    sessions,
    activeSession,
    isLoading,
    error,
    typingIndicator,
    
    // Actions
    createNewSession,
    switchToSession,
    deleteSession,
    sendMessage,
    uploadFiles,
    analyzeCodebase,
    clearError,
    retryLastMessage,
    loadSessions,
    
    // Analysis features
    findCodeReferences,
    generateInsights,
    getContextualSuggestions,
  };
}