import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitHubFileExplorer } from '../github-file-explorer';
import { useGitHubApi } from '@/hooks/useGitHubApi';
import { GitHubRepository, GitHubFileContent } from '@/types/github';

// Mock the useGitHubApi hook
jest.mock('@/hooks/useGitHubApi');
const mockUseGitHubApi = useGitHubApi as jest.MockedFunction<typeof useGitHubApi>;

// Mock API client
const mockApiClient = {
  getDirectoryContents: jest.fn(),
  getFileContent: jest.fn(),
};

const mockRepository: GitHubRepository = {
  id: 1,
  name: 'test-repo',
  full_name: 'testuser/test-repo',
  description: 'Test repository',
  language: 'TypeScript',
  stargazers_count: 10,
  forks_count: 5,
  updated_at: '2023-01-01T00:00:00Z',
  html_url: 'https://github.com/testuser/test-repo',
  clone_url: 'https://github.com/testuser/test-repo.git',
  default_branch: 'main',
  private: false,
};

const mockDirectoryContents: GitHubFileContent[] = [
  {
    name: 'src',
    path: 'src',
    sha: 'abc123',
    size: 0,
    url: 'https://api.github.com/repos/testuser/test-repo/contents/src',
    html_url: 'https://github.com/testuser/test-repo/tree/main/src',
    git_url: 'https://api.github.com/repos/testuser/test-repo/git/trees/abc123',
    download_url: '',
    type: 'dir',
    _links: {
      self: 'https://api.github.com/repos/testuser/test-repo/contents/src',
      git: 'https://api.github.com/repos/testuser/test-repo/git/trees/abc123',
      html: 'https://github.com/testuser/test-repo/tree/main/src',
    },
  },
  {
    name: 'README.md',
    path: 'README.md',
    sha: 'def456',
    size: 1024,
    url: 'https://api.github.com/repos/testuser/test-repo/contents/README.md',
    html_url: 'https://github.com/testuser/test-repo/blob/main/README.md',
    git_url: 'https://api.github.com/repos/testuser/test-repo/git/blobs/def456',
    download_url: 'https://raw.githubusercontent.com/testuser/test-repo/main/README.md',
    type: 'file',
    _links: {
      self: 'https://api.github.com/repos/testuser/test-repo/contents/README.md',
      git: 'https://api.github.com/repos/testuser/test-repo/git/blobs/def456',
      html: 'https://github.com/testuser/test-repo/blob/main/README.md',
    },
  },
];

const mockFileContent: GitHubFileContent = {
  ...mockDirectoryContents[1],
  content: btoa('# Test Repository\n\nThis is a test repository.'),
  encoding: 'base64',
};

describe('GitHubFileExplorer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGitHubApi.mockReturnValue({
      apiClient: mockApiClient,
      isAuthenticated: true,
      user: null,
      error: null,
      isLoading: false,
      authenticate: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('renders placeholder when no repository is selected', () => {
    render(<GitHubFileExplorer repository={null} />);
    
    expect(screen.getByText('File Explorer')).toBeInTheDocument();
    expect(screen.getByText('Select a GitHub repository to browse files')).toBeInTheDocument();
  });

  it('loads and displays repository contents', async () => {
    mockApiClient.getDirectoryContents.mockResolvedValue(mockDirectoryContents);

    render(<GitHubFileExplorer repository={mockRepository} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    expect(mockApiClient.getDirectoryContents).toHaveBeenCalledWith('testuser', 'test-repo', '');
  });

  it('shows loading state while fetching contents', () => {
    mockApiClient.getDirectoryContents.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockDirectoryContents), 100))
    );

    render(<GitHubFileExplorer repository={mockRepository} />);

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(10);
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to load repository contents';
    mockApiClient.getDirectoryContents.mockRejectedValue(new Error(errorMessage));

    render(<GitHubFileExplorer repository={mockRepository} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('expands directories when clicked', async () => {
    const srcContents: GitHubFileContent[] = [
      {
        name: 'components',
        path: 'src/components',
        sha: 'ghi789',
        size: 0,
        url: 'https://api.github.com/repos/testuser/test-repo/contents/src/components',
        html_url: 'https://github.com/testuser/test-repo/tree/main/src/components',
        git_url: 'https://api.github.com/repos/testuser/test-repo/git/trees/ghi789',
        download_url: '',
        type: 'dir',
        _links: {
          self: 'https://api.github.com/repos/testuser/test-repo/contents/src/components',
          git: 'https://api.github.com/repos/testuser/test-repo/git/trees/ghi789',
          html: 'https://github.com/testuser/test-repo/tree/main/src/components',
        },
      },
    ];

    mockApiClient.getDirectoryContents
      .mockResolvedValueOnce(mockDirectoryContents)
      .mockResolvedValueOnce(srcContents);

    render(<GitHubFileExplorer repository={mockRepository} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    // Click on src directory to expand it
    fireEvent.click(screen.getByText('src'));

    await waitFor(() => {
      expect(screen.getByText('components')).toBeInTheDocument();
    });

    expect(mockApiClient.getDirectoryContents).toHaveBeenCalledWith('testuser', 'test-repo', 'src');
  });

  it('calls onFileSelect when a file is clicked', async () => {
    const mockOnFileSelect = jest.fn();
    mockApiClient.getDirectoryContents.mockResolvedValue(mockDirectoryContents);
    mockApiClient.getFileContent.mockResolvedValue(mockFileContent);

    render(
      <GitHubFileExplorer 
        repository={mockRepository} 
        onFileSelect={mockOnFileSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    // Click on README.md file
    fireEvent.click(screen.getByText('README.md'));

    await waitFor(() => {
      expect(mockApiClient.getFileContent).toHaveBeenCalledWith('testuser', 'test-repo', 'README.md');
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFileContent);
    });
  });

  it('highlights selected file', async () => {
    mockApiClient.getDirectoryContents.mockResolvedValue(mockDirectoryContents);

    render(
      <GitHubFileExplorer 
        repository={mockRepository} 
        selectedFilePath="README.md"
      />
    );

    await waitFor(() => {
      const readmeElement = screen.getByText('README.md').closest('div');
      expect(readmeElement).toHaveClass('bg-muted');
    });
  });

  it('refreshes contents when refresh button is clicked', async () => {
    mockApiClient.getDirectoryContents.mockResolvedValue(mockDirectoryContents);

    render(<GitHubFileExplorer repository={mockRepository} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByLabelText('Refresh file tree');
    fireEvent.click(refreshButton);

    // Should call API again
    await waitFor(() => {
      expect(mockApiClient.getDirectoryContents).toHaveBeenCalledTimes(2);
    });
  });

  it('sorts directories before files', async () => {
    const mixedContents: GitHubFileContent[] = [
      {
        name: 'z-file.txt',
        path: 'z-file.txt',
        sha: 'file1',
        size: 100,
        url: '',
        html_url: '',
        git_url: '',
        download_url: '',
        type: 'file',
        _links: { self: '', git: '', html: '' },
      },
      {
        name: 'a-directory',
        path: 'a-directory',
        sha: 'dir1',
        size: 0,
        url: '',
        html_url: '',
        git_url: '',
        download_url: '',
        type: 'dir',
        _links: { self: '', git: '', html: '' },
      },
      {
        name: 'b-file.txt',
        path: 'b-file.txt',
        sha: 'file2',
        size: 200,
        url: '',
        html_url: '',
        git_url: '',
        download_url: '',
        type: 'file',
        _links: { self: '', git: '', html: '' },
      },
    ];

    mockApiClient.getDirectoryContents.mockResolvedValue(mixedContents);

    render(<GitHubFileExplorer repository={mockRepository} />);

    await waitFor(() => {
      const items = screen.getAllByText(/^[ab-z]/);
      expect(items[0]).toHaveTextContent('a-directory');
      expect(items[1]).toHaveTextContent('b-file.txt');
      expect(items[2]).toHaveTextContent('z-file.txt');
    });
  });
});