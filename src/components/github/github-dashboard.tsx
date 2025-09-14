'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubRepository } from '@/types/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  RefreshCw, 
  Star, 
  GitFork, 
  Eye, 
  Calendar,
  AlertCircle,
  Github
} from 'lucide-react';
import { RepositoryCard } from './repository-card';
import { RepositoryDetail } from './repository-detail';

interface GitHubDashboardProps {
  className?: string;
}

type SortOption = 'updated' | 'created' | 'pushed' | 'full_name';
type DirectionOption = 'desc' | 'asc';
type TypeOption = 'all' | 'owner' | 'member';

export function GitHubDashboard({ className }: GitHubDashboardProps) {
  const { isAuthenticated, apiClient, user, error: authError } = useGitHubAuth();
  
  // State management
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [sortDirection, setSortDirection] = useState<DirectionOption>('desc');
  const [typeFilter, setTypeFilter] = useState<TypeOption>('all');
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null);

  // Load repositories on mount and when filters change
  useEffect(() => {
    if (isAuthenticated && apiClient) {
      loadRepositories();
    }
  }, [isAuthenticated, apiClient, sortBy, sortDirection, typeFilter]);

  const loadRepositories = async () => {
    if (!apiClient) return;

    try {
      setIsLoading(true);
      setError(null);

      const repos = await apiClient.getRepositories({
        type: typeFilter,
        sort: sortBy,
        direction: sortDirection,
        per_page: 50, // Load more repos for better filtering
      });

      setRepositories(repos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load repositories';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter repositories based on search query
  const filteredRepositories = useMemo(() => {
    if (!searchQuery.trim()) return repositories;

    const query = searchQuery.toLowerCase();
    return repositories.filter(repo => 
      repo.name.toLowerCase().includes(query) ||
      repo.full_name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query)) ||
      (repo.language && repo.language.toLowerCase().includes(query))
    );
  }, [repositories, searchQuery]);

  // Handle repository selection
  const handleRepositorySelect = (repository: GitHubRepository) => {
    setSelectedRepository(repository);
  };

  const handleBackToList = () => {
    setSelectedRepository(null);
  };

  // Show repository detail view if one is selected
  if (selectedRepository) {
    return (
      <RepositoryDetail
        repository={selectedRepository}
        onBack={handleBackToList}
        className={className}
      />
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Dashboard
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to view and manage your repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Github className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Please connect your GitHub account to access the dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (authError || error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{authError || error}</span>
          </div>
          <Button onClick={loadRepositories} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Github className="h-6 w-6" />
              GitHub Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || user?.login}
            </p>
          </div>
          <Button 
            onClick={loadRepositories} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={typeFilter} onValueChange={(value: TypeOption) => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="pushed">Pushed</SelectItem>
                <SelectItem value="full_name">Name</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortDirection} onValueChange={(value: DirectionOption) => setSortDirection(value)}>
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">↓ Desc</SelectItem>
                <SelectItem value="asc">↑ Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRepositories.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="text-center py-12">
              <Github className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No repositories found' : 'No repositories'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `No repositories match "${searchQuery}"`
                  : 'You don\'t have any repositories yet'
                }
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          // Repository cards
          <div className="grid gap-4">
            {filteredRepositories.map((repository) => (
              <RepositoryCard
                key={repository.id}
                repository={repository}
                onClick={() => handleRepositorySelect(repository)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results summary */}
      {!isLoading && filteredRepositories.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredRepositories.length} of {repositories.length} repositories
        </div>
      )}
    </div>
  );
}