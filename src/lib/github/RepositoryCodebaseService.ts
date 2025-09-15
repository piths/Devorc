import { GitHubApiClient } from './GitHubApiClient';
import { GitHubRepository, GitHubFileContent, GitHubTree, GitHubTreeItem } from '@/types/github';
import { CodebaseContext, CodeFile, ProjectStructure } from '@/types/chat';

interface FetchOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  excludePatterns?: string[];
  includePatterns?: string[];
}

export class RepositoryCodebaseService {
  private githubClient: GitHubApiClient;
  private readonly DEFAULT_MAX_FILES = 100;
  private readonly DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
  private readonly DEFAULT_EXCLUDE_PATTERNS = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '*.lock',
    '*.min.js',
    '*.min.css',
    '.env*',
    '*.jpg',
    '*.jpeg',
    '*.png',
    '*.gif',
    '*.svg',
    '*.ico',
    '*.pdf',
    '*.zip',
    '*.tar.gz',
    '*.exe',
    '*.dll',
    '*.so',
    '*.dylib',
  ];

  constructor(githubClient: GitHubApiClient) {
    this.githubClient = githubClient;
  }

  async fetchRepositoryCodebase(
    repository: GitHubRepository,
    options: FetchOptions = {}
  ): Promise<CodebaseContext> {
    const {
      maxFiles = this.DEFAULT_MAX_FILES,
      maxFileSize = this.DEFAULT_MAX_FILE_SIZE,
      excludePatterns = this.DEFAULT_EXCLUDE_PATTERNS,
      includePatterns = [],
    } = options;

    try {
      const [owner, repo] = repository.full_name.split('/');
      
      // Get the repository tree recursively
      const tree = await this.githubClient.getRepositoryTree(
        owner,
        repo,
        repository.default_branch,
        true
      );

      // Filter files based on patterns and size limits
      const filteredFiles = this.filterTreeItems(tree.tree, excludePatterns, includePatterns);
      
      // Limit the number of files to process
      const filesToProcess = filteredFiles.slice(0, maxFiles);
      
      // Fetch file contents in parallel (with rate limiting)
      const files = await this.fetchFileContents(
        owner,
        repo,
        filesToProcess,
        maxFileSize,
        repository.default_branch
      );

      // Build project structure
      const structure = this.buildProjectStructure(tree.tree, repository.name);

      return {
        files,
        structure,
        repository: {
          name: repository.name,
          full_name: repository.full_name,
          default_branch: repository.default_branch,
        },
      };
    } catch (error) {
      console.error('Failed to fetch repository codebase:', error);
      throw new Error(`Failed to fetch codebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private filterTreeItems(
    treeItems: GitHubTreeItem[],
    excludePatterns: string[],
    includePatterns: string[]
  ): GitHubTreeItem[] {
    return treeItems.filter(item => {
      // Only process files (blobs), not directories
      if (item.type !== 'blob') return false;

      const path = item.path;

      // Check exclude patterns
      if (this.matchesPatterns(path, excludePatterns)) {
        return false;
      }

      // If include patterns are specified, file must match at least one
      if (includePatterns.length > 0 && !this.matchesPatterns(path, includePatterns)) {
        return false;
      }

      // Check file size if available
      if (item.size && item.size > this.DEFAULT_MAX_FILE_SIZE) {
        return false;
      }

      return true;
    });
  }

  private matchesPatterns(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    });
  }

  private async fetchFileContents(
    owner: string,
    repo: string,
    treeItems: GitHubTreeItem[],
    maxFileSize: number,
    ref: string
  ): Promise<CodeFile[]> {
    const files: CodeFile[] = [];
    const batchSize = 5; // Process files in small batches to avoid rate limits

    for (let i = 0; i < treeItems.length; i += batchSize) {
      const batch = treeItems.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          // Skip if file is too large
          if (item.size && item.size > maxFileSize) {
            return null;
          }

          const fileContent = await this.githubClient.getFileContent(
            owner,
            repo,
            item.path,
            ref
          );

          // Decode base64 content
          if (fileContent.content && fileContent.encoding === 'base64') {
            const decodedContent = atob(fileContent.content.replace(/\n/g, ''));
            
            // Skip binary files (basic check)
            if (this.isBinaryContent(decodedContent)) {
              return null;
            }

            const language = this.getFileLanguage(fileContent.name);

            return {
              path: fileContent.path,
              content: decodedContent,
              language,
              size: fileContent.size,
              lastModified: new Date(), // GitHub doesn't provide this in tree API
            } as CodeFile;
          }

          return null;
        } catch (error) {
          console.warn(`Failed to fetch file ${item.path}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validFiles = batchResults.filter((file): file is CodeFile => file !== null);
      files.push(...validFiles);

      // Add a small delay between batches to be respectful of rate limits
      if (i + batchSize < treeItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return files;
  }

  private isBinaryContent(content: string): boolean {
    // Simple binary detection - check for null bytes or high ratio of non-printable chars
    const nullByteIndex = content.indexOf('\0');
    if (nullByteIndex !== -1) return true;

    const printableChars = content.match(/[\x20-\x7E\t\n\r]/g)?.length || 0;
    const totalChars = content.length;
    
    if (totalChars === 0) return false;
    
    const printableRatio = printableChars / totalChars;
    return printableRatio < 0.7; // If less than 70% printable, consider binary
  }

  private buildProjectStructure(treeItems: GitHubTreeItem[], rootName: string): ProjectStructure {
    const root: ProjectStructure = {
      name: rootName,
      type: 'directory',
      path: '',
      children: [],
    };

    // Build a map of paths to structure nodes
    const pathMap = new Map<string, ProjectStructure>();
    pathMap.set('', root);

    // Sort items by path to ensure parents are processed before children
    const sortedItems = [...treeItems].sort((a, b) => a.path.localeCompare(b.path));

    for (const item of sortedItems) {
      const pathParts = item.path.split('/');
      let currentPath = '';

      // Ensure all parent directories exist
      for (let i = 0; i < pathParts.length - 1; i++) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];

        if (!pathMap.has(currentPath)) {
          const dirNode: ProjectStructure = {
            name: pathParts[i],
            type: 'directory',
            path: currentPath,
            children: [],
          };

          pathMap.set(currentPath, dirNode);
          
          const parent = pathMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(dirNode);
          }
        }
      }

      // Add the file/directory node
      const fileName = pathParts[pathParts.length - 1];
      const fileNode: ProjectStructure = {
        name: fileName,
        type: item.type === 'blob' ? 'file' : 'directory',
        path: item.path,
        size: item.size,
        language: item.type === 'blob' ? this.getFileLanguage(fileName) : undefined,
      };

      if (item.type === 'tree') {
        fileNode.children = [];
      }

      pathMap.set(item.path, fileNode);

      // Add to parent
      const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
      const parent = pathMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(fileNode);
      }
    }

    return root;
  }

  private getFileLanguage(filename: string): string {
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
  }

  async estimateCodebaseSize(repository: GitHubRepository): Promise<{
    totalFiles: number;
    estimatedSize: number;
    processableFiles: number;
  }> {
    try {
      const [owner, repo] = repository.full_name.split('/');
      
      const tree = await this.githubClient.getRepositoryTree(
        owner,
        repo,
        repository.default_branch,
        true
      );

      const allFiles = tree.tree.filter(item => item.type === 'blob');
      const filteredFiles = this.filterTreeItems(tree.tree, this.DEFAULT_EXCLUDE_PATTERNS, []);
      
      const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      const processableSize = filteredFiles.reduce((sum, file) => sum + (file.size || 0), 0);

      return {
        totalFiles: allFiles.length,
        estimatedSize: totalSize,
        processableFiles: Math.min(filteredFiles.length, this.DEFAULT_MAX_FILES),
      };
    } catch (error) {
      console.error('Failed to estimate codebase size:', error);
      throw error;
    }
  }
}