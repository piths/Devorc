'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Github, AlertCircle, CheckCircle } from 'lucide-react';
import type { GitHubSyncConfig, ColumnMapping, ConflictResolutionStrategy } from '@/types/github-sync';
import { Column } from '@/types/storage';
import { GitHubLabel, GitHubRepository } from '@/types/github';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { toast } from 'sonner';

interface GitHubSyncConfigProps {
  config: GitHubSyncConfig | null;
  columns: Column[];
  onConfigChange: (config: GitHubSyncConfig) => void;
  onClose: () => void;
}

export function GitHubSyncConfig({ config, columns, onConfigChange, onClose }: GitHubSyncConfigProps) {
  const { validateSyncConfig, getRepositoryInfo, getRepositoryLabels, isConnected } = useGitHubSync();
  
  const [formData, setFormData] = useState<GitHubSyncConfig>(() => ({
    enabled: false,
    repository: { owner: '', repo: '' },
    allRepos: false,
    columnMappings: [],
    autoSync: false,
    syncInterval: 15,
    conflictResolution: 'manual' as ConflictResolutionStrategy,
    ...config,
  }));

  const [availableLabels, setAvailableLabels] = useState<GitHubLabel[]>([]);
  const [repositoryInfo, setRepositoryInfo] = useState<GitHubRepository | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);

  // Initialize column mappings if empty
  useEffect(() => {
    if (formData.columnMappings.length === 0 && columns.length > 0) {
      const defaultMappings: ColumnMapping[] = columns.map(column => ({
        columnId: column.id,
        columnTitle: column.title,
        githubLabels: [],
        issueState: column.title.toLowerCase().includes('done') ? 'closed' : 'open',
      }));
      
      setFormData(prev => ({ ...prev, columnMappings: defaultMappings }));
    }
  }, [columns, formData.columnMappings.length]);

  const handleRepositoryChange = async (field: 'owner' | 'repo', value: string) => {
    const newRepo = { ...formData.repository, [field]: value };
    setFormData(prev => ({ ...prev, repository: newRepo }));

    // Auto-load repository info and labels when both owner and repo are set
    if (newRepo.owner && newRepo.repo && field === 'repo') {
      await loadRepositoryData(newRepo.owner, newRepo.repo);
    }
  };

  const loadRepositoryData = async (owner: string, repo: string) => {
    if (!isConnected) {
      toast.error('GitHub connection required');
      return;
    }

    setIsLoadingRepo(true);
    try {
      const [repoInfo, labels] = await Promise.all([
        getRepositoryInfo(owner, repo),
        getRepositoryLabels(owner, repo),
      ]);

      setRepositoryInfo(repoInfo);
      setAvailableLabels(labels);
      toast.success('Repository data loaded');
    } catch (error) {
      toast.error(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setRepositoryInfo(null);
      setAvailableLabels([]);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handleColumnMappingChange = (index: number, field: keyof ColumnMapping, value: string | string[]) => {
    const newMappings = [...formData.columnMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setFormData(prev => ({ ...prev, columnMappings: newMappings }));
  };

  const addLabelToMapping = (mappingIndex: number, labelName: string) => {
    const mapping = formData.columnMappings[mappingIndex];
    if (!mapping.githubLabels.includes(labelName)) {
      handleColumnMappingChange(mappingIndex, 'githubLabels', [...mapping.githubLabels, labelName]);
    }
  };

  const removeLabelFromMapping = (mappingIndex: number, labelName: string) => {
    const mapping = formData.columnMappings[mappingIndex];
    handleColumnMappingChange(
      mappingIndex,
      'githubLabels',
      mapping.githubLabels.filter(l => l !== labelName)
    );
  };

  const validateConfig = async () => {
    setIsValidating(true);
    try {
      const result = await validateSyncConfig(formData);
      setValidationErrors(result.errors);
      return result.valid;
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Validation failed']);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    const isValid = await validateConfig();
    if (isValid) {
      onConfigChange(formData);
      toast.success('GitHub sync configuration saved');
      onClose();
    } else {
      toast.error('Please fix validation errors before saving');
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Sync Configuration
          </CardTitle>
          <CardDescription>
            Configure synchronization between your Kanban board and GitHub issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GitHub connection required. Please connect your GitHub account first.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full max-w-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Sync Configuration
        </CardTitle>
        <CardDescription>
          Configure synchronization between your Kanban board and GitHub issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 h-[calc(86vh-120px)] overflow-y-auto pr-1">
        {/* Enable Sync */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable GitHub Sync</Label>
            <div className="text-sm text-muted-foreground">
              Synchronize cards with GitHub issues
            </div>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(enabled) => setFormData(prev => ({ ...prev, enabled }))}
          />
        </div>

        <Separator />

        {/* Scope Configuration */}
        <div className="space-y-4">
          <Label className="text-base">Scope</Label>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>All Repositories</Label>
              <div className="text-sm text-muted-foreground">
                Aggregate open issues from all repositories you have access to
              </div>
            </div>
            <Switch
              checked={!!formData.allRepos}
              onCheckedChange={(allRepos) => setFormData(prev => ({ ...prev, allRepos }))}
              disabled={!formData.enabled}
            />
          </div>
        </div>

        <Separator />

        {/* Repository Configuration */}
        <div className="space-y-4">
          <Label className="text-base">Repository</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                placeholder="username or organization"
                value={formData.repository.owner}
                onChange={(e) => handleRepositoryChange('owner', e.target.value)}
                disabled={!formData.enabled || !!formData.allRepos}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo">Repository</Label>
              <Input
                id="repo"
                placeholder="repository name"
                value={formData.repository.repo}
                onChange={(e) => handleRepositoryChange('repo', e.target.value)}
                disabled={!formData.enabled || !!formData.allRepos}
              />
            </div>
          </div>
          
          {repositoryInfo && !formData.allRepos && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Connected to <strong>{repositoryInfo.full_name}</strong>
                {repositoryInfo.description && ` - ${repositoryInfo.description}`}
              </AlertDescription>
            </Alert>
          )}
          {formData.allRepos && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Syncing across all repositories. New issues cannot be created without a selected repository.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Column Mappings */}
        <div className="space-y-4">
          <Label className="text-base">Column Mappings</Label>
          <div className="text-sm text-muted-foreground">
            Map Kanban columns to GitHub issue states and labels
          </div>
          
          <div className="space-y-4">
            {formData.columnMappings.map((mapping, index) => (
              <Card key={mapping.columnId} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{mapping.columnTitle}</h4>
                    <Badge variant="outline">{mapping.columnId}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue State</Label>
                      <Select
                        value={mapping.issueState || 'open'}
                        onValueChange={(value: 'open' | 'closed') => 
                          handleColumnMappingChange(index, 'issueState', value)
                        }
                        disabled={!formData.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>GitHub Labels</Label>
                      <Select
                        onValueChange={(labelName) => addLabelToMapping(index, labelName)}
                        disabled={!formData.enabled || availableLabels.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add label..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLabels
                            .filter(label => !mapping.githubLabels.includes(label.name))
                            .map(label => (
                              <SelectItem key={label.id} value={label.name}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: `#${label.color}` }}
                                  />
                                  {label.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {mapping.githubLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {mapping.githubLabels.map(labelName => {
                        const label = availableLabels.find(l => l.name === labelName);
                        return (
                          <Badge 
                            key={labelName} 
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {label && (
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: `#${label.color}` }}
                              />
                            )}
                            {labelName}
                            <button
                              onClick={() => removeLabelFromMapping(index, labelName)}
                              className="ml-1 hover:text-destructive"
                              disabled={!formData.enabled}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sync Settings */}
        <div className="space-y-4">
          <Label className="text-base">Sync Settings</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Sync</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync changes
                </div>
              </div>
              <Switch
                checked={formData.autoSync}
                onCheckedChange={(autoSync) => setFormData(prev => ({ ...prev, autoSync }))}
                disabled={!formData.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
              <Input
                id="syncInterval"
                type="number"
                min="5"
                max="1440"
                value={formData.syncInterval}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  syncInterval: parseInt(e.target.value) || 15 
                }))}
                disabled={!formData.enabled || !formData.autoSync}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Conflict Resolution</Label>
            <Select
              value={formData.conflictResolution}
              onValueChange={(value: ConflictResolutionStrategy) => 
                setFormData(prev => ({ ...prev, conflictResolution: value }))
              }
              disabled={!formData.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Resolution</SelectItem>
                <SelectItem value="github_wins">GitHub Wins</SelectItem>
                <SelectItem value="kanban_wins">Kanban Wins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={validateConfig}
              disabled={isValidating || isLoadingRepo}
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isValidating || isLoadingRepo || !formData.enabled}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
