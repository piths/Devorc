// Selective re-exports to avoid name collisions between storage and chat types
export type { CanvasElement } from './storage';
export type { ChatSession as ChatSessionStorage, ChatMessage as ChatMessageStorage, CodeReference as CodeReferenceStorage, CodebaseContext as CodebaseContextStorage } from './storage';
export type { ChatSession as ChatSessionChat, ChatMessage as ChatMessageChat, CodeReference as CodeReferenceChat, CodebaseContext as CodebaseContextChat } from './chat';

// Core application types (keeping for backward compatibility)
export type ModuleType = 'dashboard' | 'kanban' | 'canvas' | 'chat';

// Common utility types
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
