import { GitHubSyncService } from '../GitHubSyncService';
import { GitHubApiClient } from '../GitHubApiClient';
import { KanbanBoard, Card } from '@/types/storage';
import { GitHubSyncConfig } from '@/types/github-sync';
import { GitHubIssue } from '@/types/github';

// Mock the GitHubApiClient
jest.mock('../GitHubApiClient');

const mockApiClient = {
  getIssues: jest.fn(),
  createIssue: jest.fn(),
  updateIssue: jest.fn(),
  getRepository: jest.fn(),
} as jest.Mocked<GitHubApiClient>;

describe('GitHubSyncService', () => {
  let syncService: GitHubSyncService;
  let mockBoard: KanbanBoard;
  let mockConfig: GitHubSyncConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    syncService = new GitHubSyncService(mockApiClient);

    mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: 'Test board description',
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          color: '#ff0000',
          cards: [
            {
              id: 'card-1',
              title: 'Test Card',
              description: 'Test card description',
              labels: [],
              githubIssueId: '123',
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          color: '#00ff00',
          cards: [],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockConfig = {
      enabled: true,
      repository: {
        owner: 'test-owner',
        repo: 'test-repo',
      },
      columnMappings: [
        {
          columnId: 'todo',
          columnTitle: 'To Do',
          githubLabels: ['todo'],
          issueState: 'open',
        },
        {
          columnId: 'done',
          columnTitle: 'Done',
          githubLabels: ['done'],
          issueState: 'closed',
        },
      ],
      autoSync: true,
      syncInterval: 15,
      conflictResolution: 'manual',
    };
  });

  describe('syncBoard', () => {
    it('should return error when sync is disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };

      const result = await syncService.syncBoard(mockBoard, disabledConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync is disabled');
    });

    it('should sync successfully with no conflicts', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 123,
          number: 123,
          title: 'Test Card',
          body: 'Test card description',
          state: 'open',
          user: {
            id: 1,
            login: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            html_url: 'https://github.com/test-user',
          },
          assignee: null,
          labels: [
            {
              id: 1,
              name: 'todo',
              color: 'ff0000',
              description: 'Todo label',
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/test-owner/test-repo/issues/123',
        },
      ];

      mockApiClient.getIssues.mockResolvedValue(mockIssues);

      const result = await syncService.syncBoard(mockBoard, mockConfig);

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(mockApiClient.getIssues).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        { state: 'all', per_page: 100 }
      );
    });

    it('should detect title conflicts', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 123,
          number: 123,
          title: 'Different Title', // Different from card title
          body: 'Test card description',
          state: 'open',
          user: {
            id: 1,
            login: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            html_url: 'https://github.com/test-user',
          },
          assignee: null,
          labels: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/test-owner/test-repo/issues/123',
        },
      ];

      mockApiClient.getIssues.mockResolvedValue(mockIssues);

      const result = await syncService.syncBoard(mockBoard, mockConfig);

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('title_mismatch');
      expect(result.conflicts[0].kanbanValue).toBe('Test Card');
      expect(result.conflicts[0].githubValue).toBe('Different Title');
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.getIssues.mockRejectedValue(new Error('API Error'));

      const result = await syncService.syncBoard(mockBoard, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should create new cards from GitHub issues', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 456,
          number: 456,
          title: 'New GitHub Issue',
          body: 'New issue from GitHub',
          state: 'open',
          user: {
            id: 1,
            login: 'test-user',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
            html_url: 'https://github.com/test-user',
          },
          assignee: null,
          labels: [
            {
              id: 1,
              name: 'todo',
              color: 'ff0000',
              description: 'Todo label',
            },
          ],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/test-owner/test-repo/issues/456',
        },
      ];

      mockApiClient.getIssues.mockResolvedValue(mockIssues);

      const result = await syncService.syncBoard(mockBoard, mockConfig);

      expect(result.success).toBe(true);
      expect(result.operations.some(op => op.type === 'create_card')).toBe(true);
      expect(result.stats.cardsCreated).toBe(1);
    });
  });

  describe('validateSyncConfig', () => {
    it('should validate a correct config', async () => {
      mockApiClient.getRepository.mockResolvedValue({
        id: 123,
        name: 'test-repo',
        full_name: 'test-owner/test-repo',
        description: 'Test repository',
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 5,
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/test-owner/test-repo',
        clone_url: 'https://github.com/test-owner/test-repo.git',
        default_branch: 'main',
        private: false,
      });

      const result = await syncService.validateSyncConfig(mockConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing repository info', async () => {
      const invalidConfig = {
        ...mockConfig,
        repository: { owner: '', repo: '' },
      };

      const result = await syncService.validateSyncConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Repository owner and name are required');
    });

    it('should detect missing column mappings', async () => {
      const invalidConfig = {
        ...mockConfig,
        columnMappings: [],
      };

      const result = await syncService.validateSyncConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one column mapping is required');
    });

    it('should detect API access issues', async () => {
      mockApiClient.getRepository.mockRejectedValue(new Error('Repository not found'));

      const result = await syncService.validateSyncConfig(mockConfig);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot access repository: Repository not found');
    });
  });

  describe('executeOperations', () => {
    it('should execute create card operation', async () => {
      const mockOnCardCreate = jest.fn().mockResolvedValue({
        id: 'new-card',
        title: 'New Card',
        description: 'New card description',
        labels: [],
      });

      const operations = [
        {
          id: 'op-1',
          type: 'create_card' as const,
          data: {
            columnId: 'todo',
            title: 'New Card',
            description: 'New card description',
            githubIssueId: '456',
          },
          status: 'pending' as const,
          timestamp: new Date(),
        },
      ];

      await syncService.executeOperations(
        operations,
        mockBoard,
        mockConfig,
        jest.fn(),
        mockOnCardCreate
      );

      expect(mockOnCardCreate).toHaveBeenCalledWith('todo', {
        title: 'New Card',
        description: 'New card description',
        githubIssueId: '456',
      });
      expect(operations[0].status).toBe('completed');
    });

    it('should execute update card operation', async () => {
      const mockOnCardUpdate = jest.fn().mockResolvedValue(undefined);

      const operations = [
        {
          id: 'op-1',
          type: 'update_card' as const,
          cardId: 'card-1',
          data: {
            title: 'Updated Card',
            description: 'Updated description',
          },
          status: 'pending' as const,
          timestamp: new Date(),
        },
      ];

      await syncService.executeOperations(
        operations,
        mockBoard,
        mockConfig,
        mockOnCardUpdate,
        jest.fn()
      );

      expect(mockOnCardUpdate).toHaveBeenCalledWith('card-1', {
        title: 'Updated Card',
        description: 'Updated description',
      });
      expect(operations[0].status).toBe('completed');
    });

    it('should handle operation failures', async () => {
      const mockOnCardCreate = jest.fn().mockRejectedValue(new Error('Create failed'));

      const operations = [
        {
          id: 'op-1',
          type: 'create_card' as const,
          data: {
            columnId: 'todo',
            title: 'New Card',
          },
          status: 'pending' as const,
          timestamp: new Date(),
        },
      ];

      await syncService.executeOperations(
        operations,
        mockBoard,
        mockConfig,
        jest.fn(),
        mockOnCardCreate
      );

      expect(operations[0].status).toBe('failed');
      expect(operations[0].error).toBe('Create failed');
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', () => {
      const status = syncService.getSyncStatus();

      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('errors');
      expect(status).toHaveProperty('stats');
      expect(status.isActive).toBe(false);
    });
  });

  describe('clearErrors', () => {
    it('should clear sync errors', () => {
      syncService.clearErrors();
      const status = syncService.getSyncStatus();
      expect(status.errors).toHaveLength(0);
    });
  });
});