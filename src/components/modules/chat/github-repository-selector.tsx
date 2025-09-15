'use client';

import React, { useEffect, useState } from 'react';
import { FolderGit, AlertCircle, Loader2 } from 'lucide-react';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { useRepositories } from '@/hooks/useGitHubApi';
import { GitHubRepository } from '@/types/github';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GitHubRepositorySelectorProps {
  selectedRepository: GitHubRepository | null;
  onRepositorySelect: (repository: GitHubRepository | null) => void;
  className?: string;
}

export function GitHubRepositorySelector({
  selectedRepository,
  onRepositorySelect,
  className,
}: GitHubRepositorySelectorProps) {
  const { isAuthenticated, login, isLoading: authLoading, error: authError } = useGitHubAuth();
  const { data: repositories, loading, error, execute: fetchRepositories } = useRepositories();
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Load repositories when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasInitialLoad && !loading) {
      fetchRepositories({
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });
      setHasInitialLoad(true);
    }
  }, [isAuthenticated, hasInitialLoad, loading, fetchRepositories]);

  // Handle repository selection
  const handleRepositoryChange = (repositoryFullName: string) => {
    if (!repositories) return;
    
    const repository = repositories.find(repo => repo.full_name === repositoryFullName);
    onRepositorySelect(repository || null);
  };

  // Handle retry
  const handleRetry = () => {
    if (isAuthenticated) {
      fetchRepositories({
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });
    }
  };

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
          <FolderGit className="size-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Connect to GitHub</p>
            <p className="text-xs text-muted-foreground">
              Connect your GitHub account to browse repositories
            </p>
          </div>
          <Button 
            onClick={login} 
            size="sm" 
            disabled={authLoading}
            className="shrink-0"
          >
            {authLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect GitHub'
            )}
          </Button>
        </div>
        {authError && (
          <Alert className="mt-2">
            <AlertCircle className="size-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Show loading state
  if (loading && !repositories) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading repositories...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !repositories) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load repositories: {error}</span>
            <Button onClick={handleRetry} size="sm" variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show empty state
  if (!repositories || repositories.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
          <FolderGit className="size-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">No repositories found</p>
            <p className="text-xs text-muted-foreground">
              You don&apos;t have access to any repositories
            </p>
          </div>
          <Button onClick={handleRetry} size="sm" variant="outline">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select
        value={selectedRepository?.full_name || ''}
        onValueChange={handleRepositoryChange}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2 min-w-0">
            <FolderGit className="size-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select a repository">
              {selectedRepository && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{selectedRepository.full_name}</span>
                  {selectedRepository.private && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">
                      Private
                    </span>
                  )}
                </div>
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {repositories.map((repository) => (
            <SelectItem key={repository.id} value={repository.full_name}>
              <div className="flex items-center gap-2 min-w-0 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{repository.name}</span>
                    {repository.private && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">
                        Private
                      </span>
                    )}
                  </div>
                  {repository.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {repository.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {repository.language && (
                      <span>{repository.language}</span>
                    )}
                    <span>★ {repository.stargazers_count}</span>
                    <span>Updated {new Date(repository.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {loading && repositories && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span>Refreshing repositories...</span>
        </div>
      )}
    </div>
  );
}