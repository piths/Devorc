'use client';

import { useState, useEffect } from 'react';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { useRepositories, useRepository, useIssues } from '@/hooks/useGitHubApi';
import { GitHubAuth } from '@/components/github-auth';
// import { Button } from '@/components/ui/button'; // Removed unused import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Star, GitFork, AlertCircle, ExternalLink } from 'lucide-react';

export function GitHubDemo() {
  const { isAuthenticated, apiClient } = useGitHubAuth();
  const repositories = useRepositories();
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; name: string } | null>(null);
  const repository = useRepository();
  const issues = useIssues();

  useEffect(() => {
    if (isAuthenticated && apiClient) {
      repositories.execute({ per_page: 10, sort: 'updated', direction: 'desc' });
    }
  }, [isAuthenticated, apiClient]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRepoSelect = async (owner: string, name: string) => {
    setSelectedRepo({ owner, name });
    await Promise.all([
      repository.execute(owner, name),
      issues.execute(owner, name, { state: 'open', per_page: 5 })
    ]);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GitHubAuth />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GitHubAuth />

      <Card>
        <CardHeader>
          <CardTitle>Your Repositories</CardTitle>
          <CardDescription>
            Recent repositories from your GitHub account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repositories.loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading repositories...</span>
            </div>
          )}

          {repositories.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{repositories.error}</p>
            </div>
          )}

          {repositories.data && (
            <div className="space-y-3">
              {repositories.data.map((repo) => (
                <div
                  key={repo.id}
                  className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleRepoSelect(repo.full_name.split('/')[0], repo.name)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{repo.full_name}</h4>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          {repo.forks_count}
                        </span>
                      </div>
                    </div>
                    <Badge variant={repo.private ? 'secondary' : 'outline'}>
                      {repo.private ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRepo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Repository Details
              <ExternalLink className="h-4 w-4" />
            </CardTitle>
            <CardDescription>
              {selectedRepo.owner}/{selectedRepo.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repository.loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading repository details...</span>
              </div>
            )}

            {repository.data && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Repository Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Language:</span>
                      <span className="ml-2">{repository.data.language || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Default Branch:</span>
                      <span className="ml-2">{repository.data.default_branch}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stars:</span>
                      <span className="ml-2">{repository.data.stargazers_count}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Forks:</span>
                      <span className="ml-2">{repository.data.forks_count}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Open Issues
                  </h4>
                  
                  {issues.loading && (
                    <div className="flex items-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading issues...</span>
                    </div>
                  )}

                  {issues.data && issues.data.length > 0 ? (
                    <div className="space-y-2">
                      {issues.data.map((issue) => (
                        <div key={issue.id} className="p-2 border rounded text-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">#{issue.number} {issue.title}</p>
                              <p className="text-muted-foreground text-xs mt-1">
                                by @{issue.user.login} • {new Date(issue.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {issue.state}
                            </Badge>
                          </div>
                          {issue.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {issue.labels.map((label) => (
                                <Badge
                                  key={label.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{ backgroundColor: `#${label.color}20` }}
                                >
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No open issues found.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}