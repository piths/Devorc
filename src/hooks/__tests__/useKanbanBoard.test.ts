import { renderHook, act, waitFor } from '@testing-library/react';
import { useKanbanBoard } from '../useKanbanBoard';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

// Mock the LocalStorageManager
jest.mock('@/lib/storage/LocalStorageManager');
const mockStorageManager = LocalStorageManager.getInstance as jest.MockedFunction<typeof LocalStorageManager.getInstance>;

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useKanbanBoard', () => {
  const mockStorageInstance = {
    loadKanbanBoard: jest.fn(),
    saveKanbanBoard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageManager.mockReturnValue(mockStorageInstance as unknown as LocalStorageManager);
  });

  it('should load existing board', async () => {
    const mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: 'Test Description',
      columns: [
        {
          id: 'col1',
          title: 'Column 1',
          cards: [],
          color: '#ff0000'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockStorageInstance.loadKanbanBoard.mockResolvedValue({
      success: true,
      data: mockBoard
    });

    const { result } = renderHook(() => useKanbanBoard('test-board'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.board).toEqual(mockBoard);
    expect(result.current.error).toBeNull();
  });

  it('should create new board when none exists', async () => {
    mockStorageInstance.loadKanbanBoard.mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND' }
    });
    mockStorageInstance.saveKanbanBoard.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useKanbanBoard('new-board'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.board).toBeTruthy();
    expect(result.current.board?.name).toBe('New Kanban Board');
    expect(result.current.board?.columns).toHaveLength(3);
    expect(mockStorageInstance.saveKanbanBoard).toHaveBeenCalled();
  });

  it('should add new column', async () => {
    const mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: '',
      columns: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockStorageInstance.loadKanbanBoard.mockResolvedValue({
      success: true,
      data: mockBoard
    });
    mockStorageInstance.saveKanbanBoard.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useKanbanBoard('test-board'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addColumn('New Column', '#ff0000');
    });

    expect(result.current.board?.columns).toHaveLength(1);
    expect(result.current.board?.columns[0].title).toBe('New Column');
    expect(result.current.board?.columns[0].color).toBe('#ff0000');
  });

  it('should add new card to column', async () => {
    const mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: '',
      columns: [
        {
          id: 'col1',
          title: 'Column 1',
          cards: [],
          color: '#ff0000'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockStorageInstance.loadKanbanBoard.mockResolvedValue({
      success: true,
      data: mockBoard
    });
    mockStorageInstance.saveKanbanBoard.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useKanbanBoard('test-board'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addCard('col1', {
        title: 'Test Card',
        description: 'Test Description'
      });
    });

    expect(result.current.board?.columns[0].cards).toHaveLength(1);
    expect(result.current.board?.columns[0].cards[0].title).toBe('Test Card');
    expect(result.current.board?.columns[0].cards[0].description).toBe('Test Description');
  });

  it('should move card between columns', async () => {
    const mockBoard = {
      id: 'test-board',
      name: 'Test Board',
      description: '',
      columns: [
        {
          id: 'col1',
          title: 'Column 1',
          cards: [
            {
              id: 'card1',
              title: 'Test Card',
              description: '',
              labels: [],
            }
          ],
          color: '#ff0000'
        },
        {
          id: 'col2',
          title: 'Column 2',
          cards: [],
          color: '#00ff00'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockStorageInstance.loadKanbanBoard.mockResolvedValue({
      success: true,
      data: mockBoard
    });
    mockStorageInstance.saveKanbanBoard.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useKanbanBoard('test-board'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.moveCard('card1', 'col1', 'col2');
    });

    expect(result.current.board?.columns[0].cards).toHaveLength(0);
    expect(result.current.board?.columns[1].cards).toHaveLength(1);
    expect(result.current.board?.columns[1].cards[0].id).toBe('card1');
  });
});