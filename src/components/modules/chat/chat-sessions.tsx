'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Trash2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { StorageManagerDialog } from './storage-manager-dialog';
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
    deleteAllSessions,
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

  const handleClearAllSessions = async () => {
    try {
      await deleteAllSessions();
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
    }
  };

  return (
    <>
      <div className={cn('flex flex-col h-full bg-background', className)}>
        {/* Navigation Buttons */}
        <div className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-10 text-foreground hover:bg-muted/50"
            onClick={handleCreateSession}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-10 text-foreground hover:bg-muted/50"
          >
            <Search className="w-4 h-4" />
            Search chats
          </Button>
        </div>

        {/* Chat Sessions List */}
        <div className="flex-1 px-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="text-sm font-medium text-muted-foreground">
              Chats
            </div>
            <div className="flex items-center gap-1">
              <StorageManagerDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <HardDrive className="w-3 h-3" />
                </Button>
              </StorageManagerDialog>
              
              {sessions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleClearAllSessions}
                      disabled={isLoading}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Sessions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-full">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-muted-foreground mb-2">No chat sessions</p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreateSession}
                  disabled={isLoading}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50',
                      activeSession?.id === session.id && 'bg-muted'
                    )}
                    onClick={() => switchToSession(session.id)}
                  >
                    <span className="text-sm text-foreground truncate flex-1">
                      {session.name}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
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
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

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