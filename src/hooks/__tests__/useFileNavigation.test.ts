import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileNavigation } from '../useFileNavigation';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubRepository, GitHubFileContent } from '@/types/github';

// Mock the GitHub auth context
jest.mock('@/contexts/GitHubAuthContext');
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

// Mock API client
const mockApiClient = {
  getFileContent: jest.fn(),
};

const mockRepository: GitHubRepository = {
  id: 1,
  name: 'test-repo',
  full_name: 'user/test-repo',
  private: false,
  html_url: 'https://github.com/user/test-repo',
  description: 'Test repository',
  fork: false,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  pushed_at: '2023-01-01T00:00:00Z',
  clone_url: 'https://github.com/user/test-repo.git',
  default_branch: 'main',
  language: 'TypeScript',
  stargazers_count: 0,
  watchers_count: 0,
  forks_count: 0,
  open_issues_count: 0,
  size: 100,
  archived: false,
  disabled: false,
  visibility: 'public',
  permissions: {
    admin: true,
    maintain: true,
    push: true,
    triage: true,
    pull: true,
  },
};

const mockFileContent: GitHubFileContent = {
  name: 'test.ts',
  path: 'src/test.ts',
  sha: 'abc123',
  size: 100,
  url: 'https://api.github.com/repos/user/test-repo/contents/src/test.ts',
  html_url: 'https://github.com/user/test-repo/blob/main/src/test.ts',
  git_url: 'https://api.github.com/repos/user/test-repo/git/blobs/abc123',
  download_url: 'https://raw.githubusercontent.com/user/test-repo/main/src/test.ts',
  type: 'file',
  content: 'Y29uc29sZS5sb2coImhlbGxvIik7', // base64 encoded "console.log("hello");"
  encoding: 'base64',
};

describe('useFileNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGitHubAuth.mockReturnValue({
      apiClient: mockApiClient,
      isAuthenticated: true,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFileNavigation());

    expect(result.current.selectedRepository).toBeNull();
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.selectedFilePath).toBe('');
    expect(result.current.fileHistory).toEqual([]);
    expect(result.current.historyIndex).toBe(-1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.canNavigateBack).toBe(false);
    expect(result.current.canNavigateForward).toBe(false);
  });

  it('should set selected repository', () => {
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    expect(result.current.selectedRepository).toBe(mockRepository);
  });

  it('should clear file selection when repository changes', () => {
    const { result } = renderHook(() => useFileNavigation());

    // Set initial state
    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    // Simulate having a selected file
    act(() => {
      result.current.setSelectedFile(mockFileContent);
    });

    // Change repository
    act(() => {
      result.current.setSelectedRepository(null);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.selectedFilePath).toBe('');
    expect(result.current.fileHistory).toEqual([]);
    expect(result.current.historyIndex).toBe(-1);
  });

  it('should navigate to file and load content', async () => {
    mockApiClient.getFileContent.mockResolvedValue(mockFileContent);
    
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    await act(async () => {
      await result.current.navigateToFile('src/test.ts');
    });

    await waitFor(() => {
      expect(result.current.selectedFile).toBe(mockFileContent);
      expect(result.current.selectedFilePath).toBe('src/test.ts');
      expect(result.current.fileHistory).toContain('src/test.ts');
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.getFileContent).toHaveBeenCalledWith('user', 'test-repo', 'src/test.ts');
  });

  it('should handle file loading errors', async () => {
    const errorMessage = 'File not found';
    mockApiClient.getFileContent.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    await act(async () => {
      await result.current.navigateToFile('src/nonexistent.ts');
    });

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.selectedFile).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should maintain navigation history', async () => {
    mockApiClient.getFileContent
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file1.ts' })
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file2.ts' });
    
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    // Navigate to first file
    await act(async () => {
      await result.current.navigateToFile('file1.ts');
    });

    // Navigate to second file
    await act(async () => {
      await result.current.navigateToFile('file2.ts');
    });

    await waitFor(() => {
      expect(result.current.fileHistory).toEqual(['file1.ts', 'file2.ts']);
      expect(result.current.historyIndex).toBe(1);
      expect(result.current.canNavigateBack).toBe(true);
      expect(result.current.canNavigateForward).toBe(false);
    });
  });

  it('should navigate back in history', async () => {
    mockApiClient.getFileContent
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file1.ts' })
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file2.ts' })
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file1.ts' });
    
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    // Navigate to files
    await act(async () => {
      await result.current.navigateToFile('file1.ts');
    });
    await act(async () => {
      await result.current.navigateToFile('file2.ts');
    });

    // Navigate back
    act(() => {
      result.current.navigateBack();
    });

    await waitFor(() => {
      expect(result.current.historyIndex).toBe(0);
      expect(result.current.canNavigateBack).toBe(false);
      expect(result.current.canNavigateForward).toBe(true);
    });
  });

  it('should navigate forward in history', async () => {
    mockApiClient.getFileContent
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file1.ts' })
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file2.ts' })
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file1.ts' })
      .mockResolvedValueOnce({ ...mockFileContent, path: 'file2.ts' });
    
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    // Navigate to files
    await act(async () => {
      await result.current.navigateToFile('file1.ts');
    });
    await act(async () => {
      await result.current.navigateToFile('file2.ts');
    });

    // Navigate back then forward
    act(() => {
      result.current.navigateBack();
    });
    act(() => {
      result.current.navigateForward();
    });

    await waitFor(() => {
      expect(result.current.historyIndex).toBe(1);
      expect(result.current.canNavigateBack).toBe(true);
      expect(result.current.canNavigateForward).toBe(false);
    });
  });

  it('should retry file loading', async () => {
    mockApiClient.getFileContent
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockFileContent);
    
    const { result } = renderHook(() => useFileNavigation());

    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    // Initial failed load
    await act(async () => {
      await result.current.navigateToFile('src/test.ts');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.selectedFilePath).toBe('src/test.ts');
    });

    // Retry
    await act(async () => {
      await result.current.retryFileLoad();
    });

    await waitFor(() => {
      expect(result.current.selectedFile).toEqual(mockFileContent);
      expect(result.current.error).toBeNull();
    });
  });

  it('should clear history', () => {
    const { result } = renderHook(() => useFileNavigation());

    // Set some history
    act(() => {
      result.current.setSelectedRepository(mockRepository);
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.fileHistory).toEqual([]);
    expect(result.current.historyIndex).toBe(-1);
  });
});