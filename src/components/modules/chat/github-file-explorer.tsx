'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderIcon, 
  FileIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';
import { GitHubRepository, GitHubFileContent } from '@/types/github';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface GitHubFileExplorerProps {
  repository: GitHubRepository | null;
  onFileSelect?: (file: GitHubFileContent) => void;
  selectedFilePath?: string;
}

export function GitHubFileExplorer({ 
  repository, 
  onFileSelect, 
  selectedFilePath 
}: GitHubFileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiClient } = useGitHubAuth();

  const loadDirectoryContents = useCallback(async (
    path: string = ''
  ): Promise<GitHubFileContent[]> => {
    if (!repository || !apiClient) {
      throw new Error('Repository or API client not available');
    }

    const [owner, repo] = repository.full_name.split('/');
    return await apiClient.getDirectoryContents(owner, repo, path);
  }, [repository, apiClient]);

  const buildFileTree = useCallback((contents: GitHubFileContent[]): FileTreeNode[] => {
    return contents
      .sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      })
      .map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        children: item.type === 'dir' ? [] : undefined,
        isExpanded: false,
        isLoading: false,
      }));
  }, []);

  const loadRootDirectory = useCallback(async () => {
    if (!repository) {
      setFileTree([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contents = await loadDirectoryContents();
      const tree = buildFileTree(contents);
      setFileTree(tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repository contents');
      setFileTree([]);
    } finally {
      setIsLoading(false);
    }
  }, [repository, loadDirectoryContents, buildFileTree]);

  const toggleDirectory = useCallback(async (path: string) => {
    setFileTree(prevTree => {
      const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.map(node => {
          if (node.path === path && node.type === 'dir') {
            if (node.isExpanded) {
              // Collapse directory
              return { ...node, isExpanded: false };
            } else {
              // Expand directory - mark as loading
              return { ...node, isExpanded: true, isLoading: true };
            }
          }
          
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          
          return node;
        });
      };

      return updateNode(prevTree);
    });

    // Load directory contents if expanding
    const node = findNodeByPath(fileTree, path);
    if (node && !node.isExpanded) {
      try {
        const contents = await loadDirectoryContents(path);
        const childTree = buildFileTree(contents);

        setFileTree(prevTree => {
          const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
            return nodes.map(node => {
              if (node.path === path && node.type === 'dir') {
                return { 
                  ...node, 
                  children: childTree, 
                  isLoading: false 
                };
              }
              
              if (node.children) {
                return { ...node, children: updateNode(node.children) };
              }
              
              return node;
            });
          };

          return updateNode(prevTree);
        });
      } catch (err) {
        // Handle error by marking as not loading and not expanded
        setFileTree(prevTree => {
          const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
            return nodes.map(node => {
              if (node.path === path && node.type === 'dir') {
                return { 
                  ...node, 
                  isExpanded: false, 
                  isLoading: false 
                };
              }
              
              if (node.children) {
                return { ...node, children: updateNode(node.children) };
              }
              
              return node;
            });
          };

          return updateNode(prevTree);
        });
      }
    }
  }, [fileTree, loadDirectoryContents, buildFileTree]);

  const findNodeByPath = (nodes: FileTreeNode[], path: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileClick = useCallback(async (node: FileTreeNode) => {
    if (node.type === 'dir') {
      await toggleDirectory(node.path);
    } else if (onFileSelect && repository && apiClient) {
      try {
        const [owner, repo] = repository.full_name.split('/');
        const fileContent = await apiClient.getFileContent(owner, repo, node.path);
        onFileSelect(fileContent);
      } catch (err) {
        console.error('Failed to load file content:', err);
      }
    }
  }, [toggleDirectory, onFileSelect, repository, apiClient]);

  const renderFileTreeNode = useCallback((node: FileTreeNode, depth: number = 0) => {
    const isSelected = selectedFilePath === node.path;
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 py-1 px-2 text-sm cursor-pointer hover:bg-muted/50 rounded-sm ${
            isSelected ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'dir' && (
            <>
              {node.isLoading ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <FolderIcon className="h-4 w-4 text-blue-500" />
            </>
          )}
          {node.type === 'file' && (
            <>
              <div className="w-4" /> {/* Spacer for alignment */}
              <FileIcon className="h-4 w-4 text-gray-500" />
            </>
          )}
          <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
            {node.name}
          </span>
        </div>
        
        {node.type === 'dir' && node.isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [selectedFilePath, handleFileClick]);

  // Load root directory when repository changes
  useEffect(() => {
    loadRootDirectory();
  }, [loadRootDirectory]);

  if (!repository) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">File Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Select a GitHub repository to browse files
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>File Explorer</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRootDirectory}
            disabled={isLoading}
            aria-label="Refresh file tree"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {isLoading && fileTree.length === 0 ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : fileTree.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No files found in repository
              </div>
            ) : (
              <div className="space-y-1">
                {fileTree.map(node => renderFileTreeNode(node))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}