import { render, screen } from '@testing-library/react';
import { ChatPage } from '../chat-page';
import { useAIChat } from '@/hooks/useAIChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGitHubAuth } from '@/contexts/GitHubAuthContext';

// Mock the hooks
jest.mock('@/hooks/useAIChat');
jest.mock('@/hooks/use-mobile');
jest.mock('@/contexts/GitHubAuthContext');

const mockUseAIChat = useAIChat as jest.MockedFunction<typeof useAIChat>;
const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>;
const mockUseGitHubAuth = useGitHubAuth as jest.MockedFunction<typeof useGitHubAuth>;

describe('ChatPage Layout', () => {
  beforeEach(() => {
    mockUseAIChat.mockReturnValue({
      activeSession: null,
      sessions: [],
      isLoading: false,
      error: null,
      typingIndicator: { isVisible: false, message: '' },
      createNewSession: jest.fn(),
      sendMessage: jest.fn(),
      deleteSession: jest.fn(),
      switchToSession: jest.fn(),
      clearError: jest.fn(),
      setCurrentFile: jest.fn(),
      uploadFiles: jest.fn(),
      analyzeCodebase: jest.fn(),
      retryLastMessage: jest.fn(),
      loadSessions: jest.fn(),
      findCodeReferences: jest.fn(),
      generateInsights: jest.fn(),
      getContextualSuggestions: jest.fn(),
      analyzeCurrentFile: jest.fn(),
      getFileSpecificSuggestions: jest.fn(),
      currentFileContext: null,
    });

    mockUseGitHubAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      apiClient: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  it('renders desktop layout with resizable panels when not mobile', () => {
    mockUseIsMobile.mockReturnValue(false);
    
    const { container } = render(<ChatPage />);
    
    // Should have chat sessions sidebar
    expect(screen.getByText('Chat Sessions')).toBeInTheDocument();
    
    // Should have the main layout structure
    expect(container.querySelector('.h-full.flex.gap-4')).toBeInTheDocument();
    
    // Should have resizable panels structure
    const resizer = container.querySelector('.cursor-col-resize');
    expect(resizer).toBeInTheDocument();
    
    // Should have sessions sidebar on large screens (hidden by default in test)
    expect(container.querySelector('.lg\\:block')).toBeInTheDocument();
  });

  it('renders mobile layout with tabs when mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    
    render(<ChatPage />);
    
    // Should have tabs for mobile layout
    expect(screen.getByRole('tab', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sessions' })).toBeInTheDocument();
  });

  it('shows file explorer placeholder content', () => {
    mockUseIsMobile.mockReturnValue(false);
    
    render(<ChatPage />);
    
    expect(screen.getByText('Select a GitHub repository to browse files')).toBeInTheDocument();
    expect(screen.getByText('Select a file to view its content')).toBeInTheDocument();
  });

  it('shows code insights panel when codebase context exists', () => {
    mockUseAIChat.mockReturnValue({
      activeSession: {
        id: '1',
        name: 'Test Session',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        codebaseContext: {
          files: [{ path: 'test.js', content: 'console.log("test");', language: 'javascript', size: 100, lastModified: new Date() }],
          structure: { name: 'test', type: 'directory', path: '/', children: [] }
        }
      },
      sessions: [],
      isLoading: false,
      error: null,
      typingIndicator: { isVisible: false, message: '' },
      createNewSession: jest.fn(),
      sendMessage: jest.fn(),
      deleteSession: jest.fn(),
      switchToSession: jest.fn(),
      clearError: jest.fn(),
      setCurrentFile: jest.fn(),
      uploadFiles: jest.fn(),
      analyzeCodebase: jest.fn(),
      retryLastMessage: jest.fn(),
      loadSessions: jest.fn(),
      findCodeReferences: jest.fn(),
      generateInsights: jest.fn(),
      getContextualSuggestions: jest.fn(),
      analyzeCurrentFile: jest.fn(),
      getFileSpecificSuggestions: jest.fn(),
      currentFileContext: null,
    });
    mockUseIsMobile.mockReturnValue(false);
    
    const { container } = render(<ChatPage />);
    
    // Code insights panel should be present - look for the border-t class that indicates the insights panel
    const codeInsightsPanel = container.querySelector('.border-t');
    expect(codeInsightsPanel).toBeInTheDocument();
  });
});