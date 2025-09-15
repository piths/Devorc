import { useState, useCallback, useRef } from 'react';
import { GitHubRepository } from '@/types/github';
import { CodebaseContext } from '@/types/chat';
import { RepositoryCodebaseService } from '@/lib/github/RepositoryCodebaseService';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubApiClient } from '@/lib/github/GitHubApiClient';

interface UseRepositoryCodebaseResult {
  codebaseContext: CodebaseContext | null;
  isLoading: boolean;
  error: string | null;
  progress: {
    current: number;
    total: number;
    message: string;
  } | null;
  fetchCodebase: (repository: GitHubRepository) => Promise<CodebaseContext>;
  estimateSize: (repository: GitHubRepository) => Promise<{
    totalFiles: number;
    estimatedSize: number;
    processableFiles: number;
  }>;
  clearCodebase: () => void;
  clearError: () => void;
}

export function useRepositoryCodebase(): UseRepositoryCodebaseResult {
  const [codebaseContext, setCodebaseContext] = useState<CodebaseContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  const { connection } = useGitHubAuth();
  const serviceRef = useRef<RepositoryCodebaseService | null>(null);

  // Initialize service lazily
  const getService = useCallback(() => {
    if (!serviceRef.current && connection?.accessToken) {
      const githubClient = new GitHubApiClient(connection.accessToken);
      serviceRef.current = new RepositoryCodebaseService(githubClient);
    }
    return serviceRef.current;
  }, [connection?.accessToken]);

  const fetchCodebase = useCallback(async (repository: GitHubRepository): Promise<CodebaseContext> => {
    console.log('fetchCodebase called with:', repository.full_name);
    
    const service = getService();
    console.log('Service available:', !!service);
    console.log('Connection token available:', !!connection?.accessToken);
    
    if (!service) {
      console.error('No service available - authentication required');
      throw new Error('GitHub authentication required');
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting codebase fetch...');
      
      setProgress({
        current: 0,
        total: 100,
        message: 'Analyzing repository structure...',
      });

      // First, estimate the size
      console.log('Estimating codebase size...');
      const sizeEstimate = await service.estimateCodebaseSize(repository);
      console.log('Size estimate:', sizeEstimate);
      
      setProgress({
        current: 10,
        total: 100,
        message: `Found ${sizeEstimate.processableFiles} files to process...`,
      });

      // Fetch the codebase with progress updates
      console.log('Fetching codebase content...');
      const context = await service.fetchRepositoryCodebase(repository, {
        maxFiles: 100,
        maxFileSize: 1024 * 1024, // 1MB
      });
      console.log('Codebase fetched successfully:', context);

      setProgress({
        current: 90,
        total: 100,
        message: 'Processing codebase structure...',
      });

      setCodebaseContext(context);
      
      setProgress({
        current: 100,
        total: 100,
        message: `Successfully loaded ${context.files.length} files`,
      });

      // Clear progress immediately after success
      setTimeout(() => {
        setProgress(null);
      }, 100);

      return context;
    } catch (err) {
      console.error('Error in fetchCodebase:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch codebase';
      setError(errorMessage);
      setProgress(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getService, connection?.accessToken]);

  const estimateSize = useCallback(async (repository: GitHubRepository) => {
    const service = getService();
    if (!service) {
      // For estimation, return a default state instead of throwing
      // The actual error will be shown when user tries to load the codebase
      return {
        totalFiles: 0,
        estimatedSize: 0,
        processableFiles: 0,
      };
    }

    try {
      return await service.estimateCodebaseSize(repository);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to estimate codebase size';
      setError(errorMessage);
      // Return default state instead of throwing during estimation
      return {
        totalFiles: 0,
        estimatedSize: 0,
        processableFiles: 0,
      };
    }
  }, [getService]);

  const clearCodebase = useCallback(() => {
    setCodebaseContext(null);
    setError(null);
    setProgress(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    codebaseContext,
    isLoading,
    error,
    progress,
    fetchCodebase,
    estimateSize,
    clearCodebase,
    clearError,
  };
}