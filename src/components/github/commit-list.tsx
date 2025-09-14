'use client';

import React from 'react';
import { GitHubCommit } from '@/types/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GitCommit, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommitListProps {
  commits: GitHubCommit[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CommitList({ commits, loading, error, onRetry }: CommitListProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">Failed to load commits</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Recent Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (commits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <GitCommit className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No commits found</h3>
            <p className="text-muted-foreground">
              This repository doesn't have any recent commits.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCommit className="h-5 w-5" />
          Recent Commits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {commits.map((commit) => (
            <CommitItem key={commit.sha} commit={commit} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CommitItemProps {
  commit: GitHubCommit;
}

function CommitItem({ commit }: CommitItemProps) {
  const commitDate = new Date(commit.commit.author.date);
  const timeAgo = formatDistanceToNow(commitDate, { addSuffix: true });
  
  // Get first line of commit message
  const commitMessage = commit.commit.message.split('\n')[0];
  const shortSha = commit.sha.substring(0, 7);

  const handleExternalClick = () => {
    window.open(commit.html_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8">
        {commit.author ? (
          <AvatarImage src={commit.author.avatar_url} alt={commit.author.login} />
        ) : null}
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2 mb-1">
              {commitMessage}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {commit.author ? commit.author.login : commit.commit.author.name}
              </span>
              <span>•</span>
              <span className="font-mono">{shortSha}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExternalClick}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}