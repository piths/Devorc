'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Card } from '@/types/storage';
import { KanbanCard } from './kanban-card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Trash2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: Column;
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn?: (columnId: string, title: string) => void;
}

export function KanbanColumn({
  column,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteColumn,
  onRenameColumn,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(column.title);

  return (
    <div className="flex flex-col w-80 bg-muted/50 rounded-lg">
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                className="bg-transparent border-b border-muted-foreground/40 focus:outline-none focus:border-foreground text-sm font-semibold"
                value={tempTitle}
                autoFocus
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRenameColumn?.(column.id, tempTitle.trim() || column.title);
                    setIsEditing(false);
                  }
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setTempTitle(column.title);
                  }
                }}
                onBlur={() => {
                  onRenameColumn?.(column.id, tempTitle.trim() || column.title);
                  setIsEditing(false);
                }}
              />
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onRenameColumn?.(column.id, tempTitle.trim() || column.title); setIsEditing(false); }}>
                <Check className="h-4 w-4" />
              </button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setIsEditing(false); setTempTitle(column.title); }}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{column.title}</h3>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)} aria-label="Rename column">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Column</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the &quot;{column.title}&quot; column? This action cannot be undone.
                  {column.cards.length > 0 && (
                    <span className="block mt-2 text-destructive font-medium">
                      Warning: This column contains {column.cards.length} card{column.cards.length !== 1 ? 's' : ''} that will also be deleted.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteColumn(column.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Column
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-4 min-h-[200px] transition-colors",
          isOver && "bg-muted"
        )}
      >
        <SortableContext
          items={column.cards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {column.cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </div>
        </SortableContext>

        {/* Add Card Button */}
        <Button
          variant="ghost"
          className="w-full mt-3 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
          onClick={onAddCard}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>
    </div>
  );
}
