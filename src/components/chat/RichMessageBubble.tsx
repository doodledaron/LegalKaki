"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    BookOpen,
    Search,
    Target,
    FileText,
    CheckCircle2,
    ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import { ExplanationTab, AnalysisTab, ActionTab, SupplementaryTab } from "@/components/chat/tabs";
import {
    isEducatorResponse,
    isAnalystResponse,
    isAdvisorResponse,
    isVisualizationResponse,
    isDraftResponse,
} from "@/types/subAgentSchemas";
import { cn } from "@/lib/utils";

interface RichMessageBubbleProps {
    payload: any;
}

export function RichMessageBubble({ payload }: RichMessageBubbleProps) {
    // If payload is missing, return null
    if (!payload) return null;

    // Destructure payload (assuming it matches supervisorData structure)
    const {
        explanation_tab,
        analysis_tab,
        action_tab,
        extractedData,
        response_type,
        conversation_context,
        explanation,
        analysis,
        actions,
    } = payload;

    // Check if we have simplified structure (new format)
    const hasSimplifiedStructure = explanation || analysis || actions;

    // If simplified structure, use simplified rendering
    if (hasSimplifiedStructure && response_type === 'final') {
        return <LegalAnalysisBubble supervisorData={payload} />;
    }

    // Determine which tabs are active (legacy format)
    const activeTabs = {
        explanation: (explanation_tab as { status?: string })?.status === "active",
        analysis: (analysis_tab as { status?: string })?.status === "active",
        action: (action_tab as { status?: string })?.status === "active",
    };

    const hasAnyActiveTab = Object.values(activeTabs).some(Boolean);

    // Check if we have extracted JSON data (legacy format with embedded JSON blocks)
    const hasExplanationJson =
        !!(extractedData as Record<string, unknown>)?.explanation &&
        isEducatorResponse((extractedData as Record<string, unknown>).explanation);
    const hasAnalysisJson =
        !!(extractedData as Record<string, unknown>)?.analysis &&
        isAnalystResponse((extractedData as Record<string, unknown>).analysis);
    const hasActionJson =
        !!(extractedData as Record<string, unknown>)?.action &&
        isAdvisorResponse((extractedData as Record<string, unknown>).action);
    const hasVisualizationJson =
        !!(extractedData as Record<string, unknown>)?.visualization &&
        isVisualizationResponse((extractedData as Record<string, unknown>).visualization);
    const hasDraftJson =
        !!(extractedData as Record<string, unknown>)?.draft &&
        isDraftResponse((extractedData as Record<string, unknown>).draft);

    // Handle clarification_needed response type
    if (response_type === "clarification_needed" && conversation_context) {
        const systemMessage =
            (conversation_context as { system_message?: string }).system_message || "";
        const clarificationQuestions =
            (conversation_context as { clarification_questions?: string[] })
                .clarification_questions || [];

        return (
            <div className="flex justify-start mb-4 w-full">
                <div className="w-full bg-amber-50 border-2 border-amber-200 text-text-primary rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="p-4">
                        {systemMessage && (
                            <p className="body-regular font-medium text-amber-900 mb-3">
                                {systemMessage}
                            </p>
                        )}
                        {clarificationQuestions.length > 0 && (
                            <div className="space-y-2">
                                <p className="body-small font-semibold text-amber-800 mb-2">
                                    Please provide the following information:
                                </p>
                                <ul className="space-y-1.5 ml-4">
                                    {clarificationQuestions.map((question: string, idx: number) => (
                                        <li key={idx} className="body-small text-amber-900 list-disc">
                                            {question}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // If no active tabs at all, render as simple message
    if (!hasAnyActiveTab) {
        const messageContent =
            (conversation_context as { system_message?: string })?.system_message ||
            (explanation_tab as { content?: string })?.content ||
            (action_tab as { content?: string })?.content ||
            (analysis_tab as { content?: string })?.content ||
            "No response available.";

        return (
            <div className="flex justify-start mb-4 w-full">
                <div className="w-full bg-surface-white border border-gray-200 text-text-primary rounded-2xl rounded-bl-sm">
                    <p className="body-regular p-4 whitespace-pre-wrap">{messageContent}</p>
                </div>
            </div>
        );
    }

    // Get default tab (first active one)
    const getDefaultTab = () => {
        if (activeTabs.explanation) return "explanation";
        if (activeTabs.analysis) return "analysis";
        if (activeTabs.action) return "action";
        return "explanation";
    };

    // Add supplementary tab if we have visualization or draft data
    const hasSupplementary = hasVisualizationJson || hasDraftJson;

    return (
        <div className="flex justify-start mb-4 w-full">
            <div className="w-full bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
                <Tabs defaultValue={getDefaultTab()} className="w-full">
                    <TabsList className="w-full justify-start border-b border-gray-100 bg-gray-50/50 rounded-none px-4">
                        {activeTabs.explanation && (
                            <TabsTrigger value="explanation" className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4" />
                                <span>Explanation</span>
                            </TabsTrigger>
                        )}
                        {activeTabs.analysis && (
                            <TabsTrigger value="analysis" className="flex items-center space-x-2">
                                <Search className="w-4 h-4" />
                                <span>Analysis</span>
                            </TabsTrigger>
                        )}
                        {activeTabs.action && (
                            <TabsTrigger value="action" className="flex items-center space-x-2">
                                <Target className="w-4 h-4" />
                                <span>Actions</span>
                            </TabsTrigger>
                        )}
                        {hasSupplementary && (
                            <TabsTrigger value="supplementary" className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>Supplementary</span>
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {activeTabs.explanation && (
                        <TabsContent value="explanation" className="p-0 max-h-96 overflow-y-auto">
                            {hasExplanationJson ? (
                                <ExplanationTab
                                    data={
                                        (extractedData as Record<string, unknown>)
                                            .explanation as unknown as import("@/types/subAgentSchemas").EducatorResponse
                                    }
                                />
                            ) : (
                                <div className="p-4 space-y-3">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => (
                                                <p className="body-regular text-text-primary mb-3">{children}</p>
                                            ),
                                            ul: ({ children }) => (
                                                <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>
                                            ),
                                            li: ({ children }) => (
                                                <li className="body-regular text-text-primary">{children}</li>
                                            ),
                                            h1: ({ children }) => (
                                                <h1 className="heading-3 text-text-primary mb-3">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="heading-4 text-text-primary mb-2">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="body-semibold text-text-primary mb-2">{children}</h3>
                                            ),
                                            strong: ({ children }) => (
                                                <strong className="body-semibold text-purple-primary">{children}</strong>
                                            ),
                                            em: ({ children }) => <em className="italic">{children}</em>,
                                            code: ({ children }) => (
                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                                    {children}
                                                </code>
                                            ),
                                        }}
                                    >
                                        {(explanation_tab as { content?: string })?.content || ""}
                                    </ReactMarkdown>
                                    {(explanation_tab as { relevance?: string })?.relevance && (
                                        <p className="caption text-text-secondary italic mt-3 pt-3 border-t border-gray-100">
                                            {(explanation_tab as { relevance?: string })?.relevance}
                                        </p>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {activeTabs.analysis && (
                        <TabsContent value="analysis" className="p-0 max-h-96 overflow-y-auto">
                            {hasAnalysisJson ? (
                                <AnalysisTab
                                    data={
                                        (extractedData as Record<string, unknown>)
                                            .analysis as unknown as import("@/types/subAgentSchemas").AnalystResponse
                                    }
                                />
                            ) : (
                                <div className="p-4 space-y-3">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => (
                                                <p className="body-regular text-text-primary mb-3">{children}</p>
                                            ),
                                            ul: ({ children }) => (
                                                <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>
                                            ),
                                            li: ({ children }) => (
                                                <li className="body-regular text-text-primary">{children}</li>
                                            ),
                                            h1: ({ children }) => (
                                                <h1 className="heading-3 text-text-primary mb-3">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="heading-4 text-text-primary mb-2">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="body-semibold text-text-primary mb-2">{children}</h3>
                                            ),
                                            strong: ({ children }) => (
                                                <strong className="body-semibold text-purple-primary">{children}</strong>
                                            ),
                                            em: ({ children }) => <em className="italic">{children}</em>,
                                            code: ({ children }) => (
                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                                    {children}
                                                </code>
                                            ),
                                        }}
                                    >
                                        {(analysis_tab as { content?: string })?.content || ""}
                                    </ReactMarkdown>
                                    {(analysis_tab as { relevance?: string })?.relevance && (
                                        <p className="caption text-text-secondary italic mt-3 pt-3 border-t border-gray-100">
                                            {(analysis_tab as { relevance?: string })?.relevance}
                                        </p>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {activeTabs.action && (
                        <TabsContent value="action" className="p-0 max-h-96 overflow-y-auto">
                            {hasActionJson ? (
                                <ActionTab
                                    data={
                                        (extractedData as Record<string, unknown>)
                                            .action as unknown as import("@/types/subAgentSchemas").AdvisorResponse
                                    }
                                />
                            ) : (
                                <div className="p-4 space-y-3">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => (
                                                <p className="body-regular text-text-primary mb-3">{children}</p>
                                            ),
                                            ul: ({ children }) => (
                                                <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>
                                            ),
                                            li: ({ children }) => (
                                                <li className="body-regular text-text-primary">{children}</li>
                                            ),
                                            h1: ({ children }) => (
                                                <h1 className="heading-3 text-text-primary mb-3">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="heading-4 text-text-primary mb-2">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="body-semibold text-text-primary mb-2">{children}</h3>
                                            ),
                                            strong: ({ children }) => (
                                                <strong className="body-semibold text-purple-primary">{children}</strong>
                                            ),
                                            em: ({ children }) => <em className="italic">{children}</em>,
                                            code: ({ children }) => (
                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                                    {children}
                                                </code>
                                            ),
                                        }}
                                    >
                                        {(action_tab as { content?: string })?.content || ""}
                                    </ReactMarkdown>
                                    {(action_tab as { relevance?: string })?.relevance && (
                                        <p className="caption text-text-secondary italic mt-3 pt-3 border-t border-gray-100">
                                            {(action_tab as { relevance?: string })?.relevance}
                                        </p>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {hasSupplementary && (
                        <TabsContent value="supplementary" className="p-0 max-h-96 overflow-y-auto">
                            <SupplementaryTab
                                visualizationData={
                                    hasVisualizationJson
                                        ? ((extractedData as Record<string, unknown>)
                                            .visualization as unknown as import("@/types/subAgentSchemas").VisualizationResponse)
                                        : undefined
                                }
                                draftData={
                                    hasDraftJson
                                        ? ((extractedData as Record<string, unknown>)
                                            .draft as unknown as import("@/types/subAgentSchemas").DraftResponse)
                                        : undefined
                                }
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
}

// Simplified Bubble Component (for new format)
function LegalAnalysisBubble({ supervisorData }: { supervisorData: any }) {
    const { explanation, analysis, actions } = supervisorData;

    const explanationData = explanation as { text?: string };
    const analysisData = analysis as {
        risks?: Array<{ severity: string; title: string; description: string }>;
        key_points?: string[];
    };
    const actionsData = actions as Array<{
        title: string;
        description: string;
        priority: string;
        link_text?: string;
        link_url?: string;
    }>;

    return (
        <div className="flex justify-start mb-4 w-full">
            <div className="w-full bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
                <Tabs defaultValue="explanation" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                        <TabsTrigger
                            value="explanation"
                            className="data-[state=active]:bg-white data-[state=active]:text-purple-primary data-[state=active]:border-b-2 data-[state=active]:border-purple-primary"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            <span>Explanation</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="analysis"
                            className="data-[state=active]:bg-white data-[state=active]:text-purple-primary data-[state=active]:border-b-2 data-[state=active]:border-purple-primary"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            <span>Analysis</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="actions"
                            className="data-[state=active]:bg-white data-[state=active]:text-purple-primary data-[state=active]:border-b-2 data-[state=active]:border-purple-primary"
                        >
                            <Target className="w-4 h-4 mr-2" />
                            <span>Actions</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Explanation Tab */}
                    <TabsContent value="explanation" className="p-4 max-h-96 overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-text-primary">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {explanationData?.text || "No explanation available."}
                            </ReactMarkdown>
                        </div>
                    </TabsContent>

                    {/* Analysis Tab */}
                    <TabsContent value="analysis" className="p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                            {/* Risks */}
                            {analysisData?.risks && analysisData.risks.length > 0 && (
                                <div>
                                    <h4 className="body-semibold text-text-primary mb-3">Potential Risks</h4>
                                    <div className="space-y-3">
                                        {analysisData.risks.map((risk, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-surface-white border border-gray-200 rounded-lg p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span
                                                        className={`caption font-bold px-2 py-0.5 rounded ${risk.severity === "HIGH"
                                                            ? "bg-red-100 text-red-700"
                                                            : risk.severity === "MEDIUM"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-green-100 text-green-700"
                                                            }`}
                                                    >
                                                        {risk.severity}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="body-semibold text-text-primary">{risk.title}</p>
                                                        <p className="body-small text-text-secondary mt-1">
                                                            {risk.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key Points */}
                            {analysisData?.key_points && analysisData.key_points.length > 0 && (
                                <div>
                                    <h4 className="body-semibold text-text-primary mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Key Points
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysisData.key_points.map((point, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-purple-primary mt-1">•</span>
                                                <span className="body-regular text-text-primary">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Actions Tab */}
                    <TabsContent value="actions" className="p-0 max-h-96 overflow-y-auto">
                        <div className="p-4 space-y-3">
                            {actionsData && actionsData.length > 0 ? (
                                actionsData.map((action, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-primary transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h5 className="body-semibold text-text-primary">{action.title}</h5>
                                            <span
                                                className={`caption font-bold px-2 py-1 rounded ${action.priority === "URGENT"
                                                    ? "bg-red-100 text-red-700"
                                                    : action.priority === "IMPORTANT"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {action.priority}
                                            </span>
                                        </div>
                                        <p className="body-small text-text-secondary mb-3">
                                            {action.description}
                                        </p>
                                        {action.link_url && (
                                            <a
                                                href={action.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-purple-primary hover:text-purple-600 body-small font-medium"
                                            >
                                                <ExternalLinkIcon className="w-3 h-3" />
                                                {action.link_text || "Learn More"}
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="body-regular text-text-secondary text-center py-4">
                                    No actions available
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
