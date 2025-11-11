/**
 * IndexedDB utilities for storing large files (PDFs)
 *
 * Uses IndexedDB instead of localStorage because:
 * - localStorage has ~5-10MB limit
 * - IndexedDB has ~50MB+ limit (varies by browser)
 * - IndexedDB is designed for storing binary data efficiently
 */

const DB_NAME = 'legalkaki_db'
const DB_VERSION = 1
const STORE_NAME = 'file_blobs'

interface FileBlob {
  id: string // Document ID
  filename: string
  fileType: string
  blob: Blob // Store as Blob instead of base64
  uploadDate: Date
}

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available (SSR)'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('filename', 'filename', { unique: false })
        objectStore.createIndex('uploadDate', 'uploadDate', { unique: false })
        console.log('📦 IndexedDB object store created')
      }
    }
  })
}

/**
 * Store a file blob in IndexedDB
 */
export async function storeFileBlob(
  documentId: string,
  filename: string,
  fileType: string,
  file: File | Blob
): Promise<void> {
  try {
    console.log(`💾 Storing file blob in IndexedDB: ${filename} (${fileType})`)

    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const fileBlob: FileBlob = {
      id: documentId,
      filename,
      fileType,
      blob: file,
      uploadDate: new Date()
    }

    return new Promise((resolve, reject) => {
      const request = store.put(fileBlob)

      request.onsuccess = () => {
        console.log(`✅ File blob stored successfully: ${documentId}`)
        resolve()
      }

      request.onerror = () => {
        console.error(`❌ Failed to store file blob: ${documentId}`)
        reject(new Error('Failed to store file blob'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('❌ Error storing file blob:', error)
    throw error
  }
}

/**
 * Retrieve a file blob from IndexedDB
 */
export async function getFileBlob(documentId: string): Promise<FileBlob | undefined> {
  try {
    console.log(`📂 Retrieving file blob from IndexedDB: ${documentId}`)

    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(documentId)

      request.onsuccess = () => {
        const result = request.result as FileBlob | undefined
        if (result) {
          console.log(`✅ File blob found: ${documentId}`)
        } else {
          console.log(`⚠️ File blob not found: ${documentId}`)
        }
        resolve(result)
      }

      request.onerror = () => {
        console.error(`❌ Failed to retrieve file blob: ${documentId}`)
        reject(new Error('Failed to retrieve file blob'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('❌ Error retrieving file blob:', error)
    return undefined
  }
}

/**
 * Convert a Blob to a blob URL for viewing
 */
export function blobToUrl(blob: Blob): string {
  if (typeof window === 'undefined') {
    return '#'
  }

  try {
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('❌ Error creating blob URL:', error)
    return '#'
  }
}

/**
 * Delete a file blob from IndexedDB
 */
export async function deleteFileBlob(documentId: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting file blob from IndexedDB: ${documentId}`)

    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(documentId)

      request.onsuccess = () => {
        console.log(`✅ File blob deleted: ${documentId}`)
        resolve()
      }

      request.onerror = () => {
        console.error(`❌ Failed to delete file blob: ${documentId}`)
        reject(new Error('Failed to delete file blob'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('❌ Error deleting file blob:', error)
    throw error
  }
}

/**
 * Get all file blobs (for debugging/management)
 */
export async function getAllFileBlobs(): Promise<FileBlob[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()

      request.onsuccess = () => {
        const results = request.result as FileBlob[]
        console.log(`📊 Found ${results.length} file blobs in IndexedDB`)
        resolve(results)
      }

      request.onerror = () => {
        reject(new Error('Failed to retrieve all file blobs'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('❌ Error retrieving all file blobs:', error)
    return []
  }
}

/**
 * Clear all file blobs (for cleanup)
 */
export async function clearAllFileBlobs(): Promise<void> {
  try {
    console.log('🗑️ Clearing all file blobs from IndexedDB...')

    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.clear()

      request.onsuccess = () => {
        console.log('✅ All file blobs cleared')
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to clear file blobs'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    console.error('❌ Error clearing file blobs:', error)
    throw error
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number; percent: number }> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return { usage: 0, quota: 0, percent: 0 }
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const percent = quota > 0 ? (usage / quota) * 100 : 0

    console.log(`💾 Storage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${percent.toFixed(1)}%)`)

    return { usage, quota, percent }
  } catch (error) {
    console.error('❌ Error getting storage estimate:', error)
    return { usage: 0, quota: 0, percent: 0 }
  }
}
