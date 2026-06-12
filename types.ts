
export enum Niche {
  GENERAL = 'General'
}

// Added BOUND to LeadStatus enum to resolve reference error in constants.ts
export enum LeadStatus {
  RECEIVED = 'Received',
  IN_PROGRESS = 'In Progress',
  QUOTED = 'Quoted',
  CLOSED = 'Closed',
  BOUNCED = 'Bounced',
  REJECTED = 'Rejected'
}

export interface LandingBlock {
  id: string;
  type: 'hero' | 'about' | 'insurance_types' | 'custom_text' | 'quote_form';
  title: string;
  content: string;
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  alignment: 'left' | 'center' | 'right';
  visible: boolean;
  textColor?: string;
  backgroundColor?: string;
}

export interface LandingSettings {
  backgroundColor: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundImageUrl: string;
  textColor: string;
  accentColor: string;
  blocks: LandingBlock[];
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
  photoUrl?: string;
  landingSettings?: LandingSettings;
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
