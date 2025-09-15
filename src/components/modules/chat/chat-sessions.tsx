'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Trash2, FileText, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAIChat } from '@/hooks/useAIChat';
import { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatSessionsProps {
  className?: string;
}

export function ChatSessions({ className }: ChatSessionsProps) {
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

  const {
    sessions,
    activeSession,
    isLoading,
    createNewSession,
    switchToSession,
    deleteSession,
  } = useAIChat();

  const handleCreateSession = async () => {
    try {
      await createNewSession();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = async (session: ChatSession) => {
    try {
      await deleteSession(session.id);
      setSessionToDelete(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSessionPreview = (session: ChatSession) => {
    const lastUserMessage = [...session.messages]
      .reverse()
      .find(msg => msg.role === 'user');
    
    return lastUserMessage?.content.slice(0, 100) + 
           (lastUserMessage?.content && lastUserMessage.content.length > 100 ? '...' : '') ||
           'No messages yet';
  };

  return (
    <>
      <Card className={cn('flex flex-col h-full', className)}>
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat Sessions
            </CardTitle>
            <Button
              size="sm"
              onClick={handleCreateSession}
              disabled={isLoading}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No chat sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first chat session to get started
                </p>
                <Button onClick={handleCreateSession} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                      activeSession?.id === session.id && 'bg-muted border-primary'
                    )}
                    onClick={() => switchToSession(session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {session.name}
                          </h4>
                          {session.codebaseContext && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {session.codebaseContext.files.length}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {getSessionPreview(session)}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(session.updatedAt)}
                          </span>
                          <span>
                            {session.messages.length} messages
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDelete(session);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Session
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sessionToDelete?.name}&quot;? 
              This action cannot be undone and all messages will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && handleDeleteSession(sessionToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}