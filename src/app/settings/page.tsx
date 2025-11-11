"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { FileText, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { getDocuments, deleteDocument } from "@/lib/localStorage-utils";
import { deleteFileBlob } from "@/lib/indexedDB-utils";
import { Document } from "@/types";

export default function SettingsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const docs = getDocuments();
    setDocuments(docs);
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.originalFilename}"? This cannot be undone.`)) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(doc.id));

    try {
      // Delete from IndexedDB
      await deleteFileBlob(doc.id);
      console.log(`✅ Deleted file blob for ${doc.id}`);

      // Delete from localStorage
      deleteDocument(doc.id);
      console.log(`✅ Deleted document metadata for ${doc.id}`);

      // Reload documents
      loadDocuments();

      setSuccessMessage(`Deleted "${doc.originalFilename}" successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("❌ Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-nav">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="heading-2 mb-2">Settings</h1>
          <p className="body-regular text-text-secondary">
            Manage your uploaded documents and clear storage space
          </p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{successMessage}</span>
          </motion.div>
        )}

        {/* Storage Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {documents.length} Documents Uploaded
                  </h3>
                  <p className="text-sm text-blue-700">
                    Delete documents to free up storage space
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="heading-3 mb-4">Uploaded Documents</h2>

          {documents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="heading-3 mb-2 text-gray-600">
                  No documents uploaded yet
                </h3>
                <p className="body-regular text-text-secondary">
                  Upload documents in the chat to see them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                            <FileText className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-text-primary truncate">
                              {doc.originalFilename}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(doc.uploadDate)}</span>
                            </div>
                            {doc.contentSummary && (
                              <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                                {doc.contentSummary}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => handleDelete(doc)}
                          disabled={deletingIds.has(doc.id)}
                          leftIcon={
                            deletingIds.has(doc.id) ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )
                          }
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 ml-4 flex-shrink-0"
                        >
                          {deletingIds.has(doc.id) ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Warning */}
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">
                      Warning
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Deleting a document will remove it from all collections
                      and chats. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
