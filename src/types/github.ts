export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  assignee: GitHubUser | null;
  labels: GitHubLabel[];
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: GitHubUser | null;
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  user: GitHubUser;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface CreateIssueRequest {
  title: string;
  body?: string;
  assignee?: string;
  labels?: string[];
}

export interface UpdateIssueRequest {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  assignee?: string;
  labels?: string[];
}

export interface GitHubConnection {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  scopes: string[];
  user: GitHubUser;
}

export interface AuthResult {
  success: boolean;
  connection?: GitHubConnection;
  error?: string;
}

export class GitHubApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }

  static fromResponse(response: Response, data?: any): GitHubApiError { // eslint-disable-line @typescript-eslint/no-explicit-any
    const retryable = response.status >= 500 || response.status === 429;
    return new GitHubApiError(
      response.status,
      data?.code || 'unknown',
      data?.message || response.statusText,
      retryable
    );
  }
}