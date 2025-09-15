// GitHub-Kanban synchronization types

export interface GitHubSyncConfig {
  enabled: boolean;
  repository: {
    owner: string;
    repo: string;
  };
  // When true, sync across all repositories the user has access to.
  // Repository field is ignored for read operations; create/update operations
  // require per-card repo information.
  allRepos?: boolean;
  columnMappings: ColumnMapping[];
  autoSync: boolean;
  syncInterval: number; // minutes
  lastSync?: Date;
  conflictResolution: ConflictResolutionStrategy;
}

export interface ColumnMapping {
  columnId: string;
  columnTitle: string;
  githubLabels: string[];
  issueState?: 'open' | 'closed'; // Maps to GitHub issue state
}

export type ConflictResolutionStrategy = 'github_wins' | 'kanban_wins' | 'manual';

export interface SyncStatus {
  isActive: boolean;
  lastSync?: Date;
  nextSync?: Date;
  errors: SyncError[];
  stats: SyncStats;
}

export interface SyncStats {
  cardsCreated: number;
  cardsUpdated: number;
  cardsDeleted: number;
  issuesCreated: number;
  issuesUpdated: number;
  conflictsResolved: number;
}

export interface SyncError {
  id: string;
  type: 'api_error' | 'conflict' | 'validation_error';
  message: string;
  cardId?: string;
  issueNumber?: number;
  timestamp: Date;
  resolved: boolean;
}

export interface SyncConflict {
  id: string;
  cardId: string;
  issueNumber: number;
  type: 'title_mismatch' | 'description_mismatch' | 'state_mismatch' | 'label_mismatch';
  kanbanValue: unknown;
  githubValue: unknown;
  timestamp: Date;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'use_kanban' | 'use_github' | 'merge';
  resolvedValue: unknown;
  resolvedAt: Date;
  resolvedBy: 'user' | 'auto';
}

export interface SyncOperation {
  id: string;
  type: 'create_card' | 'update_card' | 'delete_card' | 'create_issue' | 'update_issue' | 'close_issue';
  cardId?: string;
  issueNumber?: number;
  data: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  timestamp: Date;
}

export interface GitHubSyncResult {
  success: boolean;
  operations: SyncOperation[];
  conflicts: SyncConflict[];
  stats: SyncStats;
  error?: string;
}
