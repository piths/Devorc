import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RepositoryCodebaseLoader } from '../repository-codebase-loader';
import { useRepositoryCodebase } from '@/hooks/useRepositoryCodebase';
import { GitHubRepository } from '@/types/github';
import { CodebaseContext } from '@/types/chat';

// Mock the hook
jest.mock('@/hooks/useRepositoryCodebase');
const mockUseRepositoryCodebase = useRepositoryCodebase as jest.MockedFunction<typeof useRepositoryCodebase>;

describe('RepositoryCodebaseLoader', () => {
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

  const mockOnCodebaseLoaded = jest.fn();

  const defaultHookReturn = {
    codebaseContext: null,
    isLoading: false,
    error: null,
    progress: null,
    fetchCodebase: jest.fn(),
    estimateSize: jest.fn(),
    clearCodebase: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRepositoryCodebase.mockReturnValue(defaultHookReturn);
  });

  it('should show repository selection prompt when no repository is selected', () => {
    render(
      <RepositoryCodebaseLoader
        repository={null}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    expect(screen.getByText('Select a repository to load its codebase for AI analysis')).toBeInTheDocument();
  });

  it('should show load codebase button when repository is selected', async () => {
    const mockEstimateSize = jest.fn().mockResolvedValue({
      totalFiles: 10,
      estimatedSize: 1000,
      processableFiles: 8,
    });

    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      estimateSize: mockEstimateSize,
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Load Codebase for AI Analysis')).toBeInTheDocument();
      expect(screen.getByText('Enable AI to understand and analyze owner/test-repo')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load codebase/i })).toBeInTheDocument();
    });

    expect(mockEstimateSize).toHaveBeenCalledWith(mockRepository);
  });

  it('should show size estimate information', async () => {
    const mockEstimateSize = jest.fn().mockResolvedValue({
      totalFiles: 100,
      estimatedSize: 1024 * 1024, // 1MB
      processableFiles: 80,
    });

    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      estimateSize: mockEstimateSize,
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('80 files')).toBeInTheDocument();
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
      expect(screen.getByText(/Processing 80 of 100 files/)).toBeInTheDocument();
    });
  });

  it('should handle load codebase button click', async () => {
    const mockFetchCodebase = jest.fn().mockResolvedValue(mockCodebaseContext);
    const mockEstimateSize = jest.fn().mockResolvedValue({
      totalFiles: 10,
      estimatedSize: 1000,
      processableFiles: 8,
    });

    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      fetchCodebase: mockFetchCodebase,
      estimateSize: mockEstimateSize,
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load codebase/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /load codebase/i }));

    expect(mockFetchCodebase).toHaveBeenCalledWith(mockRepository);
  });

  it('should show loading state', () => {
    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
      progress: {
        current: 50,
        total: 100,
        message: 'Fetching files...',
      },
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    expect(screen.getByText('Loading Codebase')).toBeInTheDocument();
    expect(screen.getByText('Fetching and analyzing owner/test-repo')).toBeInTheDocument();
    expect(screen.getByText('Fetching files...')).toBeInTheDocument();
  });

  it('should show success state when codebase is loaded', () => {
    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      codebaseContext: mockCodebaseContext,
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    expect(screen.getByText('Codebase Loaded')).toBeInTheDocument();
    expect(screen.getByText('owner/test-repo is ready for AI analysis')).toBeInTheDocument();
    expect(screen.getByText('1 files')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should show error state', () => {
    const mockFetchCodebase = jest.fn();
    
    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      error: 'Failed to load repository',
      fetchCodebase: mockFetchCodebase,
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    expect(screen.getByText('Failed to load codebase: Failed to load repository')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockFetchCodebase).toHaveBeenCalledWith(mockRepository);
  });

  it('should call onCodebaseLoaded when codebase is loaded', () => {
    mockUseRepositoryCodebase.mockReturnValue({
      ...defaultHookReturn,
      codebaseContext: mockCodebaseContext,
    });

    render(
      <RepositoryCodebaseLoader
        repository={mockRepository}
        onCodebaseLoaded={mockOnCodebaseLoaded}
      />
    );

    expect(mockOnCodebaseLoaded).toHaveBeenCalledWith(mockCodebaseContext);
  });
});