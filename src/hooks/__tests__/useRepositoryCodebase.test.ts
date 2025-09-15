import { renderHook, act } from '@testing-library/react';
import { useRepositoryCodebase } from '../useRepositoryCodebase';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubRepository } from '@/types/github';
import { CodebaseContext } from '@/types/chat';

// Mock the GitHub auth context
jest.mock('@/contexts/GitHubAuthContext');
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

// Mock the RepositoryCodebaseService
jest.mock('@/lib/github/RepositoryCodebaseService');

describe('useRepositoryCodebase', () => {
  const mockRepository: GitHubRepository = {
    id: 1,
    name: 'test-repo',
    full_name: 'owner/test-repo',
    description: 'Test repository',
    language: 'TypeScript',
    stargazers_count: 10,
    forks_count: 5,
    updated_at: '2023-01-01T00:00:00Z',
    html_url: 'https://github.com/owner/test-repo',
    clone_url: 'https://github.com/owner/test-repo.git',
    default_branch: 'main',
    private: false,
  };

  const mockConnection = {
    access_token: 'test-token',
    scopes: ['repo'],
    user: {
      id: 1,
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://github.com/avatar.jpg',
      html_url: 'https://github.com/testuser',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGitHubAuth.mockReturnValue({
      connection: mockConnection,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRepositoryCodebase());

    expect(result.current.codebaseContext).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBeNull();
  });

  it('should handle fetchCodebase success', async () => {
    const mockCodebaseContext: CodebaseContext = {
      files: [
        {
          path: 'src/index.ts',
          content: 'console.log("Hello");',
          language: 'typescript',
          size: 100,
          lastModified: new Date(),
        },
      ],
      structure: {
        name: 'test-repo',
        type: 'directory',
        path: '',
        children: [],
      },
    };

    // Mock the service methods
    const mockService = {
      fetchRepositoryCodebase: jest.fn().mockResolvedValue(mockCodebaseContext),
      estimateCodebaseSize: jest.fn().mockResolvedValue({
        totalFiles: 10,
        estimatedSize: 1000,
        processableFiles: 8,
      }),
    };

    // Mock the service constructor
    const RepositoryCodebaseServiceModule = await import('@/lib/github/RepositoryCodebaseService');
    (RepositoryCodebaseServiceModule.RepositoryCodebaseService as jest.Mock).mockImplementation(() => mockService);

    const { result } = renderHook(() => useRepositoryCodebase());

    await act(async () => {
      const context = await result.current.fetchCodebase(mockRepository);
      expect(context).toEqual(mockCodebaseContext);
    });

    expect(result.current.codebaseContext).toEqual(mockCodebaseContext);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetchCodebase error', async () => {
    const mockError = new Error('Failed to fetch repository');
    
    const mockService = {
      fetchRepositoryCodebase: jest.fn().mockRejectedValue(mockError),
      estimateCodebaseSize: jest.fn().mockResolvedValue({
        totalFiles: 10,
        estimatedSize: 1000,
        processableFiles: 8,
      }),
    };

    const RepositoryCodebaseServiceModule = await import('@/lib/github/RepositoryCodebaseService');
    (RepositoryCodebaseServiceModule.RepositoryCodebaseService as jest.Mock).mockImplementation(() => mockService);

    const { result } = renderHook(() => useRepositoryCodebase());

    await act(async () => {
      try {
        await result.current.fetchCodebase(mockRepository);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to fetch repository');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.codebaseContext).toBeNull();
  });

  it('should handle estimateSize', async () => {
    const mockEstimate = {
      totalFiles: 10,
      estimatedSize: 1000,
      processableFiles: 8,
    };

    const mockService = {
      fetchRepositoryCodebase: jest.fn(),
      estimateCodebaseSize: jest.fn().mockResolvedValue(mockEstimate),
    };

    const RepositoryCodebaseServiceModule = await import('@/lib/github/RepositoryCodebaseService');
    (RepositoryCodebaseServiceModule.RepositoryCodebaseService as jest.Mock).mockImplementation(() => mockService);

    const { result } = renderHook(() => useRepositoryCodebase());

    let estimate;
    await act(async () => {
      estimate = await result.current.estimateSize(mockRepository);
    });

    expect(estimate).toEqual(mockEstimate);
    expect(mockService.estimateCodebaseSize).toHaveBeenCalledWith(mockRepository);
  });

  it('should clear codebase and error', () => {
    const { result } = renderHook(() => useRepositoryCodebase());

    act(() => {
      result.current.clearCodebase();
    });

    expect(result.current.codebaseContext).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should throw error when not authenticated', async () => {
    mockUseGitHubAuth.mockReturnValue({
      connection: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    const { result } = renderHook(() => useRepositoryCodebase());

    await act(async () => {
      try {
        await result.current.fetchCodebase(mockRepository);
      } catch (error) {
        expect(error).toEqual(new Error('GitHub authentication required'));
      }
    });
  });
});