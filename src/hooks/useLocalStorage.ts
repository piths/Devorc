import { useState, useEffect, useCallback, useRef } from 'react';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';
import { StorageResult, StorageError, KanbanBoard, CanvasProject, ChatSession } from '@/types/storage';

interface UseLocalStorageOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // seconds
  onError?: (error: StorageError) => void;
  onSave?: () => void;
}

interface UseLocalStorageReturn<T> {
  data: T | null;
  loading: boolean;
  error: StorageError | null;
  save: (data: T) => Promise<boolean>;
  remove: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions = {}
): UseLocalStorageReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);
  
  const storageManager = LocalStorageManager.getInstance();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<T | null>(null);

  const {
    autoSave = false,
    autoSaveInterval = 30,
    onError,
    onSave
  } = options;

  // Load data on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: StorageResult<T> = await storageManager.load<T>(key);
      
      if (result.success && result.data) {
        setData(result.data);
      } else if (result.error && result.error.code !== 'NOT_FOUND') {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const storageError = new StorageError('Unexpected error loading data', 'LOAD_ERROR');
      setError(storageError);
      onError?.(storageError);
    } finally {
      setLoading(false);
    }
  }, [key, onError, storageManager]);

  // Save data
  const save = useCallback(async (newData: T): Promise<boolean> => {
    setError(null);

    try {
      const result = await storageManager.save(key, newData);
      
      if (result.success) {
        setData(newData);
        onSave?.();
        return true;
      } else {
        if (result.error) {
          setError(result.error);
          onError?.(result.error);
        }
        return false;
      }
    } catch (err) {
      const storageError = new StorageError('Unexpected error saving data', 'SAVE_ERROR');
      setError(storageError);
      onError?.(storageError);
      return false;
    }
  }, [key, onError, onSave, storageManager]);

  // Remove data
  const remove = useCallback(async (): Promise<boolean> => {
    setError(null);

    try {
      const result = await storageManager.remove(key);
      
      if (result.success) {
        setData(null);
        return true;
      } else {
        if (result.error) {
          setError(result.error);
          onError?.(result.error);
        }
        return false;
      }
    } catch (err) {
      const storageError = new StorageError('Unexpected error removing data', 'REMOVE_ERROR');
      setError(storageError);
      onError?.(storageError);
      return false;
    }
  }, [key, onError, storageManager]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((dataToSave: T) => {
    if (!autoSave) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Store pending data
    pendingDataRef.current = dataToSave;

    // Schedule auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (pendingDataRef.current) {
        await save(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, autoSaveInterval * 1000);
  }, [autoSave, autoSaveInterval, save]);

  // Update data with auto-save
  const updateData = useCallback((newData: T) => {
    setData(newData);
    
    if (autoSave) {
      scheduleAutoSave(newData);
    }
  }, [autoSave, scheduleAutoSave]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    save,
    remove,
    refresh
  };
}

// Specialized hooks for each module
export function useKanbanStorage() {
  const storageManager = LocalStorageManager.getInstance();

  const saveBoard = useCallback(async (board: KanbanBoard) => {
    return await storageManager.saveKanbanBoard(board);
  }, [storageManager]);

  const loadBoard = useCallback(async (id: string) => {
    return await storageManager.loadKanbanBoard(id);
  }, [storageManager]);

  const loadAllBoards = useCallback(async () => {
    return await storageManager.loadKanbanBoards();
  }, [storageManager]);

  const removeBoard = useCallback(async (id: string) => {
    return await storageManager.removeKanbanBoard(id);
  }, [storageManager]);

  return {
    saveBoard,
    loadBoard,
    loadAllBoards,
    removeBoard
  };
}

export function useCanvasStorage() {
  const storageManager = LocalStorageManager.getInstance();

  const saveProject = useCallback(async (project: CanvasProject) => {
    return await storageManager.saveCanvasProject(project);
  }, [storageManager]);

  const loadProject = useCallback(async (id: string) => {
    return await storageManager.loadCanvasProject(id);
  }, [storageManager]);

  const loadAllProjects = useCallback(async () => {
    return await storageManager.loadCanvasProjects();
  }, [storageManager]);

  const removeProject = useCallback(async (id: string) => {
    return await storageManager.removeCanvasProject(id);
  }, [storageManager]);

  return {
    saveProject,
    loadProject,
    loadAllProjects,
    removeProject
  };
}

export function useChatStorage() {
  const storageManager = LocalStorageManager.getInstance();

  const saveSession = useCallback(async (session: ChatSession) => {
    return await storageManager.saveChatSession(session);
  }, [storageManager]);

  const loadSession = useCallback(async (id: string) => {
    return await storageManager.loadChatSession(id);
  }, [storageManager]);

  const loadAllSessions = useCallback(async () => {
    return await storageManager.loadChatSessions();
  }, [storageManager]);

  const removeSession = useCallback(async (id: string) => {
    return await storageManager.removeChatSession(id);
  }, [storageManager]);

  return {
    saveSession,
    loadSession,
    loadAllSessions,
    removeSession
  };
}