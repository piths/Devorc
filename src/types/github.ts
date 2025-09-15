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

export interface GitHubCommitFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  sha: string;
  patch?: string; // Unified diff patch
  raw_url: string;
  blob_url: string;
  contents_url: string;
  previous_filename?: string;
}

export interface GitHubCommitDetail extends GitHubCommit {
  files: GitHubCommitFile[];
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  parents: { sha: string; html_url: string; url: string }[];
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
  mergeable?: boolean;
  merged?: boolean;
  merged_at?: string;
  assignees?: GitHubUser[];
  requested_reviewers?: GitHubUser[];
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
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

export interface CreateBranchRequest {
  ref: string; // The name of the fully qualified reference (ie: refs/heads/master)
  sha: string; // The SHA1 value to set this reference to
}

export interface CreatePullRequestRequest {
  title: string;
  head: string; // The name of the branch where your changes are implemented
  base: string; // The name of the branch you want the changes pulled into
  body?: string;
  maintainer_can_modify?: boolean;
  draft?: boolean;
}

export interface UpdatePullRequestRequest {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  base?: string;
  maintainer_can_modify?: boolean;
}

export interface MergePullRequestRequest {
  commit_title?: string;
  commit_message?: string;
  sha?: string; // SHA that pull request head must match to allow merge
  merge_method?: 'merge' | 'squash' | 'rebase';
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

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string; // Base64 encoded content for files
  encoding?: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
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
