'use client';

import { useEffect } from 'react';
import { ChatInterface } from './chat-interface';
import { ChatSessions } from './chat-sessions';
import { CodeInsightsPanel } from './code-insights-panel';
import { useAIChat } from '@/hooks/useAIChat';

export function ChatPage() {
  const { activeSession, createNewSession, sendMessage } = useAIChat();

  // Create initial session if none exists
  useEffect(() => {
    if (!activeSession) {
      createNewSession('Welcome Chat');
    }
  }, [activeSession, createNewSession]);

  const handleInsightClick = (insight: { type: string; filePath: string; lineStart: number; description: string }) => {
    // Send a message asking about the specific insight
    const message = `Can you explain more about this ${insight.type} in ${insight.filePath} at line ${insight.lineStart}? ${insight.description}`;
    sendMessage(message);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sessions Sidebar */}
      <div className="w-72 flex-shrink-0">
        <ChatSessions />
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1">
        <ChatInterface />
      </div>

      {/* Code Insights Panel */}
      {activeSession?.codebaseContext && (
        <div className="w-80 flex-shrink-0">
          <CodeInsightsPanel 
            codebaseContext={activeSession.codebaseContext}
            onInsightClick={handleInsightClick}
          />
        </div>
      )}
    </div>
  );
}