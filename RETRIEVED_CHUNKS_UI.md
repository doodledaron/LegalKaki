# Retrieved Chunks UI Feature

## Overview

The chat interface now displays which document chunks were retrieved and used to answer the user's question. This provides transparency and allows users to verify that the AI is actually using their uploaded documents.

## Visual Design

### Collapsed State (Default)
```
┌─────────────────────────────────────────────────────────┐
│  LegalKaki                                              │
│                                                         │
│  Based on the document, the payment terms require...   │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  📄 Retrieved from document (3 chunks) ▼               │
│                                                         │
│  2:30 PM                                                │
└─────────────────────────────────────────────────────────┘
```

### Expanded State (When User Clicks)
```
┌─────────────────────────────────────────────────────────┐
│  LegalKaki                                              │
│                                                         │
│  Based on the document, the payment terms require...   │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  📄 Retrieved from document (3 chunks) ▲               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Chunk 12                              95% match   │ │
│  │ The Parties agree that all payments shall be...  │ │
│  │ made within thirty (30) days of invoice date...  │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Chunk 15                              87% match   │ │
│  │ Late payment fees of 2% per month will apply...  │ │
│  │ to any outstanding balances after the due...     │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Chunk 9                               82% match   │ │
│  │ Payment methods accepted include bank transfer.. │ │
│  │ credit card, and company cheque. All payments... │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  2:30 PM                                                │
└─────────────────────────────────────────────────────────┘
```

## Features

### 1. **Collapsible Section**
   - Collapsed by default to keep chat clean
   - Click to expand and see details
   - Shows count of retrieved chunks (e.g., "3 chunks")

### 2. **Chunk Display**
   - **Chunk Number**: Shows original position in document (e.g., "Chunk 12")
   - **Similarity Score**: Shows relevance % (e.g., "95% match")
   - **Text Preview**: First 200 characters of the chunk
   - **Truncation**: Shows "..." if text is longer than preview

### 3. **Visual Design**
   - Light purple background (`bg-purple-50`)
   - Purple border (`border-purple-200`)
   - Scrollable if many chunks (max height: 12rem / 192px)
   - Rounded corners for modern look

### 4. **Smart Display**
   - Only shows for **assistant messages** (not user messages)
   - Only appears when chunks were actually retrieved
   - Hidden if no document context was used

## Implementation Details

### Data Flow
```
User Question
    ↓
Generate Embedding
    ↓
Similarity Search (Top 5 chunks)
    ↓
Pass chunks to AI
    ↓
Store chunks in Message object
    ↓
Display in Chat Bubble
```

### Message Type Extension
```typescript
interface Message {
  // ... existing fields ...
  retrievedChunks?: RetrievedChunk[]
}

interface RetrievedChunk {
  text: string          // The chunk content
  similarity: number    // 0.0 to 1.0
  chunkIndex: number    // Original position in document
}
```

### Component Structure
```tsx
<div className="chat-bubble">
  <div>Message content...</div>

  {/* Retrieved Chunks Section */}
  {message.retrievedChunks?.length > 0 && (
    <details>
      <summary>
        📄 Retrieved from document (N chunks)
      </summary>
      <div>
        {chunks.map(chunk => (
          <div>
            Chunk {chunk.chunkIndex + 1} - {similarity}% match
            {chunk.text.substring(0, 200)}...
          </div>
        ))}
      </div>
    </details>
  )}

  <p>Timestamp</p>
</div>
```

## User Benefits

✅ **Transparency**: See exactly what document sections were used
✅ **Verification**: Confirm AI is using the uploaded document
✅ **Trust**: Build confidence in AI responses
✅ **Context**: Understand where information came from
✅ **Debugging**: Identify if wrong sections were retrieved

## Example Scenarios

### Scenario 1: Perfect Match
```
User: "What are the payment terms?"

Retrieved Chunks:
- Chunk 12 (95% match): Payment terms section
- Chunk 15 (87% match): Late payment fees
- Chunk 9  (82% match): Payment methods

AI Response: "Based on the document, payment is due within
30 days of invoice date..."
```

### Scenario 2: Multiple Topics
```
User: "What are my obligations and the termination clause?"

Retrieved Chunks:
- Chunk 23 (92% match): Termination clause
- Chunk 8  (89% match): Party A obligations
- Chunk 18 (85% match): Notice period requirements
- Chunk 12 (79% match): Party B obligations
- Chunk 30 (76% match): Post-termination duties

AI Response: "Your obligations include... The termination
clause states..."
```

### Scenario 3: No Document (Simple Chat)
```
User: "Thank you!"

Retrieved Chunks: (none)

AI Response: "You're welcome! Let me know if you have
any other questions."

[No retrieved chunks section shown]
```

## Styling Classes

```css
/* Collapsed state */
.cursor-pointer text-xs text-gray-600 hover:text-gray-800

/* Expanded container */
.mt-2 space-y-2 max-h-48 overflow-y-auto

/* Individual chunk */
.bg-purple-50 border border-purple-200 rounded-lg p-2

/* Chunk header */
.font-medium text-purple-700

/* Similarity score */
.text-purple-600 font-mono

/* Chunk text */
.text-gray-700 leading-relaxed line-clamp-3
```

## Browser Compatibility

Uses native HTML `<details>` element:
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile browsers: Full support

No JavaScript required for expand/collapse functionality.

## Performance Considerations

- Chunks are limited to 5 per query (configurable)
- Text preview limited to 200 characters
- Scrollable container prevents layout issues
- Collapsed by default to minimize initial render

## Future Enhancements

1. **Click to highlight**: Click chunk to see it in full document viewer
2. **Page numbers**: Show which page the chunk came from
3. **Color coding**: Different colors for different relevance levels
4. **Expand all**: Button to expand all chunks at once
5. **Copy chunk**: Copy button for individual chunks
6. **Filter by relevance**: Show only high-confidence chunks

## Testing Checklist

✅ Chunks only show for assistant messages
✅ Chunks only show when document was used
✅ Expand/collapse works correctly
✅ Similarity percentages display correctly
✅ Long text is truncated appropriately
✅ Scrolling works with many chunks
✅ No layout shift when expanding
✅ Mobile responsive

## Code Locations

- **Type definition**: `src/types/index.ts` - Message & RetrievedChunk interfaces
- **Data collection**: `src/api/chatService.ts` - sendMessage() function
- **UI rendering**: `src/components/screens/ChatbotScreen.tsx` - RegularMessageBubble component
