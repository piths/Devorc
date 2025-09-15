import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeViewer } from '../code-viewer';
import { GitHubFileContent } from '@/types/github';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockFile: GitHubFileContent = {
  name: 'example.ts',
  path: 'src/example.ts',
  sha: 'abc123',
  size: 1024,
  url: 'https://api.github.com/repos/test/repo/contents/src/example.ts',
  html_url: 'https://github.com/test/repo/blob/main/src/example.ts',
  git_url: 'https://api.github.com/repos/test/repo/git/blobs/abc123',
  download_url: 'https://raw.githubusercontent.com/test/repo/main/src/example.ts',
  type: 'file',
  content: btoa('const message = "Hello, World!";\nconsole.log(message);'),
  encoding: 'base64',
  _links: {
    self: 'https://api.github.com/repos/test/repo/contents/src/example.ts',
    git: 'https://api.github.com/repos/test/repo/git/blobs/abc123',
    html: 'https://github.com/test/repo/blob/main/src/example.ts',
  },
};

describe('CodeViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders placeholder when no file is selected', () => {
    render(<CodeViewer file={null} />);
    
    expect(screen.getByText('Code Viewer')).toBeInTheDocument();
    expect(screen.getByText('Select a file to view its content')).toBeInTheDocument();
  });

  it('displays file information and content', () => {
    render(<CodeViewer file={mockFile} />);
    
    expect(screen.getByText('example.ts')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('src/example.ts')).toBeInTheDocument();
    // Check for content within the syntax highlighter
    expect(screen.getByText('const')).toBeInTheDocument();
    expect(screen.getByText('"Hello, World!"')).toBeInTheDocument();
    expect(screen.getByText('console')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<CodeViewer file={null} isLoading={true} />);
    
    // Should show loading skeletons
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(10);
  });

  it('displays error message', () => {
    const errorMessage = 'Failed to load file';
    render(<CodeViewer file={null} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('detects file language correctly', () => {
    const jsFile = { ...mockFile, name: 'script.js' };
    const { rerender } = render(<CodeViewer file={jsFile} />);
    expect(screen.getByText('javascript')).toBeInTheDocument();

    const pyFile = { ...mockFile, name: 'script.py' };
    rerender(<CodeViewer file={pyFile} />);
    expect(screen.getByText('python')).toBeInTheDocument();

    const htmlFile = { ...mockFile, name: 'index.html' };
    rerender(<CodeViewer file={htmlFile} />);
    expect(screen.getByText('markup')).toBeInTheDocument();

    const unknownFile = { ...mockFile, name: 'unknown.xyz' };
    rerender(<CodeViewer file={unknownFile} />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('formats file size correctly', () => {
    const smallFile = { ...mockFile, size: 512 };
    const { rerender } = render(<CodeViewer file={smallFile} />);
    expect(screen.getByText('512 B')).toBeInTheDocument();

    const mediumFile = { ...mockFile, size: 2048 };
    rerender(<CodeViewer file={mediumFile} />);
    expect(screen.getByText('2 KB')).toBeInTheDocument();

    const largeFile = { ...mockFile, size: 1048576 };
    rerender(<CodeViewer file={largeFile} />);
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });

  it('copies content to clipboard', async () => {
    const mockWriteText = navigator.clipboard.writeText as jest.Mock;
    mockWriteText.mockResolvedValue(undefined);

    render(<CodeViewer file={mockFile} />);
    
    const copyButton = screen.getByTitle('Copy content');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('const message = "Hello, World!";\nconsole.log(message);');
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    // Success message should disappear after timeout
    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles clipboard copy failure gracefully', async () => {
    const mockWriteText = navigator.clipboard.writeText as jest.Mock;
    mockWriteText.mockRejectedValue(new Error('Clipboard not available'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<CodeViewer file={mockFile} />);
    
    const copyButton = screen.getByTitle('Copy content');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy content:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('opens file in GitHub when external link is clicked', () => {
    const mockOpen = jest.spyOn(window, 'open').mockImplementation();

    render(<CodeViewer file={mockFile} />);
    
    const externalLinkButton = screen.getByTitle('Open in GitHub');
    fireEvent.click(externalLinkButton);

    expect(mockOpen).toHaveBeenCalledWith(mockFile.html_url, '_blank');

    mockOpen.mockRestore();
  });

  it('handles files without content gracefully', () => {
    const fileWithoutContent = { ...mockFile, content: undefined };
    render(<CodeViewer file={fileWithoutContent} />);
    
    expect(screen.getByText('Unable to display file content')).toBeInTheDocument();
  });

  it('handles base64 decoding errors', () => {
    const fileWithInvalidContent = { 
      ...mockFile, 
      content: 'invalid-base64-content!@#$%^&*()',
      encoding: 'base64'
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<CodeViewer file={fileWithInvalidContent} />);
    
    // The error message is now displayed within the syntax highlighter
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('to decode file content')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to decode file content:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('displays file icons correctly', () => {
    const testCases = [
      { name: 'script.js', expectedIcon: '🟨' },
      { name: 'component.jsx', expectedIcon: '⚛️' },
      { name: 'types.ts', expectedIcon: '🔷' },
      { name: 'component.tsx', expectedIcon: '⚛️' },
      { name: 'script.py', expectedIcon: '🐍' },
      { name: 'Main.java', expectedIcon: '☕' },
      { name: 'index.html', expectedIcon: '🌐' },
      { name: 'styles.css', expectedIcon: '🎨' },
      { name: 'data.json', expectedIcon: '📋' },
      { name: 'README.md', expectedIcon: '📝' },
      { name: 'config.yml', expectedIcon: '⚙️' },
      { name: 'unknown.xyz', expectedIcon: '📄' },
    ];

    testCases.forEach(({ name, expectedIcon }) => {
      const testFile = { ...mockFile, name };
      const { rerender } = render(<CodeViewer file={testFile} />);
      expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      rerender(<CodeViewer file={null} />);
    });
  });

  it('disables copy button when no content is available', () => {
    const fileWithoutContent = { ...mockFile, content: undefined };
    render(<CodeViewer file={fileWithoutContent} />);
    
    const copyButton = screen.getByTitle('Copy content');
    expect(copyButton).toBeDisabled();
  });
});