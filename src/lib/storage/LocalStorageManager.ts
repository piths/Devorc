import {
    UserSession,
    KanbanBoard,
    CanvasProject,
    ChatSession,
    GitHubConnection,
    StorageError,
    StorageResult,
    AutoSaveConfig
} from '@/types/storage';

export class LocalStorageManager {
    private static instance: LocalStorageManager;
    private autoSaveConfig: AutoSaveConfig = {
        enabled: true,
        interval: 30, // 30 seconds
        maxRetries: 3
    };
    private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
    private pendingOperations: Map<string, unknown> = new Map();

    private constructor() {
        // Singleton pattern
        this.initializeStorage();
    }

    public static getInstance(): LocalStorageManager {
        if (!LocalStorageManager.instance) {
            LocalStorageManager.instance = new LocalStorageManager();
        }
        return LocalStorageManager.instance;
    }

    private initializeStorage(): void {
        try {
            // Test localStorage availability
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            console.warn('LocalStorage not available, falling back to memory storage');
        }
    }

    private isLocalStorageAvailable(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }

    private generateKey(prefix: string, id?: string): string {
        return id ? `devorch_${prefix}_${id}` : `devorch_${prefix}`;
    }

    private serialize<T>(data: T): string {
        try {
            return JSON.stringify(data, (key, value) => {
                // Handle Date objects
                if (value instanceof Date) {
                    return { __type: 'Date', value: value.toISOString() };
                }
                return value;
            });
        } catch (error) {
            throw new StorageError(
                'Failed to serialize data',
                'SERIALIZATION_ERROR',
                false
            );
        }
    }

    private deserialize<T>(data: string): T {
        try {
            return JSON.parse(data, (key, value) => {
                // Handle Date objects
                if (value && typeof value === 'object' && value.__type === 'Date') {
                    return new Date(value.value);
                }
                return value;
            });
        } catch (error) {
            throw new StorageError(
                'Failed to deserialize data',
                'DESERIALIZATION_ERROR',
                false
            );
        }
    }

    // Generic CRUD operations
    public async save<T>(key: string, data: T): Promise<StorageResult<void>> {
        try {
            const serializedData = this.serialize(data);

            if (this.isLocalStorageAvailable()) {
                try {
                    localStorage.setItem(key, serializedData);
                } catch (storageError) {
                    // Handle quota exceeded error
                    if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
                        console.warn('LocalStorage quota exceeded, attempting aggressive cleanup...');
                        
                        // Try progressively more aggressive cleanup strategies
                        const cleanupStrategies = [
                            () => this.cleanupOldData(7),   // Clean data older than 7 days
                            () => this.cleanupOldData(3),   // Clean data older than 3 days
                            () => this.cleanupOldData(1),   // Clean data older than 1 day
                            () => this.cleanupLargestItems(10), // Remove 10 largest items
                            () => this.cleanupExcessSessions(), // Remove excess chat sessions
                        ];

                        let cleaned = false;
                        for (const cleanup of cleanupStrategies) {
                            try {
                                const result = await cleanup();
                                if (result.success && result.data && result.data > 0) {
                                    console.log(`Cleaned up ${result.data} items`);
                                    try {
                                        localStorage.setItem(key, serializedData);
                                        cleaned = true;
                                        break;
                                    } catch {
                                        // Continue to next cleanup strategy
                                        continue;
                                    }
                                }
                            } catch (cleanupError) {
                                console.warn('Cleanup strategy failed:', cleanupError);
                                continue;
                            }
                        }

                        if (!cleaned) {
                            // Last resort: try to save to memory storage
                            console.warn('All cleanup strategies failed, falling back to memory storage');
                            this.pendingOperations.set(key, data);
                            return { success: true };
                        }
                    } else {
                        throw storageError;
                    }
                }
            } else {
                // Fallback to memory storage
                this.pendingOperations.set(key, data);
            }

            return { success: true };
        } catch (error) {
            console.error('Storage save error:', error);
            const storageError = error instanceof StorageError
                ? error
                : new StorageError(
                    `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                    'SAVE_ERROR'
                );

            return { success: false, error: storageError };
        }
    }

    public async load<T>(key: string): Promise<StorageResult<T>> {
        try {
            let data: string | null = null;

            if (this.isLocalStorageAvailable()) {
                data = localStorage.getItem(key);
            } else {
                // Fallback to memory storage
                const memoryData = this.pendingOperations.get(key);
                if (memoryData) {
                    return { success: true, data: memoryData as T };
                }
            }

            if (data === null) {
                return {
                    success: false,
                    error: new StorageError('Data not found', 'NOT_FOUND', false)
                };
            }

            const deserializedData = this.deserialize<T>(data);
            return { success: true, data: deserializedData };
        } catch (error) {
            const storageError = error instanceof StorageError
                ? error
                : new StorageError('Failed to load data', 'LOAD_ERROR');

            return { success: false, error: storageError };
        }
    }

    public async remove(key: string): Promise<StorageResult<void>> {
        try {
            if (this.isLocalStorageAvailable()) {
                localStorage.removeItem(key);
            } else {
                this.pendingOperations.delete(key);
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to remove data', 'REMOVE_ERROR')
            };
        }
    }

    public async clear(): Promise<StorageResult<void>> {
        try {
            if (this.isLocalStorageAvailable()) {
                // Only clear devorch-related keys
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('devorch_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                this.pendingOperations.clear();
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to clear data', 'CLEAR_ERROR')
            };
        }
    }

    // Specialized methods for User Session
    public async saveUserSession(session: UserSession): Promise<StorageResult<void>> {
        const key = this.generateKey('user_session', session.id);
        return this.save(key, session);
    }

    public async loadUserSession(sessionId: string): Promise<StorageResult<UserSession>> {
        const key = this.generateKey('user_session', sessionId);
        return this.load<UserSession>(key);
    }

    public async getCurrentUserSession(): Promise<StorageResult<UserSession>> {
        const key = this.generateKey('current_session');
        return this.load<UserSession>(key);
    }

    public async setCurrentUserSession(session: UserSession): Promise<StorageResult<void>> {
        const key = this.generateKey('current_session');
        return this.save(key, session);
    }

    // Specialized methods for GitHub Connection
    public async saveGitHubConnection(connection: GitHubConnection): Promise<StorageResult<void>> {
        const key = this.generateKey('github_connection');
        return this.save(key, connection);
    }

    public async loadGitHubConnection(): Promise<StorageResult<GitHubConnection>> {
        const key = this.generateKey('github_connection');
        return this.load<GitHubConnection>(key);
    }

    public async removeGitHubConnection(): Promise<StorageResult<void>> {
        const key = this.generateKey('github_connection');
        return this.remove(key);
    }

    // Specialized methods for Kanban Boards
    public async saveKanbanBoard(board: KanbanBoard): Promise<StorageResult<void>> {
        const key = this.generateKey('kanban_board', board.id);
        const result = await this.save(key, board);

        if (result.success && this.autoSaveConfig.enabled) {
            this.scheduleAutoSave('kanban', board.id, board);
        }

        return result;
    }

    public async loadKanbanBoard(boardId: string): Promise<StorageResult<KanbanBoard>> {
        const key = this.generateKey('kanban_board', boardId);
        return this.load<KanbanBoard>(key);
    }

    public async loadKanbanBoards(): Promise<StorageResult<KanbanBoard[]>> {
        try {
            const boards: KanbanBoard[] = [];
            const prefix = this.generateKey('kanban_board');

            if (this.isLocalStorageAvailable()) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        const result = await this.load<KanbanBoard>(key);
                        if (result.success && result.data) {
                            boards.push(result.data);
                        }
                    }
                }
            } else {
                // Fallback to memory storage
                for (const [key, value] of this.pendingOperations.entries()) {
                    if (key.startsWith(prefix)) {
                        boards.push(value as KanbanBoard);
                    }
                }
            }

            return { success: true, data: boards };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to load kanban boards', 'LOAD_BOARDS_ERROR')
            };
        }
    }

    public async removeKanbanBoard(boardId: string): Promise<StorageResult<void>> {
        const key = this.generateKey('kanban_board', boardId);
        this.cancelAutoSave('kanban', boardId);
        return this.remove(key);
    }

    // Specialized methods for Canvas Projects
    public async saveCanvasProject(project: CanvasProject): Promise<StorageResult<void>> {
        const key = this.generateKey('canvas_project', project.id);
        const result = await this.save(key, project);

        if (result.success && this.autoSaveConfig.enabled) {
            this.scheduleAutoSave('canvas', project.id, project);
        }

        return result;
    }

    public async loadCanvasProject(projectId: string): Promise<StorageResult<CanvasProject>> {
        const key = this.generateKey('canvas_project', projectId);
        return this.load<CanvasProject>(key);
    }

    public async loadCanvasProjects(): Promise<StorageResult<CanvasProject[]>> {
        try {
            const projects: CanvasProject[] = [];
            const prefix = this.generateKey('canvas_project');

            if (this.isLocalStorageAvailable()) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        const result = await this.load<CanvasProject>(key);
                        if (result.success && result.data) {
                            projects.push(result.data);
                        }
                    }
                }
            } else {
                // Fallback to memory storage
                for (const [key, value] of this.pendingOperations.entries()) {
                    if (key.startsWith(prefix)) {
                        projects.push(value as CanvasProject);
                    }
                }
            }

            return { success: true, data: projects };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to load canvas projects', 'LOAD_PROJECTS_ERROR')
            };
        }
    }

    public async removeCanvasProject(projectId: string): Promise<StorageResult<void>> {
        const key = this.generateKey('canvas_project', projectId);
        this.cancelAutoSave('canvas', projectId);
        return this.remove(key);
    }

    // Specialized methods for Chat Sessions
    public async saveChatSession(session: ChatSession): Promise<StorageResult<void>> {
        const key = this.generateKey('chat_session', session.id);
        const result = await this.save(key, session);

        if (result.success && this.autoSaveConfig.enabled) {
            this.scheduleAutoSave('chat', session.id, session);
        }

        return result;
    }

    public async loadChatSession(sessionId: string): Promise<StorageResult<ChatSession>> {
        const key = this.generateKey('chat_session', sessionId);
        return this.load<ChatSession>(key);
    }

    public async loadChatSessions(): Promise<StorageResult<ChatSession[]>> {
        try {
            const sessions: ChatSession[] = [];
            const prefix = this.generateKey('chat_session');

            if (this.isLocalStorageAvailable()) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        const result = await this.load<ChatSession>(key);
                        if (result.success && result.data) {
                            sessions.push(result.data);
                        }
                    }
                }
            } else {
                // Fallback to memory storage
                for (const [key, value] of this.pendingOperations.entries()) {
                    if (key.startsWith(prefix)) {
                        sessions.push(value as ChatSession);
                    }
                }
            }

            return { success: true, data: sessions };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to load chat sessions', 'LOAD_SESSIONS_ERROR')
            };
        }
    }

    public async removeChatSession(sessionId: string): Promise<StorageResult<void>> {
        const key = this.generateKey('chat_session', sessionId);
        this.cancelAutoSave('chat', sessionId);
        return this.remove(key);
    }

    // Auto-save functionality
    private scheduleAutoSave(type: string, id: string, data: KanbanBoard | CanvasProject | ChatSession): void {
        const timerKey = `${type}_${id}`;

        // Cancel existing timer if any
        this.cancelAutoSave(type, id);

        // Schedule new auto-save
        const timer = setTimeout(async () => {
            try {
                let result: StorageResult<void>;

                switch (type) {
                    case 'kanban':
                        result = await this.saveKanbanBoard(data as KanbanBoard);
                        break;
                    case 'canvas':
                        result = await this.saveCanvasProject(data as CanvasProject);
                        break;
                    case 'chat':
                        result = await this.saveChatSession(data as ChatSession);
                        break;
                    default:
                        return;
                }

                if (!result.success) {
                    console.error(`Auto-save failed for ${type} ${id}:`, result.error);
                    // Retry logic could be implemented here
                }
            } catch (error) {
                console.error(`Auto-save error for ${type} ${id}:`, error);
            } finally {
                this.autoSaveTimers.delete(timerKey);
            }
        }, this.autoSaveConfig.interval * 1000);

        this.autoSaveTimers.set(timerKey, timer);
    }

    private cancelAutoSave(type: string, id: string): void {
        const timerKey = `${type}_${id}`;
        const timer = this.autoSaveTimers.get(timerKey);

        if (timer) {
            clearTimeout(timer);
            this.autoSaveTimers.delete(timerKey);
        }
    }

    // Configuration methods
    public setAutoSaveConfig(config: Partial<AutoSaveConfig>): void {
        this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
    }

    public getAutoSaveConfig(): AutoSaveConfig {
        return { ...this.autoSaveConfig };
    }

    // Utility methods
    public async getStorageInfo(): Promise<{
        available: boolean;
        used: number;
        total: number;
        devOrchUsed: number;
    }> {
        const info = {
            available: this.isLocalStorageAvailable(),
            used: 0,
            total: 0,
            devOrchUsed: 0
        };

        if (info.available) {
            try {
                // Calculate total storage used
                let totalUsed = 0;
                let devOrchUsed = 0;

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        const value = localStorage.getItem(key);
                        if (value) {
                            const size = new Blob([value]).size;
                            totalUsed += size;

                            if (key.startsWith('devorch_')) {
                                devOrchUsed += size;
                            }
                        }
                    }
                }

                info.used = totalUsed;
                info.devOrchUsed = devOrchUsed;

                // Estimate total available storage (typically 5-10MB)
                info.total = 5 * 1024 * 1024; // 5MB estimate
            } catch (error) {
                console.warn('Could not calculate storage info:', error);
            }
        }

        return info;
    }

    // Cleanup excess chat sessions (keep only the most recent ones)
    public async cleanupExcessSessions(maxSessions: number = 20): Promise<StorageResult<number>> {
        try {
            const sessionsResult = await this.loadChatSessions();
            if (!sessionsResult.success || !sessionsResult.data) {
                return { success: true, data: 0 };
            }

            const sessions = sessionsResult.data;
            if (sessions.length <= maxSessions) {
                return { success: true, data: 0 };
            }

            // Sort by updatedAt and keep only the most recent
            const sortedSessions = sessions.sort((a, b) => {
                const dateA = new Date(a.updatedAt);
                const dateB = new Date(b.updatedAt);
                return dateB.getTime() - dateA.getTime();
            });

            const sessionsToDelete = sortedSessions.slice(maxSessions);
            let deletedCount = 0;

            for (const session of sessionsToDelete) {
                const result = await this.removeChatSession(session.id);
                if (result.success) {
                    deletedCount++;
                }
            }

            return { success: true, data: deletedCount };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to cleanup excess sessions', 'CLEANUP_SESSIONS_ERROR')
            };
        }
    }

    // Cleanup old data based on age
    public async cleanupOldData(maxAgeInDays: number = 30): Promise<StorageResult<number>> {
        try {
            let cleanedCount = 0;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

            if (this.isLocalStorageAvailable()) {
                const keysToRemove: string[] = [];

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('devorch_')) {
                        try {
                            const data = localStorage.getItem(key);
                            if (data) {
                                const parsed = JSON.parse(data);
                                const updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : null;

                                if (updatedAt && updatedAt < cutoffDate) {
                                    keysToRemove.push(key);
                                }
                            }
                        } catch {
                            // If we can't parse the data, it might be corrupted, so remove it
                            keysToRemove.push(key);
                        }
                    }
                }

                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                    cleanedCount++;
                });
            }

            return { success: true, data: cleanedCount };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to cleanup old data', 'CLEANUP_ERROR')
            };
        }
    }

    // Cleanup largest items to free up space
    public async cleanupLargestItems(count: number = 5): Promise<StorageResult<number>> {
        try {
            let cleanedCount = 0;

            if (this.isLocalStorageAvailable()) {
                const items: { key: string; size: number }[] = [];

                // Calculate size of each devorch item
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('devorch_')) {
                        const data = localStorage.getItem(key);
                        if (data) {
                            items.push({
                                key,
                                size: new Blob([data]).size
                            });
                        }
                    }
                }

                // Sort by size (largest first) and remove the largest items
                items.sort((a, b) => b.size - a.size);
                const itemsToRemove = items.slice(0, count);

                itemsToRemove.forEach(item => {
                    localStorage.removeItem(item.key);
                    cleanedCount++;
                });
            }

            return { success: true, data: cleanedCount };
        } catch (error) {
            return {
                success: false,
                error: new StorageError('Failed to cleanup largest items', 'CLEANUP_ERROR')
            };
        }
    }



    // Destroy instance (for testing or cleanup)
    public destroy(): void {
        // Cancel all auto-save timers
        this.autoSaveTimers.forEach(timer => clearTimeout(timer));
        this.autoSaveTimers.clear();
        this.pendingOperations.clear();
    }
}