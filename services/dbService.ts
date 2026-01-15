
import { Affiliate, Lead, LeadStatus, PartnerApplication, LandingPageRequest, Niche } from '../types';
import { MOCK_AFFILIATES, MOCK_LEADS } from '../constants';

class DBService {
  private affiliates: Affiliate[] = [];
  private leads: Lead[] = [];
  private applications: PartnerApplication[] = [];
  private landingPageRequests: LandingPageRequest[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const savedAffiliates = localStorage.getItem('boss_affiliates');
      if (savedAffiliates !== null) {
        this.affiliates = JSON.parse(savedAffiliates);
      } else {
        this.affiliates = [...MOCK_AFFILIATES];
        this.saveAffiliates();
      }

      const savedLeads = localStorage.getItem('boss_leads');
      if (savedLeads !== null) {
        this.leads = JSON.parse(savedLeads);
      } else {
        this.leads = [...MOCK_LEADS];
        this.saveLeads();
      }

      const savedApps = localStorage.getItem('boss_partner_apps');
      if (savedApps !== null) {
        this.applications = JSON.parse(savedApps);
      } else {
        this.applications = [];
      }

      const savedLandingReqs = localStorage.getItem('boss_landing_reqs');
      if (savedLandingReqs !== null) {
        this.landingPageRequests = JSON.parse(savedLandingReqs);
      } else {
        this.landingPageRequests = [];
      }
    } catch (e) {
      console.error("Vault Access Error:", e);
    }
  }

  private saveAll() {
    this.saveAffiliates();
    this.saveLeads();
    this.saveApps();
    this.saveLandingReqs();
  }

  private saveAffiliates() {
    localStorage.setItem('boss_affiliates', JSON.stringify(this.affiliates));
  }

  private saveLeads() {
    localStorage.setItem('boss_leads', JSON.stringify(this.leads));
  }

  private saveApps() {
    localStorage.setItem('boss_partner_apps', JSON.stringify(this.applications));
  }

  private saveLandingReqs() {
    localStorage.setItem('boss_landing_reqs', JSON.stringify(this.landingPageRequests));
  }

  getAffiliates(includeDeleted = false): Affiliate[] {
    this.loadData();
    return includeDeleted ? this.affiliates : this.affiliates.filter(a => !a.isDeleted);
  }

  createAffiliate(data: Omit<Affiliate, 'id' | 'referralCode' | 'niche' | 'lifetimeEarnings' | 'monthlyResiduals'>): Affiliate {
    const newAffiliate: Affiliate = {
      ...data,
      id: `aff-${Date.now()}`,
      referralCode: `BOSS-${data.username.toUpperCase()}`,
      niche: Niche.GENERAL,
      lifetimeEarnings: 0,
      monthlyResiduals: 0,
      slug: data.username.toLowerCase().replace(/\s+/g, '-'),
      role: data.role || 'partner'
    };
    this.affiliates.push(newAffiliate);
    this.saveAffiliates();
    return newAffiliate;
  }

  getAffiliateBySlug(slug: string): Affiliate | undefined {
    this.loadData();
    return this.affiliates.find(a => a.slug === slug && !a.isDeleted);
  }

  getAffiliateById(id: string): Affiliate | undefined {
    this.loadData();
    return this.affiliates.find(a => a.id === id);
  }

  getLeadsForAffiliate(affiliateId: string, includeDeleted = false): Lead[] {
    this.loadData();
    return this.leads
      .filter(l => l.affiliateId === affiliateId && (includeDeleted || !l.isDeleted))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getGlobalLeads(includeDeleted = false): Lead[] {
    this.loadData();
    return includeDeleted ? this.leads : this.leads.filter(l => !l.isDeleted);
  }

  updateLeadStatus(leadId: string, status: LeadStatus): void {
    this.loadData();
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.status = status;
      this.saveLeads();
    }
  }

  addLead(affiliateId: string, name: string, email: string, phone: string, details?: Lead['details']): Lead {
    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      affiliateId,
      name,
      email,
      phone,
      status: LeadStatus.RECEIVED,
      createdAt: new Date().toISOString(),
      details,
      productType: 'In Review',
      commissionEarned: 0
    };
    this.leads.push(newLead);
    this.saveLeads();
    return newLead;
  }

  submitApplication(appData: Omit<PartnerApplication, 'id' | 'createdAt'>): void {
    const newApp: PartnerApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.applications.push(newApp);
    this.saveApps();
  }

  getApplications(includeDeleted = false): PartnerApplication[] {
    this.loadData();
    const filtered = includeDeleted ? this.applications : this.applications.filter(a => !a.isDeleted);
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  submitLandingPageRequest(requestData: Omit<LandingPageRequest, 'id' | 'createdAt'>): void {
    const newRequest: LandingPageRequest = {
      ...requestData,
      id: `lpr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.landingPageRequests.push(newRequest);
    this.saveLandingReqs();
  }

  getLandingPageRequests(includeDeleted = false): LandingPageRequest[] {
    this.loadData();
    const filtered = includeDeleted ? this.landingPageRequests : this.landingPageRequests.filter(a => !a.isDeleted);
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  login(username: string, password: string): Affiliate | null {
    this.loadData();
    const user = this.affiliates.find(a => 
      a.username.toLowerCase() === username.toLowerCase() && 
      a.password === password &&
      !a.isDeleted
    );
    return user || null;
  }

  deleteEntry(type: 'lead' | 'application' | 'landing_request' | 'affiliate', id: string) {
    this.loadData(); 
    const now = new Date().toISOString();
    switch(type) {
      case 'lead':
        const lead = this.leads.find(l => l.id === id);
        if (lead) { lead.isDeleted = true; lead.deletedAt = now; }
        this.saveLeads();
        break;
      case 'application':
        const app = this.applications.find(a => a.id === id);
        if (app) { app.isDeleted = true; app.deletedAt = now; }
        this.saveApps();
        break;
      case 'landing_request':
        const req = this.landingPageRequests.find(r => r.id === id);
        if (req) { req.isDeleted = true; req.deletedAt = now; }
        this.saveLandingReqs();
        break;
      case 'affiliate':
        const aff = this.affiliates.find(a => a.id === id);
        if (aff) { aff.isDeleted = true; aff.deletedAt = now; }
        this.saveAffiliates();
        break;
    }
  }

  restoreEntry(type: 'lead' | 'application' | 'landing_request' | 'affiliate', id: string) {
    this.loadData();
    switch(type) {
      case 'lead':
        const lead = this.leads.find(l => l.id === id);
        if (lead) { delete lead.isDeleted; delete lead.deletedAt; }
        this.saveLeads();
        break;
      case 'application':
        const app = this.applications.find(a => a.id === id);
        if (app) { delete app.isDeleted; delete app.deletedAt; }
        this.saveApps();
        break;
      case 'landing_request':
        const req = this.landingPageRequests.find(r => r.id === id);
        if (req) { delete req.isDeleted; delete req.deletedAt; }
        this.saveLandingReqs();
        break;
      case 'affiliate':
        const aff = this.affiliates.find(a => a.id === id);
        if (aff) { delete aff.isDeleted; delete aff.deletedAt; }
        this.saveAffiliates();
        break;
    }
  }

  purgeEntry(type: 'lead' | 'application' | 'landing_request' | 'affiliate', id: string) {
    this.loadData();
    switch(type) {
      case 'lead':
        this.leads = this.leads.filter(l => l.id !== id);
        this.saveLeads();
        break;
      case 'application':
        this.applications = this.applications.filter(a => a.id !== id);
        this.saveApps();
        break;
      case 'landing_request':
        this.landingPageRequests = this.landingPageRequests.filter(r => r.id !== id);
        this.saveLandingReqs();
        break;
      case 'affiliate':
        this.affiliates = this.affiliates.filter(a => a.id !== id);
        this.saveAffiliates();
        break;
    }
  }

  exportVault(): string {
    this.loadData();
    const vaultData = {
      affiliates: this.affiliates,
      leads: this.leads,
      applications: this.applications,
      landingPageRequests: this.landingPageRequests,
      exportedAt: new Date().toISOString(),
      version: '1.2'
    };
    return JSON.stringify(vaultData, null, 2);
  }

  importVault(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.affiliates && Array.isArray(data.affiliates)) {
        this.affiliates = data.affiliates;
        this.leads = data.leads || [];
        this.applications = data.applications || [];
        this.landingPageRequests = data.landingPageRequests || [];
        this.saveAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Vault Import Failed:", e);
      return false;
    }
  }
}

export const db = new DBService();
