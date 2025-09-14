'use client';

import React, { useState } from 'react';
import { GitHubPullRequest, GitHubBranch } from '@/types/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GitPullRequest, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Plus,
  GitMerge,
  X,
  Calendar,
  User,
  GitBranch,
  Users
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PullRequestManagerProps {
  pullRequests: GitHubPullRequest[];
  branches: GitHubBranch[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreatePullRequest: (title: string, head: string, base: string, body?: string) => Promise<void>;
  onMergePullRequest: (pullNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase') => Promise<void>;
  onClosePullRequest: (pullNumber: number) => Promise<void>;
  repositoryUrl: string;
  defaultBranch: string;
}

export function PullRequestManager({ 
  pullRequests, 
  branches,
  loading, 
  error, 
  onRetry, 
  onCreatePullRequest,
  onMergePullRequest,
  onClosePullRequest,
  repositoryUrl,
  defaultBranch
}: PullRequestManagerProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [headBranch, setHeadBranch] = useState('');
  const [baseBranch, setBaseBranch] = useState(defaultBranch);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePullRequest = async () => {
    if (!title.trim() || !headBranch || !baseBranch) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, head branch, and base branch",
        variant: "destructive",
      });
      return;
    }

    if (headBranch === baseBranch) {
      toast({
        title: "Invalid branch selection",
        description: "Head and base branches cannot be the same",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      await onCreatePullRequest(title.trim(), headBranch, baseBranch, body.trim() || undefined);
      setTitle('');
      setBody('');
      setHeadBranch('');
      setBaseBranch(defaultBranch);
      setCreateDialogOpen(false);
      toast({
        title: "Pull request created",
        description: `Successfully created pull request "${title}"`,
      });
    } catch (err) {
      toast({
        title: "Failed to create pull request",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleMergePullRequest = async (pullNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase') => {
    try {
      await onMergePullRequest(pullNumber, mergeMethod);
      toast({
        title: "Pull request merged",
        description: `Successfully merged pull request #${pullNumber}`,
      });
    } catch (err) {
      toast({
        title: "Failed to merge pull request",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleClosePullRequest = async (pullNumber: number) => {
    try {
      await onClosePullRequest(pullNumber);
      toast({
        title: "Pull request closed",
        description: `Successfully closed pull request #${pullNumber}`,
      });
    } catch (err) {
      toast({
        title: "Failed to close pull request",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Filter branches for head selection (exclude base branch)
  const availableHeadBranches = branches.filter(branch => branch.name !== baseBranch);
  const availableBaseBranches = branches.filter(branch => branch.name !== headBranch);

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
            Pull Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-20" />
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
            Pull Requests ({pullRequests.length})
          </CardTitle>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New PR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Pull Request</DialogTitle>
                <DialogDescription>
                  Create a new pull request to merge changes between branches
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pr-title">Title</Label>
                  <Input
                    id="pr-title"
                    placeholder="Add new feature"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="head-branch">From (Head Branch)</Label>
                    <Select value={headBranch} onValueChange={setHeadBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select head branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHeadBranches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="base-branch">To (Base Branch)</Label>
                    <Select value={baseBranch} onValueChange={setBaseBranch}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBaseBranches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            {branch.name}
                            {branch.name === defaultBranch && ' (default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pr-body">Description (optional)</Label>
                  <Textarea
                    id="pr-body"
                    placeholder="Describe your changes..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePullRequest} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Pull Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {pullRequests.length === 0 ? (
          <div className="text-center py-8">
            <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No pull requests</h3>
            <p className="text-muted-foreground mb-4">
              Create your first pull request to start collaborating.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Pull Request
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pullRequests.map((pr) => (
              <PullRequestItem
                key={pr.id}
                pullRequest={pr}
                onMerge={(mergeMethod) => handleMergePullRequest(pr.number, mergeMethod)}
                onClose={() => handleClosePullRequest(pr.number)}
                repositoryUrl={repositoryUrl}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PullRequestItemProps {
  pullRequest: GitHubPullRequest;
  onMerge: (mergeMethod: 'merge' | 'squash' | 'rebase') => void;
  onClose: () => void;
  repositoryUrl: string;
}

function PullRequestItem({ pullRequest, onMerge, onClose, repositoryUrl }: PullRequestItemProps) {
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

  const canMerge = pullRequest.state === 'open' && pullRequest.mergeable !== false;

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-8 w-8">
        <AvatarImage src={pullRequest.user.avatar_url} alt={pullRequest.user.login} />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
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
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {pullRequest.state === 'open' && (
          <div className="flex items-center gap-2 mt-3">
            {canMerge && (
              <div className="flex gap-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="default">
                      <GitMerge className="h-3 w-3 mr-1" />
                      Merge
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Merge Pull Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Choose how you want to merge this pull request.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onMerge('merge')}
                      >
                        <GitMerge className="h-4 w-4 mr-2" />
                        Create a merge commit
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onMerge('squash')}
                      >
                        <GitMerge className="h-4 w-4 mr-2" />
                        Squash and merge
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onMerge('rebase')}
                      >
                        <GitMerge className="h-4 w-4 mr-2" />
                        Rebase and merge
                      </Button>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <X className="h-3 w-3 mr-1" />
                  Close
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Pull Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to close this pull request? You can reopen it later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClose}>
                    Close Pull Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}