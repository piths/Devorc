import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatSessions } from '../chat-sessions';
import { useAIChat } from '@/hooks/useAIChat';

// Mock the useAIChat hook
jest.mock('@/hooks/useAIChat');
const mockUseAIChat = useAIChat as jest.MockedFunction<typeof useAIChat>;

describe('ChatSessions', () => {
  beforeEach(() => {
    mockUseAIChat.mockReturnValue({
      sessions: [],
      activeSession: null,
      isLoading: false,
      error: null,
      typingIndicator: { isVisible: false },
      currentFileContext: null,
      createNewSession: jest.fn(),
      switchToSession: jest.fn(),
      deleteSession: jest.fn(),
      sendMessage: jest.fn(),
      uploadFiles: jest.fn(),
      analyzeCodebase: jest.fn(),
      clearError: jest.fn(),
      retryLastMessage: jest.fn(),
      loadSessions: jest.fn(),
      setCurrentFile: jest.fn(),
      findCodeReferences: jest.fn(),
      generateInsights: jest.fn(),
      getContextualSuggestions: jest.fn(),
    });
  });

  it('renders empty state when no sessions', () => {
    render(<ChatSessions />);
    expect(screen.getByText('No chat sessions')).toBeInTheDocument();
  });

  it('handles sessions with various date formats', () => {
    const mockSessions = [
      {
        id: '1',
        name: 'Test Session 1',
        messages: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      {
        id: '2', 
        name: 'Test Session 2',
        messages: [],
        createdAt: '2023-01-02' as unknown as Date,
        updatedAt: '2023-01-02' as unknown as Date,
      },
      {
        id: '3',
        name: 'Test Session 3', 
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockUseAIChat.mockReturnValue({
      sessions: mockSessions,
      activeSession: null,
      isLoading: false,
      error: null,
      typingIndicator: { isVisible: false },
      currentFileContext: null,
      createNewSession: jest.fn(),
      switchToSession: jest.fn(),
      deleteSession: jest.fn(),
      sendMessage: jest.fn(),
      uploadFiles: jest.fn(),
      analyzeCodebase: jest.fn(),
      clearError: jest.fn(),
      retryLastMessage: jest.fn(),
      loadSessions: jest.fn(),
      setCurrentFile: jest.fn(),
      findCodeReferences: jest.fn(),
      generateInsights: jest.fn(),
      getContextualSuggestions: jest.fn(),
    });

    render(<ChatSessions />);
    
    // Should render all sessions without crashing
    expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    expect(screen.getByText('Test Session 2')).toBeInTheDocument();
    expect(screen.getByText('Test Session 3')).toBeInTheDocument();
  });

  it('handles invalid dates gracefully', () => {
    const mockSessions = [
      {
        id: '1',
        name: 'Test Session',
        messages: [],
        createdAt: 'invalid-date' as unknown as Date,
        updatedAt: 'invalid-date' as unknown as Date,
      },
      {
        id: '2',
        name: 'Test Session 2',
        messages: [],
        createdAt: null as unknown as Date,
        updatedAt: undefined as unknown as Date,
      },
    ];

    mockUseAIChat.mockReturnValue({
      sessions: mockSessions,
      activeSession: null,
      isLoading: false,
      error: null,
      typingIndicator: { isVisible: false },
      currentFileContext: null,
      createNewSession: jest.fn(),
      switchToSession: jest.fn(),
      deleteSession: jest.fn(),
      sendMessage: jest.fn(),
      uploadFiles: jest.fn(),
      analyzeCodebase: jest.fn(),
      clearError: jest.fn(),
      retryLastMessage: jest.fn(),
      loadSessions: jest.fn(),
      setCurrentFile: jest.fn(),
      findCodeReferences: jest.fn(),
      generateInsights: jest.fn(),
      getContextualSuggestions: jest.fn(),
    });

    render(<ChatSessions />);
    
    // Should render sessions without crashing, showing "Unknown" for invalid dates
    expect(screen.getByText('Test Session')).toBeInTheDocument();
    expect(screen.getByText('Test Session 2')).toBeInTheDocument();
    expect(screen.getAllByText('Unknown')).toHaveLength(2);
  });
});