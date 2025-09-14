import {
  GitHubUser,
  GitHubRepository,
  GitHubIssue,
  GitHubCommit,
  GitHubPullRequest,
  CreateIssueRequest,
  UpdateIssueRequest,
  AuthResult,
  GitHubConnection,
  GitHubApiError,
} from '@/types/github';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export class GitHubApiClient {
  private accessToken: string | null = null;
  private baseUrl = 'https://api.github.com';
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new GitHubApiError(401, 'unauthorized', 'No access token provided');
    }

    // Check rate limit before making request
    if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 0) {
      const resetTime = new Date(this.rateLimitInfo.reset * 1000);
      const waitTime = resetTime.getTime() - Date.now();
      
      if (waitTime > 0) {
        throw new GitHubApiError(
          429,
          'rate_limit_exceeded',
          `Rate limit exceeded. Reset at ${resetTime.toISOString()}`,
          true
        );
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Devorch-Suite/1.0',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Update rate limit info from headers
      this.updateRateLimitInfo(response);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        throw GitHubApiError.fromResponse(response, errorData);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new GitHubApiError(
        0,
        'network_error',
        error instanceof Error ? error.message : 'Network error occurred',
        true
      );
    }
  }

  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }
  }

  async authenticate(code: string): Promise<AuthResult> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('/api/auth/github/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        return {
          success: false,
          error: error.message || 'Authentication failed',
        };
      }

      const tokenData = await tokenResponse.json();
      this.setAccessToken(tokenData.access_token);

      // Get user information
      const user = await this.getCurrentUser();

      const connection: GitHubConnection = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at ? new Date(tokenData.expires_at) : undefined,
        scopes: tokenData.scope ? tokenData.scope.split(',') : [],
        user,
      };

      return {
        success: true,
        connection,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async getCurrentUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  async getRepositories(options: {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const params = new URLSearchParams();
    
    if (options.type) params.append('type', options.type);
    if (options.sort) params.append('sort', options.sort);
    if (options.direction) params.append('direction', options.direction);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const queryString = params.toString();
    const endpoint = `/user/repos${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<GitHubRepository[]>(endpoint);
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  async getRepositoryCommits(
    owner: string,
    repo: string,
    options: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    
    if (options.sha) params.append('sha', options.sha);
    if (options.path) params.append('path', options.path);
    if (options.author) params.append('author', options.author);
    if (options.since) params.append('since', options.since);
    if (options.until) params.append('until', options.until);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/commits${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<GitHubCommit[]>(endpoint);
  }

  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      since?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams();
    
    if (options.state) params.append('state', options.state);
    if (options.labels) params.append('labels', options.labels);
    if (options.sort) params.append('sort', options.sort);
    if (options.direction) params.append('direction', options.direction);
    if (options.since) params.append('since', options.since);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/issues${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<GitHubIssue[]>(endpoint);
  }

  async createIssue(
    owner: string,
    repo: string,
    issue: CreateIssueRequest
  ): Promise<GitHubIssue> {
    return this.makeRequest<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issue),
    });
  }

  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    updates: UpdateIssueRequest
  ): Promise<GitHubIssue> {
    return this.makeRequest<GitHubIssue>(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  async getPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      head?: string;
      base?: string;
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams();
    
    if (options.state) params.append('state', options.state);
    if (options.head) params.append('head', options.head);
    if (options.base) params.append('base', options.base);
    if (options.sort) params.append('sort', options.sort);
    if (options.direction) params.append('direction', options.direction);
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const queryString = params.toString();
    const endpoint = `/repos/${owner}/${repo}/pulls${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<GitHubPullRequest[]>(endpoint);
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  async checkRateLimit(): Promise<RateLimitInfo> {
    const response = await this.makeRequest<{
      rate: RateLimitInfo;
    }>('/rate_limit');
    
    this.rateLimitInfo = response.rate;
    return response.rate;
  }
}