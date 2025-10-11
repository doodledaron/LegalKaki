"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X, Bookmark, Plus, Folder } from "lucide-react";
import { Collection, LegalDomain } from "@/types";
import { collectionsApi } from "@/api";

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionId: number, title?: string) => Promise<void>;
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState(defaultTitle || "");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
      setCustomTitle(defaultTitle || "");
    }
  }, [isOpen, defaultTitle]);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const response = await collectionsApi.getCollections({
        status: "active",
        limit: 50,
      });

      if ("success" in response && response.success) {
        setCollections(response.data as Collection[]);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCollectionId) {
      alert("Please select a collection");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedCollectionId, customTitle || undefined);
      onClose();
    } catch (error) {
      console.error("Failed to save conversation:", error);
      alert("Failed to save conversation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewCollection = async () => {
    if (!newCollectionName.trim()) {
      alert("Please enter a collection name");
      return;
    }

    try {
      const response = await collectionsApi.createCollection({
        title: newCollectionName,
        domain: domain || "company_setup",
        summary: "Created from conversation",
      });

      if ("success" in response && response.success) {
        await loadCollections();
        setIsCreatingNew(false);
        setNewCollectionName("");
        // Auto-select the new collection
        const newCollection = response.data as Collection;
        setSelectedCollectionId(parseInt(newCollection.id));
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
      alert("Failed to create collection. Please try again.");
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
              <h2 className="heading-3">Save to Collection</h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation Title */}
          <div className="mb-4">
            <label className="block body-small font-medium text-text-primary mb-2">
              Conversation Title (optional)
            </label>
            <Input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Auto-generated from first message"
              className="w-full"
            />
          </div>

          {/* Create New Collection Toggle */}
          <div className="mb-4">
            {!isCreatingNew ? (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center space-x-2 text-purple-primary hover:text-purple-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="body-small font-medium">Create New Collection</span>
              </button>
            ) : (
              <div className="space-y-2">
                <label className="block body-small font-medium text-text-primary">
                  New Collection Name
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Enter collection name"
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleCreateNewCollection}
                  >
                    Create
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewCollectionName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Collections List */}
          <div className="mb-6">
            <label className="block body-small font-medium text-text-primary mb-2">
              Select Collection
            </label>
            {isLoading ? (
              <div className="text-center py-8 text-text-secondary">
                Loading collections...
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No collections yet. Create one to get started!
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollectionId(parseInt(collection.id))}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedCollectionId === parseInt(collection.id)
                        ? "border-purple-primary bg-purple-subtle/20"
                        : "border-gray-200 hover:border-purple-primary/50 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Folder
                        className={`w-5 h-5 ${
                          selectedCollectionId === parseInt(collection.id)
                            ? "text-purple-primary"
                            : "text-text-secondary"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="body-regular font-medium">
                          {collection.title}
                        </div>
                        {collection.summary && (
                          <div className="caption text-text-secondary truncate">
                            {collection.summary}
                          </div>
                        )}
                      </div>
                      <div className="caption text-text-secondary">
                        {collection.messageCount || 0} conversations
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!selectedCollectionId || isSaving}
              leftIcon={isSaving ? undefined : <Bookmark className="w-4 h-4" />}
            >
              {isSaving ? "Saving..." : "Save Conversation"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
