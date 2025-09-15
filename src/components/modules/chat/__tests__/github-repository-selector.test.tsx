import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitHubRepositorySelector } from '../github-repository-selector';
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

const mockPrivateRepository: GitHubRepository = {
  ...mockRepository,
  id: 2,
  name: 'private-repo',
  full_name: 'user/private-repo',
  description: 'A private repository',
  private: true,
};

describe('GitHubRepositorySelector', () => {
  const mockOnRepositorySelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock scrollIntoView for Radix UI Select component
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
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
    });

    it('should show authentication prompt', () => {
      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('Connect to GitHub')).toBeInTheDocument();
      expect(screen.getByText('Connect your GitHub account to browse repositories')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Connect GitHub' })).toBeInTheDocument();
    });

    it('should call login when connect button is clicked', () => {
      const mockLogin = jest.fn();
      mockUseGitHubAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        connection: null,
        apiClient: null,
        isLoading: false,
        error: null,
        login: mockLogin,
        logout: jest.fn(),
        handleAuthCallback: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Connect GitHub' }));
      expect(mockLogin).toHaveBeenCalled();
    });

    it('should show loading state when authentication is in progress', () => {
      mockUseGitHubAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        connection: null,
        apiClient: null,
        isLoading: true,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        handleAuthCallback: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connecting/i })).toBeDisabled();
    });

    it('should show authentication error', () => {
      mockUseGitHubAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        connection: null,
        apiClient: null,
        isLoading: false,
        error: 'Authentication failed',
        login: jest.fn(),
        logout: jest.fn(),
        handleAuthCallback: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
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
    });

    it('should show loading state when fetching repositories', () => {
      mockUseRepositories.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
    });

    it('should show error state when repository fetch fails', () => {
      const mockExecute = jest.fn();
      mockUseRepositories.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to fetch repositories',
        execute: mockExecute,
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText(/Failed to load repositories/)).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      fireEvent.click(retryButton);
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should show empty state when no repositories are found', () => {
      mockUseRepositories.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('No repositories found')).toBeInTheDocument();
      expect(screen.getByText("You don't have access to any repositories")).toBeInTheDocument();
    });

    it('should render repository selector with repositories', () => {
      mockUseRepositories.mockReturnValue({
        data: [mockRepository, mockPrivateRepository],
        loading: false,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Select a repository')).toBeInTheDocument();
    });

    it('should show selected repository', () => {
      mockUseRepositories.mockReturnValue({
        data: [mockRepository, mockPrivateRepository],
        loading: false,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={mockRepository}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('user/test-repo')).toBeInTheDocument();
    });

    it('should show private badge for private repositories', () => {
      mockUseRepositories.mockReturnValue({
        data: [mockRepository, mockPrivateRepository],
        loading: false,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={mockPrivateRepository}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('Private')).toBeInTheDocument();
    });

    it('should call onRepositorySelect when repository is selected', async () => {
      mockUseRepositories.mockReturnValue({
        data: [mockRepository, mockPrivateRepository],
        loading: false,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      // Find the select trigger and click it
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Wait for the dropdown to open and find the option by value
      await waitFor(() => {
        const option = screen.getByRole('option', { name: /test-repo/ });
        expect(option).toBeInTheDocument();
        fireEvent.click(option);
      });

      expect(mockOnRepositorySelect).toHaveBeenCalledWith(mockRepository);
    });

    it('should fetch repositories on mount when authenticated', () => {
      const mockExecute = jest.fn();
      mockUseRepositories.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        execute: mockExecute,
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(mockExecute).toHaveBeenCalledWith({
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });
    });

    it('should show refreshing indicator when loading with existing data', () => {
      mockUseRepositories.mockReturnValue({
        data: [mockRepository],
        loading: true,
        error: null,
        execute: jest.fn(),
        reset: jest.fn(),
      });

      render(
        <GitHubRepositorySelector
          selectedRepository={null}
          onRepositorySelect={mockOnRepositorySelect}
        />
      );

      expect(screen.getByText('Refreshing repositories...')).toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
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

    const { container } = render(
      <GitHubRepositorySelector
        selectedRepository={null}
        onRepositorySelect={mockOnRepositorySelect}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});