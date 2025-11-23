/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Bookmark,
  FileText,
  Lightbulb,
  Search,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ExternalLink as ExternalLinkIcon,
  PanelLeftOpen,
  PanelLeftClose,
  X,
  Download,
  Eye,
  ChevronDown,
  Edit,
  Mail,
  BookOpen,
  Target,
} from "lucide-react";
import { ExplanationTab, AnalysisTab, ActionTab, SupplementaryTab } from "@/components/chat/tabs";
import { AnalysisMessageBubble } from "@/components/chat/AnalysisMessageBubble";
import { SaveToCollectionModal } from "@/components/modals/SaveToCollectionModal";
import { EmailModal, EmailData } from "@/components/modals/EmailModal";
import { emailService } from "@/api/emailService";
import {
  isEducatorResponse,
  isAnalystResponse,
  isAdvisorResponse,
  isVisualizationResponse,
  isDraftResponse,
} from "@/types";
import { getUserId } from "@/lib/auth-utils";
import {
  LegalDomain,
  Message,
  FileAttachment,
  Document,
  ActionItem,
  ExternalLink,
  ChatSession,
} from "@/types";
import { RetrievedChunks } from "@/components/chat/RetrievedChunks";
import { addCollection, linkChatToCollection, updateChat, getChatById, addChat, addAction, getActions, updateDocument } from "@/lib/localStorage-utils";
import { Collection } from "@/api/types";
import type {
  AnalysisResult as ApiAnalysisResult,
  DraftResult as ApiDraftResult,
  SendMessageRequest,
  SendMessageResponse,
  ApiResponse,
  ApiError,
} from "@/api/types";
import { LEGAL_DOMAINS } from "@/constants/domains";
import { documentsApi, chatApi, collectionsApi, useApiCall, useApiMutation } from "@/api";
import { mockAnalysisResult, mockDraftResult } from "@/api/mockData";
import { getEnvConfig } from "@/lib/envConfig";
import { chatService } from "@/api/chatService";

interface ChatbotScreenProps {
  domain: LegalDomain;
  onBack: () => void;
  initialSession?: ChatSession; // For resuming from collection
  conversationId?: string; // Snapshot ID to load from DynamoDB
  collectionId?: string; // To show which collection this belongs to
  collectionName?: string;
}

// Removed unused mock data

// Memoized Draft Message Bubble Component
const DraftMessageBubble = memo(
  ({ draftResult, onDiscard, onEmail, onSave }: { draftResult: ApiDraftResult; onDiscard?: () => void; onEmail?: () => void; onSave?: () => void }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="w-[85%] bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
        <Tabs defaultValue="action" className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-100 bg-gray-50/50 rounded-none px-4">
            <TabsTrigger value="action" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Draft</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="explanation" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Explanation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="action" className="p-4 max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              <div className="border border-purple-primary/20 bg-purple-subtle/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-4 h-4 text-purple-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Draft Document
                        </span>
                        <span className="body-small font-medium text-text-primary">
                          {draftResult.documentType}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {onSave && (
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={onSave}
                            className="h-8 w-8 p-0 text-text-secondary hover:text-green-600 hover:bg-green-50"
                            title="Save to Documents"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {onEmail && (
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={onEmail}
                            className="h-8 w-8 p-0 text-text-secondary hover:text-purple-primary hover:bg-purple-subtle/20"
                            title="Email Document"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        )}
                        {onDiscard && (
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={onDiscard}
                            className="h-8 w-8 p-0 text-text-secondary hover:text-red-600 hover:bg-red-50"
                            title="Discard Draft"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                      <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono leading-relaxed">
                        {draftResult.content}
                      </pre>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <Button
                        size="small"
                        variant="secondary"
                        className="border-purple-primary text-purple-primary hover:bg-purple-subtle/20"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Refine Draft
                      </Button>
                      <Button
                        size="small"
                        className="bg-purple-primary text-white hover:bg-purple-primary/90"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div>
                <h4 className="body-regular font-medium mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-purple-primary" />
                  <span>Editing Suggestions</span>
                </h4>
                <div className="space-y-2">
                  {(draftResult.suggestions || []).map(
                    (
                      suggestion: ApiDraftResult["suggestions"][number],
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${suggestion.priority === "high"
                            ? "bg-red-500"
                            : suggestion.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                            }`}
                        />
                        <div className="flex-1">
                          <p className="body-small font-medium text-text-primary mb-1">
                            {suggestion.section}
                          </p>
                          <p className="caption text-text-secondary">
                            {suggestion.suggestion}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explanation" className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              <div className="bg-purple-subtle/30 rounded-lg p-4 border border-purple-primary/20">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-primary" />
                  <span className="body-small font-medium text-purple-primary">
                    About this Draft
                  </span>
                </div>
                <p className="body-regular text-text-primary">
                  {draftResult.disclaimer}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
          <p className="caption text-text-secondary">
            AI-generated draft • Review carefully before use
          </p>
          <p className="caption text-text-secondary">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  )
);

DraftMessageBubble.displayName = "DraftMessageBubble";

// Combined bubble: shows tabs for Analysis and Draft when both exist for a single AI message
const CombinedMessageBubble = memo(
  ({
    analysis,
    draft,
    onDiscard,
    onEmail,
    onSave,
  }: {
    analysis?: ApiAnalysisResult;
    draft?: ApiDraftResult;
    onDiscard?: () => void;
    onEmail?: () => void;
    onSave?: () => void;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4 w-full"
    >
      <div className="w-[70%] bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
        <Tabs defaultValue={analysis ? "analysis" : "draft"} className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-100 bg-gray-50/50 rounded-none px-4">
            {analysis && (
              <TabsTrigger
                value="analysis"
                className="flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Analysis</span>
              </TabsTrigger>
            )}
            {draft && (
              <TabsTrigger
                value="draft"
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Draft</span>
              </TabsTrigger>
            )}
          </TabsList>

          {analysis && (
            <TabsContent value="analysis" className="p-0">
              <AnalysisMessageBubble analysisResult={analysis} />
            </TabsContent>
          )}

          {draft && (
            <TabsContent value="draft" className="p-0">
              <TabsContent value="draft" className="p-0">
                <DraftMessageBubble draftResult={draft} onDiscard={onDiscard} onEmail={onEmail} onSave={onSave} />
              </TabsContent>
            </TabsContent>
          )}
        </Tabs>

        <div className="p-3 bg-gray-50/50 border-t border-gray-100">
          <p className="caption text-text-secondary text-center">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  )
);

CombinedMessageBubble.displayName = "CombinedMessageBubble";

// 3-Tab Legal Analysis Bubble (Simplified Format)
const LegalAnalysisBubble = memo(({ supervisorData, message }: { supervisorData: Record<string, unknown>; message?: Message }) => {
  const { explanation, analysis, actions } = supervisorData;

  const explanationData = explanation as { text?: string };
  const analysisData = analysis as { risks?: Array<{ severity: string; title: string; description: string }>; key_points?: string[] };
  const actionsData = actions as Array<{ title: string; description: string; priority: string; link_text?: string; link_url?: string }>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4 w-full"
    >
      <div className="w-[70%] bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
        <Tabs defaultValue="explanation" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <TabsTrigger value="explanation" className="data-[state=active]:bg-white data-[state=active]:text-purple-primary data-[state=active]:border-b-2 data-[state=active]:border-purple-primary">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Explanation</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-white data-[state=active]:text-purple-primary data-[state=active]:border-b-2 data-[state=active]:border-purple-primary">
              <Search className="w-4 h-4 mr-2" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-white data-[state=active]:text-purple-primary data-[state=active]:border-b-2 data-[state=active]:border-purple-primary">
              <ClipboardList className="w-4 h-4 mr-2" />
              <span>Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* Explanation Tab */}
          <TabsContent value="explanation" className="p-0 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
                <Lightbulb className="w-5 h-5 text-purple-600 mt-1" />
                <p className="body-regular text-text-primary">
                  {explanationData?.text || 'No explanation available'}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="p-0 max-h-96 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Risks */}
              {analysisData?.risks && analysisData.risks.length > 0 && (
                <div>
                  <h4 className="body-semibold text-text-primary mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Risk Assessment
                  </h4>
                  <div className="space-y-2">
                    {analysisData.risks.map((risk, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-l-4 ${risk.severity === 'HIGH' ? 'bg-red-50 border-red-500' :
                        risk.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-green-50 border-green-500'
                        }`}>
                        <div className="flex items-start gap-2">
                          <span className={`caption font-bold px-2 py-0.5 rounded ${risk.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                            risk.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                            {risk.severity}
                          </span>
                          <div className="flex-1">
                            <p className="body-semibold text-text-primary">{risk.title}</p>
                            <p className="body-small text-text-secondary mt-1">{risk.description}</p>
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
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-purple-primary transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="mt-1" />
                        <h5 className="body-semibold text-text-primary">{action.title}</h5>
                      </div>
                      <span className={`caption font-bold px-2 py-1 rounded ${action.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        action.priority === 'IMPORTANT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="body-small text-text-secondary mb-3 ml-6">{action.description}</p>
                    {action.link_url && (
                      <a
                        href={action.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-6 inline-flex items-center gap-1 text-purple-primary hover:text-purple-600 body-small font-medium"
                      >
                        <ExternalLinkIcon className="w-3 h-3" />
                        {action.link_text || 'Learn More'}
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="body-regular text-text-secondary text-center py-4">No actions available</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Show retrieved chunks if available */}
        {message?.retrievedChunks && (
          <div className="px-4 pb-4">
            <RetrievedChunks chunks={message.retrievedChunks} />
          </div>
        )}
      </div>
    </motion.div>
  );
});

LegalAnalysisBubble.displayName = "LegalAnalysisBubble";

// Legacy Supervisor Bubble Component (handles old multi-format responses)
const LegacySupervisorBubble = memo(({ supervisorData, message }: { supervisorData: Record<string, unknown>; message?: Message }) => {
  const { explanation_tab, analysis_tab, action_tab, extractedData, response_type, conversation_context,
    explanation, analysis, actions } = supervisorData;

  // Check if we have simplified structure (new format)
  const hasSimplifiedStructure = explanation || analysis || actions;

  // If simplified structure, use simplified rendering
  if (hasSimplifiedStructure && response_type === 'final') {
    return <LegalAnalysisBubble supervisorData={supervisorData} message={message} />;
  }

  // Determine which tabs are active (legacy format)
  const activeTabs = {
    explanation: (explanation_tab as { status?: string })?.status === "active",
    analysis: (analysis_tab as { status?: string })?.status === "active",
    action: (action_tab as { status?: string })?.status === "active",
  };

  const hasAnyActiveTab = Object.values(activeTabs).some(Boolean);

  // Check if we have extracted JSON data (legacy format with embedded JSON blocks)
  const hasExplanationJson = (extractedData as Record<string, unknown>)?.explanation && isEducatorResponse((extractedData as Record<string, unknown>).explanation);
  const hasAnalysisJson = (extractedData as Record<string, unknown>)?.analysis && isAnalystResponse((extractedData as Record<string, unknown>).analysis);
  const hasActionJson = (extractedData as Record<string, unknown>)?.action && isAdvisorResponse((extractedData as Record<string, unknown>).action);
  const hasVisualizationJson = (extractedData as Record<string, unknown>)?.visualization && isVisualizationResponse((extractedData as Record<string, unknown>).visualization);
  const hasDraftJson = (extractedData as Record<string, unknown>)?.draft && isDraftResponse((extractedData as Record<string, unknown>).draft);

  // Handle clarification_needed response type
  if (response_type === "clarification_needed" && conversation_context) {
    const systemMessage = (conversation_context as { system_message?: string }).system_message || "";
    const clarificationQuestions = (conversation_context as { clarification_questions?: string[] }).clarification_questions || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start mb-4 w-full"
      >
        <div className="w-[70%] bg-amber-50 border-2 border-amber-200 text-text-primary rounded-2xl rounded-bl-sm shadow-sm">
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
      </motion.div>
    );
  }

  // If no active tabs at all, render as simple message
  if (!hasAnyActiveTab) {
    // Try to get content from conversation_context.system_message (for plain text responses)
    // or fallback to tab contents
    const messageContent = (conversation_context as { system_message?: string })?.system_message ||
      (explanation_tab as { content?: string })?.content ||
      (action_tab as { content?: string })?.content ||
      (analysis_tab as { content?: string })?.content ||
      "No response available.";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start mb-4 w-full"
      >
        <div className="w-[70%] bg-surface-white border border-gray-200 text-text-primary rounded-2xl rounded-bl-sm">
          <p className="body-regular p-4 whitespace-pre-wrap">
            {messageContent}
          </p>
        </div>
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4 w-full"
    >
      <div className="w-[70%] bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-100 bg-gray-50/50 rounded-none px-4">
            {activeTabs.explanation ? (
              <TabsTrigger value="explanation" className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Explanation</span>
              </TabsTrigger>
            ) : null}
            {activeTabs.analysis ? (
              <TabsTrigger value="analysis" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Analysis</span>
              </TabsTrigger>
            ) : null}
            {activeTabs.action ? (
              <TabsTrigger value="action" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Actions</span>
              </TabsTrigger>
            ) : null}
            {hasSupplementary ? (
              <TabsTrigger value="supplementary" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Supplementary</span>
              </TabsTrigger>
            ) : null}
          </TabsList>

          {activeTabs.explanation ? (
            <TabsContent value="explanation" className="p-0 max-h-96 overflow-y-auto">
              {hasExplanationJson ? (
                <ExplanationTab data={(extractedData as Record<string, unknown>).explanation as unknown as import("@/types/subAgentSchemas").EducatorResponse} />
              ) : (
                <div className="p-4 space-y-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="body-regular text-text-primary mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>,
                      li: ({ children }) => <li className="body-regular text-text-primary">{children}</li>,
                      h1: ({ children }) => <h1 className="heading-3 text-text-primary mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="heading-4 text-text-primary mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="body-semibold text-text-primary mb-2">{children}</h3>,
                      strong: ({ children }) => <strong className="body-semibold text-purple-primary">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                    }}
                  >
                    {(explanation_tab as { content?: string })?.content}
                  </ReactMarkdown>
                  {(explanation_tab as { relevance?: string })?.relevance && (
                    <p className="caption text-text-secondary italic mt-3 pt-3 border-t border-gray-100">
                      {(explanation_tab as { relevance?: string })?.relevance}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          ) : null}

          {activeTabs.analysis ? (
            <TabsContent value="analysis" className="p-0 max-h-96 overflow-y-auto">
              {hasAnalysisJson ? (
                <AnalysisTab data={(extractedData as Record<string, unknown>).analysis as unknown as import("@/types/subAgentSchemas").AnalystResponse} />
              ) : (
                <div className="p-4 space-y-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="body-regular text-text-primary mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>,
                      li: ({ children }) => <li className="body-regular text-text-primary">{children}</li>,
                      h1: ({ children }) => <h1 className="heading-3 text-text-primary mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="heading-4 text-text-primary mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="body-semibold text-text-primary mb-2">{children}</h3>,
                      strong: ({ children }) => <strong className="body-semibold text-purple-primary">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                    }}
                  >
                    {(analysis_tab as { content?: string })?.content}
                  </ReactMarkdown>
                  {(analysis_tab as { relevance?: string })?.relevance && (
                    <p className="caption text-text-secondary italic mt-3 pt-3 border-t border-gray-100">
                      {(analysis_tab as { relevance?: string })?.relevance}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          ) : null}

          {activeTabs.action ? (
            <TabsContent value="action" className="p-0 max-h-96 overflow-y-auto">
              {hasActionJson ? (
                <ActionTab data={(extractedData as Record<string, unknown>).action as unknown as import("@/types/subAgentSchemas").AdvisorResponse} />
              ) : (
                <div className="p-4 space-y-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="body-regular text-text-primary mb-3">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-3">{children}</ol>,
                      li: ({ children }) => <li className="body-regular text-text-primary">{children}</li>,
                      h1: ({ children }) => <h1 className="heading-3 text-text-primary mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="heading-4 text-text-primary mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="body-semibold text-text-primary mb-2">{children}</h3>,
                      strong: ({ children }) => <strong className="body-semibold text-purple-primary">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                    }}
                  >
                    {(action_tab as { content?: string })?.content}
                  </ReactMarkdown>
                  {(action_tab as { relevance?: string })?.relevance && (
                    <p className="caption text-text-secondary italic mt-3 pt-3 border-t border-gray-100">
                      {(action_tab as { relevance?: string })?.relevance}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          ) : null}

          {hasSupplementary ? (
            <TabsContent value="supplementary" className="p-0 max-h-96 overflow-y-auto">
              <SupplementaryTab
                visualizationData={hasVisualizationJson ? (extractedData as Record<string, unknown>).visualization as unknown as import("@/types/subAgentSchemas").VisualizationResponse : undefined}
                draftData={hasDraftJson ? (extractedData as Record<string, unknown>).draft as unknown as import("@/types/subAgentSchemas").DraftResponse : undefined}
              />
            </TabsContent>
          ) : null}
        </Tabs>

        {/* Show retrieved chunks if available */}
        {message?.retrievedChunks && (
          <div className="px-4 pb-3">
            <RetrievedChunks chunks={message.retrievedChunks} />
          </div>
        )}

        <div className="p-3 bg-gray-50/50 border-t border-gray-100">
          <p className="caption text-text-secondary text-center">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

LegacySupervisorBubble.displayName = "LegacySupervisorBubble";

// Simple Text Message Bubble
const TextMessageBubble = memo(({ message }: { message: Message }) => (
  <motion.div
    key={message.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
      }`}
  >
    <div
      className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.sender === "user"
        ? "bg-purple-primary text-white rounded-br-sm"
        : "bg-surface-white border border-gray-200 text-text-primary rounded-bl-sm"
        }`}
    >
      {/* Show file attachments if present */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="mb-2 space-y-1">
          {message.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`flex items-center gap-2 text-xs ${message.sender === "user"
                ? "text-white/90"
                : "text-purple-700"
                }`}
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{attachment.filename}</span>
              {attachment.fileSize && (
                <span className="text-xs opacity-75">
                  ({(attachment.fileSize / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className={`body-regular ${message.sender === "user" ? "text-white" : "text-text-primary"
          }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                className={`underline ${message.sender === "user"
                  ? "text-white hover:text-white/80"
                  : "text-purple-primary hover:text-purple-700"
                  }`}
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Show retrieved chunks for assistant messages */}
      {message.sender === "assistant" && message.retrievedChunks && (
        <div className="mt-3 pt-3">
          <RetrievedChunks chunks={message.retrievedChunks} />
        </div>
      )}

      <p
        className={`caption mt-1 ${message.sender === "user" ? "text-white/80" : "text-text-secondary"
          }`}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  </motion.div>
));

TextMessageBubble.displayName = "TextMessageBubble";

export function ChatbotScreen({ domain, onBack, initialSession, conversationId, collectionId, collectionName }: ChatbotScreenProps) {
  const [showDocumentPrompt, setShowDocumentPrompt] = useState(!initialSession && !conversationId); // Hide prompt if resuming or viewing saved conversation
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    initialSession || null
  );
  const [inputValue, setInputValue] = useState("");
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] =
    useState<Document | null>(null);
  const [latestDraft, setLatestDraft] = useState<Document | null>(null);
  const [pendingSaveData, setPendingSaveData] = useState<{ collectionId?: number; title?: string } | null>(null);
  const [showDraftConfirmation, setShowDraftConfirmation] = useState(false);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [messagePayloads, setMessagePayloads] = useState<
    Record<string, {
      analysis?: ApiAnalysisResult;
      draft?: ApiDraftResult;
      supervisor?: Record<string, unknown>; // Supervisor response structure
    }>
  >({});
  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // State for temporarily storing uploaded documents (memory-based, no persistence)
  // Extended type for documents with staging metadata
  type StagedDocument = Document & {
    _staged?: boolean;
    _fileContent?: ArrayBuffer;
    _file?: File;
    _fileName?: string;
    _fileType?: string;
    _fileSize?: number;
  };
  const [sessionDocuments, setSessionDocuments] = useState<StagedDocument[]>([]);
  const [uploading, setUploading] = useState(false);

  // State for collection info (when viewing from collection)
  const [currentCollectionId, setCurrentCollectionId] = useState<string | undefined>(collectionId);
  const [currentCollectionName, setCurrentCollectionName] = useState<string | undefined>(collectionName);
  const [initialMessageCount, setInitialMessageCount] = useState<number>(0);
  const isLoadingConversation = useRef(false);

  // Fetch real documents for the current chat session
  const [chatDocuments, setChatDocuments] = useState<Document[]>([]);
  const [loadingChatDocuments, setLoadingChatDocuments] = useState(false);

  // Fetch collection name if collectionId is provided but name is missing
  useEffect(() => {
    const fetchCollectionName = async () => {
      if (!currentCollectionId || currentCollectionName) return;

      try {
        const result = await collectionsApi.getCollectionDashboard(currentCollectionId);
        if (result.success && result.data) {
          setCurrentCollectionName(result.data.collection.title);
        }
      } catch (error) {
        console.error('Failed to fetch collection name:', error);
      }
    };

    fetchCollectionName();
  }, [currentCollectionId, currentCollectionName]);

  // Load conversation snapshot if conversationId is provided
  useEffect(() => {
    const loadConversationSnapshot = async () => {
      if (!conversationId) return;

      console.log(`📥 Loading conversation snapshot: ${conversationId}`);
      isLoadingConversation.current = true;

      try {
        const result = await collectionsApi.getConversationSnapshot(conversationId, getUserId());

        if (result.success && result.data) {
          const snapshot = result.data;
          console.log(`✅ Loaded snapshot with ${snapshot.snapshot_data?.messages.length || 0} messages`);

          // Convert snapshot messages to ChatSession format
          const messages: Message[] = (snapshot.snapshot_data?.messages || []).map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender as 'user' | 'assistant',
            timestamp: new Date(msg.timestamp),
            attachments: msg.attachments,
            domain: msg.domain as LegalDomain,
            type: msg.type,
            payload: msg.payload, // Restore payload if present
          }));

          // Track initial message count BEFORE setting session to prevent auto-save trigger
          setInitialMessageCount(messages.length);

          // Recreate the session
          const session: ChatSession = {
            id: `session_${snapshot.chat_id}`,
            domain: (snapshot.domain as LegalDomain) || domain,
            title: snapshot.title,
            messages,
            createdAt: new Date(snapshot.created_at),
            updatedAt: new Date(snapshot.updated_at),
          };

          setCurrentSession(session);
          setShowDocumentPrompt(false); // Hide prompt for resumed chats

          // Restore message payloads if available
          if (snapshot.snapshot_data?.messagePayloads) {
            setMessagePayloads(snapshot.snapshot_data.messagePayloads as Record<string, {
              analysis?: ApiAnalysisResult;
              draft?: ApiDraftResult;
              supervisor?: Record<string, unknown>;
            }>);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load conversation snapshot:', error);
      } finally {
        // Mark loading as complete after a brief delay to ensure state updates have settled
        setTimeout(() => {
          isLoadingConversation.current = false;
        }, 100);
      }
    };

    loadConversationSnapshot();
  }, [conversationId, domain]);

  // Auto-save to collection after NEW messages are added (when already in a collection)
  useEffect(() => {
    // Skip auto-save if currently loading a conversation
    if (isLoadingConversation.current) {
      console.log('⏩ Skipping auto-save: conversation is loading');
      return;
    }

    // Only auto-save if:
    // 1. We're in a collection (currentCollectionId exists)
    // 2. We have a session with messages
    // 3. Message count has increased beyond the initial load
    if (!currentCollectionId || !currentSession || !currentSession.messages.length) {
      return;
    }

    // Only trigger auto-save if we have NEW messages (beyond what was initially loaded)
    const messageCount = currentSession.messages.length;
    const hasNewMessages = messageCount > initialMessageCount && initialMessageCount > 0;
    if (!hasNewMessages) {
      return;
    }

    // Auto-save with debounce to avoid too many saves
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`🔄 Auto-saving conversation to collection: ${currentCollectionName}`);
        console.log(`   Initial: ${initialMessageCount}, Current: ${messageCount}`);
        await handleSaveConversation(parseInt(currentCollectionId), currentSession?.title);
        console.log(`✅ Auto-saved ${messageCount} messages`);
        // Update initial count after successful save to prevent duplicate saves
        setInitialMessageCount(messageCount);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [currentSession?.messages?.length, currentCollectionId, currentCollectionName, initialMessageCount]);

  // Fetch chat documents ONLY for resumed/saved chats (not new chats)
  useEffect(() => {
    const fetchChatDocuments = async () => {
      if (!currentSession) return;

      // Only fetch documents if this is a saved/resumed chat (has initialSession or conversationId)
      // New chats shouldn't fetch documents from backend
      if (!initialSession && !conversationId) {
        console.log('⏩ Skipping document fetch for new chat session');
        return;
      }

      // Extract numeric chat ID from session ID
      const chatIdMatch = currentSession.id.match(/session_(\d+)/);
      const chatId = chatIdMatch ? parseInt(chatIdMatch[1]) : null;

      if (!chatId) return;

      setLoadingChatDocuments(true);
      try {
        const result = await documentsApi.getChatDocuments(getUserId(), chatId);
        if (result.success) {
          setChatDocuments(result.data);
          console.log(`📄 Loaded ${result.data.length} documents for chat ${chatId}`);
        }
      } catch (error) {
        console.error('Error fetching chat documents:', error);
      } finally {
        setLoadingChatDocuments(false);
      }
    };

    fetchChatDocuments();
  }, [currentSession, initialSession, conversationId]);

  // Combine chat documents with session-uploaded documents for display
  const availableDocuments = useMemo(() => {
    const combined = [...chatDocuments, ...sessionDocuments];
    return combined;
  }, [chatDocuments, sessionDocuments]);

  // #TODO: Replace chatApi.createSession with real backend endpoint
  // POST /api/chat/sessions - Create new chat session
  const { mutate: createSession, loading: creatingSession } = useApiMutation(
    chatApi.createSession
  );

  // Custom sendMessage function since the API takes multiple parameters
  const [sendingMessage, setSendingMessage] = useState(false);
  const sendMessage = async (
    sessionId: string,
    request: SendMessageRequest
  ): Promise<ApiResponse<SendMessageResponse> | ApiError> => {
    setSendingMessage(true);
    try {
      // #TODO: Replace chatApi.sendMessage with real backend endpoint
      // POST /api/chat/sessions/{sessionId}/messages - Send message and get AI response
      const response = await chatApi.sendMessage(
        sessionId,
        request,
        (stage, progress) => {
          try {
            console.log("[Chat] stream progress:", { stage, progress });
          } catch (_) { }
        }
      );
      return response;
    } finally {
      setSendingMessage(false);
    }
  };

  // Convert API documents to FileAttachment format for display consistency
  const uploadedFiles: FileAttachment[] = useMemo(() => {
    if (!availableDocuments) return [];

    return availableDocuments.map((doc) => ({
      id: doc.id,
      filename: doc.originalFilename,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      url: `#document-${doc.id}`, // Placeholder URL
    }));
  }, [availableDocuments]);
  // Remove separate state variables - we'll use message types instead
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.querySelector(".document-dropdown");
      const button = document.querySelector(".document-dropdown-button");

      if (
        showDocumentDropdown &&
        dropdown &&
        button &&
        !dropdown.contains(target) &&
        !button.contains(target)
      ) {
        setShowDocumentDropdown(false);
      }
    };

    if (showDocumentDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDocumentDropdown]);

  // Handle draft generation using the document generation endpoint
  const handleDraftGeneration = async (prompt: string, chatId: number, context?: string, displayMessage?: string) => {
    // Add user's message first
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: displayMessage || prompt,
      sender: "user",
      timestamp: new Date(),
      domain,
    };

    // Add "generating" message
    const generatingMessage: Message = {
      id: `gen_${Date.now() + 1}`,
      content: `📄 Generating document...`,
      sender: "assistant",
      timestamp: new Date(),
      domain,
    };

    setCurrentSession(prev => ({
      ...prev!,
      messages: [...prev!.messages, userMessage, generatingMessage],
    }));

    try {
      // Extract title from prompt if possible
      const titleMatch = prompt.match(/(?:draft|create|generate)\s+(?:a|an)?\s+(.+?)(?:\s+for|\s+with|$)/i);
      const title = titleMatch ? titleMatch[1].trim() : "Generated Document";

      console.log(`🎯 [POC] Calling draft generation: chatId=${chatId}, prompt="${prompt}"`);

      // POC: Generate draft using Gemini (shouldSave: false for manual save workflow)
      const result = await chatService.generateDraft(prompt, title, domain, context, false);

      if (result.success && result.document) {
        const doc = result.document;
        // Tag as draft for collection dashboard filtering
        doc.metadata = { ...doc.metadata, sourceType: 'draft' };
        setLatestDraft(doc);

        // Don't add to chat documents yet - wait for user to save
        // setChatDocuments(prev => [...prev, doc]);

        // Add success message
        const successMessage: Message = {
          id: `doc_${Date.now()}`,
          content: `✅ **Draft Generated!**\n\n📄 **${doc.originalFilename}**\n\nSize: ${(doc.fileSize / 1024).toFixed(1)} KB\n\nPlease review the draft below. You can **Save** it to your documents if you're satisfied, or **Discard** it to try again.`,
          sender: "assistant",
          timestamp: new Date(),
          domain,
          type: "draft"
        };

        // Create draft payload for the bubble
        const draftResult: ApiDraftResult = {
          id: `draft_${Date.now()}`,
          documentId: doc.id,
          documentType: title,
          content: doc.contentText || "",
          suggestions: [], // We could generate these later
          disclaimer: "This is an AI-generated draft. Please review carefully before use.",
        };

        // Update payloads first
        setMessagePayloads(prev => ({
          ...prev,
          [successMessage.id]: { draft: draftResult }
        }));

        // Replace generating message with success message
        setCurrentSession(prev => ({
          ...prev!,
          messages: [...prev!.messages.filter(m => m.id !== generatingMessage.id), successMessage],
        }));

        console.log(`✅ Document generated: ${doc.id} - ${doc.originalFilename}`);
      } else {
        throw new Error(result.error || 'Failed to generate document');
      }
    } catch (error) {
      console.error('❌ Error generating draft:', error);

      // Add error message
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        content: `❌ Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or rephrase your request.`,
        sender: "assistant",
        timestamp: new Date(),
        domain,
      };

      setCurrentSession(prev => ({
        ...prev!,
        messages: [...prev!.messages.filter(m => m.id !== generatingMessage.id), errorMessage],
      }));
    }
  };

  // Handle document editing
  const handleDocumentEdit = async (document: Document, changes: string, chatId: number) => {
    try {
      console.log(`📄 [POC] Editing document: ${document.id}`);

      // POC: Get document content from localStorage
      const documentText = chatService.getDocumentText(document.id) || document.contentText || '';

      if (!documentText) {
        throw new Error('Document content not found');
      }

      console.log(`✅ Document content loaded (${documentText.length} characters)`);

      // Create edit prompt with the original document content
      const editPrompt = `I have a document titled "${document.originalFilename}". Here is its current content:

--- ORIGINAL DOCUMENT ---
${documentText.substring(0, 10000)}
--- END OF ORIGINAL DOCUMENT ---

Please edit this document with the following changes:

${changes}

Generate a complete, updated version of the document incorporating all the requested changes. Maintain the original document structure and format where not affected by the changes.`;

      // Use the draft generation function with edit context
      await handleDraftGeneration(editPrompt, chatId, undefined, changes);

      // Clear edit mode
      setSelectedDocumentForEdit(null);
    } catch (error) {
      console.error("Error in document edit:", error);

      // Show error to user
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        content: `❌ Failed to edit document: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`,
        sender: "assistant",
        timestamp: new Date(),
        domain,
      };

      setCurrentSession(prev => ({
        ...prev!,
        messages: [...prev!.messages, errorMessage],
      }));

      // Clear edit mode even on error
      setSelectedDocumentForEdit(null);
    }
  };

  const handleSaveDraft = useCallback((document: Document) => {
    const success = chatService.saveDraft(document);
    if (success) {
      setLatestDraft(null); // Clear pending draft
      // Add to chat documents list
      setChatDocuments(prev => [...prev, document]);

      // Show success message
      if (currentSession) {
        const saveMessage: Message = {
          id: Date.now().toString(),
          content: `💾 **Document Saved!**\n\n"${document.originalFilename}" has been added to your documents list.`,
          sender: "assistant",
          timestamp: new Date(),
          domain,
          type: "text"
        };
        setCurrentSession({
          ...currentSession,
          messages: [...currentSession.messages, saveMessage]
        });
      }
    }
  }, [currentSession, domain]);

  const handleDiscardDraft = useCallback(() => {
    // 1. Exit draft mode
    setIsDraftMode(false);
    setSelectedDocumentForEdit(null);
    setLatestDraft(null); // Clear pending draft

    // 2. Add a system message indicating discard
    if (currentSession) {
      const discardMessage: Message = {
        id: Date.now().toString(),
        content: "🗑️ Draft discarded. Returning to Analysis Mode.",
        sender: "assistant",
        timestamp: new Date(),
        domain,
        type: "text"
      };
      setCurrentSession({
        ...currentSession,
        messages: [...currentSession.messages, discardMessage]
      });
    }
  }, [currentSession, domain]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSession) return;

    const messageContent = inputValue.trim();

    // Extract chat ID for document upload/generation
    const chatIdMatch = currentSession.id.match(/session_(\d+)/);
    const chatId = chatIdMatch ? parseInt(chatIdMatch[1]) : Date.now();

    // Check if editing a document
    if (selectedDocumentForEdit) {
      setInputValue("");
      await handleDocumentEdit(selectedDocumentForEdit, messageContent, chatId);
      return;
    }

    // Check if in Draft Mode - if so, use smart intent detection
    if (isDraftMode) {
      // Find the last draft in the session
      const messages = currentSession.messages;
      let lastDraftContent = "";

      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const payload = messagePayloads[msg.id];
        if (payload && payload.draft) {
          lastDraftContent = payload.draft.content;
          break;
        }
      }

      // Detect intent
      console.log("🤔 [Draft Mode] Detecting intent for:", messageContent);
      const intent = await chatService.detectIntent(messageContent);
      console.log("💡 [Draft Mode] Detected intent:", intent);

      if (intent === 'DRAFT') {
        if (lastDraftContent) {
          console.log("📝 [Draft Mode] Refining existing draft with context");
          setInputValue("");
          await handleDraftGeneration(messageContent, chatId, lastDraftContent);
          return;
        } else {
          console.log("📝 [Draft Mode] Generating new draft (no context)");
          setInputValue("");
          await handleDraftGeneration(messageContent, chatId);
          return;
        }
      } else {
        // It's a question - treat as normal chat but with draft context
        console.log("💬 [Draft Mode] Handling as question about draft");
        // Fall through to normal chat logic below, but we'll need to ensure context is passed
        // We can append the context to the prompt invisibly or rely on the chatService to handle it
        // For now, let's prepend the context to the prompt sent to the AI (but not shown to user)

        // If we have a draft, we should probably include it in the context
        if (lastDraftContent) {
          // We'll modify the message content passed to chatService, but keep user's display message same
          // Actually, chatService.sendMessage takes the whole message history.
          // We should probably add a system instruction or context.
          // For this POC, let's prepend the context to the message content sent to API

          // Let's continue to the normal flow, but we need to override the `documentText`
          // logic to use our draft content.

          // We need to set sessionDocuments temporarily to include this draft if it's not there?
          // Or just pass it as the third argument to sendMessage which is `documentText`.

          // Let's proceed to the normal flow logic, but we need to override the `documentText`
          // logic to use our draft content.
        }
      }
    }

    const messageType = "analysis_request";
    setInputValue("");

    // POC: Files are already uploaded, no staging needed

    // Create user message with file attachments if any
    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
      domain,
      attachments: sessionDocuments.length > 0
        ? sessionDocuments.map((doc: any) => ({
          id: doc.id,
          filename: doc.originalFilename,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          url: `#document-${doc.id}`,
        }))
        : undefined,
    };

    // Add user message to session immediately
    const newMessages = [...currentSession.messages, userMessage];
    setCurrentSession({
      ...currentSession,
      messages: newMessages,
    });

    try {
      console.log('[POC Chat] Sending message with', sessionDocuments.length, 'documents');

      // POC: Get document text from localStorage OR use draft content if in Draft Mode
      let documentText = '';

      // If in Draft Mode and we fell through here, it means it's a QUESTION about the draft
      // So we should use the draft content as the document context
      if (isDraftMode) {
        // Find the last draft again (we need it here)
        const messages = currentSession.messages;
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          const payload = messagePayloads[msg.id];
          if (payload && payload.draft) {
            documentText = payload.draft.content;
            console.log('[POC Chat] Using draft content as context:', documentText.length, 'chars');
            break;
          }
        }
      }

      // If no draft context, try uploaded documents
      if (!documentText && sessionDocuments.length > 0) {
        const docId = sessionDocuments[0].id;
        documentText = chatService.getDocumentText(docId) || '';
        console.log('[POC Chat] Document text length:', documentText.length);
      }

      // Send message via chatService
      const response = await chatService.sendMessage(
        {
          content: messageContent,
          domain: domain,
          uploadedDocuments: sessionDocuments.map((doc: any) => ({
            id: doc.id,
            originalFilename: doc.originalFilename,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
          })),
        },
        currentSession.messages,
        documentText
      );

      // Handle response from chatService
      if (response && response.aiResponse) {
        console.log("[POC Chat] Got AI response");

        // Add AI message
        const updatedMessages = [...newMessages, response.aiResponse];
        setCurrentSession({
          ...currentSession,
          messages: updatedMessages,
        });

        // Store analysis result if available
        if (response.analysisResult && response.aiResponse) {
          console.log("[POC Chat] Got analysis result");
          setMessagePayloads((prev) => ({
            ...prev,
            [response.aiResponse!.id]: {
              analysis: response.analysisResult,
            },
          }));
        }

        // Store supervisor data if available (for 3-tab display)
        if (response.supervisorData && response.aiResponse) {
          console.log("[POC Chat] Got supervisor data (3-tab response)");
          console.log("[POC Chat] Supervisor response type:", response.supervisorData.response_type);
          setMessagePayloads((prev) => ({
            ...prev,
            [response.aiResponse!.id]: {
              ...prev[response.aiResponse!.id],
              supervisor: response.supervisorData,
            },
          }));
        }
      }
    } catch (error) {
      console.error('[POC Chat] Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
        domain,
        type: 'text',
      };
      const updatedMessages = [...newMessages, errorMessage];
      setCurrentSession({
        ...currentSession,
        messages: updatedMessages,
      });
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf"
    );

    if (pdfFiles.length === 0) {
      alert("Please upload only PDF files.");
      return;
    }

    // Upload immediately using chatService
    setUploading(true);

    try {
      for (const file of pdfFiles) {
        console.log('[Chat] Uploading file:', file.name);

        const result = await chatService.uploadDocument(file, (progress) => {
          console.log(`[Chat] Upload progress: ${progress}%`);
          // Progress breakdown:
          // 10-70%: PDF extraction
          // 70-80%: Chunking text
          // 80-90%: Generating embeddings
          // 90-100%: Storing embeddings
        });

        if (result.document) {
          // Add to sessionDocuments
          setSessionDocuments((prev) => [...prev, result.document as any]);

          // Get chunk info from localStorage for feedback
          const { ragService } = await import('@/lib/ragService');
          const chunks = ragService.getDocumentChunks(result.document.id);
          const chunkCount = chunks ? chunks.length : 0;

          console.log('[Chat] Document uploaded and indexed:', {
            id: result.document.id,
            chunks: chunkCount
          });
        }
      }

      // If showing document prompt, start the chat session
      if (showDocumentPrompt) {
        handleUploadFirst();
      }

      alert('✅ PDF uploaded and indexed successfully! You can now ask questions about it.');
    } catch (error) {
      console.error("[Chat] Upload error:", error);
      alert("❌ Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSaveToCollection = async () => {
    // If already in a collection, auto-save without showing modal
    if (currentCollectionId) {
      try {
        await handleSaveConversation(parseInt(currentCollectionId), currentSession?.title);
        // Show success feedback
        console.log(`✅ Auto-saved to collection: ${currentCollectionName}`);
        // TODO: Show toast notification
      } catch (error) {
        console.error('Failed to auto-save to collection:', error);
        // TODO: Show error notification
      }
    } else {
      // Show modal to create new collection or select existing
      setShowSaveModal(true);
    }
  };

  /**
   * Extract and save action items from messagePayloads
   */
  const extractAndSaveActionItems = (
    messagePayloads: Record<string, { analysis?: ApiAnalysisResult; draft?: ApiDraftResult; supervisor?: Record<string, unknown> }>,
    chatId: string,
    collectionId: string
  ) => {
    console.log("🔍 DEBUG: extractAndSaveActionItems called");
    console.log("  messagePayloads count:", Object.keys(messagePayloads).length);
    console.log("  chatId:", chatId);
    console.log("  collectionId:", collectionId);

    const existingActions = getActions();
    let savedCount = 0;

    // Extract from all analysis results in messagePayloads
    Object.entries(messagePayloads).forEach(([messageId, payload]) => {
      console.log(`  Checking messageId: ${messageId}`);
      console.log(`    Has analysis:`, !!payload.analysis);
      console.log(`    Has supervisor:`, !!payload.supervisor);

      // Try analysis.actionItems first
      if (payload.analysis?.actionItems) {
        console.log(`    Found ${payload.analysis.actionItems.length} action items in analysis`);
        payload.analysis.actionItems.forEach((action: ActionItem) => {
          // Check if action already saved
          const exists = existingActions.find(a => a.id === action.id);
          if (!exists) {
            console.log(`      Saving action: ${action.title}`);
            addAction({
              ...action,
              sourceConversation: chatId,
              collectionId: collectionId
            });
            savedCount++;
          } else {
            console.log(`      Action already exists: ${action.title}`);
          }
        });
      }

      // Also try supervisor.actions (Gemini's new format)
      if (payload.supervisor && 'actions' in payload.supervisor) {
        const supervisorActions = (payload.supervisor as { actions?: any[] }).actions;
        if (supervisorActions && Array.isArray(supervisorActions)) {
          console.log(`    Found ${supervisorActions.length} action items in supervisor`);
          supervisorActions.forEach((action: any) => {
            const exists = existingActions.find(a => a.id === action.id);
            if (!exists) {
              console.log(`      Saving action from supervisor: ${action.title}`);

              // Parse dueDate if present (convert ISO string to Date)
              const actionItem: ActionItem = {
                ...action,
                dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
                sourceConversation: chatId,
                collectionId: collectionId
              };

              addAction(actionItem);
              savedCount++;
            } else {
              console.log(`      Action already exists: ${action.title}`);
            }
          });
        }
      }
    });

    if (savedCount > 0) {
      console.log(`✅ Extracted and saved ${savedCount} action items from conversation`);
    } else {
      console.log(`⚠️ No action items found to save`);
    }

    return savedCount;
  };

  const handleConfirmDraftSave = async () => {
    let extraDocs: Document[] = [];
    if (latestDraft) {
      handleSaveDraft(latestDraft);
      extraDocs = [latestDraft];
    }
    setShowDraftConfirmation(false);
    if (pendingSaveData) {
      await processSaveConversation(pendingSaveData.collectionId, pendingSaveData.title, extraDocs);
      setPendingSaveData(null);
    }
  };

  const handleDiscardDraftSave = async () => {
    // Just discard the draft (don't save it)
    setLatestDraft(null);
    setShowDraftConfirmation(false);
    if (pendingSaveData) {
      await processSaveConversation(pendingSaveData.collectionId, pendingSaveData.title);
      setPendingSaveData(null);
    }
  };

  const handleSaveConversation = async (collectionId: number | undefined, title?: string) => {
    // Check for pending draft
    if (latestDraft) {
      setPendingSaveData({ collectionId, title });
      setShowDraftConfirmation(true);
      return;
    }

    await processSaveConversation(collectionId, title);
  };

  const processSaveConversation = async (collectionId: number | undefined, title?: string, extraDocuments: Document[] = []) => {

    if (!currentSession) {
      console.error("No active session to save");
      return;
    }

    console.log("🔍 DEBUG: Starting handleSaveConversation");
    console.log("  Session ID:", currentSession.id);
    console.log("  Messages count:", currentSession.messages.length);
    console.log("  chatDocuments count:", chatDocuments.length);
    console.log("  sessionDocuments count:", sessionDocuments.length);
    console.log("  messagePayloads keys:", Object.keys(messagePayloads));
    console.log("  messagePayloads:", JSON.stringify(messagePayloads, null, 2));

    try {
      let finalCollectionId: string;
      let actionItemsCount = 0;

      // Create new collection or use existing
      if (!collectionId) {
        // Generate title from first user message if not provided
        const firstUserMessage = currentSession.messages.find(m => m.sender === 'user');
        const collectionTitle = title || firstUserMessage?.content.substring(0, 50) || 'Untitled Collection';

        const newCollection: Collection = {
          id: `collection_${Date.now()}`,
          title: collectionTitle,
          domain: domain || 'general',
          summary: `Collection created from ${domain} conversation`,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          itemCount: currentSession.messages.length,
          messageCount: currentSession.messages.length,
          documentCount: chatDocuments.length,
          actionItemsCount: 0, // Will update after extracting actions
          urgentActionsCount: 0,
          tags: [domain || 'general']
        };

        addCollection(newCollection);
        finalCollectionId = newCollection.id;
        console.log(`✅ Created new collection: ${collectionTitle}`);
      } else {
        finalCollectionId = collectionId.toString();
      }

      // Step 1: Save the complete chat session with all messages
      // Merge messagePayloads into messages before saving
      const messagesWithPayloads = currentSession.messages.map(msg => {
        if (messagePayloads[msg.id]) {
          return {
            ...msg,
            payload: messagePayloads[msg.id].analysis || messagePayloads[msg.id].draft || messagePayloads[msg.id].supervisor
          };
        }
        return msg;
      });

      const chatToSave: ChatSession = {
        id: currentSession.id,
        domain: currentSession.domain,
        title: currentSession.title || title,
        messages: messagesWithPayloads, // Save messages with payloads
        createdAt: currentSession.createdAt,
        updatedAt: new Date(),
        collectionId: finalCollectionId
      };

      // Check if chat already exists in localStorage
      const existingChat = getChatById(currentSession.id);
      if (existingChat) {
        // Update existing chat
        updateChat(currentSession.id, chatToSave);
        console.log(`✅ Updated existing chat with ${currentSession.messages.length} messages`);
      } else {
        // Add new chat
        addChat(chatToSave);
        console.log(`✅ Saved new chat session with ${currentSession.messages.length} messages`);
      }

      // Step 2: Extract and save action items from messagePayloads
      actionItemsCount = extractAndSaveActionItems(messagePayloads, currentSession.id, finalCollectionId);

      // Step 3: Link documents to collection
      // Combine both chatDocuments (persistent), sessionDocuments (temporary uploads), and any extra documents (like just-saved drafts)
      const allSessionDocs = [...chatDocuments, ...sessionDocuments, ...extraDocuments];
      console.log("🔍 DEBUG: Linking documents");
      console.log("  chatDocuments count:", chatDocuments.length);
      console.log("  sessionDocuments count:", sessionDocuments.length);
      console.log("  Total docs to link:", allSessionDocs.length);
      console.log("  Document IDs to link:", allSessionDocs.map(d => d.id));

      // Update all documents (both persistent and newly uploaded) to have this collectionId
      allSessionDocs.forEach(doc => {
        console.log(`  Updating document ${doc.id} (${doc.originalFilename}) with collectionId ${finalCollectionId}`);
        updateDocument(doc.id, { collectionId: finalCollectionId });
      });

      // Step 4: Link chat to collection (updates chat.collectionId)
      linkChatToCollection(currentSession.id, finalCollectionId);

      console.log("✅ Conversation saved to collection successfully");
      console.log(`   - Messages: ${currentSession.messages.length}`);
      console.log(`   - Documents: ${chatDocuments.length}`);
      console.log(`   - Action Items: ${actionItemsCount}`);

      // Update local state
      setCurrentCollectionId(finalCollectionId);
      if (!collectionId && title) {
        setCurrentCollectionName(title);
      }
    } catch (error) {
      console.error("Failed to save conversation:", error);
      throw error;
    }
  };



  const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (emailData: EmailData) => {
    try {
      // Try to use the real email service first
      await emailService.sendEmail(emailData);
    } catch (error) {
      // Fallback to demo mode if email service is not available
      console.log('Email service not available, using demo mode:', error);
      await emailService.sendEmailDemo(emailData);
    }
  };

  const handleStartChat = async () => {
    try {
      const response = await createSession({ domain });

      if (response) {
        setCurrentSession(response);
        setShowDocumentPrompt(false);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSkipUpload = () => {
    handleStartChat();
  };

  const handleUploadFirst = async () => {
    try {
      const response = await createSession({
        domain,
      });

      if (response) {
        setCurrentSession(response);
        setShowDocumentPrompt(false);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Document Upload Prompt Component - using useCallback to prevent re-creation
  const DocumentUploadPrompt = useCallback(
    () => (
      <div
        className={`h-full flex items-center justify-center p-6 transition-all duration-300 ${isDragOver ? "bg-purple-subtle/30" : "bg-background"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <motion.div
          className="max-w-lg mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Drag & Drop Zone */}
          <motion.div
            className={`relative border-2 border-dashed rounded-2xl p-12 mb-6 transition-all duration-300 ${isDragOver
              ? "border-purple-primary bg-purple-subtle/20 scale-105"
              : "border-gray-300 hover:border-purple-primary/50 hover:bg-purple-subtle/10"
              }`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Upload Icon */}
            <motion.div
              className="w-16 h-16 mx-auto mb-4 bg-purple-subtle rounded-xl flex items-center justify-center"
              animate={isDragOver ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FileText
                className={`w-8 h-8 transition-colors duration-300 ${isDragOver ? "text-purple-primary" : "text-purple-primary"
                  }`}
              />
            </motion.div>

            {/* Main Text */}
            <motion.h2
              className="heading-3 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {isDragOver
                ? "Drop your documents here"
                : "Drag & drop your legal documents"}
            </motion.h2>

            <motion.p
              className="body-regular text-text-secondary mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Upload contracts, agreements, or any legal documents for more
              accurate AI assistance
            </motion.p>

            {/* File Input Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="text-purple-primary border-purple-primary/30 hover:bg-purple-subtle/20"
              >
                Or browse files
              </Button>
            </motion.div>

            {/* Drag overlay */}
            {isDragOver && (
              <motion.div
                className="absolute inset-0 bg-purple-primary/5 rounded-2xl flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-purple-primary font-medium">
                  Release to upload
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            className="bg-purple-subtle/30 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center space-x-2 text-purple-primary">
              <Lightbulb className="w-4 h-4" />
              <span className="body-small font-medium">
                AI provides better advice when it understands your specific
                documents
              </span>
            </div>
          </motion.div>

          {/* Skip Option */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <button
              onClick={handleSkipUpload}
              className="text-text-secondary hover:text-purple-primary transition-colors duration-200 body-small underline underline-offset-4"
            >
              Skip and start chatting instead
            </button>
          </motion.div>
        </motion.div>
      </div>
    ),
    [
      isDragOver,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleSkipUpload,
      handleFileUpload,
    ]
  );

  // Side Panel Component - using useCallback to prevent re-creation
  const SidePanel = useCallback(
    () => (
      <AnimatePresence>
        {isSidePanelOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 bottom-0 w-[30%] min-w-[280px] bg-surface-white border-r border-gray-200 shadow-xl z-30 flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-primary" />
                <h3 className="body-regular font-medium text-text-primary">
                  Uploaded Files
                </h3>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setIsSidePanelOpen(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="body-small text-text-secondary">
                    No files uploaded yet
                  </p>
                  <p className="caption text-text-secondary mt-1">
                    Upload PDF files to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-primary/30 hover:bg-purple-subtle/10 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <FileText className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="body-small font-medium text-text-primary truncate group-hover:text-purple-primary transition-colors">
                            {file.filename}
                          </h4>
                          <p className="caption text-text-secondary mt-1">
                            {formatFileSize(file.fileSize)}
                          </p>
                          <p className="caption text-text-secondary">
                            {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="small"
                          leftIcon={<Eye className="w-3 h-3" />}
                          className="text-xs"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          leftIcon={<Download className="w-3 h-3" />}
                          className="text-xs"
                        >
                          Download
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/30">
              <p className="caption text-text-secondary text-center">
                {uploadedFiles.length} file
                {uploadedFiles.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    ),
    [isSidePanelOpen, uploadedFiles, formatFileSize]
  );

  return (
    <div
      className={`h-screen flex flex-col relative transition-colors duration-700 ${isDragOver
        ? "bg-purple-subtle/20"
        : isDraftMode
          ? "bg-gradient-to-br from-purple-subtle/20 via-purple-light/10 to-background"
          : "bg-gradient-to-br from-blue-50/30 via-gray-50/20 to-background"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Mode-specific background overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ${isDraftMode
          ? "opacity-100 bg-gradient-to-br from-purple-primary/8 via-purple-light/4 to-purple-subtle/6"
          : "opacity-100 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-gray-50/30"
          }`}
      />

      {/* Main Content */}
      <div className="relative z-10 h-full flex bg-transparent">
        {/* Chat Area */}
        <motion.div
          className="flex-1 flex flex-col"
          animate={{
            marginLeft: isSidePanelOpen ? "30%" : "0%",
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Drag & Drop Overlay */}
          {isDragOver && (
            <div className="fixed inset-0 z-50 bg-purple-primary/10 backdrop-blur-sm flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-surface-white rounded-2xl p-8 shadow-xl border-2 border-dashed border-purple-primary"
              >
                <div className="text-center">
                  <Paperclip className="w-12 h-12 text-purple-primary mx-auto mb-4" />
                  <h3 className="heading-3 text-purple-primary mb-2">
                    Drop PDF File Here
                  </h3>
                  <p className="body-small text-text-secondary">
                    Release to upload and analyze your document
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Header */}
          <div className="bg-surface-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={onBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                <div className="bg-purple-subtle text-purple-primary px-3 py-1 rounded-full">
                  <span className="body-small font-medium">
                    {LEGAL_DOMAINS[domain]?.title || "General"}
                  </span>
                </div>

                {/* Collection Badge */}
                {collectionId && collectionName && (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center space-x-2">
                    <Bookmark className="w-3 h-3" />
                    <span className="body-small font-medium">
                      {collectionName}
                    </span>
                  </div>
                )}
              </div>

              {/* Document Edit Mode Dropdown */}
              <div className="relative">
                <Button
                  variant={selectedDocumentForEdit ? "primary" : "secondary"}
                  size="small"
                  leftIcon={
                    selectedDocumentForEdit ? (
                      <Edit className="w-3 h-3" />
                    ) : (
                      <Search className="w-3 h-3" />
                    )
                  }
                  rightIcon={<ChevronDown className="w-3 h-3" />}
                  onClick={() => setShowDocumentDropdown(!showDocumentDropdown)}
                  className={`document-dropdown-button transition-all duration-300 ${selectedDocumentForEdit
                    ? "shadow-lg shadow-purple-primary/20 ring-2 ring-purple-primary/20"
                    : "hover:shadow-md"
                    }`}
                >
                  {selectedDocumentForEdit
                    ? `Editing: ${selectedDocumentForEdit.originalFilename}`
                    : isDraftMode
                      ? "Draft Mode"
                      : "Analysis Mode"}
                </Button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDocumentDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="document-dropdown absolute top-full left-0 mt-2 w-80 bg-surface-white border border-gray-200 rounded-lg shadow-xl z-50"
                    >
                      <div className="p-2">
                        {/* Analysis Mode Option */}
                        <button
                          onClick={() => {
                            setSelectedDocumentForEdit(null);
                            setIsDraftMode(false);
                            setShowDocumentDropdown(false);

                            if (currentSession) {
                              const modeMessage: Message = {
                                id: Date.now().toString(),
                                content:
                                  "🔄 Switched to Analysis Mode - I'm ready to provide legal analysis and guidance!",
                                sender: "assistant",
                                timestamp: new Date(),
                                domain,
                              };
                              setCurrentSession({
                                ...currentSession,
                                messages: [
                                  ...currentSession.messages,
                                  modeMessage,
                                ],
                              });
                            }
                          }}
                          className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${!selectedDocumentForEdit
                            ? "bg-purple-subtle text-purple-primary"
                            : "text-text-primary"
                            }`}
                        >
                          <Search className="w-4 h-4" />
                          <div className="text-left">
                            <div className="font-medium">Analysis Mode</div>
                            <div className="text-sm opacity-70">
                              Get legal advice and document analysis
                            </div>
                          </div>
                        </button>

                        {/* Documents List */}
                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <div className="px-3 py-2">
                            <div className="text-sm font-medium text-text-secondary">
                              Draft Agent:
                            </div>
                          </div>

                          {loadingChatDocuments ? (
                            <div className="px-3 py-4 text-center text-text-secondary">
                              <div className="animate-spin w-4 h-4 border-2 border-purple-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                              Loading documents...
                            </div>
                          ) : availableDocuments &&
                            availableDocuments.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                              {availableDocuments.map((document) => (
                                <button
                                  key={document.id}
                                  onClick={() => {
                                    setSelectedDocumentForEdit(document);
                                    setIsDraftMode(true);
                                    setShowDocumentDropdown(false);

                                    if (currentSession) {
                                      const modeMessage: Message = {
                                        id: Date.now().toString(),
                                        content: `🔄 Switched to Edit Mode for "${document.originalFilename}" - I'm ready to help you edit this document!`,
                                        sender: "assistant",
                                        timestamp: new Date(),
                                        domain,
                                      };
                                      setCurrentSession({
                                        ...currentSession,
                                        messages: [
                                          ...currentSession.messages,
                                          modeMessage,
                                        ],
                                      });
                                    }
                                  }}
                                  className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${selectedDocumentForEdit?.id === document.id
                                    ? "bg-purple-subtle text-purple-primary"
                                    : "text-text-primary"
                                    }`}
                                >
                                  <FileText className="w-4 h-4" />
                                  <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {document.originalFilename}
                                    </div>
                                    <div className="text-sm opacity-70">
                                      {Math.round(document.fileSize / 1024)}KB •{" "}
                                      {document.analysisStatus}
                                    </div>
                                  </div>
                                  {selectedDocumentForEdit?.id ===
                                    document.id && (
                                      <div className="w-2 h-2 bg-purple-primary rounded-full"></div>
                                    )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-4 text-center text-text-secondary">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <div className="text-sm">
                                No documents available
                              </div>
                              <div className="text-xs opacity-70">
                                Upload documents to edit them
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                variant="ghost"
                size="small"
                leftIcon={
                  isSidePanelOpen ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4" />
                  )
                }
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className="transition-all duration-200"
              >
                {isSidePanelOpen ? "Hide Files" : "Show Files"}
              </Button>
            </div>
          </div>

          {/* Draft Mode Banner */}
          <AnimatePresence>
            {isDraftMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gradient-to-r from-purple-primary to-purple-light text-white px-4 py-2 text-center shadow-lg border-b border-purple-primary/20"
              >
                <span className="body-small font-medium flex items-center justify-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>
                    Draft Mode Active - Focus on document drafting and editing
                  </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Container or Document Upload Prompt */}
          <AnimatePresence mode="wait">
            {showDocumentPrompt ? (
              <motion.div
                key="document-prompt"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <DocumentUploadPrompt />
              </motion.div>
            ) : (
              <motion.div
                key="chat-messages"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex-1 overflow-y-auto p-4 space-y-4 pb-4"
              >
                <AnimatePresence>
                  {currentSession?.messages.map((message: Message) => {
                    const analysis = messagePayloads[message.id]?.analysis;
                    const draft = messagePayloads[message.id]?.draft;
                    const supervisor = messagePayloads[message.id]?.supervisor;

                    // Handle legal analysis response (3-tab format)
                    if (supervisor && message.sender === "assistant") {
                      return (
                        <LegacySupervisorBubble
                          key={message.id}
                          supervisorData={supervisor}
                          message={message}
                        />
                      );
                    }

                    if (analysis && draft) {
                      return (
                        <CombinedMessageBubble
                          key={message.id}
                          analysis={analysis}
                          draft={draft}
                          onDiscard={handleDiscardDraft}
                          onEmail={handleOpenEmailModal}
                          onSave={draft.documentId ? () => {
                            // Reconstruct document object for saving
                            const docToSave: Document = {
                              id: draft.documentId || `doc_draft_${Date.now()}`,
                              originalFilename: `${draft.documentType.replace(/\s+/g, '_')}.txt`,
                              storedFilename: `${draft.documentType.replace(/\s+/g, '_')}.txt`,
                              fileType: 'text/plain',
                              fileSize: new Blob([draft.content], { type: 'text/plain' }).size,
                              uploadDate: new Date(),
                              analysisStatus: 'completed',
                              s3Key: `drafts/${draft.documentId}`,
                              s3Bucket: 'local-storage',
                              contentText: draft.content,
                            };
                            handleSaveDraft(docToSave);
                          } : undefined}
                        />
                      );
                    }
                    if (message.type === "analysis" && analysis) {
                      return (
                        <AnalysisMessageBubble
                          key={message.id}
                          analysisResult={analysis}
                        />
                      );
                    }
                    if (message.type === "draft" && draft) {
                      return (
                        <DraftMessageBubble
                          key={message.id}
                          draftResult={draft}
                          onDiscard={handleDiscardDraft}
                          onEmail={handleOpenEmailModal}
                          onSave={draft.documentId ? () => {
                            // Reconstruct document object for saving
                            const docToSave: Document = {
                              id: draft.documentId || `doc_draft_${Date.now()}`,
                              originalFilename: `${draft.documentType.replace(/\s+/g, '_')}.txt`,
                              storedFilename: `${draft.documentType.replace(/\s+/g, '_')}.txt`,
                              fileType: 'text/plain',
                              fileSize: new Blob([draft.content], { type: 'text/plain' }).size,
                              uploadDate: new Date(),
                              analysisStatus: 'completed',
                              s3Key: `drafts/${draft.documentId}`,
                              s3Bucket: 'local-storage',
                              contentText: draft.content,
                            };
                            handleSaveDraft(docToSave);
                          } : undefined}
                        />
                      );
                    }
                    // Default: simple text message
                    return (
                      <TextMessageBubble key={message.id} message={message} />
                    );
                  })}
                </AnimatePresence>

                {(sendingMessage || creatingSession || uploading) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-surface-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%]">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <motion.div
                            className="w-2 h-2 bg-text-secondary rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0,
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-text-secondary rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-text-secondary rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                          />
                        </div>
                        <span className="body-small text-text-secondary">
                          {uploading
                            ? "Uploading document..."
                            : sendingMessage
                              ? "Processing message..."
                              : creatingSession
                                ? "Starting chat..."
                                : "Loading..."}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Section - Only show when session exists */}
          {currentSession && (
            <div className="bg-surface-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleSaveToCollection}
                  leftIcon={<Bookmark className="w-4 h-4" />}
                >
                  {currentCollectionId && currentCollectionName
                    ? `In: ${currentCollectionName}`
                    : 'Save to Collection'}
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleOpenEmailModal}
                  leftIcon={<Mail className="w-4 h-4" />}
                >
                  Email
                </Button>

                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => chatFileInputRef.current?.click()}
                  leftIcon={<Paperclip className="w-4 h-4" />}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload PDF"}
                </Button>
              </div>

              <div className="relative">
                {/* Show staged files indicator */}
                {sessionDocuments.filter((doc: StagedDocument) => doc._staged).length > 0 && (
                  <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-purple-900">
                        {sessionDocuments.filter((doc: StagedDocument) => doc._staged).length} file(s) ready to send:
                      </span>
                      {sessionDocuments.filter((doc: StagedDocument) => doc._staged).map((doc: StagedDocument) => (
                        <span key={doc.id} className="flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          <span>{doc.originalFilename}</span>
                          <button
                            onClick={() => {
                              // Remove the staged file
                              setSessionDocuments(prev => prev.filter(d => d.id !== doc.id));
                            }}
                            className="hover:bg-purple-200 rounded p-0.5 transition-colors"
                            title="Remove file"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isDraftMode
                      ? "Describe the legal document you need or ask for editing help..."
                      : sessionDocuments.filter((doc: StagedDocument) => doc._staged).length > 0
                        ? "Add your question about the file(s)..."
                        : "Ask your legal question or drag & drop a PDF..."
                  }
                  className="pr-12 min-h-[44px] max-h-[120px] resize-none bg-gray-50 focus:bg-surface-white border-purple-primary/20 focus:border-purple-primary"
                  rows={1}
                />

                <Button
                  size="small"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || sendingMessage}
                  className="absolute right-2 bottom-2 rounded-full w-8 h-8 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <p className="caption text-text-secondary mt-2 text-center">
                {isDraftMode
                  ? "📝 Draft Mode: Create new documents or edit existing ones with AI assistance"
                  : "💡 Drag & drop PDF files anywhere or ask questions for instant legal analysis"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Side Panel */}
        <SidePanel />
        {/* Email Modal */}
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          documents={availableDocuments || []}
          onSendEmail={handleSendEmail}
        />

        {/* Save to Collection Modal */}
        <SaveToCollectionModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveConversation}
          domain={domain}
          defaultTitle={currentSession?.title || ""}
          userSub={getUserId()}
        />

        <DraftConfirmationModal
          isOpen={showDraftConfirmation}
          onClose={() => setShowDraftConfirmation(false)}
          onConfirm={handleConfirmDraftSave}
          onDiscard={handleDiscardDraftSave}
          draftName={latestDraft?.originalFilename || "Draft Document"}
        />
      </div>
    </div>
  );
}

interface DraftConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
  draftName: string;
}

function DraftConfirmationModal({ isOpen, onClose, onConfirm, onDiscard, draftName }: DraftConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Save Draft?</h3>
        <p className="text-gray-600 mb-6">
          You have a generated draft "{draftName}". Are you satisfied with it and want to save it to the collection?
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onDiscard}>
            Discard Draft
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Yes, Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
