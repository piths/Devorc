'use client';

import { useState, useCallback, useEffect } from 'react';
import { GitHubSyncService } from '@/lib/github/GitHubSyncService';
import { GitHubApiClient } from '@/lib/github/GitHubApiClient';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { KanbanBoard, Card } from '@/types/storage';
import {
  GitHubSyncConfig,
  SyncStatus,
  SyncConflict,
  GitHubSyncResult,
  ConflictResolution,
} from '@/types/github-sync';
import { toast } from 'sonner';

export function useGitHubSync() {
  const { connection } = useGitHubAuth();
  const [syncService, setSyncService] = useState<GitHubSyncService | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    errors: [],
    stats: {
      cardsCreated: 0,
      cardsUpdated: 0,
      cardsDeleted: 0,
      issuesCreated: 0,
      issuesUpdated: 0,
      conflictsResolved: 0,
    },
  });
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<GitHubSyncResult | null>(null);

  // Initialize sync service when GitHub connection is available
  useEffect(() => {
    const token = (connection as { accessToken?: string; access_token?: string })?.accessToken || (connection as { accessToken?: string; access_token?: string })?.access_token; // support both shapes
    if (token) {
      const apiClient = new GitHubApiClient(token);
      const service = new GitHubSyncService(apiClient);
      setSyncService(service);
    } else {
      setSyncService(null);
    }
  }, [connection]);

  // Update sync status periodically
  useEffect(() => {
    if (!syncService) return;

    const updateStatus = () => {
      const status = syncService.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [syncService]);

  const syncBoard = useCallback(async (
    board: KanbanBoard,
    config: GitHubSyncConfig,
    onCardUpdate: (cardId: string, updates: Partial<Card>) => Promise<void>,
    onCardCreate: (columnId: string, card: Partial<Card>) => Promise<Card>
  ): Promise<GitHubSyncResult> => {
    if (!syncService) {
      const error = 'GitHub sync service not available';
      toast.error(error);
      return {
        success: false,
        operations: [],
        conflicts: [],
        stats: syncStatus.stats,
        error,
      };
    }

    try {
      toast.info('Starting GitHub sync...');
      
      const result = await syncService.syncBoard(board, config);
      setLastSyncResult(result);
      
      if (result.success) {
        // Execute the sync operations
        await syncService.executeOperations(
          result.operations,
          board,
          config,
          onCardUpdate,
          onCardCreate
        );

        setConflicts(result.conflicts);
        
        if (result.conflicts.length > 0) {
          toast.warning(`Sync completed with ${result.conflicts.length} conflicts`);
        } else {
          toast.success('GitHub sync completed successfully');
        }
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      toast.error(`Sync failed: ${errorMessage}`);
      
      return {
        success: false,
        operations: [],
        conflicts: [],
        stats: syncStatus.stats,
        error: errorMessage,
      };
    }
  }, [syncService, syncStatus.stats]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    conflict.resolution = resolution;
    
    setConflicts(prev => 
      prev.map(c => c.id === conflictId ? { ...c, resolution } : c)
    );

    toast.success('Conflict resolved');
  }, [conflicts]);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  const clearSyncErrors = useCallback(() => {
    if (syncService) {
      syncService.clearErrors();
    }
  }, [syncService]);

  const validateSyncConfig = useCallback(async (
    config: GitHubSyncConfig
  ): Promise<{ valid: boolean; errors: string[] }> => {
    if (!syncService) {
      return {
        valid: false,
        errors: ['GitHub sync service not available'],
      };
    }

    return syncService.validateSyncConfig(config);
  }, [syncService]);

  const getRepositoryInfo = useCallback(async (owner: string, repo: string) => {
    const token = (connection as { accessToken?: string; access_token?: string })?.accessToken || (connection as { accessToken?: string; access_token?: string })?.access_token;
    if (!syncService || !token) {
      throw new Error('GitHub connection not available');
    }

    const apiClient = new GitHubApiClient(token);
    return apiClient.getRepository(owner, repo);
  }, [syncService, connection]);

  const getRepositoryLabels = useCallback(async (owner: string, repo: string) => {
    const token = (connection as { accessToken?: string; access_token?: string })?.accessToken || (connection as { accessToken?: string; access_token?: string })?.access_token;
    if (!token) {
      throw new Error('GitHub connection not available');
    }

    const apiClient = new GitHubApiClient(token);
    
    // Get issues to extract unique labels
    const issues = await apiClient.getIssues(owner, repo, { state: 'all', per_page: 100 });
    const labelMap = new Map();
    
    issues.forEach(issue => {
      issue.labels.forEach(label => {
        labelMap.set(label.name, label);
      });
    });

    return Array.from(labelMap.values());
  }, [connection]);

  return {
    // State
    syncStatus,
    conflicts,
    lastSyncResult,
    isConnected: !!((connection as { accessToken?: string; access_token?: string })?.accessToken || (connection as { accessToken?: string; access_token?: string })?.access_token),
    
    // Actions
    syncBoard,
    resolveConflict,
    clearConflicts,
    clearSyncErrors,
    validateSyncConfig,
    getRepositoryInfo,
    getRepositoryLabels,
  };
}
