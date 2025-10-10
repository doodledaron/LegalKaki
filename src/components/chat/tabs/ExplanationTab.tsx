"use client";

import { cn } from "@/lib/utils";
import { EducatorResponse } from "@/types/subAgentSchemas";
import { BookOpen, Lightbulb, Link } from "lucide-react";

export interface ExplanationTabProps {
  data: EducatorResponse;
  markdownContent?: string;
}

export function ExplanationTab({ data, markdownContent }: ExplanationTabProps) {
  return (
    <div className="space-y-6">
      {/* Concept Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="bg-purple-100 rounded-lg p-2.5 mt-0.5">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{data.concept}</h3>
            <p className="text-lg text-gray-700 leading-relaxed">{data.simpleDefinition}</p>
          </div>
        </div>
      </div>

      {/* Key Points */}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Key Points
          </h4>
          <ul className="space-y-3">
            {data.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-gray-700 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nuances */}
      {data.nuances && data.nuances.length > 0 && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            Important Nuances
          </h4>
          <ul className="space-y-3">
            {data.nuances.map((nuance, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-amber-500 text-xl flex-shrink-0">⚠️</span>
                <span className="text-gray-700 leading-relaxed">{nuance}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Examples */}
      {data.examples && data.examples.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Real-World Examples
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {data.examples.map((example, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  {example.title}
                </h5>
                <p className="text-gray-600 text-sm leading-relaxed">{example.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Concepts */}
      {data.relatedConcepts && data.relatedConcepts.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Link className="w-5 h-5 text-gray-600" />
            Related Concepts
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {data.relatedConcepts.map((related, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 transition-colors cursor-pointer"
              >
                <h5 className="font-semibold text-purple-600 mb-1">{related.name}</h5>
                <p className="text-gray-600 text-sm">{related.whyRelated}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: Markdown Content */}
      {markdownContent && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
        </div>
      )}
    </div>
  );
}

// Simplified version for when JSON parsing fails
export interface ExplanationTabFallbackProps {
  markdownContent: string;
}

export function ExplanationTabFallback({ markdownContent }: ExplanationTabFallbackProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
    </div>
  );
}
