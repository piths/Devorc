'use client';

import React, { useState } from 'react';
import { GitHubRepositorySelector } from './github-repository-selector';
import { GitHubRepository } from '@/types/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Demo component showing how the GitHubRepositorySelector would be integrated
 * into the chat page. This replaces the FileExplorerPlaceholder when implemented.
 */
export function GitHubRepositorySelectorDemo() {
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Repository Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Repository</CardTitle>
          <CardDescription className="text-xs">
            Select a GitHub repository to browse files and chat about code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GitHubRepositorySelector
            selectedRepository={selectedRepository}
            onRepositorySelect={setSelectedRepository}
          />
        </CardContent>
      </Card>

      {/* Selected Repository Info */}
      {selectedRepository && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Selected Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">{selectedRepository.full_name}</div>
              {selectedRepository.description && (
                <div className="text-muted-foreground text-xs mt-1">
                  {selectedRepository.description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {selectedRepository.language && (
                <span>{selectedRepository.language}</span>
              )}
              <span>★ {selectedRepository.stargazers_count}</span>
              <span>Forks: {selectedRepository.forks_count}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Updated: {new Date(selectedRepository.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for File Tree (Next Task) */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">File Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedRepository ? (
            <div className="text-sm text-muted-foreground">
              File tree will be implemented in the next task.
              <br />
              Repository: {selectedRepository.full_name}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a repository to browse files
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}