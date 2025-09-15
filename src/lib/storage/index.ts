// Main storage exports
export { LocalStorageManager } from './LocalStorageManager';
export { ChatStorageManager } from './ChatStorageManager';
export { StorageProvider, useStorage, StorageErrorBoundary } from './StorageProvider';

// Utility exports
export * from './utils';

// Hook exports
export {
  useLocalStorage,
  useKanbanStorage,
  useCanvasStorage,
  useChatStorage
} from '@/hooks/useLocalStorage';

// Type exports
export type {
  UserSession,
  UserPreferences,
  ModuleType,
  GitHubConnection,
  GitHubUser,
  Repository,
  Commit,
  Issue,
  PullRequest,
  Label,
  KanbanBoard,
  Column,
  Card,
  SyncConfiguration,
  CanvasProject,
  CanvasElement,
  ElementType,
  Point,
  Size,
  ElementStyle,
  Connection,
  ChatSession,
  ChatMessage,
  CodeReference,
  CodebaseContext,
  CodeFile,
  ProjectStructure,
  CodeAnalysis,
  Suggestion,
  StorageError,
  StorageResult,
  AutoSaveConfig
} from '@/types/storage';