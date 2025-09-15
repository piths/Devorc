'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Github, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  GitBranch,
  AlertTriangle
} from 'lucide-react';
import { SyncStatus, SyncConflict, GitHubSyncConfig } from '@/types/github-sync';
import { formatDistanceToNow } from 'date-fns';

interface GitHubSyncStatusProps {
  config: GitHubSyncConfig | null;
  status: SyncStatus;
  conflicts: SyncConflict[];
  onManualSync: () => void;
  onViewConflicts: () => void;
  onClearErrors: () => void;
  isConnected: boolean;
}

export function GitHubSyncStatus({
  config,
  status,
  conflicts,
  onManualSync,
  onViewConflicts,
  onClearErrors,
  isConnected,
}: GitHubSyncStatusProps) {
  const hasErrors = status.errors.length > 0;
  const hasConflicts = conflicts.length > 0;
  const isConfigured = !!(
    config?.enabled && (config.allRepos || (config.repository.owner && config.repository.repo))
  );

  const getSyncStatusBadge = () => {
    if (!isConnected) {
      return <Badge variant="destructive">Disconnected</Badge>;
    }
    
    if (!isConfigured) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }
    
    if (status.isActive) {
      return <Badge variant="default" className="animate-pulse">Syncing...</Badge>;
    }
    
    if (hasErrors) {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    if (hasConflicts) {
      return <Badge variant="destructive">Conflicts</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600">Ready</Badge>;
  };

  const getLastSyncText = () => {
    if (!status.lastSync) return 'Never';
    return formatDistanceToNow(status.lastSync, { addSuffix: true });
  };

  const getNextSyncText = () => {
    if (!config?.autoSync || !status.nextSync) return 'Manual only';
    return formatDistanceToNow(status.nextSync, { addSuffix: true });
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Github className="h-4 w-4" />
            GitHub Sync
            {getSyncStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your GitHub account to enable synchronization
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isConfigured) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Github className="h-4 w-4" />
            GitHub Sync
            {getSyncStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure GitHub sync settings to start synchronizing with issues
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Sync
            {getSyncStatusBadge()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManualSync}
            disabled={status.isActive}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${status.isActive ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="text-xs">
          {config.allRepos ? 'All Repositories' : `${config.repository.owner}/${config.repository.repo}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sync Progress */}
        {status.isActive && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Synchronizing...
            </div>
            <Progress value={undefined} className="h-1" />
          </div>
        )}

        {/* Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{status.errors.length} sync error(s)</span>
              <Button variant="ghost" size="sm" onClick={onClearErrors}>
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Conflicts */}
        {hasConflicts && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{conflicts.length} conflict(s) need resolution</span>
              <Button variant="ghost" size="sm" onClick={onViewConflicts}>
                View
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Info */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last Sync
            </div>
            <div className="font-medium">{getLastSyncText()}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              Next Sync
            </div>
            <div className="font-medium">{getNextSyncText()}</div>
          </div>
        </div>

        <Separator />

        {/* Sync Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Sync Statistics
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-green-600">{status.stats.cardsCreated}</div>
              <div className="text-muted-foreground">Cards Created</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-blue-600">{status.stats.cardsUpdated}</div>
              <div className="text-muted-foreground">Cards Updated</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">{status.stats.issuesCreated}</div>
              <div className="text-muted-foreground">Issues Created</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-purple-600">{status.stats.issuesUpdated}</div>
              <div className="text-muted-foreground">Issues Updated</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{status.stats.conflictsResolved}</div>
              <div className="text-muted-foreground">Conflicts Resolved</div>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <Separator />
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <GitBranch className="h-3 w-3" />
            Configuration
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto Sync:</span>
              <span className="font-medium">
                {config.autoSync ? `Every ${config.syncInterval}m` : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conflicts:</span>
              <span className="font-medium capitalize">
                {config.conflictResolution.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mappings:</span>
              <span className="font-medium">
                {config.columnMappings.length} column(s)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
