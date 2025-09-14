'use client';

import React from 'react';
import { GitHubPullRequest } from '@/types/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GitPullRequest, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  User,
  GitBranch,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PullRequestListProps {
  pullRequests: GitHubPullRequest[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  repositoryUrl: string;
}

export function PullRequestList({ pullRequests, loading, error, onRetry, repositoryUrl }: PullRequestListProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">Failed to load pull requests</h3>
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
            <GitPullRequest className="h-5 w-5" />
            Open Pull Requests
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
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Open Pull Requests ({pullRequests.length})
          </CardTitle>
          <Button 
            size="sm" 
            asChild
          >
            <a 
              href={`${repositoryUrl}/compare`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New PR
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pullRequests.length === 0 ? (
          <div className="text-center py-8">
            <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No open pull requests</h3>
            <p className="text-muted-foreground mb-4">
              This repository doesn't have any open pull requests.
            </p>
            <Button asChild>
              <a 
                href={`${repositoryUrl}/compare`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create the first pull request
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pullRequests.map((pr) => (
              <PullRequestItem key={pr.id} pullRequest={pr} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PullRequestItemProps {
  pullRequest: GitHubPullRequest;
}

function PullRequestItem({ pullRequest }: PullRequestItemProps) {
  const createdAt = new Date(pullRequest.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleExternalClick = () => {
    window.open(pullRequest.html_url, '_blank', 'noopener,noreferrer');
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-red-500';
      case 'merged':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={pullRequest.user.avatar_url} alt={pullRequest.user.login} />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${getStateColor(pullRequest.state)}`} />
              <h4 className="text-sm font-medium line-clamp-1">
                {pullRequest.title}
              </h4>
              <span className="text-xs text-muted-foreground">
                #{pullRequest.number}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>opened by {pullRequest.user.login}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span className="font-mono">{pullRequest.head.ref}</span>
              <span>→</span>
              <span className="font-mono">{pullRequest.base.ref}</span>
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