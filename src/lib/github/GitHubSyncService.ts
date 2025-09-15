import { GitHubApiClient } from './GitHubApiClient';
import { GitHubIssue, CreateIssueRequest, UpdateIssueRequest } from '@/types/github';
import { KanbanBoard, Card, Column } from '@/types/storage';
import {
  GitHubSyncConfig,
  SyncStatus,
  SyncConflict,
  SyncOperation,
  GitHubSyncResult,
  SyncStats,
  SyncError,
  ConflictResolution,
} from '@/types/github-sync';

export class GitHubSyncService {
  private apiClient: GitHubApiClient;
  private syncStatus: SyncStatus;
  private activeOperations: Map<string, SyncOperation> = new Map();

  constructor(apiClient: GitHubApiClient) {
    this.apiClient = apiClient;
    this.syncStatus = {
      isActive: false,
      errors: [],
      stats: this.createEmptyStats(),
    };
  }

  private createEmptyStats(): SyncStats {
    return {
      cardsCreated: 0,
      cardsUpdated: 0,
      cardsDeleted: 0,
      issuesCreated: 0,
      issuesUpdated: 0,
      conflictsResolved: 0,
    };
  }

  async syncBoard(board: KanbanBoard, config: GitHubSyncConfig): Promise<GitHubSyncResult> {
    if (!config.enabled) {
      return {
        success: false,
        operations: [],
        conflicts: [],
        stats: this.createEmptyStats(),
        error: 'Sync is disabled',
      };
    }

    this.syncStatus.isActive = true;
    this.syncStatus.lastSync = new Date();
    
    const operations: SyncOperation[] = [];
    const conflicts: SyncConflict[] = [];
    const stats = this.createEmptyStats();

    try {
      if (config.allRepos) {
        // Aggregate open issues from all repositories
        const repos = await this.apiClient.getRepositories({ type: 'owner', per_page: 100 });
        type EnrichedIssue = { issue: GitHubIssue; owner: string; repo: string };
        const enrichedIssues: EnrichedIssue[] = [];

        for (const repo of repos) {
          const [owner, name] = repo.full_name.split('/');
          if (!owner || !name) continue;
          const issues = await this.apiClient.getIssues(owner, name, { state: 'open', per_page: 100 });
          for (const issue of issues) {
            // Exclude PRs if returned in issues list
            if ((issue as any).pull_request) continue; // eslint-disable-line @typescript-eslint/no-explicit-any
            enrichedIssues.push({ issue, owner, repo: name });
          }
        }

        // Build card lookup by composite key
        const cardsByKey = new Map<string, Card>();
        const keyFor = (owner: string, repo: string, num: number) => `${owner}/${repo}#${num}`;
        for (const column of board.columns) {
          for (const card of column.cards) {
            if (card.githubIssueId && card.githubRepo) {
              const key = keyFor(card.githubRepo.owner, card.githubRepo.repo, parseInt(card.githubIssueId));
              cardsByKey.set(key, card);
            }
          }
        }

        // Sync issues -> cards
        for (const { issue, owner, repo } of enrichedIssues) {
          const key = keyFor(owner, repo, issue.number);
          const existingCard = cardsByKey.get(key);
          if (existingCard) {
            const updateConflicts = this.detectCardUpdateConflicts(existingCard, issue);
            if (updateConflicts.length > 0) {
              conflicts.push(...updateConflicts);
            } else {
              const op = this.createUpdateCardOperation(existingCard, issue, config, { owner, repo });
              operations.push(op);
              stats.cardsUpdated++;
            }
          } else {
            const targetColumn = this.findTargetColumnForIssue(issue, config);
            if (targetColumn) {
              const op = this.createCardFromIssueOperation(issue, targetColumn.id, config, { owner, repo });
              operations.push(op);
              stats.cardsCreated++;
            }
          }
        }

        // Build issues by key for updates
        const issuesByKey = new Map<string, GitHubIssue>();
        for (const { issue, owner, repo } of enrichedIssues) {
          issuesByKey.set(keyFor(owner, repo, issue.number), issue);
        }

        // Sync cards -> issues (updates only when repo info is present)
        for (const column of board.columns) {
          for (const card of column.cards) {
            if (!card.githubIssueId || !card.githubRepo) continue;
            const key = keyFor(card.githubRepo.owner, card.githubRepo.repo, parseInt(card.githubIssueId));
            const existingIssue = issuesByKey.get(key);
            if (existingIssue) {
              const updateConflicts = this.detectIssueUpdateConflicts(card, existingIssue, column, config);
              if (updateConflicts.length > 0) {
                conflicts.push(...updateConflicts);
              } else {
                const op = this.createUpdateIssueOperation(card, existingIssue, column, config, card.githubRepo);
                operations.push(op);
                stats.issuesUpdated++;
              }
            }
            // skip creating new issues in allRepos mode without explicit repo selection
          }
        }
      } else {
        // Single repository mode
        // Fetch current GitHub issues
        const githubIssues = await this.apiClient.getIssues(
          config.repository.owner,
          config.repository.repo,
          { state: 'all', per_page: 100 }
        );

        // Create maps for efficient lookups
        const cardsByIssueId = new Map<string, Card>();
        const issuesByNumber = new Map<number, GitHubIssue>();
        
        // Build card lookup map
        for (const column of board.columns) {
          for (const card of column.cards) {
            if (card.githubIssueId) {
              cardsByIssueId.set(card.githubIssueId, card);
            }
          }
        }

        // Build issue lookup map
        for (const issue of githubIssues) {
          issuesByNumber.set(issue.number, issue);
        }

        // Sync GitHub issues to Kanban cards
        const issueToCardResult = await this.syncIssuesToCards(
          githubIssues,
          board,
          config,
          cardsByIssueId
        );
        operations.push(...issueToCardResult.operations);
        conflicts.push(...issueToCardResult.conflicts);
        this.mergeStats(stats, issueToCardResult.stats);

        // Sync Kanban cards to GitHub issues
        const cardToIssueResult = await this.syncCardsToIssues(
          board,
          config,
          issuesByNumber
        );
        operations.push(...cardToIssueResult.operations);
        conflicts.push(...cardToIssueResult.conflicts);
        this.mergeStats(stats, cardToIssueResult.stats);
      }

      // Resolve conflicts based on strategy
      const resolvedConflicts = await this.resolveConflicts(
        conflicts,
        config.conflictResolution,
        board,
        config
      );
      stats.conflictsResolved = resolvedConflicts.length;

      this.syncStatus.stats = stats;
      this.syncStatus.isActive = false;

      return {
        success: true,
        operations,
        conflicts: conflicts.filter(c => !c.resolution),
        stats,
      };
    } catch (error) {
      this.syncStatus.isActive = false;
      const syncError: SyncError = {
        id: `sync_${Date.now()}`,
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date(),
        resolved: false,
      };
      this.syncStatus.errors.push(syncError);

      return {
        success: false,
        operations,
        conflicts,
        stats,
        error: syncError.message,
      };
    }
  }

  private async syncIssuesToCards(
    githubIssues: GitHubIssue[],
    board: KanbanBoard,
    config: GitHubSyncConfig,
    cardsByIssueId: Map<string, Card>
  ): Promise<{ operations: SyncOperation[]; conflicts: SyncConflict[]; stats: SyncStats }> {
    const operations: SyncOperation[] = [];
    const conflicts: SyncConflict[] = [];
    const stats = this.createEmptyStats();

    for (const issue of githubIssues) {
      const issueId = issue.number.toString();
      const existingCard = cardsByIssueId.get(issueId);

      if (existingCard) {
        // Update existing card
        const updateConflicts = this.detectCardUpdateConflicts(existingCard, issue);
        if (updateConflicts.length > 0) {
          conflicts.push(...updateConflicts);
        } else {
          const operation = this.createUpdateCardOperation(existingCard, issue, config);
          operations.push(operation);
          stats.cardsUpdated++;
        }
        } else {
          // Create new card from issue
          const targetColumn = this.findTargetColumnForIssue(issue, config);
          if (targetColumn) {
          const operation = this.createCardFromIssueOperation(issue, targetColumn.id, config, { owner: config.repository.owner, repo: config.repository.repo });
          operations.push(operation);
          stats.cardsCreated++;
          }
      }
    }

    return { operations, conflicts, stats };
  }

  private async syncCardsToIssues(
    board: KanbanBoard,
    config: GitHubSyncConfig,
    issuesByNumber: Map<number, GitHubIssue>
  ): Promise<{ operations: SyncOperation[]; conflicts: SyncConflict[]; stats: SyncStats }> {
    const operations: SyncOperation[] = [];
    const conflicts: SyncConflict[] = [];
    const stats = this.createEmptyStats();

    for (const column of board.columns) {
      for (const card of column.cards) {
        if (card.githubIssueId) {
          const issueNumber = parseInt(card.githubIssueId);
          const existingIssue = issuesByNumber.get(issueNumber);

          if (existingIssue) {
            // Update existing issue
            const updateConflicts = this.detectIssueUpdateConflicts(card, existingIssue, column, config);
            if (updateConflicts.length > 0) {
              conflicts.push(...updateConflicts);
            } else {
              const operation = this.createUpdateIssueOperation(card, existingIssue, column, config);
              operations.push(operation);
              stats.issuesUpdated++;
            }
          }
        } else {
          // Create new issue from card (if configured to do so)
          if (config.autoSync) {
            const operation = this.createIssueFromCardOperation(card, column, config);
            operations.push(operation);
            stats.issuesCreated++;
          }
        }
      }
    }

    return { operations, conflicts, stats };
  }

  private detectCardUpdateConflicts(card: Card, issue: GitHubIssue): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const baseId = `conflict_${card.id}_${issue.number}`;

    if (card.title !== issue.title) {
      conflicts.push({
        id: `${baseId}_title`,
        cardId: card.id,
        issueNumber: issue.number,
        type: 'title_mismatch',
        kanbanValue: card.title,
        githubValue: issue.title,
        timestamp: new Date(),
      });
    }

    if (card.description !== (issue.body || '')) {
      conflicts.push({
        id: `${baseId}_description`,
        cardId: card.id,
        issueNumber: issue.number,
        type: 'description_mismatch',
        kanbanValue: card.description,
        githubValue: issue.body || '',
        timestamp: new Date(),
      });
    }

    return conflicts;
  }

  private detectIssueUpdateConflicts(
    card: Card,
    issue: GitHubIssue,
    column: Column,
    config: GitHubSyncConfig
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const baseId = `conflict_${card.id}_${issue.number}`;

    // Check if column mapping conflicts with issue state
    const columnMapping = config.columnMappings.find(m => m.columnId === column.id);
    if (columnMapping && columnMapping.issueState && columnMapping.issueState !== issue.state) {
      conflicts.push({
        id: `${baseId}_state`,
        cardId: card.id,
        issueNumber: issue.number,
        type: 'state_mismatch',
        kanbanValue: columnMapping.issueState,
        githubValue: issue.state,
        timestamp: new Date(),
      });
    }

    return conflicts;
  }

  private findTargetColumnForIssue(issue: GitHubIssue, config: GitHubSyncConfig): Column | null {
    // Find column based on issue state and labels
    for (const mapping of config.columnMappings) {
      if (mapping.issueState && mapping.issueState === issue.state) {
        // Check if labels match
        const issueLabels = issue.labels.map(l => l.name);
        const hasMatchingLabel = mapping.githubLabels.some(label => 
          issueLabels.includes(label)
        );
        
        if (hasMatchingLabel || mapping.githubLabels.length === 0) {
          // Return a mock column object - in real implementation, this would reference the actual column
          return { id: mapping.columnId, title: mapping.columnTitle } as Column;
        }
      }
    }

    // Default to first column if no mapping found
    return config.columnMappings.length > 0 
      ? { id: config.columnMappings[0].columnId, title: config.columnMappings[0].columnTitle } as Column
      : null;
  }

  private createUpdateCardOperation(card: Card, issue: GitHubIssue, config: GitHubSyncConfig, repoRef?: { owner: string; repo: string }): SyncOperation {
    return {
      id: `update_card_${card.id}_${Date.now()}`,
      type: 'update_card',
      cardId: card.id,
      issueNumber: issue.number,
      data: {
        title: issue.title,
        description: issue.body || '',
        labels: issue.labels.map(l => ({
          id: l.id.toString(),
          name: l.name,
          color: `#${l.color}`,
          description: l.description,
        })),
        assignee: issue.assignee?.login,
        githubRepo: repoRef ?? { owner: config.repository.owner, repo: config.repository.repo },
      },
      status: 'pending',
      timestamp: new Date(),
    };
  }

  private createCardFromIssueOperation(issue: GitHubIssue, columnId: string, config: GitHubSyncConfig, repoRef?: { owner: string; repo: string }): SyncOperation {
    return {
      id: `create_card_${issue.number}_${Date.now()}`,
      type: 'create_card',
      issueNumber: issue.number,
      data: {
        columnId,
        title: issue.title,
        description: issue.body || '',
        githubIssueId: issue.number.toString(),
        githubRepo: repoRef ?? { owner: config.repository.owner, repo: config.repository.repo },
        labels: issue.labels.map(l => ({
          id: l.id.toString(),
          name: l.name,
          color: `#${l.color}`,
          description: l.description,
        })),
        assignee: issue.assignee?.login,
      },
      status: 'pending',
      timestamp: new Date(),
    };
  }

  private createUpdateIssueOperation(
    card: Card,
    issue: GitHubIssue,
    column: Column,
    config: GitHubSyncConfig,
    repoRef?: { owner: string; repo: string }
  ): SyncOperation {
    const columnMapping = config.columnMappings.find(m => m.columnId === column.id);
    
    return {
      id: `update_issue_${issue.number}_${Date.now()}`,
      type: 'update_issue',
      cardId: card.id,
      issueNumber: issue.number,
      data: {
        title: card.title,
        body: card.description,
        state: columnMapping?.issueState || issue.state,
        labels: card.labels.map(l => l.name),
        repoOwner: repoRef?.owner,
        repoName: repoRef?.repo,
      },
      status: 'pending',
      timestamp: new Date(),
    };
  }

  private createIssueFromCardOperation(card: Card, column: Column, config: GitHubSyncConfig): SyncOperation {
    const columnMapping = config.columnMappings.find(m => m.columnId === column.id);
    const repoOwner = card.githubRepo?.owner || config.repository.owner;
    const repoName = card.githubRepo?.repo || config.repository.repo;
    
    return {
      id: `create_issue_${card.id}_${Date.now()}`,
      type: 'create_issue',
      cardId: card.id,
      data: {
        title: card.title,
        body: card.description,
        labels: [...card.labels.map(l => l.name), ...(columnMapping?.githubLabels || [])],
        assignee: card.assignee,
        repoOwner,
        repoName,
      },
      status: 'pending',
      timestamp: new Date(),
    };
  }

  private async resolveConflicts(
    conflicts: SyncConflict[],
    strategy: string,
    board: KanbanBoard,
    config: GitHubSyncConfig
  ): Promise<SyncConflict[]> {
    const resolved: SyncConflict[] = [];

    for (const conflict of conflicts) {
      if (strategy === 'manual') {
        // Skip auto-resolution for manual strategy
        continue;
      }

      const resolution: ConflictResolution = {
        strategy: strategy === 'github_wins' ? 'use_github' : 'use_kanban',
        resolvedValue: strategy === 'github_wins' ? conflict.githubValue : conflict.kanbanValue,
        resolvedAt: new Date(),
        resolvedBy: 'auto',
      };

      conflict.resolution = resolution;
      resolved.push(conflict);
    }

    return resolved;
  }

  private mergeStats(target: SyncStats, source: SyncStats): void {
    target.cardsCreated += source.cardsCreated;
    target.cardsUpdated += source.cardsUpdated;
    target.cardsDeleted += source.cardsDeleted;
    target.issuesCreated += source.issuesCreated;
    target.issuesUpdated += source.issuesUpdated;
    target.conflictsResolved += source.conflictsResolved;
  }

  async executeOperations(
    operations: SyncOperation[],
    board: KanbanBoard,
    config: GitHubSyncConfig,
    onCardUpdate: (cardId: string, updates: Partial<Card>) => Promise<void>,
    onCardCreate: (columnId: string, card: Partial<Card>) => Promise<Card>
  ): Promise<void> {
    for (const operation of operations) {
      try {
        operation.status = 'in_progress';
        
        switch (operation.type) {
          case 'create_card':
            await this.executeCreateCard(operation, onCardCreate);
            break;
          case 'update_card':
            await this.executeUpdateCard(operation, onCardUpdate);
            break;
          case 'create_issue':
            await this.executeCreateIssue(operation, config);
            break;
          case 'update_issue':
            await this.executeUpdateIssue(operation, config);
            break;
        }
        
        operation.status = 'completed';
      } catch (error) {
        operation.status = 'failed';
        operation.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  private async executeCreateCard(
    operation: SyncOperation,
    onCardCreate: (columnId: string, card: Partial<Card>) => Promise<Card>
  ): Promise<void> {
    const { columnId, ...cardData } = operation.data as { columnId: string; [key: string]: unknown };
    await onCardCreate(columnId, cardData);
  }

  private async executeUpdateCard(
    operation: SyncOperation,
    onCardUpdate: (cardId: string, updates: Partial<Card>) => Promise<void>
  ): Promise<void> {
    if (!operation.cardId) return;
    await onCardUpdate(operation.cardId, operation.data as Partial<Card>);
  }

  private async executeCreateIssue(operation: SyncOperation, config: GitHubSyncConfig): Promise<void> {
    const issueData = operation.data as unknown as CreateIssueRequest;
    const owner = (operation.data as { repoOwner?: string }).repoOwner || config.repository.owner;
    const repo = (operation.data as { repoName?: string }).repoName || config.repository.repo;
    const issue = await this.apiClient.createIssue(
      owner,
      repo,
      issueData
    );
    
    // Store the created issue number for future reference
    operation.issueNumber = issue.number;
  }

  private async executeUpdateIssue(operation: SyncOperation, config: GitHubSyncConfig): Promise<void> {
    if (!operation.issueNumber) return;
    
    const updateData = operation.data as unknown as UpdateIssueRequest;
    const owner = (operation.data as { repoOwner?: string }).repoOwner || config.repository.owner;
    const repo = (operation.data as { repoName?: string }).repoName || config.repository.repo;
    await this.apiClient.updateIssue(
      owner,
      repo,
      operation.issueNumber,
      updateData
    );
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  clearErrors(): void {
    this.syncStatus.errors = [];
  }

  async validateSyncConfig(config: GitHubSyncConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!config.allRepos) {
      if (!config.repository.owner || !config.repository.repo) {
        errors.push('Repository owner and name are required');
      }
    }

    if (config.columnMappings.length === 0) {
      errors.push('At least one column mapping is required');
    }

    // Validate column mappings
    for (const mapping of config.columnMappings) {
      if (!mapping.columnId || !mapping.columnTitle) {
        errors.push('Column ID and title are required for all mappings');
      }
    }

    // Test API access if no basic validation errors
    if (errors.length === 0 && !config.allRepos) {
      try {
        await this.apiClient.getRepository(config.repository.owner, config.repository.repo);
      } catch (error) {
        errors.push(`Cannot access repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
