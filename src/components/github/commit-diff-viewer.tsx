"use client";

import React, { useMemo, useRef, useState } from 'react';
import { GitHubCommitDetail, GitHubCommitFile } from '@/types/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';

function StatusBadge({ status }: { status: GitHubCommitFile['status'] }) {
  const map: Record<GitHubCommitFile['status'], string> = {
    added: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    modified: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    removed: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    renamed: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  };
  return <span className={`text-xs px-2 py-0.5 rounded border ${map[status]}`}>{status}</span>;
}

function PatchView({ patch }: { patch?: string }) {
  if (!patch) return null;
  const lines = patch.split(/\r?\n/);
  return (
    <pre className="mt-2 text-xs leading-relaxed overflow-auto rounded border border-white/10">
      {lines.map((l, i) => {
        const isAdd = l.startsWith('+') && !l.startsWith('+++');
        const isDel = l.startsWith('-') && !l.startsWith('---');
        const isHunk = l.startsWith('@@');
        const bg = isHunk ? 'bg-slate-700/30' : isAdd ? 'bg-emerald-500/10' : isDel ? 'bg-rose-500/10' : '';
        return (
          <div key={i} className={`px-3 whitespace-pre ${bg}`}>{l || ' '}</div>
        );
      })}
    </pre>
  );
}

export function CommitDiffViewer({ commit }: { commit: GitHubCommitDetail }) {
  const messageFirstLine = commit.commit.message.split('\n')[0];
  const stats = commit.stats;
  const [active, setActive] = useState<string | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());

  const files = useMemo(() => commit.files, [commit.files]);
  const totalFiles = files.length;
  const totalAdd = stats?.additions ?? files.reduce((a, f) => a + (f.additions || 0), 0);
  const totalDel = stats?.deletions ?? files.reduce((a, f) => a + (f.deletions || 0), 0);

  const onJump = (path: string) => {
    const el = sectionRefs.current.get(path);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(path);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <span className="font-mono mr-2">{commit.sha.substring(0, 7)}</span>
            {messageFirstLine}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {totalFiles} files changed • +{totalAdd} −{totalDel}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* Files sidebar */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Changed files</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0 max-h-[60vh] overflow-auto">
              <ul className="divide-y divide-white/10">
                {files.map((f) => {
                  const ratio = (f.additions + f.deletions) || 1;
                  const addPct = Math.min(100, Math.round((f.additions / ratio) * 100));
                  const delPct = 100 - addPct;
                  const isActive = active === f.filename;
                  return (
                    <li key={f.sha}>
                      <button
                        onClick={() => onJump(f.filename)}
                        className={`w-full text-left px-3 py-2 hover:bg-white/5 ${isActive ? 'bg-white/10' : ''}`}
                        title={f.filename}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <StatusBadge status={f.status} />
                            <span className="font-mono text-xs truncate">{f.filename}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">+{f.additions} −{f.deletions}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full bg-white/5 rounded overflow-hidden flex">
                          <div style={{ width: `${addPct}%` }} className="bg-emerald-500/50" />
                          <div style={{ width: `${delPct}%` }} className="bg-rose-500/50" />
                        </div>
                        {f.status === 'renamed' && f.previous_filename && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            renamed from {f.previous_filename}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>

        {/* Patch content */}
        <section className="col-span-12 md:col-span-8 lg:col-span-9 space-y-4">
          {files.map((f) => (
            <Card key={f.sha} className="overflow-hidden" ref={(el) => { if (el) sectionRefs.current.set(f.filename, el); }}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm truncate" title={f.filename}>{f.filename}</span>
                    <StatusBadge status={f.status} />
                    {f.status === 'renamed' && f.previous_filename && (
                      <span className="text-xs text-muted-foreground">(from {f.previous_filename})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>+{f.additions} −{f.deletions}</span>
                    {f.blob_url && (
                      <a href={f.blob_url} target="_blank" rel="noopener noreferrer" title="Open on GitHub" className="inline-flex items-center opacity-80 hover:opacity-100">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="py-3">
                {f.patch ? (
                  <PatchView patch={f.patch} />
                ) : (
                  <div className="text-xs text-muted-foreground">No textual diff available (binary or large file).</div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
