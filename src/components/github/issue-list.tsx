'use client';

import React from 'react';
import { GitHubIssue } from '@/types/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Calendar,
  User,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface IssueListProps {
  issues: GitHubIssue[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  repositoryUrl: string;
}

export function IssueList({ issues, loading, error, onRetry, repositoryUrl }: IssueListProps) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">Failed to load issues</h3>
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
            <AlertCircle className="h-5 w-5" />
            Open Issues
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
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
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
            <AlertCircle className="h-5 w-5" />
            Open Issues ({issues.length})
          </CardTitle>
          <Button 
            size="sm" 
            asChild
          >
            <a 
              href={`${repositoryUrl}/issues/new`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Issue
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No open issues</h3>
            <p className="text-muted-foreground mb-4">
              This repository doesn&apos;t have any open issues.
            </p>
            <Button asChild>
              <a 
                href={`${repositoryUrl}/issues/new`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create the first issue
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface IssueItemProps {
  issue: GitHubIssue;
}

function IssueItem({ issue }: IssueItemProps) {
  const createdAt = new Date(issue.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleExternalClick = () => {
    window.open(issue.html_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium line-clamp-1">
                {issue.title}
              </h4>
              <span className="text-xs text-muted-foreground">
                #{issue.number}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>opened by {issue.user.login}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{timeAgo}</span>
              </div>
              {issue.assignee && (
                <>
                  <span>•</span>
                  <span>assigned to {issue.assignee.login}</span>
                </>
              )}
            </div>
            
            {issue.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {issue.labels.slice(0, 3).map((label) => (
                  <Badge 
                    key={label.id} 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
                {issue.labels.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{issue.labels.length - 3} more
                  </Badge>
                )}
              </div>
            )}
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