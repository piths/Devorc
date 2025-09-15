// Storage strategy interface for different storage backends
export interface StorageStrategy {
  save<T>(key: string, data: T): Promise<StorageResult<void>>;
  load<T>(key: string): Promise<StorageResult<T>>;
  remove(key: string): Promise<StorageResult<void>>;
  clear(): Promise<StorageResult<void>>;
  getStorageInfo(): Promise<StorageInfo>;
  isAvailable(): boolean;
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

export interface StorageInfo {
  available: boolean;
  used: number;
  total: number;
  percentage: number;
}

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