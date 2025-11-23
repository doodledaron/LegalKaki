"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { X, FileText, Check, Loader2 } from "lucide-react";

interface SummaryReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (title: string, description: string) => void;
    initialTitle: string;
    initialDescription: string;
    isGenerating: boolean;
}

export function SummaryReviewModal({
    isOpen,
    onClose,
    onConfirm,
    initialTitle,
    initialDescription,
    isGenerating
}: SummaryReviewModalProps) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);

    useEffect(() => {
        setTitle(initialTitle);
        setDescription(initialDescription);
    }, [initialTitle, initialDescription]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                Review Draft Summary
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
                                    <p className="text-gray-600">Generating summary from chat history...</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        This summary will be included in your email. You can edit it below to better match your intent.
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onConfirm(title, description)}
                                disabled={isGenerating || !title.trim()}
                                className="bg-purple-600 text-white hover:bg-purple-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Confirm & Continue
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
