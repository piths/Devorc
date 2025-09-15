import { useState, useCallback, useEffect, useRef } from 'react';
import { GitHubRepository, GitHubFileContent } from '@/types/github';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';

export interface FileNavigationState {
  selectedRepository: GitHubRepository | null;
  selectedFile: GitHubFileContent | null;
  selectedFilePath: string;
  fileHistory: string[];
  historyIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface FileNavigationActions {
  setSelectedRepository: (repo: GitHubRepository | null) => void;
  setSelectedFile: (file: GitHubFileContent | null) => void;
  navigateToFile: (filePath: string) => Promise<void>;
  navigateBack: () => void;
  navigateForward: () => void;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  clearHistory: () => void;
  retryFileLoad: () => Promise<void>;
}

export function useFileNavigation(): FileNavigationState & FileNavigationActions {
  const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitHubFileContent | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [fileHistory, setFileHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { apiClient } = useGitHubAuth();
  const lastLoadedFileRef = useRef<string>('');

  const loadFile = useCallback(async (filePath: string): Promise<GitHubFileContent | null> => {
    if (!selectedRepository || !apiClient || !filePath) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    lastLoadedFileRef.current = filePath;

    try {
      const [owner, repo] = selectedRepository.full_name.split('/');
      const fileContent = await apiClient.getFileContent(owner, repo, filePath);
      
      // Only update if this is still the file we're trying to load
      if (lastLoadedFileRef.current === filePath) {
        setSelectedFile(fileContent);
        setSelectedFilePath(filePath);
        return fileContent;
      }
      
      return null;
    } catch (err) {
      // Only set error if this is still the file we're trying to load
      if (lastLoadedFileRef.current === filePath) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
        setError(errorMessage);
        setSelectedFile(null);
        // Keep the selectedFilePath so we can retry loading it
        setSelectedFilePath(filePath);
      }
      return null;
    } finally {
      if (lastLoadedFileRef.current === filePath) {
        setIsLoading(false);
      }
    }
  }, [selectedRepository, apiClient]);

  const navigateToFile = useCallback(async (filePath: string) => {
    if (!filePath || filePath === selectedFilePath) {
      return;
    }

    const file = await loadFile(filePath);
    if (file) {
      // Add to history if it's a new navigation (not from history navigation)
      setFileHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        if (newHistory[newHistory.length - 1] !== filePath) {
          newHistory.push(filePath);
        }
        return newHistory;
      });
      setHistoryIndex(prev => {
        const newHistory = fileHistory.slice(0, prev + 1);
        if (newHistory[newHistory.length - 1] !== filePath) {
          return newHistory.length;
        }
        return prev;
      });
    }
  }, [selectedFilePath, loadFile, fileHistory, historyIndex]);

  const navigateBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const filePath = fileHistory[newIndex];
      setHistoryIndex(newIndex);
      loadFile(filePath);
    }
  }, [historyIndex, fileHistory, loadFile]);

  const navigateForward = useCallback(() => {
    if (historyIndex < fileHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const filePath = fileHistory[newIndex];
      setHistoryIndex(newIndex);
      loadFile(filePath);
    }
  }, [historyIndex, fileHistory, loadFile]);

  const canNavigateBack = historyIndex > 0;
  const canNavigateForward = historyIndex < fileHistory.length - 1;

  const clearHistory = useCallback(() => {
    setFileHistory([]);
    setHistoryIndex(-1);
  }, []);

  const retryFileLoad = useCallback(async () => {
    if (selectedFilePath) {
      await loadFile(selectedFilePath);
    }
  }, [selectedFilePath, loadFile]);

  const handleSetSelectedFile = useCallback((file: GitHubFileContent | null) => {
    if (file) {
      navigateToFile(file.path);
    } else {
      setSelectedFile(null);
      setSelectedFilePath('');
      setError(null);
    }
  }, [navigateToFile]);

  const handleSetSelectedRepository = useCallback((repo: GitHubRepository | null) => {
    setSelectedRepository(repo);
    setSelectedFile(null);
    setSelectedFilePath('');
    setError(null);
    clearHistory();
  }, [clearHistory]);

  // Clear file selection when repository changes
  useEffect(() => {
    if (!selectedRepository) {
      setSelectedFile(null);
      setSelectedFilePath('');
      setError(null);
      clearHistory();
    }
  }, [selectedRepository, clearHistory]);

  return {
    // State
    selectedRepository,
    selectedFile,
    selectedFilePath,
    fileHistory,
    historyIndex,
    isLoading,
    error,
    
    // Actions
    setSelectedRepository: handleSetSelectedRepository,
    setSelectedFile: handleSetSelectedFile,
    navigateToFile,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    clearHistory,
    retryFileLoad,
  };
}