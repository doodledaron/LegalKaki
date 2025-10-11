/* eslint-disable @typescript-eslint/no-unused-vars */
import { mockClient } from "./mockClient";
import {
  bedrockService,
  TextAnalysisRequest,
  MindMapAnalysisRequest,
} from "./bedrockService";
import { realApiClient, collectionApiClient } from "./realApi";
import {
  mockUser,
  mockDomains,
  mockCollections,
  mockActionItems,
  mockDocuments,
  mockChatSessions,
  mockUserStats,
  mockActivityItems,
  mockAnalysisResult,
  mockDraftResult,
} from "./mockData";
import { getBackendUrl, getEnvConfig } from "@/lib/envConfig";

// Backend URL from environment configuration
const BACKEND_BASE_URL = getBackendUrl();

export interface BackendExplainRequest {
  sentence: string;
}

export interface BackendExplainResponse {
  explanation: string;
  sentence_provided: string;
}

import {
  ApiResponse,
  ApiError,
  User,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  ConfirmSignupRequest,
  ConfirmSignupResponse,
  ResendCodeRequest,
  ResendCodeResponse,
  DomainInfo,
  Collection,
  CreateCollectionRequest,
  ChatSessionResponse,
  CreateChatSessionRequest,
  SendMessageRequest,
  SendMessageResponse,
  AnalysisResult,
  DraftResult,
  UploadDocumentRequest,
  UploadDocumentResponse,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  UserStats,
  ActivityItem,
  SearchRequest,
  SearchResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  CollectionDashboardData,
  mapBackendCollectionToCollection,
  mapBackendChatToChatSession,
  mapBackendActionToActionItem,
  mapBackendDocumentToDocument,
  mapBackendCollectionDocumentToDocument,
  SaveConversationRequest,
  ConversationSnapshot,
  ConversationListItem,
} from "./types";
import { LegalDomain, Message, Document, ActionItem, ChatSession } from "@/types";

// Helper: map app-level ChatSession (no status) -> API ChatSessionResponse (requires status)
const toChatSessionResponse = (s: ChatSession): ChatSessionResponse => ({
  id: s.id,
  domain: s.domain,
  title: s.title,
  messages: s.messages,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
  status: "active",
});

// Authentication Endpoints
export const authApi = {
  async signUp(
    request: SignUpRequest
  ): Promise<ApiResponse<SignUpResponse> | ApiError> {
    try {
      // Use real API for signup
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: request.full_name,
          email: request.email,
          password: request.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        message: "Account created successfully. Please check your email for verification code.",
      };
    } catch (error) {
      console.error("Real API signup failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(
        async () => {
          // Simulate signup logic
          return {
            message: "Account created successfully. Please check your email for verification code.",
            user_id: `user_${Date.now()}`,
          };
        },
        "medium",
        {
          successMessage: "Account created successfully",
        }
      );
    }
  },

  async confirmSignup(
    request: ConfirmSignupRequest
  ): Promise<ApiResponse<ConfirmSignupResponse> | ApiError> {
    try {
      // Use real API for confirmation
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/confirm-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: request.username,
          confirmation_code: request.confirmation_code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Confirmation failed');
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        message: "Email verified successfully!",
      };
    } catch (error) {
      console.error("Real API confirmation failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(
        async () => {
          // Simulate confirmation logic
          return {
            message: "Email verified successfully!",
            verified: true,
          };
        },
        "medium",
        {
          successMessage: "Email verified successfully",
        }
      );
    }
  },

  async resendCode(
    request: ResendCodeRequest
  ): Promise<ApiResponse<ResendCodeResponse> | ApiError> {
    try {
      // Use real API for resending verification code
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification code');
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        message: "Verification code resent successfully!",
      };
    } catch (error) {
      console.error("Real API resend code failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(
        async () => {
          // Simulate resend logic
          return {
            message: "Verification code resent successfully!",
            sent: true,
          };
        },
        "medium",
        {
          successMessage: "Verification code resent successfully",
        }
      );
    }
  },

  async signIn(
    request: SignInRequest
  ): Promise<ApiResponse<SignInResponse> | ApiError> {
    try {
      // Use real API for signin
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      const data = await response.json();
      
      // Map the response to our expected format
      const signInResponse: SignInResponse = {
        user: {
          id: data.user?.id || `user_${Date.now()}`,
          email: data.user?.email || request.email,
          name: data.user?.name || data.user?.full_name || 'User',
          avatar: data.user?.avatar,
          preferences: {
            theme: 'system',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              urgentActions: true,
            },
          },
          createdAt: new Date(data.user?.created_at || Date.now()),
          lastLoginAt: new Date(),
        },
        token: data.token || data.access_token || `token_${Date.now()}`,
        expiresAt: new Date(data.expires_at || Date.now() + 24 * 60 * 60 * 1000),
      };
      
      return {
        success: true,
        data: signInResponse,
        timestamp: new Date().toISOString(),
        message: "Successfully signed in",
      };
    } catch (error) {
      console.error("Real API signin failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(
        async () => {
          // Simulate authentication logic
          if (
            request.email === "demo@legalkaki.app" &&
            request.password === "demo123"
          ) {
            return {
              user: mockUser,
              token: `mock_token_${Date.now()}`,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            };
          } else {
            throw new Error("Invalid credentials");
          }
        },
        "medium",
        {
          successMessage: "Successfully signed in",
        }
      );
    }
  },

  async signOut(): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        // Clear any stored tokens or session data
        return { success: true };
      },
      "fast",
      {
        successMessage: "Successfully signed out",
      }
    );
  },

  async refreshToken(
    token: string
  ): Promise<ApiResponse<{ token: string; expiresAt: Date }> | ApiError> {
    return mockClient.request(async () => {
      return {
        token: `refreshed_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }, "fast");
  },
};

// User Endpoints
export const userApi = {
  async getProfile(): Promise<ApiResponse<User> | ApiError> {
    try {
      // Use real API to get user profile
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch user profile')
      }

      const data = await response.json()
      
      // Map the response to our User interface
      const userData: User = {
        id: data.id || data.user_id || `user_${Date.now()}`,
        email: data.email || data.email_address,
        name: data.name || data.full_name || data.username || 'User',
        avatar: data.avatar || data.profile_picture,
        preferences: {
          theme: 'system',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            urgentActions: true,
          },
        },
        createdAt: new Date(data.created_at || data.createdAt || Date.now()),
        lastLoginAt: new Date(data.last_login_at || data.lastLoginAt || Date.now()),
      }
      
      return {
        success: true,
        data: userData,
        timestamp: new Date().toISOString(),
        message: "User profile fetched successfully",
      }
    } catch (error) {
      console.error("Real API profile failed, falling back to mock:", error)
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        return mockUser;
      }, "fast");
    }
  },

  async updateProfile(
    updates: Partial<User>
  ): Promise<ApiResponse<User> | ApiError> {
    return mockClient.request(
      async () => {
        const updatedUser = { ...mockUser, ...updates };
        return updatedUser;
      },
      "medium",
      {
        successMessage: "Profile updated successfully",
      }
    );
  },

  async getStats(): Promise<ApiResponse<UserStats> | ApiError> {
    try {
      // Try to get real stats from backend data
      const userSub = getCurrentUserId(); // Get authenticated user ID
      
      // Get collections from backend to calculate real stats
      const backendCollections = await collectionApiClient.getCollections(userSub, 100, 0);
      const collections = backendCollections.map(mapBackendCollectionToCollection);
      
      // Calculate real stats from backend data
      const totalCollections = collections.length;
      const activeCollections = collections.filter(c => c.status === 'active').length;
      
      // For now, we'll calculate these from collections
      // In a real implementation, you'd also fetch actions and documents separately
      let totalActions = 0;
      let urgentActions = 0;
      
      // Try to get more detailed stats by fetching collection details
      for (const collection of collections.slice(0, 5)) { // Limit to first 5 to avoid too many API calls
        try {
          const collectionId = parseInt(collection.id);
          if (!isNaN(collectionId)) {
            const details = await collectionApiClient.getCollectionDetails(collectionId);
            totalActions += details.actions.length;
            urgentActions += details.actions.filter(a => 
              mapBackendActionToActionItem(a).priority === 'urgent'
            ).length;
          }
        } catch (error) {
          console.log(`Failed to get details for collection ${collection.id}:`, error);
        }
      }
      
      const realStats: UserStats = {
        totalCollections,
        activeCollections,
        totalActions,
        urgentActions,
        documentsAnalyzed: 0, // Would need to fetch from documents API
        conversationsCount: 0, // Would need to fetch from chats API
        joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
        lastActivity: new Date(),
      };
      
      console.log('📊 Real user stats calculated:', realStats);
      
      return {
        success: true,
        data: realStats,
        timestamp: new Date().toISOString(),
        message: "User stats fetched successfully from backend",
      };
    } catch (error) {
      console.error("Failed to get real user stats, falling back to mock:", error);
      
      // Fallback to mock stats
      return mockClient.request(async () => {
        return mockUserStats;
      }, "fast");
    }
  },

  async getActivity(
    limit: number = 10
  ): Promise<ApiResponse<ActivityItem[]> | ApiError> {
    return mockClient.request(async () => {
      return mockActivityItems.slice(0, limit);
    }, "fast");
  },
};

// Legal Domains Endpoints
export const domainsApi = {
  async getDomains(): Promise<
    ApiResponse<Record<LegalDomain, DomainInfo>> | ApiError
  > {
    return mockClient.request(async () => {
      return mockDomains;
    }, "fast");
  },

  async getDomain(
    domainId: LegalDomain
  ): Promise<ApiResponse<DomainInfo> | ApiError> {
    return mockClient.request(async () => {
      const domain = mockDomains[domainId];
      if (!domain) {
        throw new Error("Domain not found");
      }
      return domain;
    }, "fast");
  },
};

// Chat Endpoints
export const chatApi = {
  async createSession(
    request: CreateChatSessionRequest
  ): Promise<ApiResponse<ChatSessionResponse> | ApiError> {
    return mockClient.request(
      async () => {
        const sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const now = new Date();

        const initialMessage: Message = {
          id: "1",
          content: `Hi! I'm your legal assistant for ${
            mockDomains[request.domain]?.title || "General"
          } matters. How can I help you today?`,
          sender: "assistant",
          timestamp: now,
          domain: request.domain,
          type: "text",
        };

        const messages = [initialMessage];

        if (request.initialMessage) {
          const userMessage: Message = {
            id: "2",
            content: request.initialMessage,
            sender: "user",
            timestamp: new Date(now.getTime() + 1000),
            domain: request.domain,
          };
          messages.push(userMessage);
        }

        return {
          id: sessionId,
          domain: request.domain,
          title: `${mockDomains[request.domain]?.title || "Legal"} Consultation`,
          messages,
          createdAt: now,
          updatedAt: now,
          status: "active" as const,
        };
      },
      "medium",
      {
        successMessage: "Chat session created",
      }
    );
  },

  async getSession(
    sessionId: string
  ): Promise<ApiResponse<ChatSessionResponse> | ApiError> {
    return mockClient.request(async () => {
      // For demo purposes, return a mock session
      const session = mockChatSessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new Error("Session not found");
      }
      return toChatSessionResponse(session);
    }, "fast");
  },

  async sendMessage(
    sessionId: string,
    request: SendMessageRequest,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<ApiResponse<SendMessageResponse> | ApiError> {
    // Check if we should use real API or mock based on environment
    const envConfig = getEnvConfig();
    const shouldUseRealApi = envConfig.isDevMode; // Use real API in dev mode

    console.log("[ChatAPI] Environment config:", {
      isDevMode: envConfig.isDevMode,
      backendUrl: envConfig.backendUrl,
      shouldUseRealApi
    });

    if (shouldUseRealApi) {
      console.log("[ChatAPI] 🚀 Using real API - connecting to backend at", envConfig.backendUrl);
      
      try {
        // Use the supervisor endpoint for structured responses
        const chatIdNum = parseInt(sessionId.replace('session_', ''));
        if (isNaN(chatIdNum)) {
          // If session ID is not a number, use current timestamp as chat ID
          const fallbackChatId = Date.now();
          const response = await realApiClient.sendSupervisorMessage(
            fallbackChatId,
            request.content,
            request.attachments?.map(att => ({
              name: att.filename || "file.pdf",
              type: att.fileType || "application/pdf",
              size: att.fileSize || 0,
              content: new ArrayBuffer(0) // Empty content for now
            })),
            onProgress,
            request.domain
          );
          
          return {
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
            message: "Message sent successfully via real API",
          };
        } else {
          const response = await realApiClient.sendSupervisorMessage(
            chatIdNum,
            request.content,
            request.attachments?.map(att => ({
              name: att.filename || "file.pdf",
              type: att.fileType || "application/pdf",
              size: att.fileSize || 0,
              content: new ArrayBuffer(0) // Empty content for now
            })),
            onProgress,
            request.domain
          );
          
          return {
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
            message: "Message sent successfully via real API",
          };
        }
      } catch (error) {
        console.error("[ChatAPI] Real API failed, falling back to mock:", error);
        // Fall back to mock implementation
      }
    }

    // Mock implementation (fallback or when not in dev mode)
    console.log("[ChatAPI] Using mock mode - messages are in-memory only until saved to collection");

    // Mock implementation
    return mockClient.request(
      async () => {
        const messageId = `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const now = new Date();

        // Create user message
        const userMessage: Message = {
          id: messageId,
          content: request.content,
          sender: "user",
          timestamp: now,
          attachments: request.attachments?.map((id) => ({
            id,
            filename: "attached_file.pdf",
            fileType: "application/pdf",
            fileSize: 245760,
            url: "#",
          })),
        };

        let aiResponse: Message | undefined;
        let analysisResult: AnalysisResult | undefined;
        let draftResult: DraftResult | undefined;

        // Simulate AI processing
        if (onProgress) {
          onProgress("Processing your message...", 25);
          await new Promise((resolve) => setTimeout(resolve, 500));
          onProgress("Analyzing content...", 50);
          await new Promise((resolve) => setTimeout(resolve, 500));
          onProgress("Generating response...", 75);
          await new Promise((resolve) => setTimeout(resolve, 500));
          onProgress("Finalizing...", 100);
        }

        // Generate AI response based on message type
        if (request.messageType === "analysis_request") {
          analysisResult = {
            ...mockAnalysisResult,
            id: `analysis_${Date.now()}`,
          };

          aiResponse = {
            id: `msg_${Date.now() + 1}`,
            content: "Here's my detailed analysis:",
            sender: "assistant",
            timestamp: new Date(now.getTime() + 2000),
            type: "analysis",
          };
        } else if (request.messageType === "draft_request") {
          draftResult = {
            ...mockDraftResult,
            id: `draft_${Date.now()}`,
          };

          aiResponse = {
            id: `msg_${Date.now() + 1}`,
            content: "Here's your document draft:",
            sender: "assistant",
            timestamp: new Date(now.getTime() + 2000),
            type: "draft",
          };
        } else {
          // Regular text response
          aiResponse = {
            id: `msg_${Date.now() + 1}`,
            content: `I understand you're asking about "${request.content}". Let me help you with that.`,
            sender: "assistant",
            timestamp: new Date(now.getTime() + 1500),
            type: "text",
          };
        }

        return {
          message: userMessage,
          aiResponse,
          analysisResult,
          draftResult,
        };
      },
      "ai",
      {
        progressId: "send_message",
        progressSteps: [
          "Processing message...",
          "Analyzing content...",
          "Generating response...",
          "Finalizing...",
        ],
      }
    );
  },

  async getSessions(
    limit: number = 10
  ): Promise<ApiResponse<ChatSessionResponse[]> | ApiError> {
    return mockClient.request(async () => {
      return mockChatSessions.slice(0, limit).map(toChatSessionResponse);
    }, "fast");
  },
};

// Document Endpoints
export const documentsApi = {
  async upload(
    request: UploadDocumentRequest,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<UploadDocumentResponse> | ApiError> {
    try {
      // Use real API for document upload
      const uploadResult = await realApiClient.uploadDocument(
        request.file,
        onProgress
      );

      return {
        success: true,
        data: uploadResult,
        timestamp: new Date().toISOString(),
        message: "Document uploaded successfully",
      };
    } catch (error) {
      console.error("Real API upload failed, falling back to mock:", error);

      // Fallback to mock implementation
      const uploadResult = await mockClient.uploadFile(
        request.file,
        onProgress
      );

      if (!uploadResult.success) {
        return uploadResult as ApiError;
      }

      return mockClient.request(
        async () => {
          const document: Document = {
            id: uploadResult.data.fileId,
            originalFilename: request.file.name,
            storedFilename: `${uploadResult.data.fileId}.${request.file.name
              .split(".")
              .pop()}`,
            fileType: request.file.type,
            fileSize: request.file.size,
            s3Bucket: "legalkaki-documents",
            s3Key: `documents/user-1/${
              uploadResult.data.fileId
            }.${request.file.name.split(".").pop()}`,
            uploadDate: new Date(),
            analysisStatus: "pending",
          };

          return {
            document,
            uploadUrl: uploadResult.data.url,
            analysisJobId: `analysis_job_${Date.now()}`,
          };
        },
        "fast",
        {
          successMessage: "Document uploaded successfully (mock)",
        }
      );
    }
  },

  async getDocument(
    documentId: string
  ): Promise<ApiResponse<Document> | ApiError> {
    return mockClient.request(async () => {
      const document = mockDocuments.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      return document;
    }, "fast");
  },

  async getDocuments(
    limit: number = 10
  ): Promise<ApiResponse<Document[]> | ApiError> {
    return mockClient.request(async () => {
      return mockDocuments.slice(0, limit);
    }, "fast");
  },

  async analyzeDocument(
    documentId: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<ApiResponse<AnalysisResult> | ApiError> {
    return mockClient
      .processWithAI(`Analyzing document ${documentId}`, "analysis", onProgress)
      .then((result) => {
        if (!result.success) return result as ApiError;

        return mockClient.request(async () => {
          return {
            ...mockAnalysisResult,
            id: result.data.resultId,
          } as AnalysisResult;
        }, "fast");
      });
  },

  async deleteDocument(
    documentId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        return { success: true };
      },
      "fast",
      {
        successMessage: "Document deleted successfully",
      }
    );
  },

  async getDocumentProxy(
    documentId: string
  ): Promise<ApiResponse<{ url: string }> | ApiError> {
    try {
      // Try multiple backend endpoints for document access
      const endpoints = [
        `${BACKEND_BASE_URL}/documents/${documentId}/proxy`,
        `${BACKEND_BASE_URL}/documents/${documentId}/signed-url`,
        `${BACKEND_BASE_URL}/documents/${documentId}/download`,
        `${BACKEND_BASE_URL}/documents/${documentId}/stream`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ragflow-E1YWMxNmU4OTZkNTExZjBiNzUwMDI0Mm`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success with endpoint: ${endpoint}`);
            return {
              success: true,
              data: { url: data.url || data.download_url || data.signed_url },
              timestamp: new Date().toISOString(),
              message: "Document proxy URL generated successfully",
            };
          } else {
            console.log(`❌ Endpoint failed: ${endpoint} (${response.status})`);
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint error: ${endpoint}`, endpointError);
        }
      }

      throw new Error('All document endpoints failed');
    } catch (error) {
      console.error("Real API document proxy failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        return { url: '/partnership.pdf' }; // Fallback to static file
      }, "fast");
    }
  },

};

// Helper function to get current user ID from auth context
function getCurrentUserId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getCurrentUserId can only be called on the client side')
  }
  
  const storedUser = localStorage.getItem('userData')
  if (!storedUser) {
    throw new Error('No authenticated user found')
  }
  
  try {
    const userData = JSON.parse(storedUser)
    return userData.id
  } catch (error) {
    throw new Error('Invalid user data in localStorage')
  }
}

// Collections Endpoints
export const collectionsApi = {
  async getCollections(filters?: {
    status?: "active" | "archived" | "completed";
    domain?: LegalDomain;
    search?: string;
    limit?: number;
  }): Promise<ApiResponse<Collection[]> | ApiError> {
    try {
      // Use real API to get collections
      const userSub = getCurrentUserId(); // Get authenticated user ID
      const limit = filters?.limit || 50;
      const offset = 0; // Could be implemented for pagination
      
      // Try to get collections from backend with the current user ID
      const backendCollections = await collectionApiClient.getCollections(userSub, limit, offset);
      
      // Convert backend collections to frontend format
      let collections = backendCollections.map(mapBackendCollectionToCollection);

      // Apply filters (client-side filtering for now)
      if (filters?.status) {
        collections = collections.filter((c) => c.status === filters.status);
      }

      if (filters?.domain) {
        collections = collections.filter((c) => c.domain === filters.domain);
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        collections = collections.filter(
          (c) =>
            c.title.toLowerCase().includes(searchTerm) ||
            c.domain.toLowerCase().includes(searchTerm) ||
            c.summary.toLowerCase().includes(searchTerm)
        );
      }

      return {
        success: true,
        data: collections,
        timestamp: new Date().toISOString(),
        message: "Collections fetched successfully",
      };
    } catch (error) {
      console.error("Real API collections failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        let filtered = [...mockCollections];

        if (filters?.status) {
          filtered = filtered.filter((c) => c.status === filters.status);
        }

        if (filters?.domain) {
          filtered = filtered.filter((c) => c.domain === filters.domain);
        }

        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.title.toLowerCase().includes(searchTerm) ||
              c.domain.toLowerCase().includes(searchTerm) ||
              c.summary.toLowerCase().includes(searchTerm)
          );
        }

        if (filters?.limit) {
          filtered = filtered.slice(0, filters.limit);
        }

        return filtered;
      }, "fast");
    }
  },

  async getCollection(
    collectionId: string
  ): Promise<ApiResponse<Collection> | ApiError> {
    try {
      // Use real API to get collection details
      const collectionIdNum = parseInt(collectionId);
      if (isNaN(collectionIdNum)) {
        throw new Error("Invalid collection ID");
      }
      
      const backendDetails = await collectionApiClient.getCollectionDetails(collectionIdNum);
      const collection = mapBackendCollectionToCollection(backendDetails.collection);
      
      // Update collection with calculated counts
      collection.messageCount = backendDetails.chats.length;
      collection.documentCount = backendDetails.documents.length;
      collection.actionItemsCount = backendDetails.actions.length;
      collection.urgentActionsCount = backendDetails.actions.filter(
        a => mapBackendActionToActionItem(a).priority === 'urgent'
      ).length;
      collection.itemCount = collection.messageCount + collection.documentCount + collection.actionItemsCount;

      return {
        success: true,
        data: collection,
        timestamp: new Date().toISOString(),
        message: "Collection fetched successfully",
      };
    } catch (error) {
      console.error("Real API collection failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        const collection = mockCollections.find((c) => c.id === collectionId);
        if (!collection) {
          throw new Error("Collection not found");
        }
        return collection;
      }, "fast");
    }
  },

  async getCollectionDashboard(
    collectionId: string
  ): Promise<ApiResponse<CollectionDashboardData> | ApiError> {
    try {
      // Use real API to get collection details
      const collectionIdNum = parseInt(collectionId);
      if (isNaN(collectionIdNum)) {
        throw new Error("Invalid collection ID");
      }
      
      const backendDetails = await collectionApiClient.getCollectionDetails(collectionIdNum);
      
      // Convert backend data to frontend models
      const collection = mapBackendCollectionToCollection(backendDetails.collection);
      const conversations = backendDetails.chats.map(mapBackendChatToChatSession);
      const actionItems = backendDetails.actions.map(mapBackendActionToActionItem);
      
      // Map documents directly from the collection details response
      const allDocuments = backendDetails.documents.map((backendDoc: any) => 
        mapBackendCollectionDocumentToDocument(backendDoc, collectionIdNum)
      );
      
      // Update collection with calculated counts
      collection.messageCount = conversations.length;
      collection.documentCount = allDocuments.length;
      collection.actionItemsCount = actionItems.length;
      collection.urgentActionsCount = actionItems.filter(a => a.priority === 'urgent').length;
      collection.itemCount = collection.messageCount + collection.documentCount + collection.actionItemsCount;

      // Calculate stats
      const stats = {
        totalConversations: conversations.length,
        totalDocuments: allDocuments.length,
        totalActions: actionItems.length,
        urgentActions: actionItems.filter(a => a.priority === 'urgent').length,
        completedActions: actionItems.filter(a => a.status === 'completed').length,
      };

      const dashboardData: CollectionDashboardData = {
        collection,
        documents: allDocuments,
        conversations,
        actionItems,
        stats,
      };

      return {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
        message: "Collection dashboard fetched successfully",
      };
    } catch (error) {
      console.error("Real API collection dashboard failed, falling back to mock:", error);
      
      // Fallback to mock implementation with mock data
      return mockClient.request(async () => {
        const collection = mockCollections.find((c) => c.id === collectionId);
        if (!collection) {
          throw new Error("Collection not found");
        }

        // Use mock data for dashboard
        const conversations = mockChatSessions.filter(s => s.collectionId === collectionId).map(toChatSessionResponse);
        const actionItems = mockActionItems.filter(a => a.sourceConversation?.includes(collection.title));
        const documents = mockDocuments.filter(d => d.collectionId === collectionId);

        const stats = {
          totalConversations: conversations.length,
          totalDocuments: documents.length,
          totalActions: actionItems.length,
          urgentActions: actionItems.filter(a => a.priority === 'urgent').length,
          completedActions: actionItems.filter(a => a.status === 'completed').length,
        };

        return {
          collection,
          documents,
          conversations,
          actionItems,
          stats,
        };
      }, "fast");
    }
  },

  async createCollection(
    request: CreateCollectionRequest
  ): Promise<ApiResponse<Collection> | ApiError> {
    return mockClient.request(
      async () => {
        const collectionId = `collection_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const now = new Date();

        const collection: Collection = {
          id: collectionId,
          title: request.title,
          domain: request.domain,
          summary: request.summary || "",
          status: "active",
          createdAt: now,
          updatedAt: now,
          itemCount: 0,
          messageCount: 0,
          documentCount: 0,
          actionItemsCount: 0,
          urgentActionsCount: 0,
          tags: request.tags || [],
        };

        return collection;
      },
      "medium",
      {
        successMessage: "Collection created successfully",
      }
    );
  },

  async updateCollection(
    collectionId: string,
    updates: Partial<Collection>
  ): Promise<ApiResponse<Collection> | ApiError> {
    return mockClient.request(
      async () => {
        const collection = mockCollections.find((c) => c.id === collectionId);
        if (!collection) {
          throw new Error("Collection not found");
        }

        const updated = { ...collection, ...updates, updatedAt: new Date() };
        return updated;
      },
      "medium",
      {
        successMessage: "Collection updated successfully",
      }
    );
  },

  async deleteCollection(
    collectionId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        return { success: true };
      },
      "fast",
      {
        successMessage: "Collection deleted successfully",
      }
    );
  },

  async getCollectionConversations(
    collectionId: string
  ): Promise<ApiResponse<ChatSessionResponse[]> | ApiError> {
    return mockClient.request(async () => {
      // Filter conversations that belong to this collection
      const conversations = mockChatSessions
        .filter((session) => session.collectionId === collectionId)
        .map(toChatSessionResponse);
      return conversations;
    }, "fast");
  },

  async getCollectionDocuments(
    collectionId: string
  ): Promise<ApiResponse<Document[]> | ApiError> {
    try {
      // Get collection details which includes documents
      const collectionIdNum = parseInt(collectionId);
      if (isNaN(collectionIdNum)) {
        throw new Error("Invalid collection ID");
      }
      
      const backendDetails = await collectionApiClient.getCollectionDetails(collectionIdNum);
      
      // Map the backend documents to frontend Document format
      const documents = backendDetails.documents.map((backendDoc: any) => 
        mapBackendCollectionDocumentToDocument(backendDoc, collectionIdNum)
      );

      return {
        success: true,
        data: documents,
        timestamp: new Date().toISOString(),
        message: "Collection documents fetched successfully",
      };
    } catch (error) {
      console.error("Real API collection documents failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        // Filter documents that belong to this collection
        const documents = mockDocuments.filter(
          (doc) => doc.collectionId === collectionId
        );
        return documents;
      }, "fast");
    }
  },

  async getChatDocuments(
    chatId: string
  ): Promise<ApiResponse<Document[]> | ApiError> {
    try {
      const chatIdNum = parseInt(chatId);
      if (isNaN(chatIdNum)) {
        throw new Error("Invalid chat ID");
      }
      
      const userSub = getCurrentUserId(); // Get authenticated user ID
      const chatDocuments = await collectionApiClient.getChatDocuments(userSub, chatIdNum, 50, 0);
      
      const mappedDocuments = chatDocuments.map(backendDoc => {
        return mapBackendDocumentToDocument(backendDoc);
      });

      return {
        success: true,
        data: mappedDocuments,
        timestamp: new Date().toISOString(),
        message: "Chat documents fetched successfully",
      };
    } catch (error) {
      console.error("Real API chat documents failed, falling back to mock:", error);
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        // Filter documents that belong to this chat
        const documents = mockDocuments.filter(
          (doc) => doc.collectionId === chatId
        );
        return documents;
      }, "fast");
    }
  },



  async addConversationToCollection(
    collectionId: string,
    conversationId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        // In a real implementation, this would update the database
        // to link the conversation to the collection
        return { success: true };
      },
      "medium",
      {
        successMessage: "Conversation added to collection",
      }
    );
  },

  async addDocumentToCollection(
    collectionId: string,
    documentId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        // In a real implementation, this would update the database
        // to link the document to the collection
        return { success: true };
      },
      "medium",
      {
        successMessage: "Document added to collection",
      }
    );
  },

  async removeConversationFromCollection(
    collectionId: string,
    conversationId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        // In a real implementation, this would update the database
        // to unlink the conversation from the collection
        return { success: true };
      },
      "medium",
      {
        successMessage: "Conversation removed from collection",
      }
    );
  },

  async removeDocumentFromCollection(
    collectionId: string,
    documentId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        // In a real implementation, this would update the database
        // to unlink the document from the collection
        return { success: true };
      },
      "medium",
      {
        successMessage: "Document removed from collection",
      }
    );
  },

  // Conversation snapshot functions
  async saveConversationToCollection(
    request: SaveConversationRequest
  ): Promise<ApiResponse<ConversationSnapshot> | ApiError> {
    try {
      const response = await realApiClient.saveConversationToCollection(request);
      return response;
    } catch (error) {
      console.error("Failed to save conversation:", error);
      throw error;
    }
  },

  async getCollectionConversations(
    collectionId: number,
    userSub: string
  ): Promise<ApiResponse<ConversationListItem[]> | ApiError> {
    try {
      const response = await realApiClient.getCollectionConversations(collectionId, userSub);
      return response;
    } catch (error) {
      console.error("Failed to get collection conversations:", error);
      throw error;
    }
  },

  async getConversationSnapshot(
    snapshotId: string,
    userSub: string
  ): Promise<ApiResponse<ConversationSnapshot> | ApiError> {
    try {
      const response = await realApiClient.getConversationSnapshot(snapshotId, userSub);
      return response;
    } catch (error) {
      console.error("Failed to get conversation snapshot:", error);
      throw error;
    }
  },

  async deleteConversationFromCollection(
    snapshotId: string,
    userSub: string
  ): Promise<ApiResponse<void> | ApiError> {
    try {
      const response = await realApiClient.deleteConversationFromCollection(snapshotId, userSub);
      return response;
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      throw error;
    }
  },
};

// Action Items Endpoints
export const actionsApi = {
  async getActions(filters?: {
    status?: "pending" | "in_progress" | "completed";
    priority?: "urgent" | "important" | "normal";
    collectionId?: string;
    limit?: number;
  }): Promise<ApiResponse<ActionItem[]> | ApiError> {
    return mockClient.request(async () => {
      let filtered = [...mockActionItems];

      if (filters?.status) {
        filtered = filtered.filter((a) => a.status === filters.status);
      }

      if (filters?.priority) {
        filtered = filtered.filter((a) => a.priority === filters.priority);
      }

      if (filters?.collectionId) {
        // In a real app, this would filter by collection
        filtered = filtered.filter((a) =>
          a.sourceConversation?.includes("Employment")
        );
      }

      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit);
      }

      return filtered;
    }, "fast");
  },

  async getAction(
    actionId: string
  ): Promise<ApiResponse<ActionItem> | ApiError> {
    return mockClient.request(async () => {
      const action = mockActionItems.find((a) => a.id === actionId);
      if (!action) {
        throw new Error("Action not found");
      }
      return action;
    }, "fast");
  },

  async createAction(
    request: CreateActionItemRequest
  ): Promise<ApiResponse<ActionItem> | ApiError> {
    return mockClient.request(
      async () => {
        const actionId = `action_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const action: ActionItem = {
          id: actionId,
          title: request.title,
          description: request.description,
          priority: request.priority,
          status: "pending",
          dueDate: request.dueDate,
          externalLinks: request.externalLinks,
          sourceConversation: request.sourceConversation,
        };

        return action;
      },
      "medium",
      {
        successMessage: "Action item created successfully",
      }
    );
  },

  async updateAction(
    actionId: string,
    updates: UpdateActionItemRequest
  ): Promise<ApiResponse<ActionItem> | ApiError> {
    return mockClient.request(
      async () => {
        const action = mockActionItems.find((a) => a.id === actionId);
        if (!action) {
          throw new Error("Action not found");
        }

        const updated = { ...action, ...updates };
        return updated;
      },
      "medium",
      {
        successMessage: "Action item updated successfully",
      }
    );
  },

  async deleteAction(
    actionId: string
  ): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(
      async () => {
        return { success: true };
      },
      "fast",
      {
        successMessage: "Action item deleted successfully",
      }
    );
  },
};

// Search Endpoints
export const searchApi = {
  async search(
    request: SearchRequest
  ): Promise<ApiResponse<SearchResponse> | ApiError> {
    return mockClient.request(async () => {
      // Simulate search logic
      const results = [
        {
          id: "1",
          type: "conversation" as const,
          title: "Employment Contract Review",
          snippet:
            "Discussion about employment contract terms and compliance...",
          relevanceScore: 0.95,
          domain: "employment" as LegalDomain,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "2",
          type: "document" as const,
          title: "Employment_Contract_2024.pdf",
          snippet: "PDF document containing employment contract details...",
          relevanceScore: 0.87,
          domain: "employment" as LegalDomain,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      const filtered = results.filter(
        (r) =>
          r.title.toLowerCase().includes(request.query.toLowerCase()) ||
          r.snippet.toLowerCase().includes(request.query.toLowerCase())
      );

      return {
        results: filtered,
        totalResults: filtered.length,
        searchTime: 0.25,
        suggestions: [
          "employment contract",
          "salary compliance",
          "termination clauses",
        ],
        pagination: {
          page: request.pagination?.page || 1,
          limit: request.pagination?.limit || 10,
          total: filtered.length,
          totalPages: Math.ceil(
            filtered.length / (request.pagination?.limit || 10)
          ),
        },
      };
    }, "medium");
  },
};

// Reports & Tools Endpoints
export const toolsApi = {
  async generateReport(
    request: GenerateReportRequest
  ): Promise<ApiResponse<GenerateReportResponse> | ApiError> {
    return mockClient.request(
      async () => {
        const reportId = `report_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        return {
          reportId,
          downloadUrl: `#/reports/${reportId}`,
          reportType: request.reportType,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };
      },
      "slow",
      {
        successMessage: "Report generated successfully",
        progressId: "generate_report",
        progressSteps: [
          "Collecting data...",
          "Processing information...",
          "Generating report...",
          "Finalizing document...",
        ],
      }
    );
  },

  async generateMindmap(
    collectionId: string
  ): Promise<ApiResponse<{ mindmapUrl: string }> | ApiError> {
    return mockClient.request(
      async () => {
        return {
          mindmapUrl: `#/mindmap/${collectionId}`,
        };
      },
      "slow",
      {
        successMessage: "Mind map generated successfully",
      }
    );
  },

  async generateMindMapInsights(request: {
    collectionTitle: string;
    collectionDomain: string;
    collectionSummary: string;
    conversations: Array<{
      id: string;
      title: string;
      domain: string;
      messages: unknown[];
    }>;
    documents: Array<{
      id: string;
      originalFilename: string;
      contentSummary?: string;
    }>;
    actionItems: Array<{
      id: string;
      title: string;
      description: string;
      priority: "urgent" | "important" | "normal";
      status: "pending" | "in_progress" | "completed";
    }>;
  }): Promise<
    | ApiResponse<{
        keyThemes: Array<{
          id: string;
          name: string;
          description: string;
          importance: "high" | "medium" | "low";
          relatedItems: Array<{
            type: "document" | "conversation" | "action";
            id: string;
            title: string;
          }>;
        }>;
        urgentActions: Array<{
          id: string;
          title: string;
          reasoning: string;
          suggestedDeadline: string;
        }>;
        riskFactors: Array<{
          description: string;
          severity: "high" | "medium" | "low";
          affectedItems: string[];
        }>;
        recommendations: string[];
        connections: Array<{
          fromId: string;
          toId: string;
          relationship: string;
          strength: number;
        }>;
      }>
    | ApiError
  > {
    return mockClient.request(
      async () => {
        // Call Bedrock service for real AI analysis (server-side only)
        const analysisRequest: MindMapAnalysisRequest = {
          collectionTitle: request.collectionTitle,
          collectionDomain: request.collectionDomain,
          collectionSummary: request.collectionSummary,
          conversations: request.conversations,
          documents: request.documents,
          actionItems: request.actionItems,
        };

        const result = await bedrockService.generateMindMapInsights(
          analysisRequest
        );
        return result;
      },
      "ai",
      {
        successMessage: "Mind map insights generated",
      }
    );
  },
};

// PDF Analysis Endpoints
export const pdfApi = {
  async getDocumentUrl(
    documentId: string
  ): Promise<ApiResponse<{ url: string }> | ApiError> {
    return mockClient.request(async () => {
      // For the sample PDF, return the local path
      if (documentId === "550e8400-e29b-41d4-a716-446655440001") {
        return { url: "/partnership.pdf" };
      }

      // For other documents, you would typically fetch from S3
      const document = mockDocuments.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      // In production, this would be a signed S3 URL
      return { url: `/documents/${document.storedFilename}` };
    }, "fast");
  },

  async analyzeTextSelection(request: {
    documentId: string;
    selectedText: string;
    context?: string;
    pageNumber?: number;
  }): Promise<
    | ApiResponse<{
        explanation: string;
        category:
          | "clause"
          | "legal-term"
          | "obligation"
          | "right"
          | "warning"
          | "general";
        confidence: number;
      }>
    | ApiError
  > {
    return mockClient.request(
      async () => {
        // Call Bedrock service for real AI analysis
        const analysisRequest: TextAnalysisRequest = {
          selectedText: request.selectedText,
          context: request.context,
          documentType: "legal document",
          pageNumber: request.pageNumber,
        };

        const result = await bedrockService.analyzeText(analysisRequest);
        return result;
      },
      "ai",
      {
        successMessage: "Text analysis completed",
      }
    );
  },

  async getDocumentMetadata(documentId: string): Promise<
    | ApiResponse<{
        pageCount: number;
        textContent?: string;
        hasTextLayer: boolean;
      }>
    | ApiError
  > {
    return mockClient.request(async () => {
      const document = mockDocuments.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      // Return metadata for the PDF
      return {
        pageCount: document.metadata?.pages || 1,
        hasTextLayer: true,
        textContent: undefined, // Would be extracted from PDF in production
      };
    }, "fast");
  },

  // Backend API service for highlight explainer
  async explainSentence(sentence: string): Promise<BackendExplainResponse> {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/explain/sentence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend explain API error:', error);
      throw error;
    }
  },
};

// Combine all APIs
export const api = {
  auth: authApi,
  user: userApi,
  domains: domainsApi,
  chat: chatApi,
  documents: documentsApi,
  collections: collectionsApi,
  actions: actionsApi,
  search: searchApi,
  tools: toolsApi,
  pdf: pdfApi,
  explain: {
    explainSentence: pdfApi.explainSentence,
  },
};

export default api;
