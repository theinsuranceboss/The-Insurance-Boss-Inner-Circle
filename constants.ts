
import { Niche, Affiliate, Lead, LeadStatus } from './types';

export const COLORS = {
  primary: '#EAB308', // Caution Yellow
  background: '#0a0a0a',
  surface: '#171717',
  text: '#ffffff',
};

export const MOCK_AFFILIATES: Affiliate[] = [
  {
    id: 'admin-theboss',
    name: 'The Boss (Executive)',
    slug: 'the-boss',
    email: 'theboss@theinsuranceboss.com',
    username: 'theboss',
    password: 'adminboss',
    role: 'admin',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-THE-BOSS',
    lifetimeEarnings: 0,
    monthlyResiduals: 0
  },
  {
    id: 'admin-bossadmin',
    name: 'Executive Admin',
    slug: 'boss-admin',
    email: 'admin@theinsuranceboss.com',
    username: 'bossadmin',
    password: 'admin',
    role: 'admin',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-EXECUTIVE-ADMIN',
    lifetimeEarnings: 0,
    monthlyResiduals: 0
  },
  {
    id: 'aff-test-member',
    name: 'Test Inner Circle Member',
    slug: 'test-member',
    email: 'test@theinsuranceboss.com',
    username: 'innercirclemember',
    password: 'admin',
    role: 'partner',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-TEST',
    businessName: 'Test Agency',
    industry: 'Business Services',
    lifetimeEarnings: 1200.00,
    monthlyResiduals: 150.00
  },
  {
    id: 'aff-chris',
    name: 'Chris Uccio',
    slug: 'chris-uccio',
    email: 'chris@theinsuranceboss.com',
    username: 'chrisuccio',
    password: 'christheinsuranceboss',
    role: 'partner',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-CHRIS',
    businessName: 'Inner Circle Elite',
    industry: 'Executive Networking',
    lifetimeEarnings: 5000.00,
    monthlyResiduals: 500.00
  },
  {
    id: 'admin-chris',
    name: 'Chris Uccio (Admin)',
    slug: 'chris-uccio-admin',
    email: 'admin-chris@theinsuranceboss.com',
    username: 'chrisuccioadmin',
    password: 'admintheinsuranceboss',
    role: 'admin',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-EXEC-CHRIS',
    lifetimeEarnings: 0,
    monthlyResiduals: 0
  },
  {
    id: 'aff-1',
    name: 'Romeo Escalante',
    slug: 'romeo-escalante',
    email: 'romeo@boss.com',
    username: 'Romeo',
    password: 'admin',
    role: 'partner',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-ROMEO',
    businessName: 'Escalante Logistics',
    industry: 'Trucking',
    lifetimeEarnings: 4250.00,
    monthlyResiduals: 425.00
  },
  {
    id: 'admin-1',
    name: 'Admin Boss',
    slug: 'admin',
    email: 'admin@theinsuranceboss.com',
    username: 'romeoboss',
    password: 'adminboss',
    role: 'admin',
    niche: Niche.GENERAL,
    referralCode: 'BOSS-ADMIN',
    lifetimeEarnings: 0,
    monthlyResiduals: 0
  }
];

export const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    affiliateId: 'aff-chris',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    phone: '555-0101',
    status: LeadStatus.BOUND,
    productType: 'Commercial Auto',
    commissionEarned: 450.00,
    renewalDate: '2025-05-20',
    createdAt: '2024-05-20T10:00:00Z',
  },
  {
    id: 'lead-2',
    affiliateId: 'aff-1',
    name: 'Bob Marley',
    email: 'bob@example.com',
    phone: '555-0102',
    status: LeadStatus.QUOTED,
    productType: 'General Liability',
    commissionEarned: 0,
    createdAt: '2024-05-19T14:30:00Z',
  }
];
