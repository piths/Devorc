'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderIcon, FileIcon } from 'lucide-react';

export function FileExplorerPlaceholder() {
  return (
    <div className="h-full flex flex-col">
      {/* Repository Selector Placeholder */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Select a GitHub repository to browse files
          </div>
        </CardContent>
      </Card>

      {/* File Tree Placeholder */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">File Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderIcon className="h-4 w-4" />
            <span>src/</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
            <FolderIcon className="h-4 w-4" />
            <span>components/</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
            <FileIcon className="h-4 w-4" />
            <span>Button.tsx</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
            <FileIcon className="h-4 w-4" />
            <span>App.tsx</span>
          </div>
          <div className="text-xs text-muted-foreground mt-4 p-2 bg-muted/50 rounded">
            File tree will be populated when a repository is selected
          </div>
        </CardContent>
      </Card>
    </div>
  );
}