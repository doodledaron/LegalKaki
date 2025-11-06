/**
 * LocalStorage Monitor
 *
 * Monitors localStorage usage and provides utilities to manage space
 */

export interface StorageStats {
  used: number;
  total: number;
  percentUsed: number;
  breakdown: {
    documents: number;
    chunks: number;
    other: number;
  };
}

/**
 * Get rough estimate of localStorage usage
 * Note: Browsers typically allow 5-10MB for localStorage
 */
export function getStorageStats(): StorageStats {
  let documentsSize = 0;
  let chunksSize = 0;
  let otherSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      if (!value) continue;

      const size = new Blob([value]).size;

      if (key === 'legalkaki_documents') {
        documentsSize += size;
      } else if (key.startsWith('legalkaki_chunks_')) {
        chunksSize += size;
      } else if (key.startsWith('legalkaki_')) {
        otherSize += size;
      }
    }

    const used = documentsSize + chunksSize + otherSize;
    const total = 5 * 1024 * 1024; // Assume 5MB limit (conservative estimate)
    const percentUsed = (used / total) * 100;

    return {
      used,
      total,
      percentUsed,
      breakdown: {
        documents: documentsSize,
        chunks: chunksSize,
        other: otherSize,
      },
    };
  } catch (error) {
    console.error('[Storage Monitor] Error calculating stats:', error);
    return {
      used: 0,
      total: 5 * 1024 * 1024,
      percentUsed: 0,
      breakdown: {
        documents: 0,
        chunks: 0,
        other: 0,
      },
    };
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if there's enough space for new data
 */
export function hasSpaceFor(estimatedSize: number): boolean {
  const stats = getStorageStats();
  const available = stats.total - stats.used;
  return available > estimatedSize;
}

/**
 * Get list of all document IDs sorted by age (oldest first)
 */
export function getDocumentsByAge(): string[] {
  try {
    const documentsJson = localStorage.getItem('legalkaki_documents');
    if (!documentsJson) return [];

    const documents = JSON.parse(documentsJson);

    // Sort by upload date (oldest first)
    documents.sort((a: any, b: any) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return dateA - dateB;
    });

    return documents.map((doc: any) => doc.id);
  } catch (error) {
    console.error('[Storage Monitor] Error getting documents by age:', error);
    return [];
  }
}

/**
 * Delete oldest documents and their chunks to free up space
 */
export function clearOldestDocuments(count: number = 1): number {
  try {
    const documentIds = getDocumentsByAge();
    const toDelete = documentIds.slice(0, count);

    let freedSpace = 0;

    for (const docId of toDelete) {
      // Delete chunks
      const chunksKey = `legalkaki_chunks_${docId}`;
      const chunksData = localStorage.getItem(chunksKey);
      if (chunksData) {
        freedSpace += new Blob([chunksData]).size;
        localStorage.removeItem(chunksKey);
      }

      // Delete from documents list
      const documentsJson = localStorage.getItem('legalkaki_documents');
      if (documentsJson) {
        const documents = JSON.parse(documentsJson);
        const filtered = documents.filter((doc: any) => doc.id !== docId);
        const newJson = JSON.stringify(filtered);
        freedSpace += new Blob([documentsJson]).size - new Blob([newJson]).size;
        localStorage.setItem('legalkaki_documents', newJson);
      }

      console.log(`[Storage Monitor] Deleted document: ${docId}`);
    }

    console.log(`[Storage Monitor] Freed ${formatBytes(freedSpace)} by deleting ${toDelete.length} documents`);
    return freedSpace;
  } catch (error) {
    console.error('[Storage Monitor] Error clearing old documents:', error);
    return 0;
  }
}

/**
 * Clear all LegalKaki data from localStorage
 */
export function clearAllData(): void {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('legalkaki_')) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      localStorage.removeItem(key);
    }

    console.log(`[Storage Monitor] Cleared ${keys.length} items from localStorage`);
  } catch (error) {
    console.error('[Storage Monitor] Error clearing all data:', error);
  }
}

/**
 * Log storage stats to console
 */
export function logStorageStats(): void {
  const stats = getStorageStats();

  console.log('📊 LocalStorage Usage:');
  console.log(`  Total: ${formatBytes(stats.used)} / ${formatBytes(stats.total)} (${stats.percentUsed.toFixed(1)}%)`);
  console.log(`  Documents: ${formatBytes(stats.breakdown.documents)}`);
  console.log(`  Chunks: ${formatBytes(stats.breakdown.chunks)}`);
  console.log(`  Other: ${formatBytes(stats.breakdown.other)}`);

  if (stats.percentUsed > 80) {
    console.warn('⚠️ localStorage is over 80% full! Consider clearing old documents.');
  }
}

export const storageMonitor = {
  getStorageStats,
  formatBytes,
  hasSpaceFor,
  getDocumentsByAge,
  clearOldestDocuments,
  clearAllData,
  logStorageStats,
};

export default storageMonitor;
