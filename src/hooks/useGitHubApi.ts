import { useState, useCallback } from 'react';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubApiError } from '@/types/github';

interface UseGitHubApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseGitHubApiReturn<T> extends UseGitHubApiState<T> {
  execute: (...args: any[]) => Promise<T | null>; // eslint-disable-line @typescript-eslint/no-explicit-any
  reset: () => void;
}

export function useGitHubApi<T>(
  apiCall: (...args: any[]) => Promise<T> // eslint-disable-line @typescript-eslint/no-explicit-any
): UseGitHubApiReturn<T> {
  const [state, setState] = useState<UseGitHubApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof GitHubApiError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useRepositories() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (options?: {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.getRepositories(options);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useRepository() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (owner: string, repo: string) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.getRepository(owner, repo);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useRepositoryCommits() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    options?: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.getRepositoryCommits(owner, repo, options);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useIssues() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    options?: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      since?: string;
      per_page?: number;
      page?: number;
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.getIssues(owner, repo, options);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function usePullRequests() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    options?: {
      state?: 'open' | 'closed' | 'all';
      head?: string;
      base?: string;
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.getPullRequests(owner, repo, options);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useCreateIssue() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    issue: {
      title: string;
      body?: string;
      assignee?: string;
      labels?: string[];
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.createIssue(owner, repo, issue);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useUpdateIssue() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    issueNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      assignee?: string;
      labels?: string[];
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.updateIssue(owner, repo, issueNumber, updates);
  }, [apiClient]);

  return useGitHubApi(execute);
}

// Branch management hooks
export function useBranches() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    options?: {
      protected?: boolean;
      per_page?: number;
      page?: number;
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.getBranches(owner, repo, options);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useCreateBranch() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    branchName: string,
    fromSha: string
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.createBranch(owner, repo, branchName, fromSha);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useDeleteBranch() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    branchName: string
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.deleteBranch(owner, repo, branchName);
  }, [apiClient]);

  return useGitHubApi(execute);
}

// Pull request management hooks
export function useCreatePullRequest() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    pullRequest: {
      title: string;
      head: string;
      base: string;
      body?: string;
      maintainer_can_modify?: boolean;
      draft?: boolean;
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.createPullRequest(owner, repo, pullRequest);
  }, [apiClient]);

  return useGitHubApi(execute);
}

export function useMergePullRequest() {
  const { apiClient } = useGitHubAuth();
  
  const execute = useCallback(async (
    owner: string, 
    repo: string, 
    pullNumber: number,
    mergeRequest?: {
      commit_title?: string;
      commit_message?: string;
      sha?: string;
      merge_method?: 'merge' | 'squash' | 'rebase';
    }
  ) => {
    if (!apiClient) throw new Error('Not authenticated');
    return apiClient.mergePullRequest(owner, repo, pullNumber, mergeRequest);
  }, [apiClient]);

  return useGitHubApi(execute);
}