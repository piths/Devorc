import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../chat-interface';
import { useAIChat } from '@/hooks/useAIChat';

// Mock the useAIChat hook
jest.mock('@/hooks/useAIChat');
const mockUseAIChat = useAIChat as jest.MockedFunction<typeof useAIChat>;

// Mock file upload handler
jest.mock('@/lib/chat/FileUploadHandler', () => ({
  FileUploadHandler: {
    handleFileUpload: jest.fn(),
    createCodebaseContext: jest.fn(),
  },
}));

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: jest.fn(),
});

describe('ChatInterface', () => {
  const mockChatHook = {
    activeSession: null,
    isLoading: false,
    error: null,
    typingIndicator: { isVisible: false },
    sendMessage: jest.fn(),
    uploadFiles: jest.fn(),
    analyzeCodebase: jest.fn(),
    clearError: jest.fn(),
    retryLastMessage: jest.fn(),
  };

  beforeEach(() => {
    mockUseAIChat.mockReturnValue(mockChatHook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no active session', () => {
    render(<ChatInterface />);
    
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByText('Ask questions about your code or upload files for analysis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload code files/i })).toBeInTheDocument();
  });

  it('renders chat interface with active session', () => {
    const mockSession = {
      id: 'test-session',
      name: 'Test Chat',
      messages: [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseAIChat.mockReturnValue({
      ...mockChatHook,
      activeSession: mockSession,
    });

    render(<ChatInterface />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about your code or project...')).toBeInTheDocument();
  });

  it('sends message when send button is clicked', async () => {
    const mockSession = {
      id: 'test-session',
      name: 'Test Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseAIChat.mockReturnValue({
      ...mockChatHook,
      activeSession: mockSession,
    });

    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Ask about your code or project...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockChatHook.sendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('sends message when Enter key is pressed', async () => {
    const mockSession = {
      id: 'test-session',
      name: 'Test Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseAIChat.mockReturnValue({
      ...mockChatHook,
      activeSession: mockSession,
    });

    render(<ChatInterface />);
    
    const input = screen.getByPlaceholderText('Ask about your code or project...');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockChatHook.sendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('displays error message when error occurs', () => {
    const mockError = {
      type: 'api' as const,
      message: 'API Error occurred',
      retryable: true,
    };

    mockUseAIChat.mockReturnValue({
      ...mockChatHook,
      error: mockError,
    });

    render(<ChatInterface />);
    
    expect(screen.getByText('API Error occurred')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('displays typing indicator when AI is responding', () => {
    mockUseAIChat.mockReturnValue({
      ...mockChatHook,
      activeSession: {
        id: 'test-session',
        name: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      typingIndicator: { isVisible: true, message: 'AI is thinking...' },
    });

    render(<ChatInterface />);
    
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('shows codebase context badge when files are loaded', () => {
    const mockSession = {
      id: 'test-session',
      name: 'Test Chat',
      messages: [],
      codebaseContext: {
        files: [
          {
            path: 'test.js',
            content: 'console.log("test");',
            language: 'javascript',
            size: 100,
            lastModified: new Date(),
          },
        ],
        structure: {
          name: 'project',
          type: 'directory' as const,
          path: '/',
          children: [],
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUseAIChat.mockReturnValue({
      ...mockChatHook,
      activeSession: mockSession,
    });

    render(<ChatInterface />);
    
    expect(screen.getByText('1 files loaded')).toBeInTheDocument();
  });
});