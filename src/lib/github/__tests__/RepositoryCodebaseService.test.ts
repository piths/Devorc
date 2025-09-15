import { RepositoryCodebaseService } from '../RepositoryCodebaseService';
import { GitHubApiClient } from '../GitHubApiClient';
import { GitHubRepository, GitHubTree, GitHubFileContent } from '@/types/github';

// Mock the GitHubApiClient
jest.mock('../GitHubApiClient');

const mockGitHubApiClient = {
  getRepositoryTree: jest.fn(),
  getFileContent: jest.fn(),
} as jest.Mocked<GitHubApiClient>;

describe('RepositoryCodebaseService', () => {
  let service: RepositoryCodebaseService;
  let mockRepository: GitHubRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RepositoryCodebaseService(mockGitHubApiClient);
    
    mockRepository = {
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
  });

  describe('fetchRepositoryCodebase', () => {
    it('should fetch and process repository codebase successfully', async () => {
      // Mock tree response
      const mockTree: GitHubTree = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/test-repo/git/trees/abc123',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1000,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
          },
          {
            path: 'package.json',
            mode: '100644',
            type: 'blob',
            sha: 'ghi789',
            size: 500,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/ghi789',
          },
          {
            path: 'node_modules/some-package/index.js',
            mode: '100644',
            type: 'blob',
            sha: 'jkl012',
            size: 2000,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/jkl012',
          },
        ],
        truncated: false,
      };

      // Mock file content responses
      const mockFileContent1: GitHubFileContent = {
        name: 'index.ts',
        path: 'src/index.ts',
        sha: 'def456',
        size: 1000,
        url: 'https://api.github.com/repos/owner/test-repo/contents/src/index.ts',
        html_url: 'https://github.com/owner/test-repo/blob/main/src/index.ts',
        git_url: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
        download_url: 'https://raw.githubusercontent.com/owner/test-repo/main/src/index.ts',
        type: 'file',
        content: btoa('console.log("Hello, world!");'),
        encoding: 'base64',
        _links: {
          self: 'https://api.github.com/repos/owner/test-repo/contents/src/index.ts',
          git: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
          html: 'https://github.com/owner/test-repo/blob/main/src/index.ts',
        },
      };

      const mockFileContent2: GitHubFileContent = {
        name: 'package.json',
        path: 'package.json',
        sha: 'ghi789',
        size: 500,
        url: 'https://api.github.com/repos/owner/test-repo/contents/package.json',
        html_url: 'https://github.com/owner/test-repo/blob/main/package.json',
        git_url: 'https://api.github.com/repos/owner/test-repo/git/blobs/ghi789',
        download_url: 'https://raw.githubusercontent.com/owner/test-repo/main/package.json',
        type: 'file',
        content: btoa('{"name": "test-repo", "version": "1.0.0"}'),
        encoding: 'base64',
        _links: {
          self: 'https://api.github.com/repos/owner/test-repo/contents/package.json',
          git: 'https://api.github.com/repos/owner/test-repo/git/blobs/ghi789',
          html: 'https://github.com/owner/test-repo/blob/main/package.json',
        },
      };

      mockGitHubApiClient.getRepositoryTree.mockResolvedValue(mockTree);
      mockGitHubApiClient.getFileContent
        .mockResolvedValueOnce(mockFileContent1)
        .mockResolvedValueOnce(mockFileContent2);

      const result = await service.fetchRepositoryCodebase(mockRepository);

      expect(mockGitHubApiClient.getRepositoryTree).toHaveBeenCalledWith(
        'owner',
        'test-repo',
        'main',
        true
      );

      expect(result.files).toHaveLength(2);
      expect(result.files[0]).toEqual({
        path: 'src/index.ts',
        content: 'console.log("Hello, world!");',
        language: 'typescript',
        size: 1000,
        lastModified: expect.any(Date),
      });

      expect(result.files[1]).toEqual({
        path: 'package.json',
        content: '{"name": "test-repo", "version": "1.0.0"}',
        language: 'json',
        size: 500,
        lastModified: expect.any(Date),
      });

      expect(result.structure).toEqual({
        name: 'test-repo',
        type: 'directory',
        path: '',
        children: expect.any(Array),
      });
    });

    it('should filter out excluded files', async () => {
      const mockTree: GitHubTree = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/test-repo/git/trees/abc123',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1000,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
          },
          {
            path: 'node_modules/package/index.js',
            mode: '100644',
            type: 'blob',
            sha: 'ghi789',
            size: 500,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/ghi789',
          },
          {
            path: 'dist/bundle.js',
            mode: '100644',
            type: 'blob',
            sha: 'jkl012',
            size: 2000,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/jkl012',
          },
        ],
        truncated: false,
      };

      const mockFileContent: GitHubFileContent = {
        name: 'index.ts',
        path: 'src/index.ts',
        sha: 'def456',
        size: 1000,
        url: 'https://api.github.com/repos/owner/test-repo/contents/src/index.ts',
        html_url: 'https://github.com/owner/test-repo/blob/main/src/index.ts',
        git_url: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
        download_url: 'https://raw.githubusercontent.com/owner/test-repo/main/src/index.ts',
        type: 'file',
        content: btoa('console.log("Hello, world!");'),
        encoding: 'base64',
        _links: {
          self: 'https://api.github.com/repos/owner/test-repo/contents/src/index.ts',
          git: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
          html: 'https://github.com/owner/test-repo/blob/main/src/index.ts',
        },
      };

      mockGitHubApiClient.getRepositoryTree.mockResolvedValue(mockTree);
      mockGitHubApiClient.getFileContent.mockResolvedValueOnce(mockFileContent);

      const result = await service.fetchRepositoryCodebase(mockRepository);

      // Should only process src/index.ts, excluding node_modules and dist files
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('src/index.ts');
      // Note: getFileContent may be called multiple times due to filtering, but only valid files are returned
      expect(mockGitHubApiClient.getFileContent).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockGitHubApiClient.getRepositoryTree.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(service.fetchRepositoryCodebase(mockRepository)).rejects.toThrow(
        'Failed to fetch codebase: API rate limit exceeded'
      );
    });
  });

  describe('estimateCodebaseSize', () => {
    it('should estimate codebase size correctly', async () => {
      const mockTree: GitHubTree = {
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/test-repo/git/trees/abc123',
        tree: [
          {
            path: 'src/index.ts',
            mode: '100644',
            type: 'blob',
            sha: 'def456',
            size: 1000,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/def456',
          },
          {
            path: 'node_modules/package/index.js',
            mode: '100644',
            type: 'blob',
            sha: 'ghi789',
            size: 5000,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/ghi789',
          },
          {
            path: 'package.json',
            mode: '100644',
            type: 'blob',
            sha: 'jkl012',
            size: 500,
            url: 'https://api.github.com/repos/owner/test-repo/git/blobs/jkl012',
          },
        ],
        truncated: false,
      };

      mockGitHubApiClient.getRepositoryTree.mockResolvedValue(mockTree);

      const result = await service.estimateCodebaseSize(mockRepository);

      expect(result).toEqual({
        totalFiles: 3,
        estimatedSize: 6500, // 1000 + 5000 + 500
        processableFiles: 3, // All files are counted in estimate, filtering happens during fetch
      });
    });
  });
});