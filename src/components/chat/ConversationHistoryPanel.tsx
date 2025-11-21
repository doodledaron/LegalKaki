import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Calendar, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatSession } from '@/types';
import { Button } from '@/components/ui/Button';

import { AnalysisMessageBubble } from "@/components/chat/AnalysisMessageBubble";
import { RichMessageBubble } from "@/components/chat/RichMessageBubble";

const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface ConversationHistoryPanelProps {
    session: ChatSession | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ConversationHistoryPanel({ session, isOpen, onClose }: ConversationHistoryPanelProps) {
    if (!session) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40"
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-subtle/30 rounded-lg">
                                    <MessageCircle className="w-5 h-5 text-purple-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-text-primary line-clamp-1">
                                        {session.title || 'Untitled Conversation'}
                                    </h3>
                                    <div className="flex items-center text-xs text-text-secondary space-x-2">
                                        <span className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>•</span>
                                        <span>{session.messages.length} messages</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="small" onClick={onClose}>
                                <X className="w-5 h-5 text-text-secondary" />
                            </Button>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
                            {session.messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[90%]`}>
                                        <div className={`flex items-center space-x-2 mb-1 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                {message.sender === 'user' ? <User className="w-3 h-3 text-purple-primary" /> : <Bot className="w-3 h-3 text-gray-600" />}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {message.sender === 'user' ? 'You' : 'LegalKaki AI'} • {formatTime(message.timestamp)}
                                            </span>
                                        </div>

                                        {(message.type === 'analysis' || message.payload) && message.payload ? (
                                            // Check if it's a supervisor payload (has tabs or explanation/analysis/actions structure)
                                            (message.payload.explanation_tab || message.payload.explanation || message.payload.analysis_tab) ? (
                                                <RichMessageBubble payload={message.payload} />
                                            ) : (
                                                <AnalysisMessageBubble analysisResult={message.payload} />
                                            )
                                        ) : (
                                            <div className={`rounded-2xl px-4 py-3 ${message.sender === 'user'
                                                ? 'bg-purple-primary text-white rounded-tr-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                                }`}>
                                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ node, ...props }) => <p className={`mb-2 last:mb-0 ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`} {...props} />,
                                                            a: ({ node, ...props }) => <a className="underline decoration-dotted hover:decoration-solid" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                            code({ node, className, children, ...props }) {
                                                                const match = /language-(\w+)/.exec(className || "");
                                                                return match ? (
                                                                    <div className="rounded-md bg-gray-800 p-2 my-2 overflow-x-auto">
                                                                        <code className={className} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    </div>
                                                                ) : (
                                                                    <code className="bg-black/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer (Optional Actions) */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <Button
                                variant="secondary"
                                className="w-full justify-center"
                                onClick={onClose}
                            >
                                Close History
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
