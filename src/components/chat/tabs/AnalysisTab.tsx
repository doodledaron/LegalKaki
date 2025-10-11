"use client";

import { cn } from "@/lib/utils";
import { AnalystResponse, AnalystIssue } from "@/types/subAgentSchemas";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Scale,
  FileText,
  Clock,
  Folder,
} from "lucide-react";

export interface AnalysisTabProps {
  data: AnalystResponse;
  markdownContent?: string;
}

export function AnalysisTab({ data, markdownContent }: AnalysisTabProps) {
  return (
    <div className="space-y-6">
      {/* Situation Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-lg p-2.5 mt-0.5">
            <Scale className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Situation Summary</h3>
            <p className="text-gray-700 leading-relaxed">{data.situationSummary}</p>
          </div>
        </div>
      </div>

      {/* Issues Identified */}
      {data.issues && data.issues.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Issues Identified
          </h4>
          <div className="space-y-3">
            {data.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Relevant Law */}
      {data.relevantLaw && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Relevant Law
            {data.relevantLaw.jurisdiction && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({data.relevantLaw.jurisdiction})
              </span>
            )}
          </h4>

          {/* Statutes */}
          {data.relevantLaw.statutes && data.relevantLaw.statutes.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3">📚 Statutes</h5>
              <div className="space-y-2">
                {data.relevantLaw.statutes.map((statute, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-mono text-sm text-purple-700 font-semibold mb-1">
                      {statute.citation}
                    </div>
                    <p className="text-gray-600 text-sm">{statute.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cases */}
          {data.relevantLaw.cases && data.relevantLaw.cases.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3">⚖️ Case Law</h5>
              <div className="space-y-2">
                {data.relevantLaw.cases.map((caseItem, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="font-semibold text-sm text-blue-900 mb-1">
                      {caseItem.name}
                    </div>
                    <p className="text-gray-600 text-sm">{caseItem.holding}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Procedures */}
          {data.relevantLaw.procedures && data.relevantLaw.procedures.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-3">📋 Procedures</h5>
              <div className="space-y-2">
                {data.relevantLaw.procedures.map((proc, index) => (
                  <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="font-semibold text-sm text-green-900 mb-1">{proc.topic}</div>
                    <p className="text-gray-600 text-sm">{proc.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessment */}
      {data.assessment && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-600" />
            Position Assessment
          </h4>

          {/* Position Strength */}
          <PositionStrengthBadge strength={data.assessment.positionStrength} />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Strengths */}
            {data.assessment.strengths && data.assessment.strengths.length > 0 && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-5">
                <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Strengths
                </h5>
                <ul className="space-y-2">
                  {data.assessment.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {data.assessment.weaknesses && data.assessment.weaknesses.length > 0 && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-5">
                <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Weaknesses
                </h5>
                <ul className="space-y-2">
                  {data.assessment.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Missing Information */}
          {data.assessment.missingInformation &&
            data.assessment.missingInformation.length > 0 && (
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
                <h5 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Missing Information
                </h5>
                <ul className="space-y-2">
                  {data.assessment.missingInformation.map((info, index) => (
                    <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">?</span>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Time Sensitive */}
          {data.assessment.timeSensitive && data.assessment.timeSensitive.length > 0 && (
            <div className="bg-orange-50 rounded-lg border border-orange-200 p-5">
              <h5 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time-Sensitive Matters
              </h5>
              <ul className="space-y-2">
                {data.assessment.timeSensitive.map((item, index) => (
                  <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">⏰</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents Needed */}
          {data.assessment.docsNeeded && data.assessment.docsNeeded.length > 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Documents Needed
              </h5>
              <ul className="space-y-2">
                {data.assessment.docsNeeded.map((doc, index) => (
                  <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">📄</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimers */}
          {data.assessment.disclaimers && data.assessment.disclaimers.length > 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-300 p-4">
              {data.assessment.disclaimers.map((disclaimer, index) => (
                <p key={index} className="text-gray-600 text-xs italic">
                  {disclaimer}
                </p>
              ))}
            </div>
          )}
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

// Issue Card Component
function IssueCard({ issue }: { issue: AnalystIssue }) {
  const severityConfig = {
    high: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      icon: "🚨",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      icon: "⚠️",
    },
    low: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      icon: "ℹ️",
    },
  };

  const config = severityConfig[issue.severity];
  const confidencePercent = Math.round(issue.confidence * 100);

  return (
    <div className={cn("rounded-lg border p-5", config.bg, config.border)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <h5 className="font-semibold text-gray-900">{issue.name}</h5>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", config.badge)}>
            {issue.severity.toUpperCase()}
          </span>
          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            {confidencePercent}% confident
          </span>
        </div>
      </div>
      {issue.considerations && issue.considerations.length > 0 && (
        <ul className="space-y-2 mt-3">
          {issue.considerations.map((consideration, index) => (
            <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{consideration}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Position Strength Badge Component
function PositionStrengthBadge({
  strength,
}: {
  strength: "STRONG" | "MODERATE" | "WEAK" | "NEEDS_MORE_INFO";
}) {
  const strengthConfig = {
    STRONG: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
      icon: "💪",
      label: "Strong Position",
    },
    MODERATE: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      icon: "👍",
      label: "Moderate Position",
    },
    WEAK: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      icon: "⚠️",
      label: "Weak Position",
    },
    NEEDS_MORE_INFO: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-300",
      icon: "❓",
      label: "Needs More Information",
    },
  };

  const config = strengthConfig[strength];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold",
        config.bg,
        config.text,
        config.border
      )}
    >
      <span className="text-xl">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

// Fallback component
export interface AnalysisTabFallbackProps {
  markdownContent: string;
}

export function AnalysisTabFallback({ markdownContent }: AnalysisTabFallbackProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
    </div>
  );
}
