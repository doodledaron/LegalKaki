/**
 * POC Mode: LocalStorage utilities for persisting data client-side
 *
 * This module provides utilities for storing and retrieving application data
 * in localStorage during the POC phase. All data is stored with a 'legalkaki_' prefix.
 *
 * Storage Structure:
 * - legalkaki_documents: Document[] - Uploaded documents with file data
 * - legalkaki_collections: Collection[] - User collections
 * - legalkaki_chats: ChatSession[] - Chat sessions and messages
 * - legalkaki_actions: ActionItem[] - Action items
 * - legalkaki_user: User - Current user data
 */

import { User, Collection } from '@/api/types'
import { ChatSession, Document, ActionItem } from '@/types'
import {
  mockUser,
  mockCollections,
  mockChatSessions,
  mockDocuments,
  mockActionItems,
} from '@/api/mockData'

const STORAGE_PREFIX = 'legalkaki_'

// Storage keys
export const STORAGE_KEYS = {
  USER: `${STORAGE_PREFIX}user`,
  DOCUMENTS: `${STORAGE_PREFIX}documents`,
  COLLECTIONS: `${STORAGE_PREFIX}collections`,
  CHATS: `${STORAGE_PREFIX}chats`,
  ACTIONS: `${STORAGE_PREFIX}actions`,
  FILE_BLOBS: `${STORAGE_PREFIX}file_blobs`, // For storing file data as base64
} as const

/**
 * Safe localStorage wrapper that handles SSR and errors
 */
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error)
  }
}

function removeStorage(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error)
  }
}

// =======================
// User Operations
// =======================

export function getUser(): User {
  return getStorage(STORAGE_KEYS.USER, mockUser)
}

export function setUser(user: User): void {
  setStorage(STORAGE_KEYS.USER, user)
}

// =======================
// Document Operations
// =======================

export function getDocuments(): Document[] {
  return getStorage(STORAGE_KEYS.DOCUMENTS, mockDocuments)
}

export function setDocuments(documents: Document[]): void {
  setStorage(STORAGE_KEYS.DOCUMENTS, documents)
}

export function addDocument(document: Document): void {
  const documents = getDocuments()
  setDocuments([document, ...documents])
}

export function getDocumentById(id: string): Document | undefined {
  const documents = getDocuments()
  return documents.find((doc) => doc.id === id)
}

export function updateDocument(id: string, updates: Partial<Document>): void {
  const documents = getDocuments()
  const index = documents.findIndex((doc) => doc.id === id)
  if (index !== -1) {
    documents[index] = { ...documents[index], ...updates }
    setDocuments(documents)
  }
}

export function deleteDocument(id: string): void {
  const documents = getDocuments()
  setDocuments(documents.filter((doc) => doc.id !== id))
}

// =======================
// File Blob Operations
// =======================

interface FileBlob {
  id: string // Document ID
  filename: string
  fileType: string
  base64Data: string // File data as base64
  blobUrl?: string // Generated blob URL (not persisted)
}

export function getFileBlobs(): Record<string, FileBlob> {
  return getStorage(STORAGE_KEYS.FILE_BLOBS, {})
}

export function setFileBlobs(blobs: Record<string, FileBlob>): void {
  setStorage(STORAGE_KEYS.FILE_BLOBS, blobs)
}

export function addFileBlob(
  documentId: string,
  filename: string,
  fileType: string,
  base64Data: string
): void {
  const blobs = getFileBlobs()
  blobs[documentId] = {
    id: documentId,
    filename,
    fileType,
    base64Data,
  }
  setFileBlobs(blobs)
}

export function getFileBlob(documentId: string): FileBlob | undefined {
  const blobs = getFileBlobs()
  return blobs[documentId]
}

export function deleteFileBlob(documentId: string): void {
  const blobs = getFileBlobs()
  delete blobs[documentId]
  setFileBlobs(blobs)
}

/**
 * Convert base64 string to Blob URL for viewing/downloading
 */
export function base64ToBlobUrl(base64Data: string, fileType: string): string {
  if (typeof window === 'undefined') {
    return '#'
  }

  try {
    // Remove data URL prefix if present
    const base64String = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data

    const byteCharacters = atob(base64String)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: fileType })
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error converting base64 to blob URL:', error)
    return '#'
  }
}

/**
 * Convert File to base64 string for storage
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// =======================
// Collection Operations
// =======================

export function getCollections(): Collection[] {
  return getStorage(STORAGE_KEYS.COLLECTIONS, mockCollections)
}

export function setCollections(collections: Collection[]): void {
  setStorage(STORAGE_KEYS.COLLECTIONS, collections)
}

export function addCollection(collection: Collection): void {
  const collections = getCollections()
  setCollections([collection, ...collections])
}

export function getCollectionById(id: string): Collection | undefined {
  const collections = getCollections()
  return collections.find((col) => col.id === id)
}

export function updateCollection(
  id: string,
  updates: Partial<Collection>
): void {
  const collections = getCollections()
  const index = collections.findIndex((col) => col.id === id)
  if (index !== -1) {
    collections[index] = { ...collections[index], ...updates }
    setCollections(collections)
  }
}

export function deleteCollection(id: string): void {
  const collections = getCollections()
  setCollections(collections.filter((col) => col.id !== id))
}

// =======================
// Chat Operations
// =======================

export function getChats(): ChatSession[] {
  return getStorage(STORAGE_KEYS.CHATS, mockChatSessions)
}

export function setChats(chats: ChatSession[]): void {
  setStorage(STORAGE_KEYS.CHATS, chats)
}

export function addChat(chat: ChatSession): void {
  const chats = getChats()
  setChats([chat, ...chats])
}

export function getChatById(id: string): ChatSession | undefined {
  const chats = getChats()
  return chats.find((chat) => chat.id === id)
}

export function updateChat(id: string, updates: Partial<ChatSession>): void {
  const chats = getChats()
  const index = chats.findIndex((chat) => chat.id === id)
  if (index !== -1) {
    chats[index] = { ...chats[index], ...updates }
    setChats(chats)
  }
}

export function deleteChat(id: string): void {
  const chats = getChats()
  setChats(chats.filter((chat) => chat.id !== id))
}

// =======================
// Action Item Operations
// =======================

export function getActions(): ActionItem[] {
  return getStorage(STORAGE_KEYS.ACTIONS, mockActionItems)
}

export function setActions(actions: ActionItem[]): void {
  setStorage(STORAGE_KEYS.ACTIONS, actions)
}

export function addAction(action: ActionItem): void {
  const actions = getActions()
  setActions([action, ...actions])
}

export function getActionById(id: string): ActionItem | undefined {
  const actions = getActions()
  return actions.find((action) => action.id === id)
}

export function updateAction(id: string, updates: Partial<ActionItem>): void {
  const actions = getActions()
  const index = actions.findIndex((action) => action.id === id)
  if (index !== -1) {
    actions[index] = { ...actions[index], ...updates }
    setActions(actions)
  }
}

export function deleteAction(id: string): void {
  const actions = getActions()
  setActions(actions.filter((action) => action.id !== id))
}

// =======================
// Utility Functions
// =======================

/**
 * Initialize localStorage with mock data if empty
 */
export function initializeStorage(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Initialize with mock data if storage is empty
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    setUser(mockUser)
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    setDocuments(mockDocuments)
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLECTIONS)) {
    setCollections(mockCollections)
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
    setChats(mockChatSessions)
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIONS)) {
    setActions(mockActionItems)
  }
  if (!localStorage.getItem(STORAGE_KEYS.FILE_BLOBS)) {
    setFileBlobs({})
  }

  console.log('[LocalStorage POC] Initialized with mock data')
}

/**
 * Clear all LegalKaki data from localStorage
 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeStorage(key)
  })
  console.log('[LocalStorage POC] Cleared all data')
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  totalSize: number
  itemCount: number
  items: Record<string, number>
} {
  if (typeof window === 'undefined') {
    return { totalSize: 0, itemCount: 0, items: {} }
  }

  const stats: Record<string, number> = {}
  let totalSize = 0

  Object.values(STORAGE_KEYS).forEach((key) => {
    const item = localStorage.getItem(key)
    if (item) {
      const size = new Blob([item]).size
      stats[key] = size
      totalSize += size
    }
  })

  return {
    totalSize,
    itemCount: Object.keys(stats).length,
    items: stats,
  }
}
