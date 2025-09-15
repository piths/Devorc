import { ChatSession, ChatMessage, CodebaseContext } from '@/types/chat';
import { HybridStorageManager } from './HybridStorageManager';
import { LocalStorageManager } from './LocalStorageManager';

export class ChatStorageManager {
  private hybridStorage: HybridStorageManager;
  private legacyStorage: LocalStorageManager;
  private static readonly ACTIVE_SESSION_KEY = 'devorch_active_chat_session';
  private static readonly MAX_SESSIONS = 20; // Reduced from 50
  private static readonly MAX_MESSAGES_PER_SESSION = 50; // Reduced from 100

  constructor() {
    this.hybridStorage = HybridStorageManager.getInstance();
    this.legacyStorage = LocalStorageManager.getInstance();
  }

  async saveChatSession(session: ChatSession): Promise<void> {
    try {
      // Trim messages if too many
      const trimmedSession = {
        ...session,
        messages: session.messages.slice(-ChatStorageManager.MAX_MESSAGES_PER_SESSION),
        updatedAt: new Date(),
      };

      // Trim codebase context if it's too large
      if (trimmedSession.codebaseContext) {
        trimmedSession.codebaseContext = this.trimCodebaseContext(trimmedSession.codebaseContext);
      }

      const key = `devorch_chat_session_${trimmedSession.id}`;
      // Save to hybrid storage (IndexedDB -> LocalStorage fallback)
      const hybridResult = await this.hybridStorage.save(key, trimmedSession);
      if (!hybridResult.success) {
        console.error('Storage save failed:', hybridResult.error);
        throw new Error(hybridResult.error?.message || 'Failed to save chat session');
      }

      // Also save to legacy LocalStorage so we can enumerate sessions reliably
      try {
        const legacyResult = await this.legacyStorage.saveChatSession(trimmedSession);
        if (!legacyResult.success) {
          console.warn('Legacy storage save failed:', legacyResult.error);
        }
      } catch (e) {
        console.warn('Legacy storage error while saving chat session:', e);
      }

      // Maintain an index of ids in hybrid storage for future reads
      await this.updateSessionIndex(trimmedSession.id, 'add');
    } catch (error) {
      console.error('Failed to save chat session:', error);
      // Don't re-throw a generic error, preserve the original error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to save chat session');
    }
  }

  private async updateSessionIndex(sessionId: string, action: 'add' | 'remove') {
    try {
      const indexKey = 'devorch_chat_session_index';
      const current = await this.hybridStorage.load<string[]>(indexKey);
      let ids: string[] = current.success && current.data ? current.data : [];
      if (action === 'add') {
        if (!ids.includes(sessionId)) ids.push(sessionId);
      } else {
        ids = ids.filter(id => id !== sessionId);
      }
      await this.hybridStorage.save(indexKey, ids);
    } catch (err) {
      console.warn('Failed to update chat session index:', err);
    }
  }

  private trimCodebaseContext(context: CodebaseContext): CodebaseContext {
    const maxFiles = 50; // Limit to 50 files
    const maxFileSize = 50 * 1024; // 50KB per file

    return {
      ...context,
      files: context.files
        .slice(0, maxFiles)
        .map(file => ({
          ...file,
          content: file.content.length > maxFileSize 
            ? file.content.substring(0, maxFileSize) + '\n... [truncated]'
            : file.content
        }))
    };
  }

  async loadChatSessions(): Promise<ChatSession[]> {
    try {
      // Load from legacy storage (enumerable)
      const legacyResult = await this.legacyStorage.loadChatSessions();
      let sessions: ChatSession[] = legacyResult.success && legacyResult.data ? legacyResult.data : [];

      // If nothing is found, try hybrid by index
      if (sessions.length === 0) {
        try {
          const index = await this.hybridStorage.load<string[]>('devorch_chat_session_index');
          if (index.success && index.data && index.data.length > 0) {
            const loaded = await Promise.all(
              index.data.map(async (id) => {
                const key = `devorch_chat_session_${id}`;
                const res = await this.hybridStorage.load<ChatSession>(key);
                return res.success && res.data ? res.data : null;
              })
            );
            sessions = loaded.filter((s): s is ChatSession => s !== null);
          }
        } catch (e) {
          console.warn('Failed to load sessions via hybrid index:', e);
        }

        // As a final fallback, try to load the active session directly
        if (sessions.length === 0) {
          try {
            const activeId = await this.getActiveSessionId();
            if (activeId) {
              const active = await this.getChatSession(activeId);
              if (active) sessions = [active];
            }
          } catch (e) {
            console.warn('Failed to load active chat session from hybrid storage:', e);
          }
        }
      }

      return sessions
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt);
          const dateB = new Date(b.updatedAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, ChatStorageManager.MAX_SESSIONS);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const key = `devorch_chat_session_${sessionId}`;
      const result = await this.hybridStorage.load<ChatSession>(key);
      
      if (result.success && result.data) {
        return result.data;
      }
      
      // Fallback to legacy storage
      const legacyResult = await this.legacyStorage.loadChatSession(sessionId);
      if (legacyResult.success && legacyResult.data) {
        // Migrate to hybrid storage
        await this.hybridStorage.save(key, legacyResult.data);
        return legacyResult.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get chat session:', error);
      return null;
    }
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      const key = `devorch_chat_session_${sessionId}`;
      
      // Remove from both storages
      await Promise.all([
        this.hybridStorage.remove(key),
        this.legacyStorage.removeChatSession(sessionId)
      ]);

      // Update hybrid index
      await this.updateSessionIndex(sessionId, 'remove');

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
    const result = await this.hybridStorage.save(ChatStorageManager.ACTIVE_SESSION_KEY, sessionId);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to set active session');
    }
  }

  async getActiveSessionId(): Promise<string | null> {
    const result = await this.hybridStorage.load<string>(ChatStorageManager.ACTIVE_SESSION_KEY);
    return result.success && result.data ? result.data : null;
  }

  async clearActiveSession(): Promise<void> {
    const result = await this.hybridStorage.remove(ChatStorageManager.ACTIVE_SESSION_KEY);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to clear active session');
    }
  }

  async createNewSession(name?: string, codebaseContext?: CodebaseContext): Promise<ChatSession> {
    // Proactively clean up old sessions before creating a new one
    await this.cleanupOldSessions();

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

  private async cleanupOldSessions(): Promise<void> {
    try {
      const sessions = await this.loadChatSessions();
      
      // If we have too many sessions, remove the oldest ones
      if (sessions.length >= ChatStorageManager.MAX_SESSIONS) {
        const sessionsToRemove = sessions.slice(ChatStorageManager.MAX_SESSIONS - 5); // Keep 5 fewer than max
        
        for (const session of sessionsToRemove) {
          await this.legacyStorage.removeChatSession(session.id);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old sessions:', error);
      // Don't throw error, just log warning
    }
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
    return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
