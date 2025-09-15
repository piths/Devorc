'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanBoard as KanbanBoardType, Card, Column } from '@/types/storage';
import { GitHubSyncConfig } from '@/types/github-sync';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { CardEditModal } from './card-edit-modal';
import { GitHubSyncConfig as GitHubSyncConfigComponent } from './github-sync-config';
import { GitHubSyncStatus } from './github-sync-status';
import { ConflictResolutionDialog } from './conflict-resolution-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Plus, Settings, Github, Pencil, Check, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { Progress } from '@/components/ui/progress';

interface KanbanBoardProps {
  boardId: string;
  onBoardUpdate?: (board: KanbanBoardType) => void;
}

export function KanbanBoard({ boardId, onBoardUpdate }: KanbanBoardProps) {
  const {
    board,
    loading,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    addColumn,
    deleteColumn,
    updateBoard,
  } = useKanbanBoard(boardId);

  const {
    syncStatus,
    conflicts,
    isConnected,
    syncBoard,
    resolveConflict,
    clearSyncErrors,
  } = useGitHubSync();
  const { user } = useGitHubAuth();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGitHubConfigOpen, setIsGitHubConfigOpen] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const [hasAutoOpenedSync, setHasAutoOpenedSync] = useState(false);
  const [hasAutoSyncedAllRepos, setHasAutoSyncedAllRepos] = useState(false);
  const [githubSyncConfig, setGitHubSyncConfig] = useState<GitHubSyncConfig | null>(
    board?.githubRepo ? {
      enabled: true,
      repository: {
        owner: board.githubRepo.owner,
        repo: board.githubRepo.repo,
      },
      columnMappings: [],
      autoSync: board.githubRepo.syncConfig.autoSync,
      syncInterval: board.githubRepo.syncConfig.syncInterval,
      conflictResolution: 'manual',
    } : null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Notify parent of board updates
  React.useEffect(() => {
    if (board && onBoardUpdate) {
      onBoardUpdate(board);
    }
  }, [board, onBoardUpdate]);

  // Keep editable fields in sync with board
  React.useEffect(() => {
    if (board) {
      setTempTitle(board.name || '');
      setTempDescription(board.description || '');
    }
  }, [board]);

  // Auto-open GitHub sync config when connected but not configured
  React.useEffect(() => {
    if (!board || !isConnected || githubSyncConfig || hasAutoOpenedSync) return;

    const defaultConfig: GitHubSyncConfig = {
      enabled: true,
      repository: {
        owner: user?.login || '',
        repo: '',
      },
      allRepos: true,
      columnMappings: board.columns.map((c) => ({
        columnId: c.id,
        columnTitle: c.title,
        githubLabels: [],
        issueState: c.title.toLowerCase().includes('done') ? 'closed' : 'open',
      })),
      autoSync: false,
      syncInterval: 15,
      conflictResolution: 'manual',
    };

    setGitHubSyncConfig(defaultConfig);
    setIsGitHubConfigOpen(true);
    setHasAutoOpenedSync(true);
  }, [board, isConnected, githubSyncConfig, hasAutoOpenedSync, user]);

  // If all-repos default config is set and enabled, kick off an initial sync once
  React.useEffect(() => {
    if (board && githubSyncConfig?.enabled && githubSyncConfig.allRepos && !hasAutoSyncedAllRepos) {
      (async () => {
        await syncBoard(board, githubSyncConfig, updateCard, addCard);
        setHasAutoSyncedAllRepos(true);
      })();
    }
  }, [board, githubSyncConfig, hasAutoSyncedAllRepos, syncBoard, updateCard, addCard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCard(active.id as string);
    setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active card and its column
    const activeCard = findCard(activeId);
    const activeColumn = findColumnByCardId(activeId);
    
    if (!activeCard || !activeColumn) return;

    // Find the over column (could be a column or a card)
    const overColumn = findColumnById(overId) || findColumnByCardId(overId);
    
    if (!overColumn || activeColumn.id === overColumn.id) return;

    // Move card to different column
    const updatedBoard = { ...board };
    const sourceColumn = updatedBoard.columns.find(col => col.id === activeColumn.id)!;
    const targetColumn = updatedBoard.columns.find(col => col.id === overColumn.id)!;

    // Remove card from source column
    sourceColumn.cards = sourceColumn.cards.filter(card => card.id !== activeId);
    
    // Add card to target column
    targetColumn.cards.push(activeCard);

    // Note: This is just for drag preview, actual update happens in handleDragEnd
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveCard(null);
    
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Find source and target columns
    const sourceColumn = findColumnByCardId(activeId);
    const targetColumn = findColumnById(overId) || findColumnByCardId(overId);

    if (sourceColumn && targetColumn && sourceColumn.id !== targetColumn.id) {
      await moveCard(activeId, sourceColumn.id, targetColumn.id);
      // If sync configured, trigger a quick sync to reflect status changes
      if (githubSyncConfig?.enabled) {
        await syncBoard(board, githubSyncConfig, updateCard, addCard);
      }
    }
  };

  const findCard = (cardId: string): Card | null => {
    if (!board) return null;
    
    for (const column of board.columns) {
      const card = column.cards.find(card => card.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const findColumnByCardId = (cardId: string): Column | null => {
    if (!board) return null;
    
    return board.columns.find(column => 
      column.cards.some(card => card.id === cardId)
    ) || null;
  };

  const findColumnById = (columnId: string): Column | null => {
    if (!board) return null;
    return board.columns.find(column => column.id === columnId) || null;
  };

  const handleAddCard = (columnId: string) => {
    setEditingColumnId(columnId);
    setEditingCard(null);
    setIsEditModalOpen(true);
  };

  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setEditingColumnId(findColumnByCardId(card.id)?.id || null);
    setIsEditModalOpen(true);
  };

  const handleSaveCard = async (cardData: Partial<Card>) => {
    if (!editingColumnId) return;

    try {
      if (editingCard) {
        // Update existing card
        await updateCard(editingCard.id, cardData);
      } else {
        // Create new card
        await addCard(editingColumnId, cardData);
      }
      
      setIsEditModalOpen(false);
      setEditingCard(null);
      setEditingColumnId(null);
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
  };

  const handleAddColumn = async () => {
    await addColumn('New Column');
  };

  const handleGitHubConfigSave = async (config: GitHubSyncConfig) => {
    if (!board) return;

    // Update board with GitHub sync configuration
    const updatedBoard: KanbanBoardType = {
      ...board,
      githubRepo: config.enabled ? {
        owner: config.repository.owner,
        repo: config.repository.repo,
        syncConfig: {
          enabled: config.enabled,
          columnMappings: config.columnMappings.reduce((acc, mapping) => {
            acc[mapping.columnId] = mapping.githubLabels.join(',');
            return acc;
          }, {} as Record<string, string>),
          autoSync: config.autoSync,
          syncInterval: config.syncInterval,
          allRepos: config.allRepos,
        },
      } : undefined,
    };

    await updateBoard(updatedBoard);
    setGitHubSyncConfig(config);
    setIsGitHubConfigOpen(false);

    // Kick off an initial sync right after saving a valid configuration
    if (config.enabled) {
      await syncBoard(updatedBoard, config, updateCard, addCard);
    }
  };

  const handleSaveTitle = async () => {
    if (!board) return;
    const trimmed = tempTitle.trim();
    if (!trimmed || trimmed === board.name) {
      setIsEditingTitle(false);
      setTempTitle(board.name);
      return;
    }
    await updateBoard({ ...board, name: trimmed });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    if (!board) return;
    const next = tempDescription;
    if (next === board.description) {
      setIsEditingDescription(false);
      setTempDescription(board.description || '');
      return;
    }
    await updateBoard({ ...board, description: next });
    setIsEditingDescription(false);
  };

  const handleManualSync = async () => {
    if (!board || !githubSyncConfig) return;

    await syncBoard(board, githubSyncConfig, updateCard, addCard);
  };

  const handleViewConflicts = () => {
    setIsConflictDialogOpen(true);
  };

  const handleResolveAllConflicts = async (strategy: 'use_kanban' | 'use_github') => {
    const unresolvedConflicts = conflicts.filter(c => !c.resolution);
    
    for (const conflict of unresolvedConflicts) {
      await resolveConflict(conflict.id, {
        strategy,
        resolvedValue: strategy === 'use_kanban' ? conflict.kanbanValue : conflict.githubValue,
        resolvedAt: new Date(),
        resolvedBy: 'user',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div 
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        ></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load board</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-xl w-full">
                <Input
                  autoFocus
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setTempTitle(board.name);
                    }
                  }}
                  onBlur={handleSaveTitle}
                  className="text-2xl font-bold h-9"
                />
                <Button size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => { setIsEditingTitle(false); setTempTitle(board.name); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold truncate" title={board.name}>{board.name}</h1>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)} aria-label="Rename board">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="mt-1">
            {isEditingDescription ? (
              <div className="flex items-start gap-2 max-w-2xl">
                <Textarea
                  autoFocus
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') handleSaveDescription();
                    if (e.key === 'Escape') {
                      setIsEditingDescription(false);
                      setTempDescription(board.description || '');
                    }
                  }}
                  onBlur={handleSaveDescription}
                  placeholder="Add a short description for your board"
                  className="min-h-[60px]"
                />
                <div className="flex flex-col gap-2">
                  <Button size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={handleSaveDescription}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => { setIsEditingDescription(false); setTempDescription(board.description || ''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {board.description ? (
                  <div className="flex items-start gap-2">
                    <p className="text-muted-foreground truncate" title={board.description}>{board.description}</p>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(true)}>Edit description</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(true)}>Add a description</Button>
                )}
              </>
            )}
          </div>
          {/* Board progress */}
          <div className="mt-3 max-w-md">
            {(() => {
              const total = board.columns.reduce((acc, c) => acc + c.cards.length, 0);
              const doneIds = board.columns.filter(c => c.title.toLowerCase().includes('done'));
              const done = doneIds.reduce((acc, c) => acc + c.cards.length, 0);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Progress: {pct}% ({done}/{total})</div>
                  <Progress value={pct} />
                </div>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddColumn} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
          <Dialog open={isGitHubConfigOpen} onOpenChange={setIsGitHubConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Github className="h-4 w-4 mr-2" />
                GitHub Sync
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[92vw] max-w-6xl h-[86vh]">
              <DialogTitle className="sr-only">GitHub Sync Configuration</DialogTitle>
              <GitHubSyncConfigComponent
                config={githubSyncConfig}
                columns={board.columns}
                onConfigChange={handleGitHubConfigSave}
                onClose={() => setIsGitHubConfigOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Main Board Area */}
        <div className="flex-1 overflow-x-auto p-4">
          {/* Empty State for New Boards */}
          {board.columns.every(c => c.cards.length === 0) && (
            <div className="mb-4">
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Getting started</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">Welcome to your new Kanban board</h2>
                <p className="text-sm text-muted-foreground mb-4">Add your first card, customize columns, or connect GitHub to sync issues.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleAddCard(board.columns[0]?.id || '')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add first card
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleAddColumn}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add a column
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsGitHubConfigOpen(true)}>
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename board
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-h-full">
              {board.columns.map((column) => (
                <SortableContext
                  key={column.id}
                  items={column.cards.map(card => card.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    column={column}
                    onAddCard={() => handleAddCard(column.id)}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onDeleteColumn={deleteColumn}
                    onRenameColumn={(id, title) => updateBoard({ ...board, columns: board.columns.map(c => c.id === id ? { ...c, title } : c) })}
                  />
                </SortableContext>
              ))}
            </div>

            <DragOverlay>
              {activeCard ? (
                <KanbanCard
                  card={activeCard}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isDragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* GitHub Sync Sidebar */}
        <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
          <GitHubSyncStatus
            config={githubSyncConfig}
            status={syncStatus}
            conflicts={conflicts}
            onManualSync={handleManualSync}
            onViewConflicts={handleViewConflicts}
            onClearErrors={clearSyncErrors}
            isConnected={isConnected}
          />
        </div>
      </div>

      {/* Card Edit Modal */}
      <CardEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCard(null);
          setEditingColumnId(null);
        }}
        onSave={handleSaveCard}
        card={editingCard}
      />

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        isOpen={isConflictDialogOpen}
        conflicts={conflicts}
        onClose={() => setIsConflictDialogOpen(false)}
        onResolveConflict={resolveConflict}
        onResolveAll={handleResolveAllConflicts}
      />
    </div>
  );
}
