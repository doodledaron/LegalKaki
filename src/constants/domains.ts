import { CardItem, LegalDomain } from "@/types";
import { Building2, FileText, Users, TrendingUp, BookOpen } from "lucide-react";
import { domainsApi } from "@/api";

// SME/Business Owner Focused Domains
export const LEGAL_DOMAINS: Record<LegalDomain, CardItem> = {
  company_setup: {
    id: "company_setup",
    emoji: "🏢",
    icon: Building2,
    title: "Company Setup & Compliance",
    description: "Formation, registration, licenses, annual compliance",
    examples: [
      "SSM registration",
      "Business licenses",
      "Annual filings",
      "Company secretarial",
    ],
  },
  contracts: {
    id: "contracts",
    emoji: "📄",
    icon: FileText,
    title: "Contracts & Agreements",
    description: "Business contracts, NDAs, service agreements",
    examples: [
      "Supplier contracts",
      "Customer agreements",
      "NDAs",
      "Service terms",
    ],
  },
  employment: {
    id: "employment",
    emoji: "👥",
    icon: Users,
    title: "Employment & HR",
    description: "Hiring, contracts, policies, employee disputes",
    examples: [
      "Employment contracts",
      "HR policies",
      "Termination procedures",
      "Employee disputes",
    ],
  },
  business_growth: {
    id: "business_growth",
    emoji: "🚀",
    icon: TrendingUp,
    title: "Business Growth",
    description: "Partnerships, expansion, IP, joint ventures",
    examples: [
      "Partnership agreements",
      "Trademark registration",
      "Franchise agreements",
      "IP protection",
    ],
  },
};

export const DOMAIN_COLORS: Record<LegalDomain, string> = {
  company_setup: "#7B68EE",
  contracts: "#7B68EE",
  employment: "#7B68EE",
  business_growth: "#7B68EE",
};

// Helper function to convert API domain info to CardItem format
export function domainInfoToCardItem(domainInfo: {
  id: LegalDomain;
  title: string;
  description: string;
  examples: string[];
  icon: string;
}): CardItem {
  const iconMap = {
    "building-2": Building2,
    "file-text": FileText,
    users: Users,
    "trending-up": TrendingUp,
  };

  return {
    id: domainInfo.id,
    emoji: "⚖️", // Default emoji
    icon: iconMap[domainInfo.icon as keyof typeof iconMap] || BookOpen,
    title: domainInfo.title,
    description: domainInfo.description,
    examples: domainInfo.examples,
  };
}

// Hook for loading domains from API
export async function loadDomainsFromApi(): Promise<
  Record<LegalDomain, CardItem>
> {
  const response = await domainsApi.getDomains();

  if (response.success) {
    const domains: Record<LegalDomain, CardItem> = {} as Record<
      LegalDomain,
      CardItem
    >;

    Object.entries(response.data).forEach(([key, domainInfo]) => {
      domains[key as LegalDomain] = domainInfoToCardItem(domainInfo);
    });

    return domains;
  }

  // Fallback to static data if API fails
  return LEGAL_DOMAINS;
}
