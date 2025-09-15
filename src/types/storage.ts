// Core data models for local storage persistence

export interface UserSession {
  id: string;
  githubToken?: string;
  preferences: UserPreferences;
  lastActive: Date | string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  defaultModule: ModuleType;
  githubSyncEnabled: boolean;
}

export type ModuleType = 'dashboard' | 'kanban' | 'canvas' | 'chat';

// GitHub Integration Models
export interface GitHubConnection {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | string;
  scopes: string[];
  user: GitHubUser;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  starCount: number;
  forkCount: number;
  lastUpdated: Date | string;
  recentCommits: Commit[];
  openIssues: Issue[];
  pullRequests: PullRequest[];
}

export interface Commit {
  id: string;
  message: string;
  author: string;
  date: Date | string;
  sha: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Label[];
  assignee?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: Date | string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Kanban Board Models
export interface KanbanBoard {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  githubRepo?: {
    owner: string;
    repo: string;
    syncConfig: SyncConfiguration;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  labels: Label[];
  assignee?: string;
  dueDate?: Date | string;
  githubIssueId?: string;
  githubRepo?: { owner: string; repo: string };
}

export interface SyncConfiguration {
  enabled: boolean;
  columnMappings: Record<string, string>; // column id -> github label
  autoSync: boolean;
  syncInterval: number; // minutes
  allRepos?: boolean; // when true, sync across all accessible repositories
}

// Canvas Models
export interface CanvasProject {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  position: Point;
  size: Size;
  rotation: number;
  style: ElementStyle;
  data: Record<string, unknown>;
  connections: Connection[];
}

export type ElementType = 'text' | 'rectangle' | 'circle' | 'arrow' | 'connector' | 'line' | 'polygon' | 'image' | 'group' | 'sticky-note' | 'flowchart-shape' | 'pen-drawing';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through';
  borderRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  gradient?: {
    type: 'linear' | 'radial';
    startColor: string;
    endColor: string;
    angle?: number;
  };
}

export interface Connection {
  id: string;
  targetElementId: string;
  type: 'arrow' | 'line';
  style: ElementStyle;
}

// AI Chat Models - Re-export from chat types to maintain compatibility
export type { 
  ChatSession, 
  ChatMessage, 
  CodeReference, 
  CodebaseContext, 
  CodeFile, 
  ProjectStructure, 
  CodeAnalysis 
} from './chat';

// Storage Error Types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// Storage operation result types
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // seconds
  maxRetries: number;
}
