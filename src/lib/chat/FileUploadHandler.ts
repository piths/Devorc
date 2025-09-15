import { CodeFile, FileUploadResult, ProjectStructure, CodebaseContext } from '@/types/chat';

export class FileUploadHandler {
  private static readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB per file
  private static readonly MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total
  private static readonly SUPPORTED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php',
    '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml',
    '.vue', '.svelte', '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.env',
    '.md', '.txt', '.sql', '.sh', '.bat', '.ps1',
  ];

  static async handleFileUpload(files: FileList): Promise<FileUploadResult> {
    try {
      const codeFiles: CodeFile[] = [];
      let totalSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
          return {
            success: false,
            files: [],
            error: `File ${file.name} is too large (max ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`,
          };
        }

        totalSize += file.size;
        if (totalSize > this.MAX_TOTAL_SIZE) {
          return {
            success: false,
            files: [],
            error: `Total file size exceeds limit (max ${this.MAX_TOTAL_SIZE / 1024 / 1024}MB)`,
          };
        }

        // Check file extension
        const extension = this.getFileExtension(file.name);
        if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
          continue; // Skip unsupported files
        }

        try {
          const content = await this.readFileContent(file);
          const codeFile: CodeFile = {
            path: file.name,
            content,
            language: this.detectLanguage(file.name),
            size: file.size,
            lastModified: new Date(file.lastModified),
          };

          codeFiles.push(codeFile);
        } catch (err) {
          console.warn(`Failed to read file ${file.name}:`, err);
        }
      }

      if (codeFiles.length === 0) {
        return {
          success: false,
          files: [],
          error: 'No supported code files found',
        };
      }

      return {
        success: true,
        files: codeFiles,
      };
    } catch {
      return {
        success: false,
        files: [],
        error: 'Failed to process files',
      };
    }
  }

  static async handleDirectoryUpload(files: FileList): Promise<FileUploadResult> {
    const result = await this.handleFileUpload(files);
    
    if (result.success && result.files.length > 0) {
      // Sort files to create a logical structure
      result.files.sort((a, b) => a.path.localeCompare(b.path));
    }

    return result;
  }

  static createProjectStructure(files: CodeFile[]): ProjectStructure {
    const root: ProjectStructure = {
      name: 'project',
      type: 'directory',
      path: '/',
      children: [],
    };

    files.forEach(file => {
      const pathParts = file.path.split('/').filter(part => part.length > 0);
      let current = root;

      pathParts.forEach((part, index) => {
        const isFile = index === pathParts.length - 1;
        const path = '/' + pathParts.slice(0, index + 1).join('/');

        let child = current.children?.find(c => c.name === part);
        
        if (!child) {
          child = {
            name: part,
            type: isFile ? 'file' : 'directory',
            path,
            children: isFile ? undefined : [],
            size: isFile ? file.size : undefined,
            language: isFile ? file.language : undefined,
          };
          
          if (!current.children) current.children = [];
          current.children.push(child);
        }

        if (!isFile) {
          current = child;
        }
      });
    });

    return root;
  }

  static createCodebaseContext(files: CodeFile[]): CodebaseContext {
    return {
      files,
      structure: this.createProjectStructure(files),
    };
  }

  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
  }

  private static detectLanguage(filename: string): string {
    const extension = this.getFileExtension(filename);
    
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.clj': 'clojure',
      '.hs': 'haskell',
      '.ml': 'ocaml',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.ini': 'ini',
      '.env': 'env',
      '.md': 'markdown',
      '.txt': 'text',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bat': 'batch',
      '.ps1': 'powershell',
    };

    return languageMap[extension] || 'text';
  }
}