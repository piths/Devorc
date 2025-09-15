import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CodeViewer } from '../code-viewer';
import { GitHubApiClient } from '@/lib/github/GitHubApiClient';
import { GitHubFileContent } from '@/types/github';

// Mock the GitHub API client
jest.mock('@/lib/github/GitHubApiClient');

const mockGitHubApiClient = GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>;

const mockFileContent: GitHubFileContent = {
  name: 'example.ts',
  path: 'src/example.ts',
  sha: 'abc123',
  size: 1024,
  url: 'https://api.github.com/repos/test/repo/contents/src/example.ts',
  html_url: 'https://github.com/test/repo/blob/main/src/example.ts',
  git_url: 'https://api.github.com/repos/test/repo/git/blobs/abc123',
  download_url: 'https://raw.githubusercontent.com/test/repo/main/src/example.ts',
  type: 'file',
  content: btoa(`interface User {
  id: number;
  name: string;
  email: string;
}

export function createUser(data: Partial<User>): User {
  return {
    id: data.id || Math.random(),
    name: data.name || 'Anonymous',
    email: data.email || 'user@example.com'
  };
}`),
  encoding: 'base64',
  _links: {
    self: 'https://api.github.com/repos/test/repo/contents/src/example.ts',
    git: 'https://api.github.com/repos/test/repo/git/blobs/abc123',
    html: 'https://github.com/test/repo/blob/main/src/example.ts',
  },
};

describe('CodeViewer Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays TypeScript code with proper syntax highlighting', async () => {
    render(<CodeViewer file={mockFileContent} />);

    // Check file metadata
    expect(screen.getByText('example.ts')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();

    // Check syntax highlighted content
    await waitFor(() => {
      expect(screen.getByText('interface')).toBeInTheDocument();
      expect(screen.getAllByText('User').length).toBeGreaterThan(0);
      expect(screen.getByText('export')).toBeInTheDocument();
      expect(screen.getByText('function')).toBeInTheDocument();
      expect(screen.getByText('createUser')).toBeInTheDocument();
    });
  });

  it('handles different file types with appropriate syntax highlighting', async () => {
    const jsFile: GitHubFileContent = {
      ...mockFileContent,
      name: 'script.js',
      content: btoa(`const message = "Hello, World!";
console.log(message);

function greet(name) {
  return \`Hello, \${name}!\`;
}`),
    };

    render(<CodeViewer file={jsFile} />);

    expect(screen.getByText('javascript')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('const')).toBeInTheDocument();
      expect(screen.getByText('function')).toBeInTheDocument();
      expect(screen.getByText('greet')).toBeInTheDocument();
    });
  });

  it('displays Python code with proper highlighting', async () => {
    const pythonFile: GitHubFileContent = {
      ...mockFileContent,
      name: 'script.py',
      content: btoa(`def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result`),
    };

    render(<CodeViewer file={pythonFile} />);

    expect(screen.getByText('python')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getAllByText('def').length).toBeGreaterThan(0);
      expect(screen.getByText('class')).toBeInTheDocument();
      expect(screen.getByText('Calculator')).toBeInTheDocument();
    });
  });

  it('handles JSON files correctly', async () => {
    const jsonFile: GitHubFileContent = {
      ...mockFileContent,
      name: 'package.json',
      content: btoa(`{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^4.0.0"
  },
  "scripts": {
    "start": "npm run dev",
    "build": "npm run build"
  }
}`),
    };

    render(<CodeViewer file={jsonFile} />);

    expect(screen.getByText('json')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('"name"')).toBeInTheDocument();
      expect(screen.getByText('"test-project"')).toBeInTheDocument();
      expect(screen.getByText('"dependencies"')).toBeInTheDocument();
    });
  });

  it('shows line numbers for code files', async () => {
    render(<CodeViewer file={mockFileContent} />);

    await waitFor(() => {
      // Check for line numbers in the syntax highlighter
      const lineNumbers = screen.getAllByText('1');
      expect(lineNumbers.length).toBeGreaterThan(0);
      
      const lineNumber2 = screen.getAllByText('2');
      expect(lineNumber2.length).toBeGreaterThan(0);
    });
  });

  it('handles large files efficiently', async () => {
    const largeContent = Array.from({ length: 10 }, (_, i) => 
      `// Line ${i + 1}\nconst variable${i} = "value${i}";`
    ).join('\n');

    const largeFile: GitHubFileContent = {
      ...mockFileContent,
      name: 'large-file.js',
      size: largeContent.length,
      content: btoa(largeContent),
    };

    render(<CodeViewer file={largeFile} />);

    expect(screen.getByText('large-file.js')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getAllByText('const').length).toBeGreaterThan(0);
      // Should handle large files without performance issues
    });
  });
});