'use client';

import React, { useState, useEffect } from 'react';
import { GitHubRepository } from '@/types/github';
import { CodebaseContext } from '@/types/chat';
import { useRepositoryCodebase } from '@/hooks/useRepositoryCodebase';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  Folder,
  Loader2,
  RefreshCw,
  Info,
  LogIn
} from 'lucide-react';

interface RepositoryCodebaseLoaderProps {
  repository: GitHubRepository | null;
  onCodebaseLoaded: (codebase: CodebaseContext) => void;
  className?: string;
}

export function RepositoryCodebaseLoader({
  repository,
  onCodebaseLoaded,
  className,
}: RepositoryCodebaseLoaderProps) {
  const { isAuthenticated, login } = useGitHubAuth();
  const {
    codebaseContext,
    isLoading,
    error,
    progress,
    fetchCodebase,
    estimateSize,
    clearCodebase,
    clearError,
  } = useRepositoryCodebase();

  const [sizeEstimate, setSizeEstimate] = useState<{
    totalFiles: number;
    estimatedSize: number;
    processableFiles: number;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Auto-estimate size when repository changes and user is authenticated
  useEffect(() => {
    if (repository && !codebaseContext && isAuthenticated) {
      handleEstimateSize();
    }
  }, [repository, isAuthenticated]);

  // Clear codebase when repository changes
  useEffect(() => {
    if (repository) {
      clearError();
      // Don't clear codebase context here as it might be intentionally loaded
      // Only clear if it's a different repository
      if (codebaseContext && codebaseContext.repository?.full_name !== repository.full_name) {
        clearCodebase();
      }
    }
  }, [repository, clearError, clearCodebase, codebaseContext]);

  // Track if we've already notified about this codebase to prevent loops
  const [hasNotified, setHasNotified] = useState(false);

  // Notify parent when codebase is loaded
  useEffect(() => {
    if (codebaseContext && !hasNotified) {
      setHasNotified(true);
      // Add a small delay to ensure the UI has time to update
      const timer = setTimeout(() => {
        onCodebaseLoaded(codebaseContext);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [codebaseContext, onCodebaseLoaded, hasNotified]);

  // Reset notification flag when repository changes
  useEffect(() => {
    setHasNotified(false);
  }, [repository]);

  const handleEstimateSize = async () => {
    if (!repository) return;

    try {
      setIsEstimating(true);
      clearError();
      const estimate = await estimateSize(repository);
      setSizeEstimate(estimate);
    } catch (err) {
      console.error('Failed to estimate repository size:', err);
      // Don't set error state for authentication issues during auto-estimation
      // The user will see the authentication error when they try to load the codebase
    } finally {
      setIsEstimating(false);
    }
  };

  const handleLoadCodebase = async () => {
    if (!repository) {
      console.log('No repository selected');
      return;
    }

    console.log('Starting codebase load for:', repository.full_name);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current loading state:', isLoading);

    try {
      const result = await fetchCodebase(repository);
      console.log('Codebase loaded successfully:', result);
    } catch (err) {
      console.error('Failed to load codebase:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (!repository) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a repository to load its codebase for AI analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state when codebase is loaded (and not currently loading)
  if (codebaseContext && !isLoading && !progress) {
    return (
      <div className={className}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle className="text-sm">Codebase Loaded</CardTitle>
            </div>
            <CardDescription>
              {repository.full_name} is ready for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {codebaseContext.files.length} files
                </span>
                <span>
                  {formatFileSize(codebaseContext.files.reduce((sum, f) => sum + f.size, 0))}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadCodebase}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <CardTitle className="text-sm">Loading Codebase</CardTitle>
            </div>
            <CardDescription>
              Fetching and analyzing {repository.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {progress && (
              <>
                <Progress value={progress.current} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  {progress.message}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load codebase: {error}</span>
            <Button onClick={handleLoadCodebase} size="sm" variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className={className}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              GitHub Authentication Required
            </CardTitle>
            <CardDescription>
              Connect your GitHub account to load {repository.full_name} for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={login} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Connect GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show initial state with size estimate
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            Load Codebase for AI Analysis
          </CardTitle>
          <CardDescription>
            Enable AI to understand and analyze {repository.full_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {isEstimating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing repository structure...</span>
            </div>
          ) : sizeEstimate && sizeEstimate.processableFiles > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {sizeEstimate.processableFiles} files
                </span>
                <span>
                  {formatFileSize(sizeEstimate.estimatedSize)}
                </span>
              </div>
              {sizeEstimate.processableFiles < sizeEstimate.totalFiles && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p>
                      Processing {sizeEstimate.processableFiles} of {sizeEstimate.totalFiles} files.
                      Large files, binaries, and common build artifacts are excluded.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <Button
            onClick={handleLoadCodebase}
            className="w-full"
            disabled={isLoading || isEstimating}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Load Codebase
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}