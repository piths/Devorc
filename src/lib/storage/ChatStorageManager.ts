import { ChatSession, ChatMessage, CodebaseContext } from '@/types/chat';
import { LocalStorageManager } from './LocalStorageManager';

export class ChatStorageManager {
  private storage: LocalStorageManager;
  private static readonly ACTIVE_SESSION_KEY = 'devorch_active_chat_session';
  private static readonly MAX_SESSIONS = 50;
  private static readonly MAX_MESSAGES_PER_SESSION = 100;

  constructor() {
    this.storage = LocalStorageManager.getInstance();
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    try {
      // Trim messages if too many
      const trimmedSession = {
        ...session,
        messages: session.messages.slice(-ChatStorageManager.MAX_MESSAGES_PER_SESSION),
        updatedAt: new Date(),
      };

      const result = await this.storage.saveChatSession(trimmedSession as unknown as import('@/types/storage').ChatSession);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save chat session');
      }
    } catch (error) {
      console.error('Failed to save chat session:', error);
      throw new Error('Failed to save chat session');
    }
  }

  async loadChatSessions(): Promise<ChatSession[]> {
    try {
      const result = await this.storage.loadChatSessions();
      if (!result.success || !result.data) {
        return [];
      }

      // Sort by most recent first and limit to max sessions
      return (result.data as unknown as ChatSession[])
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, ChatStorageManager.MAX_SESSIONS);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const result = await this.storage.loadChatSession(sessionId);
      return result.success && result.data ? (result.data as unknown as ChatSession) : null;
    } catch (error) {
      console.error('Failed to get chat session:', error);
      return null;
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const result = await this.storage.removeChatSession(sessionId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete chat session');
      }

      // Clear active session if it was deleted
      const activeSessionId = await this.getActiveSessionId();
      if (activeSessionId === sessionId) {
        await this.clearActiveSession();
      }
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  async addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    session.messages.push(message);
    await this.saveChatSession(session);
  }

  async updateMessageInSession(
    sessionId: string, 
    messageId: string, 
    updates: Partial<ChatMessage>
  ): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    session.messages[messageIndex] = {
      ...session.messages[messageIndex],
      ...updates,
    };

    await this.saveChatSession(session);
  }

  async setActiveSession(sessionId: string): Promise<void> {
    const result = await this.storage.save(ChatStorageManager.ACTIVE_SESSION_KEY, sessionId);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to set active session');
    }
  }

  async getActiveSessionId(): Promise<string | null> {
    const result = await this.storage.load<string>(ChatStorageManager.ACTIVE_SESSION_KEY);
    return result.success && result.data ? result.data : null;
  }

  async clearActiveSession(): Promise<void> {
    const result = await this.storage.remove(ChatStorageManager.ACTIVE_SESSION_KEY);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to clear active session');
    }
  }

  async createNewSession(name?: string, codebaseContext?: CodebaseContext): Promise<ChatSession> {
    const session: ChatSession = {
      id: this.generateId(),
      name: name || `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      codebaseContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

      await this.saveChatSession(session);
      await this.setActiveSession(session.id);
    
    return session;
  }

  async exportChatSession(sessionId: string): Promise<string> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    return JSON.stringify(session, null, 2);
  }

  async importChatSession(sessionData: string): Promise<ChatSession> {
    try {
      const session = JSON.parse(sessionData) as ChatSession;
      
      // Validate session structure
      if (!session.id || !session.name || !Array.isArray(session.messages)) {
        throw new Error('Invalid session data format');
      }

      // Generate new ID to avoid conflicts
      session.id = this.generateId();
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date();

      await this.saveChatSession(session);
      return session;
    } catch {
      throw new Error('Failed to import chat session: Invalid format');
    }
  }

  private generateId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
