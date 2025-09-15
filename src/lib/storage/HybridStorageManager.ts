import { StorageStrategy, StorageResult, StorageInfo } from './StorageStrategy';
import { LocalStorageStrategy } from './LocalStorageStrategy';
import { IndexedDBStrategy } from './IndexedDBStrategy';

export class HybridStorageManager {
  private primaryStrategy: StorageStrategy;
  private fallbackStrategy: StorageStrategy;
  private static instance: HybridStorageManager;

  private constructor() {
    // Try IndexedDB first (larger capacity), fallback to LocalStorage
    this.primaryStrategy = new IndexedDBStrategy();
    this.fallbackStrategy = new LocalStorageStrategy();
  }

  public static getInstance(): HybridStorageManager {
    if (!HybridStorageManager.instance) {
      HybridStorageManager.instance = new HybridStorageManager();
    }
    return HybridStorageManager.instance;
  }

  private generateKey(prefix: string, id?: string): string {
    return id ? `devorch_${prefix}_${id}` : `devorch_${prefix}`;
  }

  async save<T>(key: string, data: T): Promise<StorageResult<void>> {
    // Try primary strategy first
    if (this.primaryStrategy.isAvailable()) {
      const result = await this.primaryStrategy.save(key, data);
      if (result.success) {
        return result;
      }
      console.warn('Primary storage failed, trying fallback:', result.error);
    }

    // Fallback to secondary strategy
    return await this.fallbackStrategy.save(key, data);
  }

  async load<T>(key: string): Promise<StorageResult<T>> {
    // Try primary strategy first
    if (this.primaryStrategy.isAvailable()) {
      const result = await this.primaryStrategy.load<T>(key);
      if (result.success) {
        return result;
      }
      // If not found in primary, try fallback
      if (result.error?.code === 'NOT_FOUND') {
        return await this.fallbackStrategy.load<T>(key);
      }
    }

    // Fallback to secondary strategy
    return await this.fallbackStrategy.load<T>(key);
  }

  async remove(key: string): Promise<StorageResult<void>> {
    // Remove from both strategies
    const results = await Promise.all([
      this.primaryStrategy.isAvailable() ? this.primaryStrategy.remove(key) : Promise.resolve({ success: true }),
      this.fallbackStrategy.remove(key)
    ]);

    // Return success if at least one succeeded
    return results.some(r => r.success) ? { success: true } : results[0];
  }

  async clear(): Promise<StorageResult<void>> {
    // Clear both strategies
    const results = await Promise.all([
      this.primaryStrategy.isAvailable() ? this.primaryStrategy.clear() : Promise.resolve({ success: true }),
      this.fallbackStrategy.clear()
    ]);

    // Return success if at least one succeeded
    return results.some(r => r.success) ? { success: true } : results[0];
  }

  async getStorageInfo(): Promise<{
    primary: StorageInfo;
    fallback: StorageInfo;
    combined: StorageInfo;
  }> {
    const [primaryInfo, fallbackInfo] = await Promise.all([
      this.primaryStrategy.isAvailable() ? this.primaryStrategy.getStorageInfo() : Promise.resolve({
        available: false,
        used: 0,
        total: 0,
        percentage: 0
      }),
      this.fallbackStrategy.getStorageInfo()
    ]);

    const combined: StorageInfo = {
      available: primaryInfo.available || fallbackInfo.available,
      used: primaryInfo.used + fallbackInfo.used,
      total: primaryInfo.total + fallbackInfo.total,
      percentage: 0
    };

    if (combined.total > 0) {
      combined.percentage = (combined.used / combined.total) * 100;
    }

    return {
      primary: primaryInfo,
      fallback: fallbackInfo,
      combined
    };
  }

  // Migrate data from fallback to primary storage when possible
  async migrateToOptimalStorage(): Promise<{ migrated: number; failed: number }> {
    if (!this.primaryStrategy.isAvailable()) {
      return { migrated: 0, failed: 0 };
    }

    const migrated = 0;
    const failed = 0;

    try {
      // This is a simplified migration - in a real implementation,
      // you'd need to enumerate all keys in the fallback storage
      console.log('Migration would require enumerating fallback storage keys');
      // For now, we'll just return the counts
    } catch (error) {
      console.error('Migration failed:', error);
    }

    return { migrated, failed };
  }

  // Cleanup old data to free up space
  async cleanupOldData(maxAgeInDays: number = 30): Promise<{ cleaned: number; spaceSaved: number }> {
    const cleaned = 0;
    const spaceSaved = 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    // This would need to be implemented based on the specific data structure
    // For now, we'll return placeholder values
    console.log(`Cleanup would remove data older than ${cutoffDate.toISOString()}`);

    return { cleaned, spaceSaved };
  }

  // Compress data to save space
  async compressData(): Promise<{ compressed: number; spaceSaved: number }> {
    // This would implement data compression strategies
    // For now, we'll return placeholder values
    console.log('Data compression would be implemented here');
    
    return { compressed: 0, spaceSaved: 0 };
  }
}