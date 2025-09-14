import { GitHubApiClient } from '../GitHubApiClient';
import { GitHubApiError } from '@/types/github';

// Mock fetch globally
global.fetch = jest.fn();

describe('GitHubApiClient', () => {
  let client: GitHubApiClient;
  const mockToken = 'test-token';

  beforeEach(() => {
    client = new GitHubApiClient(mockToken);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with access token', () => {
      const clientWithToken = new GitHubApiClient('token');
      expect(clientWithToken).toBeInstanceOf(GitHubApiClient);
    });

    it('should create client without access token', () => {
      const clientWithoutToken = new GitHubApiClient();
      expect(clientWithoutToken).toBeInstanceOf(GitHubApiClient);
    });
  });

  describe('setAccessToken', () => {
    it('should set access token', () => {
      const newClient = new GitHubApiClient();
      newClient.setAccessToken('new-token');
      // Token is private, but we can test by making a request
      expect(() => newClient.setAccessToken('new-token')).not.toThrow();
    });
  });

  describe('makeRequest', () => {
    it('should make successful API request', async () => {
      const mockResponse = { id: 1, name: 'test-repo' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map([
          ['x-ratelimit-limit', '5000'],
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200'],
        ]),
      });

      const result = await client.getCurrentUser();
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Devorch-Suite/1.0',
          }),
        })
      );
    });

    it('should throw error when no access token', async () => {
      const clientWithoutToken = new GitHubApiClient();
      
      await expect(clientWithoutToken.getCurrentUser()).rejects.toThrow(GitHubApiError);
    });

    it('should handle API errors', async () => {
      const errorResponse = { message: 'Not Found', code: 'not_found' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve(errorResponse),
        headers: new Map(),
      });

      await expect(client.getCurrentUser()).rejects.toThrow(GitHubApiError);
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getCurrentUser()).rejects.toThrow(GitHubApiError);
    });

    it('should respect rate limits', async () => {
      // Set up client with exhausted rate limit
      const clientWithRateLimit = new GitHubApiClient(mockToken);
      
      // Mock a response that sets rate limit info
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Map([
          ['x-ratelimit-limit', '5000'],
          ['x-ratelimit-remaining', '0'],
          ['x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 3600)], // 1 hour from now
        ]),
      });

      // First request to set rate limit info
      await clientWithRateLimit.getCurrentUser();

      // Second request should throw rate limit error
      await expect(clientWithRateLimit.getCurrentUser()).rejects.toThrow(GitHubApiError);
    });
  });

  describe('getRepositories', () => {
    it('should fetch repositories with default options', async () => {
      const mockRepos = [{ id: 1, name: 'repo1' }, { id: 2, name: 'repo2' }];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
        headers: new Map(),
      });

      const result = await client.getRepositories();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos',
        expect.any(Object)
      );
      expect(result).toEqual(mockRepos);
    });

    it('should fetch repositories with custom options', async () => {
      const mockRepos = [{ id: 1, name: 'repo1' }];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepos),
        headers: new Map(),
      });

      const options = {
        type: 'owner' as const,
        sort: 'updated' as const,
        direction: 'desc' as const,
        per_page: 10,
        page: 1,
      };

      await client.getRepositories(options);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?type=owner&sort=updated&direction=desc&per_page=10&page=1',
        expect.any(Object)
      );
    });
  });

  describe('getRepository', () => {
    it('should fetch single repository', async () => {
      const mockRepo = { id: 1, name: 'test-repo', full_name: 'owner/test-repo' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepo),
        headers: new Map(),
      });

      const result = await client.getRepository('owner', 'test-repo');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/test-repo',
        expect.any(Object)
      );
      expect(result).toEqual(mockRepo);
    });
  });

  describe('getIssues', () => {
    it('should fetch issues with default options', async () => {
      const mockIssues = [{ id: 1, number: 1, title: 'Test issue' }];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssues),
        headers: new Map(),
      });

      const result = await client.getIssues('owner', 'repo');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues',
        expect.any(Object)
      );
      expect(result).toEqual(mockIssues);
    });

    it('should fetch issues with custom options', async () => {
      const mockIssues = [{ id: 1, number: 1, title: 'Test issue' }];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssues),
        headers: new Map(),
      });

      const options = {
        state: 'open' as const,
        labels: 'bug,enhancement',
        sort: 'updated' as const,
        direction: 'desc' as const,
        per_page: 5,
      };

      await client.getIssues('owner', 'repo', options);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues?state=open&labels=bug%2Cenhancement&sort=updated&direction=desc&per_page=5',
        expect.any(Object)
      );
    });
  });

  describe('createIssue', () => {
    it('should create new issue', async () => {
      const newIssue = {
        title: 'New issue',
        body: 'Issue description',
        labels: ['bug'],
      };
      const mockCreatedIssue = { id: 1, number: 1, ...newIssue };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreatedIssue),
        headers: new Map(),
      });

      const result = await client.createIssue('owner', 'repo', newIssue);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newIssue),
        })
      );
      expect(result).toEqual(mockCreatedIssue);
    });
  });

  describe('updateIssue', () => {
    it('should update existing issue', async () => {
      const updates = {
        title: 'Updated title',
        state: 'closed' as const,
      };
      const mockUpdatedIssue = { id: 1, number: 1, ...updates };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUpdatedIssue),
        headers: new Map(),
      });

      const result = await client.updateIssue('owner', 'repo', 1, updates);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updates),
        })
      );
      expect(result).toEqual(mockUpdatedIssue);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return null when no rate limit info available', () => {
      const newClient = new GitHubApiClient(mockToken);
      expect(newClient.getRateLimitInfo()).toBeNull();
    });

    it('should return rate limit info after API call', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Map([
          ['x-ratelimit-limit', '5000'],
          ['x-ratelimit-remaining', '4999'],
          ['x-ratelimit-reset', '1640995200'],
        ]),
      });

      await client.getCurrentUser();
      const rateLimitInfo = client.getRateLimitInfo();

      expect(rateLimitInfo).toEqual({
        limit: 5000,
        remaining: 4999,
        reset: 1640995200,
      });
    });
  });
});