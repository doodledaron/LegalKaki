# LegalKaki API Documentation

This document provides comprehensive documentation for the LegalKaki mock API layer, designed to simulate real backend interactions with realistic network delays and data persistence.

## Overview

The API layer consists of:
- **Types**: TypeScript interfaces for all API requests/responses
- **Mock Data**: Centralized data store simulating a real database
- **Mock Client**: Simulates network delays, errors, and progress tracking
- **Endpoints**: Complete API implementation with all CRUD operations
- **React Hooks**: Convenient hooks for loading and error states

## Quick Start

```typescript
import { api, useApiCall, useApiMutation } from '@/api'

// Using hooks in React components
function MyComponent() {
  const { data, loading, error } = useApiCall(() => api.collections.getCollections())
  const { mutate: createCollection, loading: creating } = useApiMutation(api.collections.createCollection)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>{data?.map(collection => collection.title)}</div>
}
```

## API Endpoints

### Authentication (`api.auth`)

#### Sign In
```typescript
const response = await api.auth.signIn({
  email: 'demo@legalkaki.app',
  password: 'demo123'
})

// Returns: { user, token, expiresAt }
```

#### Sign Out
```typescript
await api.auth.signOut()
```

### User Management (`api.user`)

#### Get Profile
```typescript
const profile = await api.user.getProfile()
// Returns: User object with preferences
```

#### Update Profile
```typescript
await api.user.updateProfile({
  name: 'New Name',
  preferences: {
    theme: 'dark',
    notifications: { email: true }
  }
})
```

#### Get Statistics
```typescript
const stats = await api.user.getStats()
// Returns: totalCollections, activeCollections, totalActions, etc.
```

### Legal Domains (`api.domains`)

#### Get All Domains
```typescript
const domains = await api.domains.getDomains()
// Returns: Record<LegalDomain, DomainInfo>
```

#### Get Specific Domain
```typescript
const domain = await api.domains.getDomain('employment')
// Returns: DomainInfo for employment law
```

### Chat & Conversations (`api.chat`)

#### Create Chat Session
```typescript
const session = await api.chat.createSession({
  domain: 'employment',
  initialMessage: 'I need help with my contract'
})
```

#### Send Message with Progress Tracking
```typescript
const response = await api.chat.sendMessage(
  'session_123',
  {
    content: 'Analyze my employment contract',
    messageType: 'analysis_request'
  },
  (stage, progress) => {
    console.log(`${stage}: ${progress}%`)
  }
)

// Returns: { message, aiResponse, analysisResult?, draftResult? }
```

### Documents (`api.documents`)

#### Upload Document
```typescript
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

const response = await api.documents.upload(
  { file },
  (progress) => console.log(`Upload: ${progress}%`)
)

// Returns: { document, uploadUrl, analysisJobId }
// Document object includes:
// - originalFilename: "My Contract.pdf" (for display)
// - storedFilename: "550e8400-e29b-41d4-a716-446655440000.pdf" (S3 filename)
// - s3Key: "documents/user123/550e8400-e29b-41d4-a716-446655440000.pdf"
```

#### File Display vs Storage
```typescript
// Frontend displays original filename
<h3>{document.originalFilename}</h3> // Shows: "My Contract.pdf"

// Backend uses stored filename for operations
const fileContent = await s3.getObject({
  Bucket: document.s3Bucket,
  Key: document.s3Key // Uses stored filename with UUID
})
```

#### Analyze Document
```typescript
const analysis = await api.documents.analyzeDocument(
  'document_123',
  (stage, progress) => {
    console.log(`${stage}: ${progress}%`)
  }
)

// Returns: AnalysisResult with risks, keyPoints, actionItems
```

### Collections (`api.collections`)

#### Get Collections with Filters
```typescript
const collections = await api.collections.getCollections({
  status: 'active', // 'active' | 'archived' | 'completed'
  domain: 'employment',
  search: 'contract',
  limit: 10,
  offset: 0
})
// Returns: Collection[] with counters (documentCount, actionItemsCount, etc.)
```

#### Get Collection by ID
```typescript
const collection = await api.collections.getCollection(collectionId)
// Returns: Collection with full details and all related items
```

#### Create Collection
```typescript
const collection = await api.collections.createCollection({
  title: 'Employment Contract Review',
  domain: 'employment',
  summary: 'Reviewing my new job contract',
  tags: ['contract', 'employment']
})
// Returns: Collection with generated ID and timestamps
```

#### Update Collection
```typescript
const updatedCollection = await api.collections.updateCollection(collectionId, {
  title: 'Updated Title',
  summary: 'Updated summary',
  status: 'completed',
  tags: ['updated', 'tags']
})
```

#### Delete Collection
```typescript
await api.collections.deleteCollection(collectionId)
// Cascades to delete all collection_items and action_items
```

#### Add Item to Collection
```typescript
await api.collections.addItem(collectionId, {
  itemId: documentId,
  itemType: 'document',
  title: 'Contract Document',
  preview: 'Employment contract for review',
  domain: 'employment'
})
```

#### Remove Item from Collection
```typescript
await api.collections.removeItem(collectionId, itemId, 'document')
```

#### Get Collection Items
```typescript
const items = await api.collections.getItems(collectionId, {
  itemType: 'document', // 'conversation' | 'document' | 'action' | 'all'
  limit: 20
})
```

#### Get Collection Statistics
```typescript
const stats = await api.collections.getStats(collectionId)
// Returns: { documentCount, actionItemsCount, urgentActionsCount, messageCount }
```

#### Get Collection Dashboard Data
```typescript
const dashboardData = await api.collections.getDashboard(collectionId)
// Returns: {
//   collection: Collection,
//   conversations: ChatSession[],
//   documents: Document[],
//   actionItems: ActionItem[],
//   stats: {
//     totalConversations: number,
//     totalDocuments: number,
//     totalActions: number,
//     urgentActions: number,
//     completedActions: number
//   }
// }
```

#### Get Collection Conversations
```typescript
const conversations = await api.collections.getCollectionConversations(collectionId)
// Returns: ChatSession[] - All conversations linked to this collection
```

#### Get Collection Documents
```typescript
const documents = await api.collections.getCollectionDocuments(collectionId)
// Returns: Document[] - All documents linked to this collection
```

#### Get Collection Action Items
```typescript
const actions = await api.collections.getCollectionActions(collectionId)
// Returns: ActionItem[] - All action items linked to this collection
```

#### Add Conversation to Collection
```typescript
await api.collections.addConversationToCollection(collectionId, conversationId)
// Links an existing conversation to the collection
```

#### Add Document to Collection
```typescript
await api.collections.addDocumentToCollection(collectionId, documentId)
// Links an existing document to the collection
```

#### Remove Conversation from Collection
```typescript
await api.collections.removeConversationFromCollection(collectionId, conversationId)
// Unlinks a conversation from the collection
```

#### Remove Document from Collection
```typescript
await api.collections.removeDocumentFromCollection(collectionId, documentId)
// Unlinks a document from the collection
```

### Action Items (`api.actions`)

#### Get Actions with Filters
```typescript
const actions = await api.actions.getActions({
  collectionId: 'collection-uuid', // Optional: filter by collection
  status: 'pending', // 'pending' | 'in_progress' | 'completed'
  priority: 'urgent', // 'urgent' | 'important' | 'normal'
  limit: 5,
  offset: 0
})
// Returns: ActionItem[] with external links and metadata
```

#### Get Actions by Collection
```typescript
const collectionActions = await api.actions.getByCollection(collectionId, {
  status: 'pending',
  priority: 'urgent'
})
// Returns: ActionItem[] filtered by collection
```

#### Create Action Item
```typescript
const action = await api.actions.createAction({
  title: 'Review salary compliance',
  description: 'Check if salary meets minimum wage requirements',
  priority: 'important',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  collectionId: 'collection-uuid', // Optional: associate with collection
  sourceConversation: 'Employment Contract Review',
  externalLinks: [
    { text: 'Ministry of HR', url: 'https://www.mohr.gov.my', icon: 'ExternalLink' } // TODO: Replace with LegalKaki resource URL
  ]
})
// Returns: ActionItem with generated ID and timestamps
```

#### Update Action Item
```typescript
const updatedAction = await api.actions.updateAction(actionId, {
  title: 'Updated Action Title',
  description: 'Updated description',
  priority: 'urgent',
  status: 'in_progress',
  dueDate: new Date(),
  externalLinks: [
    { text: 'New Link', url: 'https://example.com', icon: 'ExternalLink' } // TODO: Replace with LegalKaki resource URL
  ]
})
```

#### Update Action Status
```typescript
await api.actions.updateAction('action_123', {
  status: 'completed'
})
// Returns: Updated ActionItem
```

#### Delete Action Item
```typescript
await api.actions.deleteAction(actionId)
// Returns: Success confirmation
```

#### Get Action by ID
```typescript
const action = await api.actions.getAction(actionId)
// Returns: ActionItem with full details
```

#### Mark Action as Completed
```typescript
const completedAction = await api.actions.markCompleted(actionId, {
  notes: 'Action completed successfully'
})
// Returns: Updated ActionItem with completion timestamp
```

### User Statistics (`api.user`)

#### Get User Stats
```typescript
const userStats = await api.user.getStats()
// Returns: {
//   totalCollections: number,
//   activeCollections: number,
//   totalActions: number,
//   urgentActions: number,
//   totalDocuments: number,
//   totalConversations: number
// }
```

#### Get User Dashboard Overview
```typescript
const dashboard = await api.user.getDashboard()
// Returns: {
//   stats: UserStats,
//   recentCollections: Collection[],
//   urgentActions: ActionItem[],
//   recentDocuments: Document[]
// }
```

### Collection Dashboard Features

#### Document Management
- **Upload Documents**: Documents are uploaded to S3 and metadata stored in database
- **Document Analysis**: AI analyzes uploaded documents and generates action items
- **PDF Viewer**: Integrated PDF viewer for document review
- **Document Summaries**: AI-generated summaries for quick overview

#### Action Item Management
- **Priority System**: Urgent, Important, Normal priority levels
- **Status Tracking**: Pending, In Progress, Completed statuses
- **External Links**: Associated external resources and references
- **Due Date Management**: Track and manage action deadlines

#### Collection Organization
- **Domain-based Grouping**: Collections organized by legal domain
- **Status Management**: Active, Completed, Archived collection states
- **Search and Filter**: Full-text search across collections and items
- **Tag System**: Flexible tagging for better organization

### Search (`api.search`)

#### Search Across All Content
```typescript
const results = await api.search.search({
  query: 'employment contract',
  filters: {
    domains: ['employment'],
    itemTypes: ['conversation', 'document'],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  },
  pagination: { page: 1, limit: 10 }
})

// Returns: { results, totalResults, searchTime, suggestions, pagination }
```

### Tools & Reports (`api.tools`)

#### Generate Report
```typescript
const report = await api.tools.generateReport({
  collectionId: 'collection_123',
  reportType: 'summary',
  includeDocuments: true,
  includeConversations: true
})

// Returns: { reportId, downloadUrl, generatedAt, expiresAt }
```

#### Generate Mind Map
```typescript
const mindmap = await api.tools.generateMindmap('collection_123')
// Returns: { mindmapUrl }
```

## React Hooks

### useApiCall - For Data Fetching
```typescript
import { useApiCall } from '@/api'

function CollectionsList() {
  const { data, loading, error } = useApiCall(
    () => api.collections.getCollections({ status: 'active' }),
    [] // dependencies
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      {data?.map(collection => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
```

### useApiMutation - For Data Mutations
```typescript
import { useApiMutation } from '@/api'

function CreateCollectionForm() {
  const { mutate, loading, error, data } = useApiMutation(api.collections.createCollection)

  const handleSubmit = async (formData) => {
    const result = await mutate({
      title: formData.title,
      domain: formData.domain,
      summary: formData.summary
    })
    
    if (result) {
      console.log('Collection created:', result)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Creating...' : 'Create Collection'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
```

### useProgress - For Progress Tracking
```typescript
import { useProgress } from '@/api'

function DocumentUpload() {
  const { progress, status } = useProgress('document_upload')

  const handleUpload = async (file) => {
    await api.documents.upload({ file }, (prog) => {
      // Progress automatically tracked via useProgress hook
    })
  }

  return (
    <div>
      <ProgressBar value={progress} />
      <div>{status}</div>
    </div>
  )
}
```

## Error Handling

The API includes comprehensive error handling:

```typescript
import { handleApiResponse, isApiError } from '@/api'

// Method 1: Using handleApiResponse utility
const data = await handleApiResponse(
  api.collections.getCollections(),
  (collections) => {
    console.log('Success:', collections)
  },
  (error) => {
    console.error('Error:', error)
  }
)

// Method 2: Manual error checking
const response = await api.collections.getCollections()
if (isApiError(response)) {
  console.error('API Error:', response.error)
} else {
  console.log('Success:', response.data)
}
```

## Network Simulation

The mock client simulates realistic network conditions:

```typescript
import { mockUtils } from '@/api'

// Enable error simulation for testing
mockUtils.enableErrorSimulation(true)
mockUtils.setErrorRates({
  rate: 0.1,           // 10% general error rate
  networkErrorRate: 0.05, // 5% network errors
  serverErrorRate: 0.03   // 3% server errors
})

// Clear mock storage
mockUtils.clearMockStorage()

// Access stored data
const uploadedFiles = mockUtils.getMockStorageData('uploaded_files')
```

## Database Schema Recommendations

For when you implement a real backend, here are the recommended table structures:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  collection_id UUID REFERENCES collections(id),
  domain VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for chat_sessions
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_collection_id ON chat_sessions(collection_id);
CREATE INDEX idx_chat_sessions_domain ON chat_sessions(domain);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id),
  content TEXT NOT NULL,
  sender VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  message_type VARCHAR(20) DEFAULT 'text',
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  collection_id UUID REFERENCES collections(id),
  original_filename VARCHAR(255) NOT NULL,        -- Original filename (e.g., "My Contract.pdf")
  stored_filename VARCHAR(255) NOT NULL,          -- S3 filename (e.g., "550e8400-e29b-41d4-a716-446655440000.pdf")
  file_type VARCHAR(50),                          -- MIME type (e.g., "application/pdf")
  file_size INTEGER,                              -- File size in bytes
  s3_bucket VARCHAR(100),                         -- S3 bucket name
  s3_key VARCHAR(500) NOT NULL,                   -- Full S3 key/path
  upload_date TIMESTAMP DEFAULT NOW(),
  analysis_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  content_text TEXT,                              -- Extracted text content
  content_summary TEXT,                           -- AI-generated summary
  metadata JSONB,                                 -- Additional metadata (pages, language, etc.)
  
  -- Indexes for performance
  INDEX idx_documents_user_id (user_id),
  INDEX idx_documents_collection_id (collection_id),
  INDEX idx_documents_s3_key (s3_key),
  INDEX idx_documents_upload_date (upload_date),
  INDEX idx_documents_analysis_status (analysis_status)
);
```

### Collections Table
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  summary TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  tags TEXT[],
  item_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  action_items_count INTEGER DEFAULT 0,
  urgent_actions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for collections
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_domain ON collections(domain);
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_created_at ON collections(created_at);
CREATE INDEX idx_collections_urgent_actions ON collections(urgent_actions_count) WHERE urgent_actions_count > 0;
```

### Collection Items Table (Junction Table)
```sql
CREATE TABLE collection_items (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('conversation', 'document', 'action')),
  title VARCHAR(255) NOT NULL,
  preview TEXT,
  domain VARCHAR(50),
  metadata JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(collection_id, item_id, item_type)
);

-- Indexes for collection_items
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_item_id ON collection_items(item_id);
CREATE INDEX idx_collection_items_item_type ON collection_items(item_type);
CREATE INDEX idx_collection_items_domain ON collection_items(domain);
```

### Action Items Table
```sql
CREATE TABLE action_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  collection_id UUID REFERENCES collections(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('urgent', 'important', 'normal')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date TIMESTAMP,
  source_conversation VARCHAR(255),
  external_links JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Collection Access Patterns
Collections provide direct access to their related data through foreign key relationships:

1. **Direct Access**: Collections can directly access their conversations, documents, and action items
2. **Flexible Organization**: The collection_items junction table allows for additional organizational patterns
3. **Performance**: Direct relationships enable fast queries without complex joins
4. **Data Integrity**: Foreign key constraints ensure data consistency

## API Endpoints Overview

All endpoints return consistent response formats:

```typescript
// Success Response
{
  data: T,
  success: true,
  message?: string,
  timestamp: string
}

// Error Response
{
  success: false,
  error: string,
  code: string,
  timestamp: string
}
```

## Real Backend Implementation Notes

When implementing a real backend:

1. **Authentication**: Use JWT tokens with refresh token rotation

2. **File Upload & Storage**: 
   - Use presigned URLs for direct S3/cloud storage uploads
   - **CRITICAL**: Rename uploaded files using the generated document ID
   - Store original filename in database for display purposes
   - S3 key structure: `documents/{user_id}/{document_id}.{extension}`
   - Example workflow:
     ```
     1. Generate UUID for document: "550e8400-e29b-41d4-a716-446655440000"
     2. User uploads "My Employment Contract.pdf"
     3. Store in S3 as: "documents/user123/550e8400-e29b-41d4-a716-446655440000.pdf"
     4. Database stores:
        - original_filename: "My Employment Contract.pdf"
        - stored_filename: "550e8400-e29b-41d4-a716-446655440000.pdf"
        - s3_key: "documents/user123/550e8400-e29b-41d4-a716-446655440000.pdf"
     5. Frontend displays original filename, backend searches by ID
     ```

3. **File Security & Access**:
   - Validate file types and sizes before upload
   - Scan for malware/viruses
   - Use presigned URLs for secure downloads
   - Implement access controls (user can only access their files)

4. **Real-time Updates**: Implement WebSocket connections for live updates

5. **Analysis Processing**: 
   - Use job queues (Redis/RabbitMQ) for AI processing
   - Process files by S3 key (document ID), not original filename
   - Store analysis results linked to document ID

6. **Search**: 
   - Implement with Elasticsearch or similar for full-text search
   - Index by document content, original filename, and metadata
   - Search results return document ID for file access

7. **Rate Limiting**: Implement per-user rate limits

8. **Validation**: Use schema validation (Joi, Yup, or Zod)

9. **Logging**: Comprehensive logging for debugging and monitoring

## Testing

The mock API includes testing utilities:

```typescript
import { mockClient, mockUtils } from '@/api'

// Test with errors enabled
mockUtils.enableErrorSimulation(true)
const response = await api.user.getProfile()
// May return an error response

// Test with clean state
mockUtils.clearMockStorage()
const collections = await api.collections.getCollections()
// Will return empty array

// Test file upload
const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
const uploadResponse = await mockClient.uploadFile(mockFile)
```

This API layer provides a complete foundation for your LegalKaki frontend, with all the data structures and interactions needed to build a production-ready legal assistant platform.