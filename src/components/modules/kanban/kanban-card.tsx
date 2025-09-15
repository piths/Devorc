'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/types/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Github,
  GripVertical 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface KanbanCardProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  isDragging?: boolean;
}

export function KanbanCard({ card, onEdit, onDelete, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group",
        isBeingDragged && "opacity-50 rotate-2 shadow-lg"
      )}
      {...attributes}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight truncate">
            {card.title}
          </h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <div
            className="h-6 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Card Description */}
      {card.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.labels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className="text-xs px-2 py-0"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
                borderColor: `${label.color}40`,
              }}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {/* Assignee */}
          {card.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{card.assignee}</span>
            </div>
          )}

          {/* GitHub Issue Link */}
          {card.githubIssueId && (
            <div className="flex items-center gap-1">
              <Github className="h-3 w-3" />
              <span>#{card.githubIssueId}</span>
            </div>
          )}
        </div>

        {/* Due Date */}
        {card.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className={cn(
              "text-xs",
              new Date(card.dueDate) < new Date() && "text-destructive"
            )}>
              {format(new Date(card.dueDate), 'MMM dd')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}