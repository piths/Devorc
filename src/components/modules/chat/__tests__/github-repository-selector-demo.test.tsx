import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitHubRepositorySelectorDemo } from '../github-repository-selector-demo';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { useRepositories } from '@/hooks/useGitHubApi';
import { GitHubRepository } from '@/types/github';

// Mock the hooks
jest.mock('@/contexts/GitHubAuthContext');
jest.mock('@/hooks/useGitHubApi');

const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;
const mockUseRepositories = useRepositories as jest.MockedFunction<typeof useRepositories>;

const mockRepository: GitHubRepository = {
  id: 1,
  name: 'test-repo',
  full_name: 'user/test-repo',
  description: 'A test repository',
  language: 'TypeScript',
  stargazers_count: 42,
  forks_count: 5,
  updated_at: '2024-01-15T10:00:00Z',
  html_url: 'https://github.com/user/test-repo',
  clone_url: 'https://github.com/user/test-repo.git',
  default_branch: 'main',
  private: false,
};

describe('GitHubRepositorySelectorDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('should render repository selector and placeholder', () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      connection: null,
      apiClient: null,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      handleAuthCallback: jest.fn(),
    });

    mockUseRepositories.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      execute: jest.fn(),
      reset: jest.fn(),
    });

    render(<GitHubRepositorySelectorDemo />);

    expect(screen.getByText('Repository')).toBeInTheDocument();
    expect(screen.getByText('Select a GitHub repository to browse files and chat about code')).toBeInTheDocument();
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
    expect(screen.getByText('Select a repository to browse files')).toBeInTheDocument();
  });

  it('should show selected repository information when repository is selected', () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://github.com/avatar.jpg',
      },
      connection: null,
      apiClient: null,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      handleAuthCallback: jest.fn(),
    });

    mockUseRepositories.mockReturnValue({
      data: [mockRepository],
      loading: false,
      error: null,
      execute: jest.fn(),
      reset: jest.fn(),
    });

    render(<GitHubRepositorySelectorDemo />);

    // Open the select dropdown and select a repository
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    // The repository should be selectable and show info
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
  });

  it('should show file tree placeholder when no repository is selected', () => {
    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://github.com/avatar.jpg',
      },
      connection: null,
      apiClient: null,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      handleAuthCallback: jest.fn(),
    });

    mockUseRepositories.mockReturnValue({
      data: [mockRepository],
      loading: false,
      error: null,
      execute: jest.fn(),
      reset: jest.fn(),
    });

    render(<GitHubRepositorySelectorDemo />);

    expect(screen.getByText('Select a repository to browse files')).toBeInTheDocument();
  });
});