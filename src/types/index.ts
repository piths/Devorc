// Re-export storage types
export * from './storage';

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