"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { X, Mail, FileText, Check, AlertCircle, Loader2 } from "lucide-react";
import { Document } from "@/types";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onSendEmail: (emailData: EmailData) => Promise<void>;
  initialSelectedDocs?: string[];
  initialBody?: string;
}

export interface EmailData {
  to: string[];
  subject: string;
  body: string;
  documentIds: string[];
}

export function EmailModal({ isOpen, onClose, documents, onSendEmail, initialSelectedDocs = [], initialBody }: EmailModalProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    "Legal documents from LegalKaki"
  );
  const [emailMessage, setEmailMessage] = useState(
    "Hi,\n\nPlease find the selected legal documents attached for your reference.\n\nThese documents have been analyzed using LegalKaki's AI-powered legal assistance system.\n\nBest regards,\nLegalKaki"
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDocs(initialSelectedDocs);
      setEmailTo("");
      setEmailSubject("Legal documents from LegalKaki");
      setEmailMessage(
        initialBody || "Hi,\n\nPlease find the selected legal documents attached for your reference.\n\nThese documents have been analyzed using LegalKaki's AI-powered legal assistance system.\n\nBest regards,\nLegalKaki"
      );
      setSendResult({ type: null, message: "" });
    }
  }, [isOpen]);

  const handleToggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      setSendResult({
        type: "error",
        message: "Please enter at least one recipient email address.",
      });
      return;
    }

    if (selectedDocs.length === 0) {
      setSendResult({
        type: "error",
        message: "Please select at least one document to send.",
      });
      return;
    }

    // Parse email addresses (comma or semicolon separated)
    const emailAddresses = emailTo
      .split(/[,;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emailAddresses.length === 0) {
      setSendResult({
        type: "error",
        message: "Please enter valid email addresses.",
      });
      return;
    }

    try {
      setSendingEmail(true);
      setSendResult({ type: null, message: "" });

      await onSendEmail({
        to: emailAddresses,
        subject: emailSubject,
        body: emailMessage,
        documentIds: selectedDocs,
      });

      setSendResult({
        type: "success",
        message: `Email sent successfully to ${emailAddresses.join(", ")}`,
      });

      // Reset form after successful send
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setSendResult({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send email",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-surface-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-subtle/30 to-blue-subtle/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-primary rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="heading-4 text-text-primary">Send Documents via Gmail</h2>
                  <p className="caption text-text-secondary">
                    Share legal documents using your Gmail account
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Document Selection */}
              <div className="mb-6">
                <h3 className="body-semibold mb-3 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-primary" />
                  <span>Select Documents to Send</span>
                </h3>

                {documents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="body-small text-text-secondary">
                      No documents available in this chat
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedDocs.includes(doc.id)
                          ? "bg-purple-subtle/30 border-purple-primary/50"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                        onClick={() => handleToggleDoc(doc.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(doc.id)}
                          onChange={() => handleToggleDoc(doc.id)}
                          className="rounded border-gray-300 text-purple-primary focus:ring-purple-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="body-small font-medium text-text-primary truncate">
                            {doc.originalFilename}
                          </p>
                          <p className="caption text-text-secondary">
                            {formatFileSize(doc.fileSize)} • {doc.fileType || "PDF"}
                          </p>
                        </div>
                        {selectedDocs.includes(doc.id) && (
                          <Check className="w-4 h-4 text-purple-primary flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="caption text-text-secondary mt-2">
                  {selectedDocs.length} document(s) selected
                </p>
              </div>

              {/* Email Details */}
              <div className="space-y-4">
                <div>
                  <label className="block body-small font-medium text-text-primary mb-2">
                    Recipients *
                  </label>
                  <input
                    type="text"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="Enter email addresses (comma or semicolon separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent body-regular"
                    disabled={sendingEmail}
                  />
                  <p className="caption text-text-secondary mt-1">
                    Separate multiple emails with commas or semicolons
                  </p>
                </div>

                <div>
                  <label className="block body-small font-medium text-text-primary mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-primary focus:border-transparent body-regular"
                    disabled={sendingEmail}
                  />
                </div>

                <div>
                  <label className="block body-small font-medium text-text-primary mb-2">
                    Message *
                  </label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Email message"
                    rows={4}
                    className="w-full"
                    disabled={sendingEmail}
                  />
                </div>
              </div>

              {/* Result Message */}
              {sendResult.type && (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${sendResult.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {sendResult.type === "success" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="body-small">{sendResult.message}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50/50">
              <div className="caption text-text-secondary">
                Opens Gmail in a new tab
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || selectedDocs.length === 0 || !emailTo.trim()}
                  className="bg-purple-primary text-white hover:bg-purple-primary/90"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send via Gmail
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}