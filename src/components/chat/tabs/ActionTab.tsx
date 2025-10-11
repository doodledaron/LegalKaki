"use client";

import { cn } from "@/lib/utils";
import { AdvisorResponse, AdvisorActionItem } from "@/types/subAgentSchemas";
import {
  CheckCircle,
  Clock,
  Tag,
  Link as LinkIcon,
  FileText,
  MapPin,
} from "lucide-react";
import { useState } from "react";

export interface ActionTabProps {
  data: AdvisorResponse;
  markdownContent?: string;
  onItemStatusChange?: (itemId: string, newStatus: "todo" | "in_progress" | "done") => void;
}

export function ActionTab({ data, markdownContent, onItemStatusChange }: ActionTabProps) {
  const [itemStatuses, setItemStatuses] = useState<Record<string, "todo" | "in_progress" | "done">>(
    () => {
      const initialStatuses: Record<string, "todo" | "in_progress" | "done"> = {};
      data.items.forEach((item) => {
        initialStatuses[item.id] = item.status;
      });
      return initialStatuses;
    }
  );

  const handleStatusChange = (itemId: string, newStatus: "todo" | "in_progress" | "done") => {
    setItemStatuses((prev) => ({ ...prev, [itemId]: newStatus }));
    onItemStatusChange?.(itemId, newStatus);
  };

  // Filter items by status
  const todoItems = data.items.filter((item) => itemStatuses[item.id] === "todo");
  const inProgressItems = data.items.filter((item) => itemStatuses[item.id] === "in_progress");
  const doneItems = data.items.filter((item) => itemStatuses[item.id] === "done");

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-lg p-2.5 mt-0.5">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Action Plan</h3>
              <p className="text-gray-700 leading-relaxed">{data.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimers */}
      {data.disclaimers && data.disclaimers.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-300 p-4">
          {data.disclaimers.map((disclaimer, index) => (
            <p key={index} className="text-gray-600 text-xs italic">
              {disclaimer}
            </p>
          ))}
        </div>
      )}

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-400">{todoItems.length}</div>
          <div className="text-sm text-gray-600 mt-1">To Do</div>
        </div>
        <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{inProgressItems.length}</div>
          <div className="text-sm text-gray-600 mt-1">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{doneItems.length}</div>
          <div className="text-sm text-gray-600 mt-1">Done</div>
        </div>
      </div>

      {/* Action Items - In Progress */}
      {inProgressItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            In Progress
          </h4>
          {inProgressItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={{ ...item, status: itemStatuses[item.id] }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Action Items - To Do */}
      {todoItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            To Do
          </h4>
          {todoItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={{ ...item, status: itemStatuses[item.id] }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Action Items - Done */}
      {doneItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Completed
          </h4>
          {doneItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={{ ...item, status: itemStatuses[item.id] }}
              onStatusChange={handleStatusChange}
            />
          ))}
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

// Action Item Card Component
function ActionItemCard({
  item,
  onStatusChange,
}: {
  item: AdvisorActionItem;
  onStatusChange: (itemId: string, newStatus: "todo" | "in_progress" | "done") => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityConfig = {
    high: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      icon: "🔥",
    },
    medium: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      icon: "⚡",
    },
    low: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      icon: "📌",
    },
  };

  const config = priorityConfig[item.priority];
  const isDone = item.status === "done";

  return (
    <div
      className={cn(
        "rounded-lg border p-5 transition-all",
        config.bg,
        config.border,
        isDone && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Status Checkbox */}
        <button
          onClick={() => {
            const newStatus =
              item.status === "todo"
                ? "in_progress"
                : item.status === "in_progress"
                ? "done"
                : "todo";
            onStatusChange(item.id, newStatus);
          }}
          className={cn(
            "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
            item.status === "done"
              ? "bg-green-500 border-green-500"
              : item.status === "in_progress"
              ? "bg-blue-500 border-blue-500"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          {item.status === "done" && <CheckCircle className="w-4 h-4 text-white" />}
          {item.status === "in_progress" && (
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h5 className={cn("font-semibold text-gray-900", isDone && "line-through")}>
              {item.title}
            </h5>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", config.badge)}>
              {item.priority.toUpperCase()}
            </span>
            {item.due && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                {item.due}
              </span>
            )}
            {item.estimatedHours !== undefined && item.estimatedHours > 0 && (
              <span className="text-xs text-gray-600">{item.estimatedHours}h</span>
            )}
          </div>

          <p className="text-gray-700 text-sm mb-2">{item.whatToDo}</p>

          {/* Why It Matters */}
          <div className="bg-white/70 rounded-lg p-3 mb-3 text-sm">
            <span className="font-semibold text-gray-700">Why it matters: </span>
            <span className="text-gray-600">{item.whyItMatters}</span>
          </div>

          {/* Expandable Details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
          >
            {isExpanded ? "Hide details ↑" : "Show details ↓"}
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Dependencies */}
              {item.dependencies && item.dependencies.length > 0 && (
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Dependencies:</div>
                  <div className="flex flex-wrap gap-2">
                    {item.dependencies.map((depId) => (
                      <span
                        key={depId}
                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs"
                      >
                        {depId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-500" />
                  {item.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Required Documents */}
              {item.requiredDocuments && item.requiredDocuments.length > 0 && (
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Required Documents:
                  </div>
                  <ul className="space-y-1">
                    {item.requiredDocuments.map((doc, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Links */}
              {item.links && item.links.length > 0 && (
                <div className="space-y-2">
                  {item.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Jurisdiction */}
              {item.jurisdiction && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {item.jurisdiction}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Fallback component
export interface ActionTabFallbackProps {
  markdownContent: string;
}

export function ActionTabFallback({ markdownContent }: ActionTabFallbackProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
      <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
    </div>
  );
}
