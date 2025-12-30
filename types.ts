
export enum Niche {
  GENERAL = 'General'
}

export enum LeadStatus {
  RECEIVED = 'Received',
  QUOTED = 'Quoted',
  BOUND = 'Bound',
  ACTIVE = 'Active',
  CLOSED = 'Closed'
}

export interface Affiliate {
  id: string;
  name: string;
  slug: string;
  email: string;
  username: string;
  password: string;
  niche: Niche;
  referralCode: string;
  role?: 'partner' | 'admin';
  businessName?: string;
  industry?: string;
  lifetimeEarnings?: number;
  monthlyResiduals?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Lead {
  id: string;
  affiliateId: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  productType?: string;
  commissionEarned?: number;
  renewalDate?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  details?: {
    businessName?: string;
    dba?: string;
    fein?: string;
    yearsInBusiness?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    businessTypes?: string[];
    hasActiveCoverage?: boolean;
    knowsPremium?: boolean;
    hasDeclarations?: boolean;
  };
}

export interface PartnerApplication {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  industry: string;
  avgReferrals: string;
  website?: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface LandingPageRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  niche: string;
  notes: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AuthState {
  user: Affiliate | null;
  isAuthenticated: boolean;
}
