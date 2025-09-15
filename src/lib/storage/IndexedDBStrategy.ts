import { StorageStrategy, StorageResult, StorageInfo, StorageError } from './StorageStrategy';

export class IndexedDBStrategy implements StorageStrategy {
  private dbName = 'DevOrchDB';
  private dbVersion = 1;
  private storeName = 'devorch_data';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new StorageError('Failed to open IndexedDB', 'DB_OPEN_ERROR'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  isAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new StorageError('IndexedDB not available', 'DB_NOT_AVAILABLE', false);
    }
    return this.db;
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
      const db = await this.ensureDB();
      const serializedData = this.serialize(data);

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.put({
          key,
          value: serializedData,
          timestamp: Date.now()
        });

        request.onsuccess = () => {
          resolve({ success: true });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: new StorageError('Failed to save to IndexedDB', 'IDB_SAVE_ERROR')
          });
        };
      });
    } catch (error) {
      const storageError = error instanceof StorageError
        ? error
        : new StorageError('Failed to save data', 'SAVE_ERROR');

      return { success: false, error: storageError };
    }
  }

  async load<T>(key: string): Promise<StorageResult<T>> {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve({
              success: false,
              error: new StorageError('Data not found', 'NOT_FOUND', false)
            });
            return;
          }

          try {
            const deserializedData = this.deserialize<T>(result.value);
            resolve({ success: true, data: deserializedData });
          } catch (error) {
            resolve({
              success: false,
              error: new StorageError('Failed to deserialize data', 'DESERIALIZATION_ERROR')
            });
          }
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: new StorageError('Failed to load from IndexedDB', 'IDB_LOAD_ERROR')
          });
        };
      });
    } catch (error) {
      const storageError = error instanceof StorageError
        ? error
        : new StorageError('Failed to load data', 'LOAD_ERROR');

      return { success: false, error: storageError };
    }
  }

  async remove(key: string): Promise<StorageResult<void>> {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve({ success: true });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: new StorageError('Failed to remove from IndexedDB', 'IDB_REMOVE_ERROR')
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: new StorageError('Failed to remove data', 'REMOVE_ERROR')
      };
    }
  }

  async clear(): Promise<StorageResult<void>> {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve({ success: true });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: new StorageError('Failed to clear IndexedDB', 'IDB_CLEAR_ERROR')
          });
        };
      });
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

    if (!info.available || !this.db) {
      return info;
    }

    try {
      // Estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        info.used = estimate.usage || 0;
        info.total = estimate.quota || 0;
        info.percentage = info.total > 0 ? (info.used / info.total) * 100 : 0;
      } else {
        // Fallback: count records in our store
        const db = await this.ensureDB();
        
        return new Promise((resolve) => {
          const transaction = db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.getAll();

          request.onsuccess = () => {
            const records = request.result;
            let totalSize = 0;
            
            records.forEach(record => {
              totalSize += new Blob([record.value]).size;
            });

            info.used = totalSize;
            info.total = 50 * 1024 * 1024; // 50MB typical IndexedDB limit
            info.percentage = (info.used / info.total) * 100;
            resolve(info);
          };

          request.onerror = () => {
            resolve(info);
          };
        });
      }
    } catch (error) {
      console.warn('Could not calculate IndexedDB storage info:', error);
    }

    return info;
  }
}