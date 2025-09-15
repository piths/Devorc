'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    activeSession,
    isLoading,
    error,
    typingIndicator,
    sendMessage,
    uploadFiles,
    analyzeCodebase,
    clearError,
    retryLastMessage,
  } = useAIChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, typingIndicator]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    try {
      await sendMessage(inputValue.trim());
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    try {
      await uploadFiles(files);
      // Optionally trigger analysis after upload
      setTimeout(() => analyzeCodebase(), 1000);
    } catch (error) {
      console.error('Failed to upload files:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 p-4',
          isUser && 'flex-row-reverse',
          isSystem && 'justify-center'
        )}
      >
        {!isSystem && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isUser ? 'U' : 'AI'}
          </div>
        )}
        
        <div className={cn('flex-1 space-y-2', isUser && 'text-right', isSystem && 'text-center')}>
          <div
            className={cn(
              'inline-block p-3 rounded-lg max-w-[80%]',
              isUser
                ? 'bg-primary text-primary-foreground'
                : isSystem
                ? 'bg-muted/50 text-muted-foreground text-sm'
                : 'bg-muted text-foreground'
            )}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {message.codeReferences && message.codeReferences.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-muted-foreground font-medium">Code References:</div>
                <div className="space-y-2">
                  {message.codeReferences.map((ref, index) => (
                    <div key={index} className="bg-muted/50 rounded-md p-2 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {ref.filePath}
                        </Badge>
                        {ref.lineEnd && ref.lineEnd > ref.lineStart ? (
                          <span className="text-muted-foreground">
                            Lines {ref.lineStart}-{ref.lineEnd}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Line {ref.lineStart}
                          </span>
                        )}
                      </div>
                      <pre className="text-xs bg-background rounded px-2 py-1 overflow-x-auto">
                        <code className={`language-${ref.language}`}>
                          {ref.content}
                        </code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {!isSystem && (
            <div className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          AI Chat Assistant
          {activeSession?.codebaseContext && (
            <Badge variant="secondary" className="ml-auto">
              {activeSession.codebaseContext.files.length} files loaded
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Error Display */}
        {error && (
          <div className="p-4 border-b">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error.message}</span>
                <div className="flex gap-2">
                  {error.retryable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={retryLastMessage}
                      disabled={isLoading}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={clearError}>
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div
            className={cn(
              'min-h-full',
              isDragOver && 'bg-muted/50 border-2 border-dashed border-primary'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Ask questions about your code or upload files for analysis
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Code Files
                </Button>
              </div>
            ) : (
              <div>
                {activeSession.messages.map(renderMessage)}
                
                {/* Typing Indicator */}
                {typingIndicator.isVisible && (
                  <div className="flex gap-3 p-4">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                      AI
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            {typingIndicator.message || 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Drag Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Drop files to upload</p>
                  <p className="text-muted-foreground">
                    Supported: .js, .ts, .py, .java, .cpp, and more
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your code or project..."
              disabled={isLoading}
              className="flex-1"
            />
            
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload files"
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.clj,.hs,.ml,.vue,.svelte,.html,.css,.scss,.sass,.less,.json,.xml,.yaml,.yml,.toml,.ini,.env,.md,.txt,.sql,.sh,.bat,.ps1"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}