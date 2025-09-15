"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubCommitDetail } from '@/types/github';
import { CommitDiffViewer } from './commit-diff-viewer';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface CommitDiffDialogProps {
  owner: string;
  repo: string;
  sha: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommitDiffDialog({ owner, repo, sha, open, onOpenChange }: CommitDiffDialogProps) {
  const { apiClient } = useGitHubAuth();
  const [commit, setCommit] = useState<GitHubCommitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && sha && apiClient) {
      load();
    } else {
      setCommit(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sha, apiClient]);

  async function load() {
    if (!apiClient || !sha) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCommit(owner, repo, sha);
      setCommit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load commit');
    } finally {
      setLoading(false);
    }
  }

  const ghUrl = sha ? `https://github.com/${owner}/${repo}/commit/${sha}` : '#';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="full" className="w-[96vw] max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Commit Diff</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => load()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {sha && (
                <Button asChild size="sm">
                  <a href={ghUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" /> View on GitHub
                  </a>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {loading && <div className="text-sm text-muted-foreground">Loading commit…</div>}
        {commit && <CommitDiffViewer commit={commit} />}
      </DialogContent>
    </Dialog>
  );
}
