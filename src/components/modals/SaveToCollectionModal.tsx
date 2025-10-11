"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Bookmark } from "lucide-react";
import { LegalDomain } from "@/types";

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionId: number | undefined, title?: string) => Promise<void>;
  domain?: LegalDomain;
  defaultTitle?: string;
  userSub: string;
}

export function SaveToCollectionModal({
  isOpen,
  onClose,
  onSave,
  domain,
  defaultTitle,
  userSub,
}: SaveToCollectionModalProps) {
  const [customTitle, setCustomTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Filter out "undefined" string and other falsy values
      const cleanTitle = defaultTitle && defaultTitle !== "undefined" && !defaultTitle.includes("undefined")
        ? defaultTitle
        : "";
      setCustomTitle(cleanTitle);
    }
  }, [isOpen, defaultTitle]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Pass undefined for collectionId to create new collection
      await onSave(undefined, customTitle || undefined);
      onClose();
    } catch (error) {
      console.error("Failed to save conversation:", error);
      alert("Failed to save conversation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg bg-surface-white rounded-2xl shadow-2xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-subtle rounded-xl flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-purple-primary" />
              </div>
              <h2 className="heading-3">Save Conversation</h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info message */}
          <div className="mb-6 p-4 bg-purple-subtle/20 rounded-lg border border-purple-primary/20">
            <p className="body-small text-text-secondary">
              A new collection will be created for this conversation, including all documents and messages.
            </p>
          </div>

          {/* Conversation Title */}
          <div className="mb-6">
            <label className="block body-small font-medium text-text-primary mb-2">
              Collection Title (optional)
            </label>
            <Input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Auto-generated from first message"
              className="w-full"
              autoFocus
            />
            <p className="caption text-text-secondary mt-1">
              Leave blank to auto-generate from your first message
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              leftIcon={isSaving ? undefined : <Bookmark className="w-4 h-4" />}
            >
              {isSaving ? "Saving..." : "Save to New Collection"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
