/**
 * @jest-environment jsdom
 */

import { LocalStorageManager } from '../LocalStorageManager';
import { KanbanBoard, CanvasProject, ChatSession } from '@/types/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('LocalStorageManager', () => {
  let storageManager: LocalStorageManager;

  beforeEach(() => {
    localStorageMock.clear();
    storageManager = LocalStorageManager.getInstance();
  });

  afterEach(() => {
    storageManager.destroy();
  });

  describe('Basic CRUD Operations', () => {
    test('should save and load data correctly', async () => {
      const testData = { id: '1', name: 'Test', value: 42 };
      
      const saveResult = await storageManager.save('test_key', testData);
      expect(saveResult.success).toBe(true);

      const loadResult = await storageManager.load('test_key');
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(testData);
    });

    test('should handle Date objects correctly', async () => {
      const testData = {
        id: '1',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const saveResult = await storageManager.save('date_test', testData);
      expect(saveResult.success).toBe(true);

      const loadResult = await storageManager.load('date_test');
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.createdAt).toBeInstanceOf(Date);
      expect(loadResult.data?.updatedAt).toBeInstanceOf(Date);
    });

    test('should return error for non-existent data', async () => {
      const loadResult = await storageManager.load('non_existent');
      expect(loadResult.success).toBe(false);
      expect(loadResult.error?.code).toBe('NOT_FOUND');
    });

    test('should remove data correctly', async () => {
      const testData = { id: '1', name: 'Test' };
      
      await storageManager.save('remove_test', testData);
      const removeResult = await storageManager.remove('remove_test');
      expect(removeResult.success).toBe(true);

      const loadResult = await storageManager.load('remove_test');
      expect(loadResult.success).toBe(false);
    });
  });

  describe('Kanban Board Operations', () => {
    test('should save and load kanban board', async () => {
      const board: KanbanBoard = {
        id: 'board-1',
        name: 'Test Board',
        description: 'Test Description',
        columns: [
          {
            id: 'col-1',
            title: 'To Do',
            cards: [],
            color: '#blue'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const saveResult = await storageManager.saveKanbanBoard(board);
      expect(saveResult.success).toBe(true);

      const loadResult = await storageManager.loadKanbanBoard('board-1');
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.name).toBe('Test Board');
    });

    test('should load all kanban boards', async () => {
      const board1: KanbanBoard = {
        id: 'board-1',
        name: 'Board 1',
        description: '',
        columns: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const board2: KanbanBoard = {
        id: 'board-2',
        name: 'Board 2',
        description: '',
        columns: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storageManager.saveKanbanBoard(board1);
      await storageManager.saveKanbanBoard(board2);

      const loadResult = await storageManager.loadKanbanBoards();
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.length).toBe(2);
    });
  });

  describe('Canvas Project Operations', () => {
    test('should save and load canvas project', async () => {
      const project: CanvasProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test Description',
        elements: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const saveResult = await storageManager.saveCanvasProject(project);
      expect(saveResult.success).toBe(true);

      const loadResult = await storageManager.loadCanvasProject('project-1');
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.name).toBe('Test Project');
    });
  });

  describe('Chat Session Operations', () => {
    test('should save and load chat session', async () => {
      const session: ChatSession = {
        id: 'session-1',
        name: 'Test Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const saveResult = await storageManager.saveChatSession(session);
      expect(saveResult.success).toBe(true);

      const loadResult = await storageManager.loadChatSession('session-1');
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.name).toBe('Test Chat');
    });
  });

  describe('Storage Info and Cleanup', () => {
    test('should provide storage information', async () => {
      const info = await storageManager.getStorageInfo();
      expect(info.available).toBe(true);
      expect(typeof info.used).toBe('number');
      expect(typeof info.total).toBe('number');
    });

    test('should cleanup old data', async () => {
      // Create old data
      const oldData = {
        id: '1',
        updatedAt: new Date('2020-01-01') // Very old date
      };

      await storageManager.save('devorch_old_data', oldData);
      
      const cleanupResult = await storageManager.cleanupOldData(30);
      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.data).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle serialization errors gracefully', async () => {
      const circularData: Record<string, unknown> = { id: '1' };
      circularData.self = circularData; // Create circular reference

      const saveResult = await storageManager.save('circular_test', circularData);
      expect(saveResult.success).toBe(false);
      expect(saveResult.error?.code).toBe('SERIALIZATION_ERROR');
    });
  });
});