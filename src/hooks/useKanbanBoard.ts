'use client';

import { useState, useEffect, useCallback } from 'react';
import { KanbanBoard, Card, Column } from '@/types/storage';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';
import { toast } from 'sonner';

export function useKanbanBoard(boardId: string) {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageManager = LocalStorageManager.getInstance();

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await storageManager.loadKanbanBoard(boardId);
      
      if (result.success && result.data) {
        setBoard(result.data);
      } else {
        // Create a new board if it doesn't exist
        const newBoard: KanbanBoard = {
          id: boardId,
          name: 'New Kanban Board',
          description: '',
          columns: [
            {
              id: 'todo',
              title: 'To Do',
              cards: [],
              color: '#ef4444'
            },
            {
              id: 'in-progress',
              title: 'In Progress',
              cards: [],
              color: '#f59e0b'
            },
            {
              id: 'done',
              title: 'Done',
              cards: [],
              color: '#10b981'
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await saveBoard(newBoard);
        setBoard(newBoard);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
      setError('Failed to load Kanban board');
      toast.error('Failed to load Kanban board');
    } finally {
      setLoading(false);
    }
  }, [boardId, storageManager]);

  const saveBoard = useCallback(async (updatedBoard: KanbanBoard) => {
    try {
      updatedBoard.updatedAt = new Date();
      const result = await storageManager.saveKanbanBoard(updatedBoard);
      
      if (!result.success) {
        throw new Error('Failed to save board');
      }
    } catch (err) {
      console.error('Failed to save board:', err);
      toast.error('Failed to save board changes');
      throw err;
    }
  }, [storageManager]);

  const updateBoard = useCallback(async (updatedBoard: KanbanBoard) => {
    setBoard(updatedBoard);
    await saveBoard(updatedBoard);
  }, [saveBoard]);

  const addColumn = useCallback(async (title: string, color: string = '#6366f1') => {
    if (!board) return;

    const newColumn: Column = {
      id: `column_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      cards: [],
      color
    };

    const updatedBoard = {
      ...board,
      columns: [...board.columns, newColumn]
    };

    await updateBoard(updatedBoard);
    toast.success('Column added successfully');
  }, [board, updateBoard]);

  const updateColumn = useCallback(async (columnId: string, updates: Partial<Column>) => {
    if (!board) return;

    const updatedBoard = {
      ...board,
      columns: board.columns.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    };

    await updateBoard(updatedBoard);
    toast.success('Column updated successfully');
  }, [board, updateBoard]);

  const deleteColumn = useCallback(async (columnId: string) => {
    if (!board) return;

    const updatedBoard = {
      ...board,
      columns: board.columns.filter(col => col.id !== columnId)
    };

    await updateBoard(updatedBoard);
    toast.success('Column deleted successfully');
  }, [board, updateBoard]);

  const addCard = useCallback(async (columnId: string, cardData: Partial<Card>): Promise<Card> => {
    if (!board) throw new Error('Board not available');

    const newCard: Card = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: cardData.title || 'New Card',
      description: cardData.description || '',
      labels: cardData.labels || [],
      assignee: cardData.assignee,
      dueDate: cardData.dueDate,
      githubIssueId: cardData.githubIssueId,
      githubRepo: cardData.githubRepo,
    };

    const updatedBoard = {
      ...board,
      columns: board.columns.map(col => 
        col.id === columnId 
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    };

    await updateBoard(updatedBoard);
    toast.success('Card created successfully');
    return newCard;
  }, [board, updateBoard]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    if (!board) return;

    const updatedBoard = {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.map(card => 
          card.id === cardId ? { ...card, ...updates } : card
        )
      }))
    };

    await updateBoard(updatedBoard);
    toast.success('Card updated successfully');
  }, [board, updateBoard]);

  const deleteCard = useCallback(async (cardId: string) => {
    if (!board) return;

    const updatedBoard = {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId)
      }))
    };

    await updateBoard(updatedBoard);
    toast.success('Card deleted successfully');
  }, [board, updateBoard]);

  const moveCard = useCallback(async (cardId: string, sourceColumnId: string, targetColumnId: string, targetIndex?: number) => {
    if (!board || sourceColumnId === targetColumnId) return;

    const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
    const targetColumn = board.columns.find(col => col.id === targetColumnId);
    const card = sourceColumn?.cards.find(c => c.id === cardId);

    if (!sourceColumn || !targetColumn || !card) return;

    const updatedBoard = {
      ...board,
      columns: board.columns.map(col => {
        if (col.id === sourceColumnId) {
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== cardId)
          };
        }
        if (col.id === targetColumnId) {
          const newCards = [...col.cards];
          const insertIndex = targetIndex !== undefined ? targetIndex : newCards.length;
          newCards.splice(insertIndex, 0, card);
          return {
            ...col,
            cards: newCards
          };
        }
        return col;
      })
    };

    await updateBoard(updatedBoard);
    toast.success('Card moved successfully');
  }, [board, updateBoard]);

  // Load board on mount
  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  return {
    board,
    loading,
    error,
    loadBoard,
    updateBoard,
    addColumn,
    updateColumn,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}
