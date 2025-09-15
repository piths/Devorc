import { StorageStrategy, StorageResult, StorageInfo, StorageError } from './StorageStrategy';

export class LocalStorageStrategy implements StorageStrategy {
  private memoryFallback: Map<string, unknown> = new Map();

  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private serialize<T>(data: T): string {
    try {
      return JSON.stringify(data, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });
    } catch (error) {
      throw new StorageError('Failed to serialize data', 'SERIALIZATION_ERROR', false);
    }
  }

  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });
    } catch (error) {
      throw new StorageError('Failed to deserialize data', 'DESERIALIZATION_ERROR', false);
    }
  }

  async save<T>(key: string, data: T): Promise<StorageResult<void>> {
    try {
      const serializedData = this.serialize(data);

      if (this.isAvailable()) {
        try {
          localStorage.setItem(key, serializedData);
        } catch (storageError) {
          if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
            // Try memory fallback for quota exceeded
            this.memoryFallback.set(key, data);
            console.warn(`LocalStorage quota exceeded for key ${key}, using memory fallback`);
          } else {
            throw storageError;
          }
        }
      } else {
        this.memoryFallback.set(key, data);
      }

      return { success: true };
    } catch (error) {
      const storageError = error instanceof StorageError
        ? error
        : new StorageError(
            `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'SAVE_ERROR'
          );

      return { success: false, error: storageError };
    }
  }

  async load<T>(key: string): Promise<StorageResult<T>> {
    try {
      let data: string | null = null;

      if (this.isAvailable()) {
        data = localStorage.getItem(key);
      }

      // Check memory fallback if not found in localStorage
      if (data === null) {
        const memoryData = this.memoryFallback.get(key);
        if (memoryData) {
          return { success: true, data: memoryData as T };
        }
      }

      if (data === null) {
        return {
          success: false,
          error: new StorageError('Data not found', 'NOT_FOUND', false)
        };
      }

      const deserializedData = this.deserialize<T>(data);
      return { success: true, data: deserializedData };
    } catch (error) {
      const storageError = error instanceof StorageError
        ? error
        : new StorageError('Failed to load data', 'LOAD_ERROR');

      return { success: false, error: storageError };
    }
  }

  async remove(key: string): Promise<StorageResult<void>> {
    try {
      if (this.isAvailable()) {
        localStorage.removeItem(key);
      }
      this.memoryFallback.delete(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: new StorageError('Failed to remove data', 'REMOVE_ERROR')
      };
    }
  }

  async clear(): Promise<StorageResult<void>> {
    try {
      if (this.isAvailable()) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('devorch_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      this.memoryFallback.clear();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: new StorageError('Failed to clear data', 'CLEAR_ERROR')
      };
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    const info: StorageInfo = {
      available: this.isAvailable(),
      used: 0,
      total: 0,
      percentage: 0
    };

    if (info.available) {
      try {
        let totalUsed = 0;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('devorch_')) {
            const value = localStorage.getItem(key);
            if (value) {
              totalUsed += new Blob([value]).size;
            }
          }
        }

        // Add memory fallback size
        for (const [key, value] of this.memoryFallback.entries()) {
          if (key.startsWith('devorch_')) {
            totalUsed += new Blob([JSON.stringify(value)]).size;
          }
        }

        info.used = totalUsed;
        info.total = 5 * 1024 * 1024; // 5MB typical localStorage limit
        info.percentage = (info.used / info.total) * 100;
      } catch (error) {
        console.warn('Could not calculate storage info:', error);
      }
    }

    return info;
  }
}