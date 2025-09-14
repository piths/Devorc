// Core application types
export type ModuleType = 'dashboard' | 'kanban' | 'canvas' | 'chat';

// User and session types
export interface UserSession {
  id: string;
  githubToken?: string;
  preferences: UserPreferences;
  lastActive: Date;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  defaultModule: ModuleType;
  githubSyncEnabled: boolean;
}

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