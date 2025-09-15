'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FolderIcon,
  FileIcon,
  KeyboardIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FileNavigationToolbarProps {
  currentFilePath: string;
  repositoryName?: string;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  isLoading?: boolean;
}

export function FileNavigationToolbar({
  currentFilePath,
  repositoryName,
  canNavigateBack,
  canNavigateForward,
  onNavigateBack,
  onNavigateForward,
  isLoading,
}: FileNavigationToolbarProps) {
  const pathSegments = currentFilePath.split('/').filter(Boolean);
  const fileName = pathSegments[pathSegments.length - 1] || '';
  const folderPath = pathSegments.slice(0, -1).join('/');

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateBack}
                disabled={!canNavigateBack || isLoading}
                className="h-7 w-7 p-0"
                aria-label="Go back"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>Go back (Alt + ←)</div>
                <div className="text-muted-foreground">Cmd/Ctrl + [</div>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateForward}
                disabled={!canNavigateForward || isLoading}
                className="h-7 w-7 p-0"
                aria-label="Go forward"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>Go forward (Alt + →)</div>
                <div className="text-muted-foreground">Cmd/Ctrl + ]</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* File Path */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {repositoryName && (
            <>
              <Badge variant="secondary" className="text-xs">
                {repositoryName}
              </Badge>
              <span className="text-muted-foreground">/</span>
            </>
          )}
          
          {folderPath && (
            <>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FolderIcon className="h-3 w-3" />
                <span className="truncate">{folderPath}</span>
              </div>
              <span className="text-muted-foreground">/</span>
            </>
          )}
          
          {fileName && (
            <div className="flex items-center gap-1 text-xs font-medium">
              <FileIcon className="h-3 w-3" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              aria-label="Keyboard shortcuts"
            >
              <KeyboardIcon className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <div className="font-medium">Keyboard Shortcuts</div>
              <div>Alt + ← / → : Navigate files</div>
              <div>Cmd/Ctrl + [ / ] : Navigate files</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}