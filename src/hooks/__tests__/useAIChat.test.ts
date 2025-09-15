import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChat } from '../useAIChat';
import { ChatStorageManager } from '@/lib/storage/ChatStorageManager';
import { OpenAIApiClient } from '@/lib/openai/OpenAIApiClient';

// Mock dependencies
jest.mock('@/lib/storage/ChatStorageManager');
jest.mock('@/lib/openai/OpenAIApiClient');
jest.mock('@/lib/chat/FileUploadHandler');

const mockStorageManager = ChatStorageManager as jest.MockedClass<typeof ChatStorageManager>;
const mockOpenAIClient = OpenAIApiClient as jest.MockedClass<typeof OpenAIApiClient>;

describe('useAIChat', () => {
  const mockSession = {
    id: 'test-session',
    name: 'Test Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock storage manager methods
    mockStorageManager.prototype.loadChatSessions = jest.fn().mockResolvedValue([mockSession]);
    mockStorageManager.prototype.getActiveSessionId = jest.fn().mockResolvedValue('test-session');
    mockStorageManager.prototype.createNewSession = jest.fn().mockResolvedValue(mockSession);
    mockStorageManager.prototype.addMessageToSession = jest.fn().mockResolvedValue(undefined);
    mockStorageManager.prototype.setActiveSession = jest.fn().mockResolvedValue(undefined);
    mockStorageManager.prototype.deleteChatSession = jest.fn().mockResolvedValue(undefined);
    
    // Mock OpenAI client methods
    mockOpenAIClient.prototype.chatCompletion = jest.fn().mockResolvedValue('AI response');
    mockOpenAIClient.prototype.analyzeCode = jest.fn().mockResolvedValue({
      summary: 'Test analysis',
      technologies: ['JavaScript'],
      patterns: ['Module'],
      suggestions: ['Add tests'],
      complexity: 'low',
      maintainability: 80,
    });
  });

  it('loads sessions on mount', async () => {
    const { result } = renderHook(() => useAIChat());
    
    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.activeSession).toEqual(mockSession);
    });
    
    expect(mockStorageManager.prototype.loadChatSessions).toHaveBeenCalled();
    expect(mockStorageManager.prototype.getActiveSessionId).toHaveBeenCalled();
  });

  it('creates new session', async () => {
    const { result } = renderHook(() => useAIChat());
    
    await act(async () => {
      await result.current.createNewSession('New Chat');
    });
    
    expect(mockStorageManager.prototype.createNewSession).toHaveBeenCalledWith('New Chat', undefined);
  });

  it('switches to session', async () => {
    const { result } = renderHook(() => useAIChat());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
    });
    
    await act(async () => {
      await result.current.switchToSession('test-session');
    });
    
    expect(mockStorageManager.prototype.setActiveSession).toHaveBeenCalledWith('test-session');
  });

  it('sends message and gets AI response', async () => {
    const { result } = renderHook(() => useAIChat());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.activeSession).toEqual(mockSession);
    });
    
    await act(async () => {
      await result.current.sendMessage('Hello AI');
    });
    
    expect(mockStorageManager.prototype.addMessageToSession).toHaveBeenCalledTimes(2); // User message + AI response
    expect(mockOpenAIClient.prototype.chatCompletion).toHaveBeenCalled();
  });

  it('handles send message error', async () => {
    // Mock OpenAI client to throw error
    mockOpenAIClient.prototype.chatCompletion = jest.fn().mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useAIChat());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.activeSession).toEqual(mockSession);
    });
    
    await act(async () => {
      await result.current.sendMessage('Hello AI');
    });
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('API Error');
  });

  it('deletes session', async () => {
    const { result } = renderHook(() => useAIChat());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
    });
    
    await act(async () => {
      await result.current.deleteSession('test-session');
    });
    
    expect(mockStorageManager.prototype.deleteChatSession).toHaveBeenCalledWith('test-session');
  });

  it('clears error', async () => {
    const { result } = renderHook(() => useAIChat());
    
    // Set an error first
    act(() => {
      // Simulate error state
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('shows typing indicator during message sending', async () => {
    const { result } = renderHook(() => useAIChat());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.activeSession).toEqual(mockSession);
    });
    
    // Mock a delayed response
    mockOpenAIClient.prototype.chatCompletion = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('AI response'), 100))
    );
    
    act(() => {
      result.current.sendMessage('Hello AI');
    });
    
    // Should show typing indicator immediately
    expect(result.current.typingIndicator.isVisible).toBe(true);
    
    // Wait for completion
    await waitFor(() => {
      expect(result.current.typingIndicator.isVisible).toBe(false);
    });
  });
});