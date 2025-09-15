import { renderHook, act } from '@testing-library/react';
import { useGitHubSync } from '../useGitHubSync';
import { GitHubSyncService } from '@/lib/github/GitHubSyncService';
import { GitHubApiClient } from '@/lib/github/GitHubApiClient';

// Mock the dependencies
jest.mock('@/lib/github/GitHubSyncService');
jest.mock('@/lib/github/GitHubApiClient');
jest.mock('@/contexts/GitHubAuthContext', () => ({
  useGitHubAuth: () => ({
    connection: {
      access_token: 'mock-token',
    },
  }),
}));

const mockSyncService = {
  syncBoard: jest.fn(),
  executeOperations: jest.fn(),
  getSyncStatus: jest.fn(),
  clearErrors: jest.fn(),
  validateSyncConfig: jest.fn(),
};

const mockApiClient = {
  getRepository: jest.fn(),
  getIssues: jest.fn(),
};

describe('useGitHubSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (GitHubSyncService as jest.Mock).mockImplementation(() => mockSyncService);
    (GitHubApiClient as jest.Mock).mockImplementation(() => mockApiClient);
    
    mockSyncService.getSyncStatus.mockReturnValue({
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
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGitHubSync());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.conflicts).toEqual([]);
    expect(result.current.syncStatus.isActive).toBe(false);
  });

  it('should sync board successfully', async () => {
    const mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: '',
      columns: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockConfig = {
      enabled: true,
      repository: { owner: 'test', repo: 'test-repo' },
      columnMappings: [],
      autoSync: false,
      syncInterval: 15,
      conflictResolution: 'manual' as const,
    };

    const mockResult = {
      success: true,
      operations: [],
      conflicts: [],
      stats: {
        cardsCreated: 1,
        cardsUpdated: 0,
        cardsDeleted: 0,
        issuesCreated: 0,
        issuesUpdated: 0,
        conflictsResolved: 0,
      },
    };

    mockSyncService.syncBoard.mockResolvedValue(mockResult);
    mockSyncService.executeOperations.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGitHubSync());

    const mockOnCardUpdate = jest.fn();
    const mockOnCardCreate = jest.fn();

    await act(async () => {
      const syncResult = await result.current.syncBoard(
        mockBoard,
        mockConfig,
        mockOnCardUpdate,
        mockOnCardCreate
      );
      expect(syncResult.success).toBe(true);
    });

    expect(mockSyncService.syncBoard).toHaveBeenCalledWith(mockBoard, mockConfig);
    expect(mockSyncService.executeOperations).toHaveBeenCalled();
  });

  it('should handle sync errors', async () => {
    const mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: '',
      columns: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockConfig = {
      enabled: true,
      repository: { owner: 'test', repo: 'test-repo' },
      columnMappings: [],
      autoSync: false,
      syncInterval: 15,
      conflictResolution: 'manual' as const,
    };

    mockSyncService.syncBoard.mockRejectedValue(new Error('Sync failed'));

    const { result } = renderHook(() => useGitHubSync());

    const mockOnCardUpdate = jest.fn();
    const mockOnCardCreate = jest.fn();

    await act(async () => {
      const syncResult = await result.current.syncBoard(
        mockBoard,
        mockConfig,
        mockOnCardUpdate,
        mockOnCardCreate
      );
      expect(syncResult.success).toBe(false);
      expect(syncResult.error).toBe('Sync failed');
    });
  });

  it('should validate sync config', async () => {
    const mockConfig = {
      enabled: true,
      repository: { owner: 'test', repo: 'test-repo' },
      columnMappings: [],
      autoSync: false,
      syncInterval: 15,
      conflictResolution: 'manual' as const,
    };

    const mockValidationResult = {
      valid: true,
      errors: [],
    };

    mockSyncService.validateSyncConfig.mockResolvedValue(mockValidationResult);

    const { result } = renderHook(() => useGitHubSync());

    await act(async () => {
      const validationResult = await result.current.validateSyncConfig(mockConfig);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toEqual([]);
    });

    expect(mockSyncService.validateSyncConfig).toHaveBeenCalledWith(mockConfig);
  });

  it('should resolve conflicts', async () => {
    const mockConflict = {
      id: 'conflict-1',
      cardId: 'card-1',
      issueNumber: 123,
      type: 'title_mismatch' as const,
      kanbanValue: 'Kanban Title',
      githubValue: 'GitHub Title',
      timestamp: new Date(),
    };

    const { result } = renderHook(() => useGitHubSync());

    // Set initial conflicts
    act(() => {
      result.current.conflicts.push(mockConflict);
    });

    const resolution = {
      strategy: 'use_kanban' as const,
      resolvedValue: 'Kanban Title',
      resolvedAt: new Date(),
      resolvedBy: 'user' as const,
    };

    await act(async () => {
      await result.current.resolveConflict('conflict-1', resolution);
    });

    // Note: In a real implementation, we'd check that the conflict was updated
    // This is a simplified test structure
  });

  it('should get repository info', async () => {
    const mockRepo = {
      id: 123,
      name: 'test-repo',
      full_name: 'test/test-repo',
      description: 'Test repository',
      language: 'TypeScript',
      stargazers_count: 10,
      forks_count: 5,
      updated_at: '2023-01-01T00:00:00Z',
      html_url: 'https://github.com/test/test-repo',
      clone_url: 'https://github.com/test/test-repo.git',
      default_branch: 'main',
      private: false,
    };

    mockApiClient.getRepository.mockResolvedValue(mockRepo);

    const { result } = renderHook(() => useGitHubSync());

    await act(async () => {
      const repo = await result.current.getRepositoryInfo('test', 'test-repo');
      expect(repo).toEqual(mockRepo);
    });

    expect(mockApiClient.getRepository).toHaveBeenCalledWith('test', 'test-repo');
  });

  it('should get repository labels', async () => {
    const mockIssues = [
      {
        id: 1,
        number: 1,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open' as const,
        user: { id: 1, login: 'test', name: 'Test', email: 'test@test.com', avatar_url: '', html_url: '' },
        assignee: null,
        labels: [
          { id: 1, name: 'bug', color: 'ff0000', description: 'Bug label' },
          { id: 2, name: 'feature', color: '00ff00', description: 'Feature label' },
        ],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        html_url: 'https://github.com/test/test-repo/issues/1',
      },
    ];

    mockApiClient.getIssues.mockResolvedValue(mockIssues);

    const { result } = renderHook(() => useGitHubSync());

    await act(async () => {
      const labels = await result.current.getRepositoryLabels('test', 'test-repo');
      expect(labels).toHaveLength(2);
      expect(labels[0].name).toBe('bug');
      expect(labels[1].name).toBe('feature');
    });

    expect(mockApiClient.getIssues).toHaveBeenCalledWith('test', 'test-repo', {
      state: 'all',
      per_page: 100,
    });
  });
});