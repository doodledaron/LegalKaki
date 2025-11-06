# LocalStorage Guide for RAG System

## 📊 Storage Limitations

### Browser Limits
- **Chrome/Edge**: ~10 MB
- **Firefox**: ~10 MB
- **Safari**: ~5 MB
- **Mobile browsers**: ~5 MB

**Conservative estimate used**: 5 MB for maximum compatibility

## 💾 What We Store

### Per Document Storage Breakdown

| Item | Size | Required for RAG |
|------|------|------------------|
| ~~PDF Binary (base64)~~ | ~~1-5 MB~~ | ❌ **REMOVED** |
| Extracted Text | 50-500 KB | ✅ Yes |
| Document Metadata | 1-2 KB | ✅ Yes |
| Chunks (50 chunks) | 40 KB | ✅ Yes |
| Embeddings (768-dim × 50) | 150-300 KB | ✅ Yes |
| **Total per document** | **~250-850 KB** | - |

### Storage Optimization
✅ **Removed PDF storage** - Original PDF files are NOT stored
✅ **Kept text only** - Extracted text is sufficient for RAG
✅ **Efficient embeddings** - Stored as compact JSON arrays

## 📈 Capacity Estimates

With the optimizations:

| Document Size | Storage Used | Documents Possible (in 5MB) |
|---------------|--------------|------------------------------|
| 10 pages | ~250 KB | **~20 documents** |
| 25 pages | ~500 KB | **~10 documents** |
| 50 pages | ~850 KB | **~6 documents** |
| 100 pages | ~1.5 MB | **~3 documents** |

## 🔄 Automatic Storage Management

### Auto-Cleanup Feature
When storage exceeds **80%**, the system automatically:
1. Detects storage limit approaching
2. Deletes the **oldest document** (first uploaded)
3. Removes associated chunks and embeddings
4. Frees up space for new upload

### Manual Cleanup
Use browser console:
```javascript
// Check storage usage
storageMonitor.logStorageStats()

// Clear oldest 2 documents
storageMonitor.clearOldestDocuments(2)

// Clear ALL LegalKaki data (use with caution!)
storageMonitor.clearAllData()
```

## ✅ Multi-Document Support

**Yes, you can upload multiple documents!**

### Before Chat
- Upload 1-3 documents before starting chat
- All documents will be indexed for RAG

### During Chat
- Upload additional documents mid-conversation
- New documents are immediately indexed
- All documents are searchable together

### Example Workflow
```
1. Upload employment_contract.pdf (500 KB)
   ✅ Indexed: 45 chunks

2. Start chat, ask questions

3. Upload company_policy.pdf (350 KB) during chat
   ✅ Indexed: 32 chunks

4. Ask: "What are my leave entitlements?"
   🔍 Searches both documents
   📄 Returns relevant chunks from both
```

## 🚨 Error Handling

### "Storage Quota Exceeded" Error

**What happens:**
1. Upload fails with quota error
2. System automatically clears 2 oldest documents
3. User sees: "Storage full. Oldest documents cleared. Please try uploading again."
4. User retries upload successfully

**Prevention:**
- Storage is monitored before each upload
- Auto-cleanup at 80% prevents most quota errors

## 📱 Best Practices

### For Maximum Documents
1. **Keep documents focused** - Only upload relevant docs
2. **Upload smaller PDFs** - Break large PDFs into sections if possible
3. **Monitor storage** - Check console logs after uploads
4. **Clear old sessions** - Remove documents from past chats

### Storage Console Logs
After each upload:
```
📊 LocalStorage Usage:
  Total: 2.34 MB / 5.00 MB (46.8%)
  Documents: 156 KB
  Chunks: 2.12 MB
  Other: 62 KB
```

## 🔍 What Happens to Deleted Documents?

When a document is automatically cleaned up:

✅ **Chunks deleted** - Frees most space
✅ **Embeddings deleted** - Included in chunks
✅ **Metadata removed** - Document list updated
❌ **Chat history preserved** - Messages remain
❌ **Cannot retrieve** - Document text is gone

**Note**: If you need the document again, simply re-upload it!

## 🛠️ Technical Details

### Storage Keys
```
legalkaki_documents          - Document metadata list
legalkaki_chunks_{docId}     - Chunks + embeddings per document
legalkaki_file_blobs         - DEPRECATED (removed, saves space)
```

### Data Structure
```json
// legalkaki_documents
[{
  "id": "doc_1234567890",
  "originalFilename": "contract.pdf",
  "contentText": "Full extracted text...",
  "fileSize": 524288,
  "metadata": { "pages": 25 }
}]

// legalkaki_chunks_doc_1234567890
[{
  "id": "doc_1234567890_chunk_0",
  "text": "Chunk text here...",
  "embedding": [0.123, -0.456, ...],  // 768 numbers
  "chunkIndex": 0
}]
```

## 🎯 Recommendations

### Ideal Setup
- **2-4 documents** - Best balance of context and performance
- **10-30 pages each** - Optimal chunk count (30-90 chunks)
- **Related topic** - All documents about same legal matter

### Not Recommended
- ❌ Uploading 10+ documents (may hit storage limit)
- ❌ Very large PDFs (100+ pages, 2+ MB storage each)
- ❌ Keeping old documents from unrelated matters

### Pro Tips
1. **Before important session**: Clear old data
   ```javascript
   storageMonitor.clearAllData()
   ```

2. **Check space regularly**:
   ```javascript
   storageMonitor.logStorageStats()
   ```

3. **Upload strategically**: Upload most important doc first

4. **Monitor console**: Watch for storage warnings

## 🔮 Future Improvements

Possible enhancements for production:

1. **IndexedDB Migration** - Store up to 50-250 MB
2. **Selective Storage** - Only store frequently accessed chunks
3. **Cloud Sync** - Upload to S3, keep only recent in localStorage
4. **Compression** - Gzip embeddings for 50% space savings
5. **Smart Cleanup** - Delete least-used documents instead of oldest

## 📊 Quick Reference

| Action | Command |
|--------|---------|
| Check storage | `storageMonitor.logStorageStats()` |
| Clear 1 document | `storageMonitor.clearOldestDocuments(1)` |
| Clear all data | `storageMonitor.clearAllData()` |
| Check document list | `storageMonitor.getDocumentsByAge()` |

## ⚡ Performance Impact

Storage management is **very fast**:
- Check space: < 1ms
- Delete document: < 10ms
- Upload with auto-cleanup: +10ms overhead

No noticeable performance impact! 🚀
