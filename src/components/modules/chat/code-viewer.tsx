'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileIcon, 
  CopyIcon, 
  ExternalLinkIcon,
  AlertCircleIcon 
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from 'next-themes';
import { GitHubFileContent } from '@/types/github';

interface CodeViewerProps {
  file: GitHubFileContent | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isFullScreen?: boolean;
}

export function CodeViewer({ file, isLoading, error, onRetry, isFullScreen = false }: CodeViewerProps) {
  const [decodedContent, setDecodedContent] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const { theme } = useTheme();

  // Decode base64 content when file changes
  useEffect(() => {
    if (file?.content && file.encoding === 'base64') {
      try {
        const decoded = atob(file.content);
        setDecodedContent(decoded);
      } catch (err) {
        console.error('Failed to decode file content:', err);
        setDecodedContent('Failed to decode file content');
      }
    } else {
      setDecodedContent('');
    }
  }, [file]);

  const getFileLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'markup',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'markup',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'dockerfile': 'docker',
      'makefile': 'makefile',
      'gitignore': 'git',
      'env': 'bash',
      'ini': 'ini',
      'toml': 'toml',
      'vue': 'markup',
      'svelte': 'markup',
    };

    return languageMap[extension || ''] || 'text';
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    // You could extend this with more specific icons
    const iconMap: Record<string, string> = {
      'js': '🟨',
      'jsx': '⚛️',
      'ts': '🔷',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'yml': '⚙️',
      'yaml': '⚙️',
    };

    return iconMap[extension || ''] || '📄';
  };

  const handleCopyContent = async () => {
    if (decodedContent) {
      try {
        await navigator.clipboard.writeText(decodedContent);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy content:', err);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    // Only show decimal places if needed
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
    return formatted + ' ' + sizes[i];
  };

  if (!file && !isLoading && !error) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Code Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Select a file to view its content
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            {file && (
              <>
                <span className="text-base">{getFileIcon(file.name)}</span>
                <span className="truncate">{file.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {getFileLanguage(file.name)}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {file && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyContent}
                  disabled={!decodedContent}
                  title="Copy content"
                >
                  <CopyIcon className="h-4 w-4" />
                  {copySuccess && <span className="ml-1 text-xs">Copied!</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.html_url, '_blank')}
                  title="Open in GitHub"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardTitle>
        {file && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span>{file.path}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={isFullScreen ? "h-[calc(100vh-200px)]" : "h-[300px]"}>
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 text-sm text-destructive py-8">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="text-foreground"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            ) : decodedContent ? (
              <SyntaxHighlighter
                language={getFileLanguage(file?.name || '')}
                style={theme === 'dark' ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  fontSize: '0.875rem',
                }}
                wrapLines={true}
                wrapLongLines={true}
                showLineNumbers={true}
                lineNumberStyle={{
                  minWidth: '3em',
                  paddingRight: '1em',
                  color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                  userSelect: 'none',
                }}
              >
                {decodedContent}
              </SyntaxHighlighter>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                Unable to display file content
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}