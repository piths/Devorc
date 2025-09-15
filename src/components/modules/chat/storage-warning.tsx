'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, HardDrive, Trash2 } from 'lucide-react';
import { HybridStorageManager } from '@/lib/storage/HybridStorageManager';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

interface StorageWarningProps {
  className?: string;
}

export function StorageWarning({ className }: StorageWarningProps) {
  const [storageInfo, setStorageInfo] = useState<{
    available: boolean;
    used: number;
    total: number;
    usagePercentage: number;
    strategy: string;
  } | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    checkStorageUsage();
    
    // Check storage usage every 30 seconds
    const interval = setInterval(checkStorageUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStorageUsage = async () => {
    try {
      const hybridStorage = HybridStorageManager.getInstance();
      const storageDetails = await hybridStorage.getStorageInfo();
      
      // Use the combined storage info, but prefer primary if available
      const info = storageDetails.primary.available ? storageDetails.primary : storageDetails.fallback;
      const usagePercentage = info.total > 0 ? (info.used / info.total) * 100 : 0;
      
      setStorageInfo({
        available: info.available,
        used: info.used,
        total: info.total,
        usagePercentage,
        strategy: storageDetails.primary.available ? 'IndexedDB' : 'LocalStorage',
      });
    } catch (error) {
      console.error('Failed to check storage usage:', error);
    }
  };

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      const hybridStorage = HybridStorageManager.getInstance();
      const legacyStorage = LocalStorageManager.getInstance();
      
      // Try different cleanup strategies
      const [cleanupResult, migrationResult] = await Promise.all([
        legacyStorage.cleanupOldData(7), // Clean data older than 7 days
        hybridStorage.migrateToOptimalStorage() // Migrate to better storage
      ]);
      
      // Also cleanup excess sessions
      await legacyStorage.cleanupExcessSessions();
      
      console.log('Cleanup results:', { cleanupResult, migrationResult });
      
      // Refresh storage info
      await checkStorageUsage();
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Only show warning if storage usage is high (>80%) or if storage is not available
  if (!storageInfo || (!storageInfo.available && storageInfo.usagePercentage < 80)) {
    return null;
  }

  if (!storageInfo.available) {
    return (
      <div className={className}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Local storage is not available. Your chat sessions may not be saved.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (storageInfo.usagePercentage >= 80) {
    return (
      <div className={className}>
        <Alert variant={storageInfo.usagePercentage >= 95 ? "destructive" : "default"}>
          <HardDrive className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium mb-1">
                Storage {storageInfo.usagePercentage >= 95 ? 'Critical' : 'Warning'}
              </div>
              <div className="text-sm">
                Using {formatBytes(storageInfo.used)} of {storageInfo.strategy} storage 
                ({storageInfo.usagePercentage.toFixed(1)}% full)
              </div>
            </div>
            <Button
              onClick={handleCleanup}
              disabled={isCleaningUp}
              size="sm"
              variant="outline"
              className="ml-4"
            >
              {isCleaningUp ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clean Up
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}