import { 
  UserSession, 
  KanbanBoard, 
  CanvasProject, 
  ChatSession,
  StorageError 
} from '@/types/storage';

// Data validation functions
export function validateUserSession(data: unknown): data is UserSession {
  const obj = data as Record<string, unknown>;
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof obj.id === 'string' &&
    typeof obj.preferences === 'object' &&
    obj.preferences !== null &&
    obj.lastActive instanceof Date
  );
}

export function validateKanbanBoard(data: unknown): data is KanbanBoard {
  const obj = data as Record<string, unknown>;
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.columns) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

export function validateCanvasProject(data: unknown): data is CanvasProject {
  const obj = data as Record<string, unknown>;
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.elements) &&
    typeof obj.viewport === 'object' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

export function validateChatSession(data: unknown): data is ChatSession {
  const obj = data as Record<string, unknown>;
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.messages) &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

// Data migration functions
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: StorageError[];
}

export async function migrateStorageData(
  fromVersion: string,
  toVersion: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: []
  };

  try {
    // Add migration logic here as the app evolves
    console.log(`Migrating storage data from ${fromVersion} to ${toVersion}`);
    
    // Example migration logic (to be implemented as needed)
    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      // Perform specific migrations
    }

    return result;
  } catch {
    result.success = false;
    result.errors.push(
      new StorageError('Migration failed', 'MIGRATION_ERROR', false)
    );
    return result;
  }
}

// Data sanitization functions
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
    .substring(0, 255); // Limit length
}

// Storage quota management
export function calculateStorageUsage(data: unknown): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

export function isStorageQuotaExceeded(
  currentUsage: number,
  maxQuota: number = 5 * 1024 * 1024 // 5MB default
): boolean {
  return currentUsage >= maxQuota * 0.95; // 95% threshold
}

// Data compression utilities (for large datasets)
export function compressData(data: unknown): string {
  try {
    // Simple compression by removing whitespace from JSON
    return JSON.stringify(data);
  } catch {
    throw new StorageError('Failed to compress data', 'COMPRESSION_ERROR');
  }
}

export function decompressData<T>(compressedData: string): T {
  try {
    return JSON.parse(compressedData);
  } catch {
    throw new StorageError('Failed to decompress data', 'DECOMPRESSION_ERROR');
  }
}

// Backup and restore utilities
export interface BackupData {
  version: string;
  timestamp: Date;
  userSessions: UserSession[];
  kanbanBoards: KanbanBoard[];
  canvasProjects: CanvasProject[];
  chatSessions: ChatSession[];
}

export function createBackup(data: {
  userSessions: UserSession[];
  kanbanBoards: KanbanBoard[];
  canvasProjects: CanvasProject[];
  chatSessions: ChatSession[];
}): BackupData {
  return {
    version: '1.0.0',
    timestamp: new Date(),
    ...data
  };
}

export function validateBackup(backup: unknown): backup is BackupData {
  const obj = backup as Record<string, unknown>;
  return (
    typeof backup === 'object' &&
    backup !== null &&
    typeof obj.version === 'string' &&
    obj.timestamp instanceof Date &&
    Array.isArray(obj.userSessions) &&
    Array.isArray(obj.kanbanBoards) &&
    Array.isArray(obj.canvasProjects) &&
    Array.isArray(obj.chatSessions)
  );
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Date utilities for storage
export function isDateExpired(date: Date, maxAgeInDays: number): boolean {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > maxAgeInDays;
}

// Error recovery utilities
export function attemptDataRecovery<T>(
  corruptedData: string,
  validator: (data: unknown) => data is T
): T | null {
  try {
    // Try to parse as-is
    const parsed = JSON.parse(corruptedData);
    if (validator(parsed)) {
      return parsed;
    }

    // Try to fix common JSON issues
    const fixed = corruptedData
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

    const reparsed = JSON.parse(fixed);
    if (validator(reparsed)) {
      return reparsed;
    }

    return null;
  } catch {
    return null;
  }
}

// Performance monitoring
export function measureStorageOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now();
  
  return operation().finally(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) { // Log slow operations (>100ms)
      console.warn(`Slow storage operation: ${operationName} took ${duration.toFixed(2)}ms`);
    }
  });
}