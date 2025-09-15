import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KanbanBoard } from '../kanban-board';
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

// Mock @dnd-kit components
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  PointerSensor: jest.fn(),
  closestCorners: jest.fn(),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  useDroppable: jest.fn(() => ({
    setNodeRef: jest.fn(),
    isOver: false,
  })),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

describe('KanbanBoard', () => {
  const mockStorageInstance = {
    loadKanbanBoard: jest.fn(),
    saveKanbanBoard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageManager.mockReturnValue(mockStorageInstance as unknown as LocalStorageManager);
  });

  it('renders loading state initially', () => {
    mockStorageInstance.loadKanbanBoard.mockImplementation(() => new Promise(() => {}));
    
    render(<KanbanBoard boardId="test-board" />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('creates a new board when none exists', async () => {
    mockStorageInstance.loadKanbanBoard.mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND' }
    });
    mockStorageInstance.saveKanbanBoard.mockResolvedValue({ success: true });

    render(<KanbanBoard boardId="test-board" />);

    await waitFor(() => {
      expect(screen.getByText('New Kanban Board')).toBeInTheDocument();
    });

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('loads existing board data', async () => {
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

    render(<KanbanBoard boardId="test-board" />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Column 1')).toBeInTheDocument();
  });

  it('handles add column functionality', async () => {
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

    render(<KanbanBoard boardId="test-board" />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    const addColumnButton = screen.getByText('Add Column');
    fireEvent.click(addColumnButton);

    await waitFor(() => {
      expect(mockStorageInstance.saveKanbanBoard).toHaveBeenCalled();
    });
  });

  it('calls onBoardUpdate when board is updated', async () => {
    const mockOnBoardUpdate = jest.fn();
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

    render(<KanbanBoard boardId="test-board" onBoardUpdate={mockOnBoardUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });

    const addColumnButton = screen.getByText('Add Column');
    fireEvent.click(addColumnButton);

    await waitFor(() => {
      expect(mockOnBoardUpdate).toHaveBeenCalled();
    });
  });
});