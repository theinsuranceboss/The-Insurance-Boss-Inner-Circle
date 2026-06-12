
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
        // Sync mock credentials
        let updated = false;
        MOCK_AFFILIATES.forEach(mock => {
          const existingIdx = this.affiliates.findIndex(a => a.username.toLowerCase() === mock.username.toLowerCase());
          if (existingIdx === -1) {
            this.affiliates.push(mock);
            updated = true;
          } else if (this.affiliates[existingIdx].password !== mock.password) {
            this.affiliates[existingIdx].password = mock.password;
            updated = true;
          }
        });
        if (updated) this.saveAffiliates();
      } else {
        this.affiliates = [...MOCK_AFFILIATES];
        this.saveAffiliates();
      }

      const savedLeads = localStorage.getItem('boss_leads');
      if (savedLeads !== null) {
        this.leads = JSON.parse(savedLeads);
        // Sync mock leads
        let updated = false;
        MOCK_LEADS.forEach(mock => {
          const existingIdx = this.leads.findIndex(l => l.id === mock.id);
          if (existingIdx === -1) {
            this.leads.push(mock);
            updated = true;
          }
        });
        if (updated) this.saveLeads();
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

  private getDefaultLandingSettings(name: string): any {
    return {
      backgroundColor: '#0a0a0a',
      backgroundType: 'color',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1920',
      textColor: '#ffffff',
      accentColor: '#EAB308',
      blocks: [
        {
          id: 'block-hero',
          type: 'hero',
          title: 'Residual Value. Institutional Risk Placements.',
          content: 'Work directly with certified risk advisors representing over 50 gold-tier carrier syndicates. I have partnered with The Insurance Boss to connect your firm to custom commercial lines with absolute ease.',
          fontSize: '4xl',
          alignment: 'center',
          visible: true
        },
        {
          id: 'block-about',
          type: 'about',
          title: 'Your Dedicated Inner Circle Consultant',
          content: `Hello! I'm ${name}. As your elite Commercial Partner, I analyze and structure high-capacity, multi-tier corporate coverages, trucking logistics, and liability packages. Together, we translate complex coverages into simple residual security. No license required—just top tier results.`,
          fontSize: 'lg',
          alignment: 'left',
          visible: true
        },
        {
          id: 'block-insurance-types',
          type: 'insurance_types',
          title: 'A Full Suite of Insurance Solutions Offered',
          content: 'We provide specialized commercial carrier placement across four major risk matrices:',
          fontSize: '2xl',
          alignment: 'center',
          visible: true
        },
        {
          id: 'block-custom-text',
          type: 'custom_text',
          title: 'The Sovereign Carrier Advantage',
          content: 'Through our secure network, we gain direct brokerage line permissions to process high-volume placements across Amazon DSP fleets, long-haul trucking liability, general builder risk bonds, and multi-tier tech/cyber liability plans.',
          fontSize: 'md',
          alignment: 'center',
          visible: true
        },
        {
          id: 'block-quote-form',
          type: 'quote_form',
          title: 'Request Institutional Proposal Quote',
          content: 'Complete our secure 8-step commercial intake questionnaire. Your details are securely compiled into our system for underwriter placement.',
          fontSize: '2xl',
          alignment: 'center',
          visible: true
        }
      ]
    };
  }

  private enrichAffiliate(aff: Affiliate): Affiliate {
    if (!aff) return aff;
    const cloned = { ...aff };
    if (!cloned.photoUrl) {
      cloned.photoUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250`;
    }
    if (!cloned.landingSettings) {
      cloned.landingSettings = this.getDefaultLandingSettings(cloned.name);
    }
    return cloned;
  }

  getAffiliates(includeDeleted = false): Affiliate[] {
    this.loadData();
    const list = includeDeleted ? this.affiliates : this.affiliates.filter(a => !a.isDeleted);
    return list.map(a => this.enrichAffiliate(a));
  }

  createAffiliate(data: Omit<Affiliate, 'id' | 'referralCode' | 'niche' | 'lifetimeEarnings' | 'monthlyResiduals' | 'slug'>): Affiliate {
    const usernameClean = data.username.toLowerCase().replace(/\s+/g, '-');
    const newAffiliate: Affiliate = {
      ...data,
      id: `aff-${Date.now()}`,
      referralCode: `BOSS-${data.username.toUpperCase()}`,
      niche: Niche.GENERAL,
      lifetimeEarnings: 0,
      monthlyResiduals: 0,
      slug: usernameClean,
      role: data.role || 'partner'
    };
    newAffiliate.photoUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250';
    newAffiliate.landingSettings = this.getDefaultLandingSettings(newAffiliate.name);
    
    this.affiliates.push(newAffiliate);
    this.saveAffiliates();
    return newAffiliate;
  }

  getAffiliateBySlug(slug: string): Affiliate | undefined {
    this.loadData();
    const aff = this.affiliates.find(a => a.slug === slug && !a.isDeleted);
    return aff ? this.enrichAffiliate(aff) : undefined;
  }

  getAffiliateById(id: string): Affiliate | undefined {
    this.loadData();
    const aff = this.affiliates.find(a => a.id === id);
    return aff ? this.enrichAffiliate(aff) : undefined;
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

  updateAffiliatePassword(affiliateId: string, newPassword: string): void {
    this.loadData();
    const affiliate = this.affiliates.find(a => a.id === affiliateId);
    if (affiliate) {
      affiliate.password = newPassword;
      this.saveAffiliates();
    }
  }

  updateAffiliate(id: string, data: Partial<Affiliate>): void {
    this.loadData();
    const affiliate = this.affiliates.find(a => a.id === id);
    if (affiliate) {
      Object.assign(affiliate, data);
      this.saveAffiliates();
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

  /**
   * Security Manager Protocol: Authentication via InnerCircleAuth_Log
   * Step 1: Search 'Email' column (ignore case)
   * Step 2: Retrieve corresponding 'Password'
   * Step 3: Compare 8-digit numeric password (as strings)
   */
  async syncAuthLog(): Promise<void> {
    console.log("Starting InnerCircleAuth_Log synchronization...");
    try {
      const SPREADSHEET_ID = '1qGXGMzSokRUXO7-UjePQTdV1RjFqI5A_TdWvx2PHBYM';
      const GID = '0';
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      const lines = text.split(/\r?\n/);
      console.log(`Fetched ${lines.length} lines from auth log.`);
      
      this.loadData();
      let updated = false;
      const updatedEmails = new Set<string>();
      
      const startLine = (lines.length > 0 && lines[0].toLowerCase().includes('email')) ? 1 : 0;
      
      // Process lines in reverse order (bottom to top) to prefer the most recent entries
      for (let i = lines.length - 1; i >= startLine; i--) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple but effective CSV/Pipe parsing
        let parts: string[] = [];
        if (line.includes('|')) {
          parts = line.split('|');
        } else {
          // Basic CSV split that handles simple quotes
          parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());
        }
        
        if (parts.length < 2) continue;
        
        const email = parts[0].toLowerCase().trim();
        const password = parts[1].trim();
        
        if (!email || !password) continue;

        const existing = this.affiliates.find(a => a.email.toLowerCase() === email);
        if (!existing) {
          console.log(`Adding new Inner Circle member: ${email}`);
          const username = email.split('@')[0];
          const newAffiliate: Affiliate = {
            id: `aff-${username}-${Math.random().toString(36).substr(2, 4)}`,
            username: username,
            email: email,
            password: password,
            name: username.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            role: 'partner',
            niche: Niche.GENERAL,
            referralCode: `BOSS-${username.toUpperCase()}`,
            slug: username.toLowerCase().replace(/\s+/g, '-'),
            lifetimeEarnings: 0,
            monthlyResiduals: 0
          };
          this.affiliates.push(newAffiliate);
          updated = true;
        } else if (String(existing.password).trim() !== password && !updatedEmails.has(email)) {
          // Only update if we haven't already updated this email in this sync session
          console.log(`Updating password for: ${email} to ${password}`);
          existing.password = password;
          updated = true;
        }
        updatedEmails.add(email);
      }
      
      if (updated) {
        this.saveAffiliates();
        console.log("Vault updated with new credentials.");
      } else {
        console.log("No credential changes detected.");
      }
    } catch (e) {
      console.error("Security Manager Sync Error:", e);
      this.loadData();
    }
  }

  async login(email: string, password: string): Promise<Affiliate | null> {
    // Attempt sync but don't let it block indefinitely
    try {
      await Promise.race([
        this.syncAuthLog(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 6000))
      ]);
    } catch (e) {
      console.warn("Login sync skipped or failed:", e);
    }
    
    this.loadData();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    const user = this.affiliates.find(a => 
      (a.email.toLowerCase() === cleanEmail || a.username.toLowerCase() === cleanEmail) && 
      String(a.password).trim() === cleanPassword &&
      !a.isDeleted
    );
    
    return user || null;
  }

  async emailExists(email: string): Promise<boolean> {
    this.loadData();
    const clean = email.toLowerCase().trim();
    return this.affiliates.some(a => (a.email.toLowerCase() === clean || a.username.toLowerCase() === clean) && !a.isDeleted);
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
