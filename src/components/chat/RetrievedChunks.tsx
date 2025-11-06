/**
 * Retrieved Chunks Display Component
 * Shows which document chunks were used to generate the AI response
 */

import type { RetrievedChunk } from '@/types';

interface RetrievedChunksProps {
  chunks: RetrievedChunk[];
}

export function RetrievedChunks({ chunks }: RetrievedChunksProps) {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-3">
      <details className="group">
        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1">
          <span>📄 Retrieved from document ({chunks.length} chunks)</span>
          <span className="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {chunks.map((chunk, idx) => (
            <div
              key={idx}
              className="text-xs bg-purple-50 border border-purple-200 rounded-lg p-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-purple-700">
                  Chunk {chunk.chunkIndex + 1}
                </span>
                <span className="text-purple-600 font-mono">
                  {(chunk.similarity * 100).toFixed(0)}% match
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed line-clamp-3">
                {chunk.text.substring(0, 200)}
                {chunk.text.length > 200 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
