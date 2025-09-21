import {
  User,
  Collection,
  DomainInfo,
  AnalysisResult,
  DraftResult,
  UserStats,
  ActivityItem,
} from "./types";
import { LegalDomain, ChatSession, Document, ActionItem } from "@/types";

// User Data
export const mockUser: User = {
  id: "user-1",
  name: "Guest User",
  preferences: {
    theme: "light",
    language: "en",
    notifications: {
      email: true,
      push: true,
      urgentActions: true,
    },
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  lastLoginAt: new Date(),
};

// Legal Domains Data
export const mockDomains: Record<LegalDomain, DomainInfo> = {
  business: {
    id: "business",
    title: "Business",
    description: "Company registration, contracts, compliance",
    examples: [
      "SSM registration",
      "Partnership agreements",
      "Employment contracts",
    ],
    color: "#7B68EE",
    icon: "briefcase",
    isAvailable: true,
  },
  employment: {
    id: "employment",
    title: "Employment",
    description: "Work rights, contracts, disputes",
    examples: [
      "Employment Act queries",
      "Salary disputes",
      "Termination procedures",
    ],
    color: "#7B68EE",
    icon: "user",
    isAvailable: true,
  },
  property: {
    id: "property",
    title: "Tenancy",
    description: "Rental agreements, property disputes",
    examples: [
      "Tenancy agreements",
      "Deposit disputes",
      "Landlord-tenant issues",
    ],
    color: "#7B68EE",
    icon: "home",
    isAvailable: true,
  },
  marriage: {
    id: "marriage",
    title: "Partnership",
    description: "Business partnerships, joint ventures",
    examples: ["Partnership agreements", "Profit sharing", "Partner disputes"],
    color: "#7B68EE",
    icon: "handshake",
    isAvailable: true,
  },
  general: {
    id: "general",
    title: "General Legal",
    description: "Other legal matters",
    examples: ["Legal advice", "Document review", "General queries"],
    color: "#7B68EE",
    icon: "book-open",
    isAvailable: true,
  },
};

// Mock Collections Data
export const mockCollections: Collection[] = [
  {
    id: "1",
    title: "Employment Contract Review",
    domain: "employment",
    summary:
      "Comprehensive review of employment contract terms, salary compliance analysis, and identification of potentially problematic clauses requiring immediate legal attention.",
    status: "active",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    itemCount: 5,
    messageCount: 12,
    documentCount: 2,
    actionItemsCount: 3,
    urgentActionsCount: 1,
    tags: ["employment", "contract", "urgent"],
  },
  {
    id: "2",
    title: "Business Registration Malaysia",
    domain: "business",
    summary:
      "Complete guidance for SSM registration process, business structure analysis, and regulatory compliance requirements for starting a new company in Malaysia.",
    status: "completed",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    itemCount: 4,
    messageCount: 8,
    documentCount: 1,
    actionItemsCount: 2,
    urgentActionsCount: 0,
    tags: ["business", "registration", "ssm"],
  },
  {
    id: "3",
    title: "Property Purchase Agreement",
    domain: "property",
    summary:
      "Analysis of property purchase agreement, stamp duty calculations, and legal requirements for property transfer in Kuala Lumpur.",
    status: "active",
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    itemCount: 7,
    messageCount: 15,
    documentCount: 4,
    actionItemsCount: 5,
    urgentActionsCount: 2,
    tags: ["property", "purchase", "agreement"],
  },
  {
    id: "4",
    title: "Divorce Proceedings Consultation",
    domain: "marriage",
    summary:
      "Initial consultation regarding divorce proceedings, child custody arrangements, and asset division under Malaysian family law.",
    status: "archived",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    itemCount: 3,
    messageCount: 6,
    documentCount: 1,
    actionItemsCount: 1,
    urgentActionsCount: 0,
    tags: ["divorce", "family-law", "consultation"],
  },
];

// Mock Action Items Data
export const mockActionItems: ActionItem[] = [
  {
    id: "1",
    title: "Seek legal advice immediately",
    description:
      "Contract contains potentially illegal clauses that need immediate attention",
    priority: "urgent",
    status: "pending",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    externalLinks: [
      { text: "Find Legal Aid", url: "https://www.legalaid.gov.my" }, // TODO: Replace with LegalKaki resource URL
    ],
    sourceConversation: "Employment Contract Review",
  },
  {
    id: "2",
    title: "Review salary compliance with minimum wage",
    description:
      "Ensure your salary meets the current minimum wage requirements",
    priority: "important",
    status: "pending",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    externalLinks: [
      { text: "Check Minimum Wage Rates", url: "https://www.mohr.gov.my" }, // TODO: Replace with LegalKaki resource URL
    ],
    sourceConversation: "Employment Contract Review",
  },
  {
    id: "3",
    title: "Verify working hours arrangement",
    description: "Confirm that working hours comply with Employment Act limits",
    priority: "normal",
    status: "pending",
    sourceConversation: "Employment Contract Review",
  },
  {
    id: "4",
    title: "Submit SSM registration form",
    description:
      "Complete business registration with Companies Commission of Malaysia",
    priority: "normal",
    status: "completed",
    externalLinks: [
      { text: "SSM Portal", url: "https://www.ssm.com.my" }, // TODO: Replace with LegalKaki resource URL
    ],
    sourceConversation: "Business Registration Inquiry",
  },
  {
    id: "5",
    title: "Calculate stamp duty for property purchase",
    description: "Determine exact stamp duty amount for property transfer",
    priority: "urgent",
    status: "pending",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    externalLinks: [
      { text: "Stamp Duty Calculator", url: "https://www.hasil.gov.my" }, // TODO: Replace with LegalKaki resource URL
    ],
    sourceConversation: "Property Purchase Agreement",
  },
];

// Mock Documents Data
export const mockDocuments: Document[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    originalFilename: "Employment_Contract_2024.pdf",
    storedFilename: "550e8400-e29b-41d4-a716-446655440001.pdf",
    fileType: "application/pdf",
    fileSize: 245760, // ~240KB
    s3Bucket: "legalkaki-documents",
    s3Key: "documents/user-1/550e8400-e29b-41d4-a716-446655440001.pdf",
    uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    analysisStatus: "completed",
    contentSummary: "Employment contract with standard terms and conditions",
    collectionId: "collection-1", // Linked to Employment Contract Review collection
    metadata: {
      pages: 5,
      language: "en",
      wordCount: 1250,
    },
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    originalFilename: "Business_Plan_Draft.docx",
    storedFilename: "550e8400-e29b-41d4-a716-446655440002.docx",
    fileType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 1048576, // 1MB
    s3Bucket: "legalkaki-documents",
    s3Key: "documents/user-1/550e8400-e29b-41d4-a716-446655440002.docx",
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    analysisStatus: "processing",
    collectionId: "collection-2", // Linked to Business Registration collection
    metadata: {
      pages: 12,
      language: "en",
      wordCount: 3500,
    },
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    originalFilename: "Company Bylaws Draft.pdf",
    storedFilename: "550e8400-e29b-41d4-a716-446655440003.pdf",
    fileType: "application/pdf",
    fileSize: 512000, // 500KB
    s3Bucket: "legalkaki-documents",
    s3Key: "documents/user-1/550e8400-e29b-41d4-a716-446655440003.pdf",
    uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    analysisStatus: "completed",
    contentSummary: "Corporate bylaws and governance structure",
    collectionId: "collection-2", // Linked to Business Registration collection
    metadata: {
      pages: 8,
      language: "en",
      wordCount: 2100,
    },
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    originalFilename: "Property Sale Agreement.pdf",
    storedFilename: "550e8400-e29b-41d4-a716-446655440004.pdf",
    fileType: "application/pdf",
    fileSize: 768000, // 750KB
    s3Bucket: "legalkaki-documents",
    s3Key: "documents/user-1/550e8400-e29b-41d4-a716-446655440004.pdf",
    uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    analysisStatus: "pending",
    metadata: {
      pages: 15,
      language: "en",
      wordCount: 4200,
    },
  },
];

// Mock Analysis Results
export const mockAnalysisResult: AnalysisResult = {
  id: "analysis-1",
  explanation:
    "You can admit an investor while retaining decision-making control by separating economic rights (profit/return) from governance rights (voting/control). In Malaysia, this is typically achieved through a combination of (1) corporate structure choices (e.g., Sdn Bhd vs LLP), (2) share class design (e.g., non‑voting or limited‑voting preference shares), and (3) a well‑drafted shareholders’/partnership agreement that reserves key matters to you. Ensure alignment with the Companies Act 2016, the partnership/LLP framework, and your company constitution. Where the Employment Act 1955 is relevant (e.g., for key employee‑partners), ensure any executive service agreements comply with working time, leave and termination requirements.",
  risks: [
    {
      level: "high",
      description:
        "Investor controls creep into governance due to ambiguous documents",
      recommendation:
        "Use a detailed shareholders’ or partnership agreement with a clear reserved matters list and board composition clauses. Align with your company constitution.",
      urgency: 9,
    },
    {
      level: "medium",
      description: "Non‑compliant employment terms for executive partners",
      recommendation:
        "Check working hours, leave and termination provisions against the Employment Act 1955 for any partner who is also an employee.",
      urgency: 6,
    },
    {
      level: "low",
      description: "Vague dividend/return mechanics cause expectation gaps",
      recommendation:
        "Define profit distribution policy, liquidation preference and timelines in writing.",
      urgency: 2,
    },
  ],
  keyPoints: [
    "Keep control via voting design: issue non‑voting or limited‑voting shares to the investor.",
    "Adopt a reserved matters list requiring your consent for strategic decisions (e.g., new shares, debt, major CAPEX).",
    "Document profit mechanics: dividends, repayment priorities, liquidation preferences and timelines.",
    "If the investor works in the business, use an executive service agreement that complies with the Employment Act 1955.",
    "Ensure alignment between constitution/company bylaws and the shareholders’/partnership agreement.",
  ],
  actionItems: [
    {
      id: "act-structure",
      title: "Confirm optimal legal structure (Sdn Bhd vs LLP)",
      description:
        "Review tax, liability and control implications. If Sdn Bhd, prepare/improve company constitution to support share classes and reserved matters.",
      priority: "important",
      status: "pending",
      externalLinks: [
        { text: "SSM: Company basics", url: "https://www.ssm.com.my" },
      ],
    },
    {
      id: "act-shares",
      title: "Design investor share class (non‑voting/limited voting)",
      description:
        "Create a term sheet for preference/non‑voting shares with dividend policy, redemption and transfer restrictions.",
      priority: "urgent",
      status: "pending",
    },
    {
      id: "act-agreement",
      title: "Draft shareholders’/partnership agreement with reserved matters",
      description:
        "Include board composition, quorum, information rights, drag/tag, pre‑emption, non‑compete and the full reserved matters list.",
      priority: "urgent",
      status: "in_progress",
      externalLinks: [
        { text: "Reserved matters overview", url: "https://www.lexology.com" },
      ],
    },
    {
      id: "act-employment",
      title:
        "Prepare executive service agreement (if investor works in company)",
      description:
        "Set role, KPIs, remuneration, confidentiality/IP and compliant termination clauses per Employment Act 1955.",
      priority: "important",
      status: "pending",
    },
    {
      id: "act-filings",
      title: "Company secretary filings & cap table update",
      description:
        "Update share register, issue share certificates, and file any required SSM forms after completion.",
      priority: "normal",
      status: "pending",
    },
  ],
  confidence: 0.92,
  processingTime: 2.3,
};

// Mock Draft Results
export const mockDraftResult: DraftResult = {
  id: "draft-1",
  documentType: "Partnership Agreement",
  content: `**PARTNERSHIP AGREEMENT DRAFT**

**PARTIES:**
- Partner A: [Full Name / Company]
- Partner B: [Full Name / Company]

**BUSINESS PURPOSE:**
The Partners agree to carry on the business of [Business Description] under the name [Partnership Name]. The primary objective shall be:
• [Objective 1]
• [Objective 2]
• [Objective 3]

**CAPITAL CONTRIBUTIONS:**
- Partner A: RM [Amount]
- Partner B: RM [Amount]
- Additional contributions shall be mutually agreed in writing.

**PROFIT & LOSS SHARING:**
- Profits and losses shall be shared in the following proportions:
  • Partner A: [Percentage]%
  • Partner B: [Percentage]%
- Distribution shall be made annually, unless otherwise agreed.

**MANAGEMENT & DECISION-MAKING:**
- Day-to-day management shall be jointly exercised.
- Major decisions (e.g., capital expenditure, admission of new partners) require unanimous consent.

**TERM & TERMINATION:**
- The Partnership shall commence on [Date] and continue until terminated.
- Either Partner may withdraw by giving 3 months written notice.
- Grounds for dissolution include insolvency, illegality of business, or mutual agreement.

**CONFIDENTIALITY & NON-COMPETE:**
- Partners shall not disclose partnership information to third parties.
- Partners shall not engage in competing businesses without prior consent.

**GOVERNING LAW & DISPUTE RESOLUTION:**
- This Agreement shall be governed by the laws of Malaysia. Disputes shall be resolved first through good-faith negotiation, then mediation, and failing that, by the Malaysian courts.

**SIGNATURES:**
- Partner A: _____________________  Date: __________
- Partner B: _____________________  Date: __________

⚠️ **DISCLAIMER**: This is an AI-generated draft. Please have it reviewed by a qualified lawyer before use.`,
  suggestions: [
    {
      section: "Capital Contributions",
      suggestion: "Include details on how future contributions will be handled",
      priority: "medium",
      reasoning:
        "Prevents disputes over unequal or unexpected capital injections",
    },
    {
      section: "Profit & Loss Sharing",
      suggestion: "Specify treatment of partner salaries or drawings",
      priority: "high",
      reasoning:
        "Ensures clarity on whether partners can withdraw funds outside of profit distributions",
    },
    {
      section: "Management Clause",
      suggestion: "Define voting rights and tie-breaker mechanism",
      priority: "high",
      reasoning:
        "Avoids deadlock in decision-making and ensures smooth operation",
    },
    {
      section: "Termination Clause",
      suggestion: "Add buy-out provisions for withdrawing partners",
      priority: "medium",
      reasoning:
        "Clarifies exit process and prevents disruption of the business",
    },
    {
      section: "Confidentiality",
      suggestion: "Expand to include intellectual property ownership",
      priority: "medium",
      reasoning:
        "Protects business IP and prevents misuse if a partner leaves",
    },
  ],
  disclaimer:
    "This is an AI-generated draft. Please have it reviewed by a qualified lawyer before use.",
  templateUsed: "Malaysia Partnership Agreement Template v1.0",
};

// Mock Chat Sessions
export const mockChatSessions: ChatSession[] = [
  {
    id: "1",
    domain: "employment",
    title: "Employment Contract Review",
    collectionId: "collection-1", // Linked to Employment Contract Review collection
    messages: [
      {
        id: "1",
        content:
          "Hi! I'm your legal assistant for Employment matters. How can I help you today?",
        sender: "assistant",
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        domain: "employment",
        type: "text",
      },
      {
        id: "2",
        content: "I need help reviewing my employment contract",
        sender: "user",
        timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        domain: "employment",
      },
    ],
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 50 * 60 * 1000),
  },
  {
    id: "2",
    domain: "business",
    title: "Business Registration Inquiry",
    collectionId: "collection-2", // Linked to Business Registration collection
    messages: [
      {
        id: "3",
        content:
          "Hello! I can help you with business registration and compliance matters. What do you need assistance with?",
        sender: "assistant",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        domain: "business",
        type: "text",
      },
      {
        id: "4",
        content: "I want to register my new company with SSM",
        sender: "user",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), // 1h 55m ago
        domain: "business",
      },
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
  },
];

// Mock User Statistics
export const mockUserStats: UserStats = {
  totalCollections: 4,
  activeCollections: 2,
  totalActions: 11,
  urgentActions: 3,
  documentsAnalyzed: 8,
  conversationsCount: 35,
  joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
};

// Mock Activity Feed
export const mockActivityItems: ActivityItem[] = [
  {
    id: "1",
    type: "document_upload",
    description: "Uploaded Employment_Contract_2024.pdf",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    relatedId: "1",
  },
  {
    id: "2",
    type: "action_created",
    description: "Created urgent action: Seek legal advice immediately",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    relatedId: "1",
  },
  {
    id: "3",
    type: "collection_created",
    description: "Created collection: Employment Contract Review",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    relatedId: "1",
  },
  {
    id: "4",
    type: "message",
    description: "Started conversation about business registration",
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    relatedId: "2",
  },
];

// AI Response Templates
export const mockAiResponses = {
  analysisMode: {
    initial: (domain: string) =>
      `I understand you're asking about {query}. Let me analyze this for you and provide detailed guidance based on ${domain} law.`,
    withDocument: (filename: string) =>
      `I've analyzed your document "${filename}". Here's my detailed assessment:`,
    followUp:
      "Is there anything specific about this analysis you'd like me to clarify or expand on?",
  },
  draftMode: {
    initial: (
      query: string
    ) => `I'm ready to draft a legal document for you regarding ${query.toLowerCase()}. 

⚠️ **Important Disclaimer**: This draft is AI-generated and should be reviewed by a qualified lawyer before use. However, it can help you convey your message faster and serve as a starting point.

Would you like me to:
1. Create a new document draft
2. Upload an existing document for me to help you edit

Please let me know how you'd like to proceed!`,
    withDocument: (
      filename: string
    ) => `I've received your document "${filename}" and I'm ready to help you edit it!

⚠️ **Important Disclaimer**: My edits are AI-generated suggestions and should be reviewed by a qualified lawyer before use.

I can help you with:
• Improving clarity and structure
• Suggesting legal language improvements
• Identifying potential gaps or issues
• Formatting and organization

What specific aspects would you like me to focus on while editing your document?`,
  },
};

// File upload simulation data
export const mockUploadedFiles = [
  {
    id: "mock-1",
    filename: "employment_contract_template.pdf",
    fileType: "application/pdf",
    fileSize: 245760, // 240 KB
    url: "#",
  },
  {
    id: "mock-2",
    filename: "company_bylaws_draft.pdf",
    fileType: "application/pdf",
    fileSize: 512000, // 500 KB
    url: "#",
  },
];
