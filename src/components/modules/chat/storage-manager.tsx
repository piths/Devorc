'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  HardDrive, 
  Trash2, 
  Upload, 
  RefreshCw, 
  Database,
  Archive,
  Zap
} from 'lucide-react';
import { HybridStorageManager } from '@/lib/storage/HybridStorageManager';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

interface StorageManagerProps {
  className?: string;
}

export function StorageManager({ className }: StorageManagerProps) {
  const [storageInfo, setStorageInfo] = useState<{
    primary: { available: boolean; used: number; total: number; percentage: number; };
    fallback: { available: boolean; used: number; total: number; percentage: number; };
    combined: { available: boolean; used: number; total: number; percentage: number; };
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [operations, setOperations] = useState<{
    cleaning: boolean;
    migrating: boolean;
    compressing: boolean;
  }>({
    cleaning: false,
    migrating: false,
    compressing: false,
  });

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setIsLoading(true);
      const hybridStorage = HybridStorageManager.getInstance();
      const info = await hybridStorage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setOperations(prev => ({ ...prev, cleaning: true }));
      const legacyStorage = LocalStorageManager.getInstance();
      
      const [oldDataResult, excessSessionsResult] = await Promise.all([
        legacyStorage.cleanupOldData(7),
        legacyStorage.cleanupExcessSessions(10)
      ]);
      
      console.log('Cleanup completed:', { oldDataResult, excessSessionsResult });
      await loadStorageInfo();
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setOperations(prev => ({ ...prev, cleaning: false }));
    }
  };

  const handleMigration = async () => {
    try {
      setOperations(prev => ({ ...prev, migrating: true }));
      const hybridStorage = HybridStorageManager.getInstance();
      
      const result = await hybridStorage.migrateToOptimalStorage();
      console.log('Migration completed:', result);
      await loadStorageInfo();
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setOperations(prev => ({ ...prev, migrating: false }));
    }
  };

  const handleCompression = async () => {
    try {
      setOperations(prev => ({ ...prev, compressing: true }));
      const hybridStorage = HybridStorageManager.getInstance();
      
      const result = await hybridStorage.compressData();
      console.log('Compression completed:', result);
      await loadStorageInfo();
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setOperations(prev => ({ ...prev, compressing: false }));
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStorageStatus = (percentage: number) => {
    if (percentage >= 95) return { color: 'destructive', label: 'Critical' };
    if (percentage >= 80) return { color: 'warning', label: 'High' };
    if (percentage >= 60) return { color: 'default', label: 'Moderate' };
    return { color: 'success', label: 'Good' };
  };

  if (isLoading || !storageInfo) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading storage information...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <CardDescription>
            Manage your local storage usage and optimize performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Storage (IndexedDB) */}
          {storageInfo.primary.available && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">IndexedDB (Primary)</span>
                  <Badge variant="outline" className="text-xs">
                    {getStorageStatus(storageInfo.primary.percentage).label}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(storageInfo.primary.used)} / {formatBytes(storageInfo.primary.total)}
                </span>
              </div>
              <Progress value={storageInfo.primary.percentage} className="h-2" />
            </div>
          )}

          {/* Fallback Storage (LocalStorage) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span className="font-medium">
                  LocalStorage {!storageInfo.primary.available ? '(Primary)' : '(Fallback)'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {getStorageStatus(storageInfo.fallback.percentage).label}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(storageInfo.fallback.used)} / {formatBytes(storageInfo.fallback.total)}
              </span>
            </div>
            <Progress value={storageInfo.fallback.percentage} className="h-2" />
          </div>

          {/* Combined Usage */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Usage</span>
              <span className="text-sm">
                {formatBytes(storageInfo.combined.used)} / {formatBytes(storageInfo.combined.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Management</CardTitle>
          <CardDescription>
            Optimize your storage usage with these tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleCleanup}
              disabled={operations.cleaning}
              variant="outline"
              className="flex items-center gap-2"
            >
              {operations.cleaning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {operations.cleaning ? 'Cleaning...' : 'Clean Up'}
            </Button>

            {storageInfo.primary.available && (
              <Button
                onClick={handleMigration}
                disabled={operations.migrating}
                variant="outline"
                className="flex items-center gap-2"
              >
                {operations.migrating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {operations.migrating ? 'Migrating...' : 'Migrate Data'}
              </Button>
            )}

            <Button
              onClick={handleCompression}
              disabled={operations.compressing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {operations.compressing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {operations.compressing ? 'Compressing...' : 'Compress'}
            </Button>
          </div>

          <Button
            onClick={loadStorageInfo}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Storage Info
          </Button>
        </CardContent>
      </Card>

      {/* Storage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• IndexedDB provides much larger storage capacity than LocalStorage</p>
          <p>• Regular cleanup helps maintain optimal performance</p>
          <p>• Old chat sessions are automatically cleaned up after 30 days</p>
          <p>• Large codebase contexts are compressed to save space</p>
        </CardContent>
      </Card>
    </div>
  );
}