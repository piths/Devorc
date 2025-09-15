'use client';

import React, { useState, useEffect } from 'react';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubRepository, GitHubCommit, GitHubIssue, GitHubPullRequest, GitHubBranch } from '@/types/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Star, 
  GitFork, 
  Eye, 
  ExternalLink,
  Calendar,
  GitCommit,
  AlertCircle,
  GitPullRequest,
  GitBranch,
  Lock,
  Globe,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommitList } from './commit-list';
import { CommitDiffDialog } from './commit-diff-dialog';
import { IssueList } from './issue-list';
import { PullRequestList } from './pull-request-list';
import { BranchList } from './branch-list';
import { PullRequestManager } from './pull-request-manager';
import { SlackNotificationPanel } from '@/components/slack';

interface RepositoryDetailProps {
  repository: GitHubRepository;
  onBack: () => void;
  className?: string;
}

export function RepositoryDetail({ repository, onBack, className }: RepositoryDetailProps) {
  const { apiClient } = useGitHubAuth();
  
  // State for additional data
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  
  // Loading states
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [pullRequestsLoading, setPullRequestsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  
  // Error states
  const [commitsError, setCommitsError] = useState<string | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [pullRequestsError, setPullRequestsError] = useState<string | null>(null);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);

  const [owner, repo] = repository.full_name.split('/');
  const updatedAt = new Date(repository.updated_at);

  // Load data on mount
  useEffect(() => {
    loadCommits();
    loadIssues();
    loadPullRequests();
    loadBranches();
  }, [repository.id]);

  const loadCommits = async () => {
    if (!apiClient) return;

    try {
      setCommitsLoading(true);
      setCommitsError(null);
      
      const commitsData = await apiClient.getRepositoryCommits(owner, repo, {
        per_page: 10
      });
      
      setCommits(commitsData);
    } catch (err) {
      setCommitsError(err instanceof Error ? err.message : 'Failed to load commits');
    } finally {
      setCommitsLoading(false);
    }
  };

  const handleSelectCommit = (c: GitHubCommit) => {
    setSelectedCommitSha(c.sha);
    setDiffOpen(true);
  };

  const loadIssues = async () => {
    if (!apiClient) return;

    try {
      setIssuesLoading(true);
      setIssuesError(null);
      
      const issuesData = await apiClient.getIssues(owner, repo, {
        state: 'open',
        per_page: 10
      });
      
      setIssues(issuesData);
    } catch (err) {
      setIssuesError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setIssuesLoading(false);
    }
  };

  const loadPullRequests = async () => {
    if (!apiClient) return;

    try {
      setPullRequestsLoading(true);
      setPullRequestsError(null);
      
      const pullRequestsData = await apiClient.getPullRequests(owner, repo, {
        state: 'open',
        per_page: 10
      });
      
      setPullRequests(pullRequestsData);
    } catch (err) {
      setPullRequestsError(err instanceof Error ? err.message : 'Failed to load pull requests');
    } finally {
      setPullRequestsLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!apiClient) return;

    try {
      setBranchesLoading(true);
      setBranchesError(null);
      
      const branchesData = await apiClient.getBranches(owner, repo, {
        per_page: 50
      });
      
      setBranches(branchesData);
    } catch (err) {
      setBranchesError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  // Branch management functions
  const handleCreateBranch = async (branchName: string, fromBranch: string) => {
    if (!apiClient) return;

    // Find the SHA of the from branch
    const fromBranchData = branches.find(b => b.name === fromBranch);
    if (!fromBranchData) {
      throw new Error(`Branch ${fromBranch} not found`);
    }

    await apiClient.createBranch(owner, repo, branchName, fromBranchData.commit.sha);
    await loadBranches(); // Refresh branches list
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!apiClient) return;
    
    await apiClient.deleteBranch(owner, repo, branchName);
    await loadBranches(); // Refresh branches list
  };

  // Pull request management functions
  const handleCreatePullRequest = async (title: string, head: string, base: string, body?: string) => {
    if (!apiClient) {
      console.error('No API client available for creating pull request');
      return;
    }

    try {
      console.log('Creating pull request:', { title, head, base, body, owner, repo });
      console.log('Repository details:', {
        full_name: repository.full_name,
        owner,
        repo,
        default_branch: repository.default_branch
      });
      
      await apiClient.createPullRequest(owner, repo, {
        title,
        head,
        base,
        body,
      });
      await loadPullRequests(); // Refresh PR list
      console.log('Pull request created successfully');
    } catch (error) {
      console.error('Error creating pull request:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // You might want to show a toast notification here
    }
  };

  const handleMergePullRequest = async (pullNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase') => {
    if (!apiClient) {
      console.error('No API client available for merging pull request');
      return;
    }

    try {
      console.log('Merging pull request:', { pullNumber, mergeMethod, owner, repo });
      await apiClient.mergePullRequest(owner, repo, pullNumber, { merge_method: mergeMethod });
      await loadPullRequests(); // Refresh PR list
      console.log('Pull request merged successfully');
    } catch (error) {
      console.error('Error merging pull request:', error);
      // You might want to show a toast notification here
    }
  };

  const handleClosePullRequest = async (pullNumber: number) => {
    if (!apiClient) {
      console.error('No API client available for closing pull request');
      return;
    }

    try {
      console.log('Closing pull request:', { pullNumber, owner, repo });
      await apiClient.closePullRequest(owner, repo, pullNumber);
      await loadPullRequests(); // Refresh PR list
      console.log('Pull request closed successfully');
    } catch (error) {
      console.error('Error closing pull request:', error);
      // You might want to show a toast notification here
    }
  };

  const handleRefreshAll = () => {
    loadCommits();
    loadIssues();
    loadPullRequests();
    loadBranches();
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to repositories
          </Button>
          
          <div className="flex-1" />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshAll}
            disabled={commitsLoading || issuesLoading || pullRequestsLoading || branchesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(commitsLoading || issuesLoading || pullRequestsLoading || branchesLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button asChild>
            <a 
              href={repository.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>

        {/* Repository Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  {repository.name}
                  <div className="flex items-center gap-1">
                    {repository.private ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Badge variant={repository.private ? 'secondary' : 'outline'}>
                      {repository.private ? 'Private' : 'Public'}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {repository.full_name}
                </CardDescription>
              </div>
            </div>
            
            {repository.description && (
              <p className="text-foreground mt-2">
                {repository.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{repository.stargazers_count.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">stars</span>
              </div>
              
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{repository.forks_count.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">forks</span>
              </div>
              
              {repository.language && (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getLanguageColor(repository.language) }}
                  />
                  <span className="font-medium">{repository.language}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="commits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="commits" className="flex items-center gap-1 sm:gap-2">
            <GitCommit className="h-4 w-4" />
            <span className="hidden sm:inline">Commits</span>
            <span className="sm:hidden">Commits</span>
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-1 sm:gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Branches ({branches.length})</span>
            <span className="sm:hidden">Branches</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-1 sm:gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Issues ({issues.length})</span>
            <span className="sm:hidden">Issues</span>
          </TabsTrigger>
          <TabsTrigger value="pulls" className="flex items-center gap-1 sm:gap-2">
            <GitPullRequest className="h-4 w-4" />
            <span className="hidden sm:inline">PRs ({pullRequests.length})</span>
            <span className="sm:hidden">PRs</span>
          </TabsTrigger>
          <TabsTrigger value="pr-manager" className="flex items-center gap-1 sm:gap-2">
            <GitPullRequest className="h-4 w-4" />
            <span className="hidden sm:inline">Manage PRs</span>
            <span className="sm:hidden">Manage</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notify</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commits">
          <CommitList 
            commits={commits}
            loading={commitsLoading}
            error={commitsError}
            onRetry={loadCommits}
            repositoryName={repository.name}
            repositoryUrl={repository.html_url}
            branch={repository.default_branch}
            onSelectCommit={handleSelectCommit}
          />
          <CommitDiffDialog 
            owner={owner}
            repo={repo}
            sha={selectedCommitSha}
            open={diffOpen}
            onOpenChange={setDiffOpen}
          />
        </TabsContent>

        <TabsContent value="branches">
          <BranchList 
            branches={branches}
            loading={branchesLoading}
            error={branchesError}
            onRetry={loadBranches}
            onCreateBranch={handleCreateBranch}
            onDeleteBranch={handleDeleteBranch}
            repositoryUrl={repository.html_url}
            defaultBranch={repository.default_branch}
          />
        </TabsContent>

        <TabsContent value="issues">
          <IssueList 
            issues={issues}
            loading={issuesLoading}
            error={issuesError}
            onRetry={loadIssues}
            repositoryUrl={repository.html_url}
          />
        </TabsContent>

        <TabsContent value="pulls">
          <PullRequestList 
            pullRequests={pullRequests}
            loading={pullRequestsLoading}
            error={pullRequestsError}
            onRetry={loadPullRequests}
            repositoryUrl={repository.html_url}
          />
        </TabsContent>

        <TabsContent value="pr-manager">
          <PullRequestManager 
            pullRequests={pullRequests}
            branches={branches}
            loading={pullRequestsLoading}
            error={pullRequestsError}
            onRetry={loadPullRequests}
            onCreatePullRequest={handleCreatePullRequest}
            onMergePullRequest={handleMergePullRequest}
            onClosePullRequest={handleClosePullRequest}
            repositoryUrl={repository.html_url}
            defaultBranch={repository.default_branch}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <SlackNotificationPanel
            commits={commits}
            repositoryName={repository.name}
            repositoryUrl={repository.html_url}
            branch={repository.default_branch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to get language colors (same as repository-card)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C#': '#239120',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Dart': '#00B4AB',
    'HTML': '#e34c26',
    'CSS': '#1572B6',
    'Shell': '#89e051',
    'Vue': '#2c3e50',
    'React': '#61dafb',
  };
  
  return colors[language] || '#6b7280';
}
