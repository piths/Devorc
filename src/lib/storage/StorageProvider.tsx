'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LocalStorageManager } from './LocalStorageManager';
import { StorageError, AutoSaveConfig } from '@/types/storage';

interface StorageContextType {
  storageManager: LocalStorageManager;
  isAvailable: boolean;
  storageInfo: {
    used: number;
    total: number;
    devOrchUsed: number;
  };
  error: StorageError | null;
  autoSaveConfig: AutoSaveConfig;
  setAutoSaveConfig: (config: Partial<AutoSaveConfig>) => void;
  cleanupOldData: (maxAgeInDays?: number) => Promise<number>;
  refreshStorageInfo: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [storageManager] = useState(() => LocalStorageManager.getInstance());
  const [isAvailable, setIsAvailable] = useState(true);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    devOrchUsed: 0
  });
  const [error, setError] = useState<StorageError | null>(null);
  const [autoSaveConfig, setAutoSaveConfigState] = useState<AutoSaveConfig>({
    enabled: true,
    interval: 30,
    maxRetries: 3
  });

  // Initialize storage and check availability
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Test storage availability
        const testResult = await storageManager.save('__test__', { test: true });
        setIsAvailable(testResult.success);
        
        if (testResult.success) {
          await storageManager.remove('__test__');
        } else {
          setError(testResult.error || new StorageError('Storage not available', 'INIT_ERROR'));
        }

        // Load storage info
        await refreshStorageInfo();

        // Load auto-save config
        const config = storageManager.getAutoSaveConfig();
        setAutoSaveConfigState(config);

      } catch (err) {
        setIsAvailable(false);
        setError(new StorageError('Failed to initialize storage', 'INIT_ERROR'));
      }
    };

    initializeStorage();
  }, [storageManager]);

  const refreshStorageInfo = async () => {
    try {
      const info = await storageManager.getStorageInfo();
      setStorageInfo({
        used: info.used,
        total: info.total,
        devOrchUsed: info.devOrchUsed
      });
    } catch (err) {
      console.warn('Failed to refresh storage info:', err);
    }
  };

  const setAutoSaveConfig = (config: Partial<AutoSaveConfig>) => {
    const newConfig = { ...autoSaveConfig, ...config };
    storageManager.setAutoSaveConfig(newConfig);
    setAutoSaveConfigState(newConfig);
  };

  const cleanupOldData = async (maxAgeInDays: number = 30): Promise<number> => {
    try {
      const result = await storageManager.cleanupOldData(maxAgeInDays);
      if (result.success) {
        await refreshStorageInfo();
        return result.data || 0;
      } else {
        throw result.error || new Error('Cleanup failed');
      }
    } catch (err) {
      console.error('Failed to cleanup old data:', err);
      return 0;
    }
  };

  // Monitor storage usage periodically
  useEffect(() => {
    const interval = setInterval(refreshStorageInfo, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Handle storage quota exceeded
  useEffect(() => {
    const handleStorageQuotaExceeded = async () => {
      if (storageInfo.used > storageInfo.total * 0.9) { // 90% full
        console.warn('Storage quota nearly exceeded, cleaning up old data...');
        await cleanupOldData(7); // Clean data older than 7 days
      }
    };

    handleStorageQuotaExceeded();
  }, [storageInfo]);

  const contextValue: StorageContextType = {
    storageManager,
    isAvailable,
    storageInfo,
    error,
    autoSaveConfig,
    setAutoSaveConfig,
    cleanupOldData,
    refreshStorageInfo
  };

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextType {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}

// Error boundary for storage-related errors
interface StorageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface StorageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class StorageErrorBoundary extends React.Component<
  StorageErrorBoundaryProps,
  StorageErrorBoundaryState
> {
  constructor(props: StorageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StorageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Storage error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Storage Error
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">
            There was an error with data storage. Your work may not be saved automatically.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}