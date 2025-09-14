'use client';

import React, { useState } from 'react';
import { GitHubBranch } from '@/types/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  GitBranch, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Trash2,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface BranchListProps {
  branches: GitHubBranch[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCreateBranch: (branchName: string, fromBranch: string) => Promise<void>;
  onDeleteBranch: (branchName: string) => Promise<void>;
  repositoryUrl: string;
  defaultBranch: string;
}

export function BranchList({ 
  branches, 
  loading, 
  error, 
  onRetry, 
  onCreateBranch,
  onDeleteBranch,
  repositoryUrl,
  defaultBranch
}: BranchListProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [fromBranch, setFromBranch] = useState(defaultBranch);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast({
        title: "Invalid branch name",
        description: "Please enter a valid branch name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      await onCreateBranch(newBranchName.trim(), fromBranch);
      setNewBranchName('');
      setCreateDialogOpen(false);
      toast({
        title: "Branch created",
        description: `Successfully created branch "${newBranchName}"`,
      });
    } catch (err) {
      toast({
        title: "Failed to create branch",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    try {
      await onDeleteBranch(branchName);
      toast({
        title: "Branch deleted",
        description: `Successfully deleted branch "${branchName}"`,
      });
    } catch (err) {
      toast({
        title: "Failed to delete branch",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCopySha = async (sha: string) => {
    try {
      await navigator.clipboard.writeText(sha);
      setCopiedSha(sha);
      setTimeout(() => setCopiedSha(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: `SHA ${sha.substring(0, 7)} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy SHA to clipboard",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">Failed to load branches</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Branches ({branches.length})
          </CardTitle>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogDescription>
                  Create a new branch from an existing branch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Branch Name</Label>
                  <Input
                    id="branch-name"
                    placeholder="feature/new-feature"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-branch">Create from</Label>
                  <select
                    id="from-branch"
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                        {branch.name === defaultBranch && ' (default)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateBranch} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Branch
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No branches found</h3>
            <p className="text-muted-foreground">
              This repository doesn't have any branches.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <BranchItem
                key={branch.name}
                branch={branch}
                isDefault={branch.name === defaultBranch}
                onDelete={() => handleDeleteBranch(branch.name)}
                onCopySha={() => handleCopySha(branch.commit.sha)}
                copiedSha={copiedSha}
                repositoryUrl={repositoryUrl}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BranchItemProps {
  branch: GitHubBranch;
  isDefault: boolean;
  onDelete: () => void;
  onCopySha: () => void;
  copiedSha: string | null;
  repositoryUrl: string;
}

function BranchItem({ branch, isDefault, onDelete, onCopySha, copiedSha, repositoryUrl }: BranchItemProps) {
  const shortSha = branch.commit.sha.substring(0, 7);
  const isCopied = copiedSha === branch.commit.sha;

  const handleExternalClick = () => {
    window.open(`${repositoryUrl}/tree/${branch.name}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <GitBranch className="h-4 w-4 text-muted-foreground" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium truncate">
            {branch.name}
          </h4>
          {isDefault && (
            <Badge variant="secondary" className="text-xs">
              default
            </Badge>
          )}
          {branch.protected && (
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              protected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={onCopySha}
            className="flex items-center gap-1 hover:text-foreground transition-colors font-mono"
          >
            {isCopied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {shortSha}
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExternalClick}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
        
        {!isDefault && !branch.protected && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the branch "{branch.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Branch
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}