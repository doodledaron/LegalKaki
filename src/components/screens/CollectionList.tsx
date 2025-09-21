'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, MessageCircle, FileText, AlertTriangle, CheckCircle, ChevronRight, Search, Grid, List, Loader2 } from 'lucide-react'
import { collectionsApi, userApi, useApiCall } from '@/api'

interface CollectionListProps {
  onBack: () => void
  onSelectCollection: (collectionId: string) => void
  onStartNewChat: () => void
}

export function CollectionList({ onBack, onSelectCollection, onStartNewChat }: CollectionListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'completed'>('all')

  // Load collections from API with filters
  const { 
    data: collections, 
    loading: collectionsLoading, 
    error: collectionsError 
  } = useApiCall(() => collectionsApi.getCollections({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: 50
  }), [statusFilter, searchQuery])

  // Load user stats from API  
  const { 
    data: userStats, 
    loading: statsLoading, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error: statsError 
  } = useApiCall(() => userApi.getStats(), [])

  const stats = userStats ? {
    totalCollections: userStats.totalCollections,
    activeCollections: userStats.activeCollections,
    totalActions: userStats.totalActions,
    urgentActions: userStats.urgentActions
  } : {
    totalCollections: 0,
    activeCollections: 0,
    totalActions: 0,
    urgentActions: 0
  }

  // Collections are already filtered by API, no need for client-side filtering
  const filteredCollections = collections || []


  return (
    <div className="min-h-screen bg-background p-4 pb-nav">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="small"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            <Button
              variant="primary"
              onClick={onStartNewChat}
              leftIcon={<MessageCircle className="w-4 h-4" />}
            >
              Start New Chat
            </Button>
          </div>
          
          <h1 className="heading-2 mb-2">Your Legal Collections</h1>
          <p className="body-regular text-text-secondary mb-6">
            Access your saved conversations, documents, and legal progress
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-primary" />
              ) : (
                <div className="text-2xl font-bold text-purple-primary">{stats.totalCollections}</div>
              )}
              <div className="body-small text-text-secondary">Total Collections</div>
            </motion.div>
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-success" />
              ) : (
                <div className="text-2xl font-bold text-success">{stats.activeCollections}</div>
              )}
              <div className="body-small text-text-secondary">Active</div>
            </motion.div>
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-info" />
              ) : (
                <div className="text-2xl font-bold text-info">{stats.totalActions}</div>
              )}
              <div className="body-small text-text-secondary">Total Actions</div>
            </motion.div>
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-warning" />
              ) : (
                <div className="text-2xl font-bold text-warning">{stats.urgentActions}</div>
              )}
              <div className="body-small text-text-secondary">Urgent</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-primary focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Status Filter */}
              <div className="flex space-x-1">
                {['all', 'active', 'completed', 'archived'].map((filter) => (
                  <Button
                    key={filter}
                    variant={statusFilter === filter ? 'primary' : 'ghost'}
                    size="small"
                    onClick={() => setStatusFilter(filter as 'all' | 'active' | 'completed' | 'archived')}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setViewMode('grid')}
                  leftIcon={<Grid className="w-4 h-4" />}
                  className="px-2"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setViewMode('list')}
                  leftIcon={<List className="w-4 h-4" />}
                  className="px-2"
                >
                  List
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Collections Grid/List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Error State */}
          {collectionsError && (
            <Card className="text-center py-12 border-red-200 bg-red-50">
              <CardContent>
                <div className="mb-4 flex justify-center">
                  <AlertTriangle className="w-16 h-16 text-red-500" />
                </div>
                <h3 className="heading-3 mb-2 text-red-700">Error Loading Collections</h3>
                <p className="body-regular text-red-600 mb-4">
                  {collectionsError}
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="secondary"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {collectionsLoading && !collectionsError && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-primary mb-4" />
              <p className="body-regular text-text-secondary">Loading your collections...</p>
            </div>
          )}

          {/* Empty State */}
          {!collectionsLoading && !collectionsError && filteredCollections.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mb-4 flex justify-center">
                  <MessageCircle className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="heading-3 mb-2">No collections found</h3>
                <p className="body-regular text-text-secondary mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters'
                    : 'Start your first legal conversation to create a collection'
                  }
                </p>
                <Button onClick={onStartNewChat}>
                  Start New Chat
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Collections Grid/List */}
          {!collectionsLoading && !collectionsError && filteredCollections.length > 0 && (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className="card-interactive cursor-pointer"
                    onClick={() => onSelectCollection(collection.id)}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="body-regular font-semibold text-text-primary mb-2">
                            {collection.title}
                          </h3>
                          <p className="body-small text-text-secondary leading-relaxed line-clamp-2">
                            {collection.summary}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-secondary ml-2 flex-shrink-0" />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1 text-text-secondary">
                          <FileText className="w-4 h-4" />
                          <span className="body-small">{collection.documentCount} doc{collection.documentCount !== 1 ? 's' : ''}</span>
                        </div>
                        
                        {collection.urgentActionsCount > 0 ? (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span className="caption text-red-700 font-medium">Urgent</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full">
                            <CheckCircle className="w-3 h-3 text-gray-500" />
                            <span className="caption text-gray-600">No urgent items</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
