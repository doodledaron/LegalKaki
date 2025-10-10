"use client";

import { cn } from "@/lib/utils";
import {
  VisualizationResponse,
  DraftResponse,
  TimelineData,
  DocumentSummaryData,
  ComparisonData,
  ProcessMapData,
  ChecklistData,
  GraphData,
  MindmapData,
} from "@/types/subAgentSchemas";
import {
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";

export interface SupplementaryTabProps {
  visualizationData?: VisualizationResponse;
  draftData?: DraftResponse;
  markdownContent?: string;
}

export function SupplementaryTab({
  visualizationData,
  draftData,
  markdownContent,
}: SupplementaryTabProps) {
  return (
    <div className="space-y-6">
      {/* Visualization */}
      {visualizationData && <VisualizationRenderer data={visualizationData} />}

      {/* Draft */}
      {draftData && <DraftRenderer data={draftData} />}

      {/* Fallback: Markdown Content */}
      {markdownContent && !visualizationData && !draftData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: markdownContent }} />
        </div>
      )}
    </div>
  );
}

// Visualization Renderer Component
function VisualizationRenderer({ data }: { data: VisualizationResponse }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-100 rounded-lg p-2.5 mt-0.5">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{data.title}</h3>
            <p className="text-gray-600 text-sm">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Render based on type */}
      {data.type === "timeline" && <TimelineRenderer data={data.data as TimelineData} />}
      {data.type === "document_summary" && (
        <DocumentSummaryRenderer data={data.data as DocumentSummaryData} />
      )}
      {data.type === "comparison" && <ComparisonRenderer data={data.data as ComparisonData} />}
      {data.type === "process_map" && <ProcessMapRenderer data={data.data as ProcessMapData} />}
      {data.type === "checklist" && <ChecklistRenderer data={data.data as ChecklistData} />}
      {data.type === "graph" && <GraphRenderer data={data.data as GraphData} />}
      {data.type === "mindmap" && <MindmapRenderer data={data.data as MindmapData} />}
    </div>
  );
}

// Timeline Renderer
function TimelineRenderer({ data }: { data: TimelineData }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-4">
        {data.events.map((event, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              {index < data.events.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 my-2 flex-1" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="text-sm text-gray-500 mb-1">{event.date}</div>
              <h5 className="font-semibold text-gray-900 mb-1">{event.title}</h5>
              <p className="text-gray-600 text-sm">{event.description}</p>
              {event.type && (
                <span className="inline-block mt-2 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {event.type}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Document Summary Renderer
function DocumentSummaryRenderer({ data }: { data: DocumentSummaryData }) {
  return (
    <div className="space-y-4">
      {/* Document Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <span className="font-semibold text-gray-700">Document Type: </span>
        <span className="text-gray-600">{data.documentType}</span>
      </div>

      {/* Parties */}
      {data.parties && data.parties.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">Parties</h5>
          <div className="space-y-2">
            {data.parties.map((party, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="font-medium text-purple-600">{party.role}:</span>
                <span className="text-gray-700">{party.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Terms */}
      {data.keyTerms && data.keyTerms.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">Key Terms</h5>
          <div className="space-y-3">
            {data.keyTerms.map((term, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="font-semibold text-gray-900 mb-1 flex items-center justify-between">
                  <span>{term.term}</span>
                  {term.page && (
                    <span className="text-xs text-gray-500">Page {term.page}</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{term.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Obligations */}
      {data.obligations && data.obligations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">Obligations</h5>
          <div className="space-y-2">
            {data.obligations.map((obligation, index) => (
              <div key={index} className="bg-blue-50 rounded-lg p-3">
                <div className="font-medium text-blue-900 mb-1">{obligation.party}</div>
                <p className="text-gray-700 text-sm">{obligation.description}</p>
                {obligation.deadline && (
                  <div className="text-xs text-gray-600 mt-2">Due: {obligation.deadline}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {data.risks && data.risks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">Risks</h5>
          <div className="space-y-2">
            {data.risks.map((risk, index) => {
              const severityColors = {
                high: "bg-red-50 border-red-200",
                medium: "bg-yellow-50 border-yellow-200",
                low: "bg-blue-50 border-blue-200",
              };
              return (
                <div
                  key={index}
                  className={cn("rounded-lg p-3 border", severityColors[risk.severity])}
                >
                  <p className="text-gray-700 text-sm mb-1">{risk.description}</p>
                  {risk.mitigation && (
                    <p className="text-gray-600 text-xs">Mitigation: {risk.mitigation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Comparison Renderer
function ComparisonRenderer({ data }: { data: ComparisonData }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Item
            </th>
            {data.columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.label}</td>
              {row.values.map((value, valueIndex) => (
                <td key={valueIndex} className="px-6 py-4 text-sm text-gray-600">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Process Map Renderer
function ProcessMapRenderer({ data }: { data: ProcessMapData }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-4">
        {data.steps.map((step, index) => (
          <div key={step.id}>
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-2">{step.title}</h5>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                  {step.next && step.next.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500">
                      Next: {step.next.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {index < data.steps.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="text-gray-400 text-2xl">↓</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Checklist Renderer
function ChecklistRenderer({ data }: { data: ChecklistData }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-3">
        {data.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              item.completed ? "bg-green-50" : "bg-gray-50"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                item.completed
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              )}
            >
              {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <span
                className={cn(
                  "text-sm",
                  item.completed ? "text-gray-500 line-through" : "text-gray-700"
                )}
              >
                {item.text}
              </span>
              {item.required && (
                <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                  Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Graph Renderer (Simple visualization)
function GraphRenderer({ data }: { data: GraphData }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Nodes */}
        <div>
          <h5 className="font-semibold text-gray-900 mb-3">Nodes</h5>
          <div className="flex flex-wrap gap-2">
            {data.nodes.map((node) => (
              <div
                key={node.id}
                className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium text-sm"
              >
                {node.label}
                {node.type && (
                  <span className="ml-2 text-xs text-indigo-600">({node.type})</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edges */}
        {data.edges && data.edges.length > 0 && (
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Relationships</h5>
            <div className="space-y-2">
              {data.edges.map((edge, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-medium">
                    {edge.from}
                  </span>
                  <span className="text-gray-400">→</span>
                  {edge.label && <span className="text-gray-600 text-xs">{edge.label}</span>}
                  <span className="text-gray-400">→</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-medium">
                    {edge.to}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mindmap Renderer (Nested list visualization)
function MindmapRenderer({ data }: { data: MindmapData }) {
  const renderNode = (node: MindmapData["root"], level: number = 0) => {
    const indentClass = level === 0 ? "" : `ml-${level * 4}`;
    const bgColor = level === 0 ? "bg-purple-100" : level === 1 ? "bg-indigo-50" : "bg-gray-50";

    return (
      <div key={node.id} className={cn("space-y-2", indentClass)}>
        <div className={cn("rounded-lg p-3 border", bgColor)}>
          <span className="font-medium text-gray-900">{node.label}</span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {renderNode(data.root)}
    </div>
  );
}

// Draft Renderer Component
function DraftRenderer({ data }: { data: DraftResponse }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-100">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 rounded-lg p-2.5 mt-0.5">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{data.title}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="bg-white px-3 py-1 rounded border border-gray-200">
                {data.documentType.replace("_", " ").toUpperCase()}
              </span>
              {data.jurisdiction && (
                <span className="bg-white px-3 py-1 rounded border border-gray-200">
                  {data.jurisdiction}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      {data.parties && data.parties.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">Parties</h5>
          <div className="space-y-2">
            {data.parties.map((party, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-purple-600">{party.role}:</span>
                  <span className="text-gray-900">{party.name}</span>
                </div>
                {party.address && <span className="text-gray-600 text-sm ml-20">{party.address}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placeholders */}
      {data.placeholders && data.placeholders.length > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">⚠️ Placeholders to Fill</h5>
          <div className="space-y-2">
            {data.placeholders.map((placeholder, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded font-mono text-sm">
                  {placeholder.key}
                </span>
                <span className="text-gray-700 text-sm">{placeholder.label}</span>
                <span className="text-gray-500 text-xs">({placeholder.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Sections */}
      {data.sections && data.sections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h5 className="font-semibold text-gray-900 mb-4">Document Structure</h5>
          <div className="space-y-4">
            {data.sections.map((section, index) => (
              <div key={section.id} className="border-l-4 border-purple-300 pl-4">
                <h6 className="font-semibold text-gray-900 mb-1">
                  {index + 1}. {section.title}
                </h6>
                {section.content && (
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{section.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      {data.signatures && data.signatures.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h5 className="font-semibold text-gray-900 mb-3">Signatures Required</h5>
          <div className="space-y-3">
            {data.signatures.map((signature, index) => (
              <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                <div className="font-medium text-gray-900">{signature.name}</div>
                {signature.title && <div className="text-gray-600 text-sm">{signature.title}</div>}
                <div className="text-gray-500 text-xs mt-1">Role: {signature.role}</div>
                {signature.date && (
                  <div className="text-gray-500 text-xs">Date: {signature.date}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
