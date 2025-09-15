'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Github, 
  Kanban, 
  CheckCircle,
  Clock,
  FileText,
  Tag,
  GitBranch
} from 'lucide-react';
import { SyncConflict, ConflictResolution } from '@/types/github-sync';
import { formatDistanceToNow } from 'date-fns';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  conflicts: SyncConflict[];
  onClose: () => void;
  onResolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  onResolveAll: (strategy: 'use_kanban' | 'use_github') => void;
}

export function ConflictResolutionDialog({
  isOpen,
  conflicts,
  onClose,
  onResolveConflict,
  onResolveAll,
}: ConflictResolutionDialogProps) {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  
  const unresolvedConflicts = conflicts.filter(c => !c.resolution);
  const resolvedConflicts = conflicts.filter(c => c.resolution);

  const getConflictIcon = (type: SyncConflict['type']) => {
    switch (type) {
      case 'title_mismatch':
        return <FileText className="h-4 w-4" />;
      case 'description_mismatch':
        return <FileText className="h-4 w-4" />;
      case 'state_mismatch':
        return <GitBranch className="h-4 w-4" />;
      case 'label_mismatch':
        return <Tag className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getConflictTitle = (type: SyncConflict['type']) => {
    switch (type) {
      case 'title_mismatch':
        return 'Title Mismatch';
      case 'description_mismatch':
        return 'Description Mismatch';
      case 'state_mismatch':
        return 'State Mismatch';
      case 'label_mismatch':
        return 'Label Mismatch';
      default:
        return 'Unknown Conflict';
    }
  };

  const handleResolveConflict = (conflict: SyncConflict, strategy: 'use_kanban' | 'use_github') => {
    const resolution: ConflictResolution = {
      strategy,
      resolvedValue: strategy === 'use_kanban' ? conflict.kanbanValue : conflict.githubValue,
      resolvedAt: new Date(),
      resolvedBy: 'user',
    };

    onResolveConflict(conflict.id, resolution);
  };

  const renderConflictValue = (value: unknown, source: 'kanban' | 'github') => {
    const icon = source === 'kanban' ? <Kanban className="h-3 w-3" /> : <Github className="h-3 w-3" />;
    const label = source === 'kanban' ? 'Kanban' : 'GitHub';
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label} Value
        </div>
        <div className="p-3 bg-muted rounded-md text-sm">
          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Sync Conflicts ({conflicts.length})
          </DialogTitle>
          <DialogDescription>
            Resolve conflicts between Kanban cards and GitHub issues
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[60vh]">
          {/* Conflict List */}
          <div className="lg:col-span-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Conflicts</h3>
              {unresolvedConflicts.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolveAll('use_kanban')}
                  >
                    Use Kanban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolveAll('use_github')}
                  >
                    Use GitHub
                  </Button>
                </div>
              )}
            </div>
            
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {unresolvedConflicts.map((conflict) => (
                  <Card
                    key={conflict.id}
                    className={`cursor-pointer transition-colors ${
                      selectedConflict === conflict.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedConflict(conflict.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {getConflictIcon(conflict.type)}
                        {getConflictTitle(conflict.type)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Card #{conflict.cardId} ↔ Issue #{conflict.issueNumber}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(conflict.timestamp, { addSuffix: true })}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {resolvedConflicts.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="text-sm font-medium text-muted-foreground">Resolved</h4>
                    {resolvedConflicts.map((conflict) => (
                      <Card key={conflict.id} className="opacity-60">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {getConflictTitle(conflict.type)}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Resolved: {conflict.resolution?.strategy.replace('_', ' ')}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Conflict Details */}
          <div className="lg:col-span-2">
            {selectedConflict ? (
              (() => {
                const conflict = conflicts.find(c => c.id === selectedConflict);
                if (!conflict) return null;

                return (
                  <div className="space-y-4 h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{getConflictTitle(conflict.type)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Card #{conflict.cardId} ↔ Issue #{conflict.issueNumber}
                        </p>
                      </div>
                      {conflict.resolution && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="space-y-4">
                        {renderConflictValue(conflict.kanbanValue, 'kanban')}
                        {renderConflictValue(conflict.githubValue, 'github')}

                        {conflict.resolution && (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-1">
                                <div>
                                  <strong>Resolution:</strong> {conflict.resolution.strategy.replace('_', ' ')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Resolved {formatDistanceToNow(conflict.resolution.resolvedAt, { addSuffix: true })} 
                                  by {conflict.resolution.resolvedBy}
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </ScrollArea>

                    {!conflict.resolution && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict, 'use_kanban')}
                          className="flex-1"
                        >
                          <Kanban className="h-4 w-4 mr-2" />
                          Use Kanban Value
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict, 'use_github')}
                          className="flex-1"
                        >
                          <Github className="h-4 w-4 mr-2" />
                          Use GitHub Value
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a conflict to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {unresolvedConflicts.length} unresolved, {resolvedConflicts.length} resolved
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {unresolvedConflicts.length === 0 && (
                <Button onClick={onClose}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  All Resolved
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}