import { CardItem, LegalDomain } from '@/types'
import { Briefcase, User, Home, Handshake, BookOpen } from 'lucide-react'
import { domainsApi } from '@/api'

// Legacy static export for immediate use - components should use API for fresh data
export const LEGAL_DOMAINS: Record<LegalDomain, CardItem> = {
  business: {
    id: 'business',
    emoji: '💼', // Will be replaced with icon component
    icon: Briefcase,
    title: 'Business',
    description: 'Company registration, contracts, compliance',
    examples: [
      'SSM registration',
      'Partnership agreements',
      'Employment contracts'
    ]
  },
  employment: {
    id: 'employment',
    emoji: '👔', // Will be replaced with icon component
    icon: User,
    title: 'Employment',
    description: 'Work rights, contracts, disputes',
    examples: [
      'Employment Act queries',
      'Salary disputes',
      'Termination procedures'
    ]
  },
  property: {
    id: 'property',
    emoji: '🏠', // Will be replaced with icon component
    icon: Home,
    title: 'Tenancy',
    description: 'Rental agreements, property disputes',
    examples: [
      'Tenancy agreements',
      'Deposit disputes',
      'Landlord-tenant issues'
    ]
  },
  marriage: {
    id: 'marriage',
    emoji: '🤝', // Will be replaced with icon component
    icon: Handshake,
    title: 'Partnership',
    description: 'Business partnerships, joint ventures',
    examples: [
      'Partnership agreements',
      'Profit sharing',
      'Partner disputes'
    ]
  },
  general: {
    id: 'general',
    emoji: '📚', // Will be replaced with icon component
    icon: BookOpen,
    title: 'General Legal',
    description: 'Other legal matters',
    examples: [
      'Legal advice',
      'Document review',
      'General queries'
    ]
  }
}

export const DOMAIN_COLORS: Record<LegalDomain, string> = {
  business: '#7B68EE',
  employment: '#7B68EE',
  property: '#7B68EE',
  marriage: '#7B68EE',
  general: '#7B68EE'
}

// Helper function to convert API domain info to CardItem format
export function domainInfoToCardItem(domainInfo: any): CardItem {
  const iconMap = {
    'briefcase': Briefcase,
    'user': User,
    'home': Home,
    'handshake': Handshake,
    'book-open': BookOpen
  }
  
  return {
    id: domainInfo.id,
    emoji: '⚖️', // Default emoji
    icon: iconMap[domainInfo.icon as keyof typeof iconMap] || BookOpen,
    title: domainInfo.title,
    description: domainInfo.description,
    examples: domainInfo.examples
  }
}

// Hook for loading domains from API
export async function loadDomainsFromApi(): Promise<Record<LegalDomain, CardItem>> {
  const response = await domainsApi.getDomains()
  
  if (response.success) {
    const domains: Record<LegalDomain, CardItem> = {} as Record<LegalDomain, CardItem>
    
    Object.entries(response.data).forEach(([key, domainInfo]) => {
      domains[key as LegalDomain] = domainInfoToCardItem(domainInfo)
    })
    
    return domains
  }
  
  // Fallback to static data if API fails
  return LEGAL_DOMAINS
}
