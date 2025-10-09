/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { collectionApiClient } from '@/api/realApi'
import { collectionsApi } from '@/api/endpoints'

export function CollectionApiTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDirectApiCall = async () => {
    setLoading(true)
    addResult('Testing direct API call to backend...')
    
    try {
      const collections = await collectionApiClient.getCollections('demo_user_sub', 10, 0)
      addResult(`✅ Direct API call successful! Found ${collections.length} collections`)
      
      if (collections.length > 0) {
        const firstCollection = collections[0]
        addResult(`First collection: ${firstCollection.name} (ID: ${firstCollection.collection_id})`)
        
        // Test getting collection details
        const details = await collectionApiClient.getCollectionDetails(firstCollection.collection_id)
        addResult(`✅ Collection details fetched! Found ${details.chats.length} chats, ${details.actions.length} actions`)
      }
    } catch (error) {
      addResult(`❌ Direct API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testEndpointApiCall = async () => {
    setLoading(true)
    addResult('Testing endpoint API call...')
    
    try {
      const result = await collectionsApi.getCollections({ limit: 10 })
      if (result.success) {
        addResult(`✅ Endpoint API call successful! Found ${result.data.length} collections`)
        
        if (result.data.length > 0) {
          const firstCollection = result.data[0]
          addResult(`First collection: ${firstCollection.title} (ID: ${firstCollection.id})`)
          
          // Test getting collection dashboard
          const dashboardResult = await collectionsApi.getCollectionDashboard(firstCollection.id)
          if (dashboardResult.success) {
            addResult(`✅ Collection dashboard fetched! Stats: ${dashboardResult.data.stats.totalActions} actions, ${dashboardResult.data.stats.totalConversations} conversations, ${dashboardResult.data.stats.totalDocuments} documents`)
          }
        }
      } else {
        addResult(`❌ Endpoint API call failed: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ Endpoint API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testDocumentsApiCall = async () => {
    setLoading(true)
    addResult('Testing documents API call...')
    
    try {
      // First get a collection
      const collectionsResult = await collectionsApi.getCollections({ limit: 1 })
      if (collectionsResult.success && collectionsResult.data.length > 0) {
        const collection = collectionsResult.data[0]
        addResult(`Testing documents for collection: ${collection.title}`)
        
        // Test getting collection documents
        const documentsResult = await collectionsApi.getCollectionDocuments(collection.id)
        if (documentsResult.success) {
          addResult(`✅ Collection documents fetched! Found ${documentsResult.data.length} documents`)
          
          if (documentsResult.data.length > 0) {
            const firstDoc = documentsResult.data[0]
            addResult(`First document: ${firstDoc.originalFilename} (${firstDoc.analysisStatus})`)
          }
        } else {
          addResult(`❌ Collection documents failed: ${documentsResult.error}`)
        }
      } else {
        addResult(`❌ No collections found to test documents`)
      }
    } catch (error) {
      addResult(`❌ Documents API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Collection API Integration Test</h2>
      
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={testDirectApiCall} 
          disabled={loading}
          variant="primary"
        >
          Test Direct API Call
        </Button>
        
        <Button 
          onClick={testEndpointApiCall} 
          disabled={loading}
          variant="secondary"
        >
          Test Endpoint API Call
        </Button>
        
        <Button 
          onClick={testDocumentsApiCall} 
          disabled={loading}
          variant="secondary"
        >
          Test Documents API Call
        </Button>
        
        <Button 
          onClick={clearResults} 
          variant="ghost"
        >
          Clear Results
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Click a test button above.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
