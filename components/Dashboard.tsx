
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../services/dbService';
import { Affiliate, Lead, LeadStatus, PartnerApplication, LandingPageRequest } from '../types';
import { Button } from './Button';
import { MultiStepForm, FormInput } from './LandingPage';
import { PromotionPage } from './PromotionPage';

interface DashboardProps {
  user: Affiliate;
  onLogout: () => void;
}

type Tab = 'overview' | 'leads' | 'applications' | 'landing_requests' | 'payouts' | 'tools' | 'program' | 'affiliate_manager' | 'recycle_bin';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [landingRequests, setLandingRequests] = useState<LandingPageRequest[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  
  const [deletedLeads, setDeletedLeads] = useState<Lead[]>([]);
  const [deletedApps, setDeletedApps] = useState<PartnerApplication[]>([]);
  const [deletedLandingReqs, setDeletedLandingReqs] = useState<LandingPageRequest[]>([]);
  const [deletedAffiliates, setDeletedAffiliates] = useState<Affiliate[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>(user.role === 'admin' ? 'applications' : 'overview');
  const [copySuccess, setCopySuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Customization form state
  const [customNiche, setCustomNiche] = useState('Medical & Healthcare');
  const [customNotes, setCustomNotes] = useState('');

  // User Manager state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'partner' as 'partner' | 'admin'
  });
  
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/#/${user.slug}`;

  const updateData = useCallback(() => {
    if (user.role === 'admin') {
      const allApps = db.getApplications(true);
      const allLand = db.getLandingPageRequests(true);
      const allAff = db.getAffiliates(true);

      setApplications(allApps.filter(a => !a.isDeleted));
      setLandingRequests(allLand.filter(r => !r.isDeleted));
      setAffiliates(allAff.filter(a => !a.isDeleted));
      
      setDeletedApps(allApps.filter(a => a.isDeleted));
      setDeletedLandingReqs(allLand.filter(r => r.isDeleted));
      setDeletedAffiliates(allAff.filter(a => a.isDeleted));
    } else {
      const allLeads = db.getLeadsForAffiliate(user.id, true);
      setLeads(allLeads.filter(l => !l.isDeleted));
      setDeletedLeads(allLeads.filter(l => l.isDeleted));
    }
  }, [user.id, user.role]);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [updateData]);

  const copyToClipboard = async (text: string = referralLink) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCustomizationSubmit = () => {
    db.submitLandingPageRequest({
      affiliateId: user.id,
      affiliateName: user.name,
      niche: customNiche,
      notes: customNotes
    });
    setSelectedAsset(null);
    setCustomNotes('');
    alert('Customization Request Logged!');
    updateData();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    db.createAffiliate(newUser);
    updateData();
    setNewUser({ name: '', email: '', username: '', password: '', role: 'partner' });
    alert('Inner Circle Member Provisioned Successfully.');
  };

  const handleDelete = (type: 'lead' | 'application' | 'landing_request' | 'affiliate', id: string) => {
    if(confirm('Move this entry to the Recycling Bin?')) {
      db.deleteEntry(type, id);
      updateData();
    }
  };

  const handleRestore = (type: 'lead' | 'application' | 'landing_request' | 'affiliate', id: string) => {
    db.restoreEntry(type, id);
    alert('Entry restored to active database.');
    updateData();
  };

  const handlePurge = (type: 'lead' | 'application' | 'landing_request' | 'affiliate', id: string) => {
    if(confirm('PERMANENT ACTION: This will be deleted from the vault forever. Purge now?')) {
      db.purgeEntry(type, id);
      updateData();
    }
  };

  const handleExportVault = () => {
    const data = db.exportVault();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InsuranceBoss_InnerCircle_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.importVault(content);
      if (success) {
        alert("Vault Re-Synchronized Successfully. Reloading...");
        window.location.reload();
      } else {
        alert("Error: Invalid Vault Data Package.");
      }
    };
    reader.readAsText(file);
  };

  const activePolicies = leads.filter(l => l.status === LeadStatus.ACTIVE || l.status === LeadStatus.BOUND).length;
  const lifetimeEarnings = user.lifetimeEarnings || 0;
  const monthlyResiduals = user.monthlyResiduals || 0;

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.ACTIVE: return 'bg-green-500/10 text-green-500 border-green-500/20';
      case LeadStatus.BOUND: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case LeadStatus.QUOTED: return 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="border-b border-white/5 bg-[#171717]/80 px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="bg-[#EAB308] text-black font-black p-2 rounded text-lg leading-none">IB</div>
          <div className="hidden md:flex items-center gap-6">
            {!isAdmin ? (
              (['overview', 'leads', 'payouts', 'tools', 'program', 'recycle_bin'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-bold tracking-widest transition-colors capitalize ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab === 'leads' ? 'Lead Vault' : tab === 'recycle_bin' ? 'Recycling Bin' : tab === 'payouts' ? 'Earnings' : tab === 'tools' ? 'Inner Circle Tools' : tab === 'program' ? 'Inner Circle Info' : tab}
                </button>
              ))
            ) : (
              (['applications', 'landing_requests', 'affiliate_manager', 'recycle_bin'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-bold tracking-widest transition-colors capitalize ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab === 'applications' ? 'Membership Inquiries' : tab === 'landing_requests' ? 'Landing Requests' : tab === 'recycle_bin' ? 'Recycling Bin' : 'Circle Member Manager'}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:block text-right">
            <div className="text-[9px] text-gray-500 font-black tracking-widest uppercase">{isAdmin ? 'Executive Desk' : 'Inner Circle Member'}</div>
            <div className="text-sm font-bold">{user.name}</div>
          </div>
          <button onClick={onLogout} className="text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 font-black uppercase tracking-widest">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {isAdmin && activeTab === 'applications' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#171717] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h2 className="text-2xl font-black tracking-tighter">Inner Circle Membership Inquiries</h2>
                <div className="text-xs text-[#EAB308] font-black tracking-widest">Prospect Intake</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] text-gray-500 border-b border-white/5 tracking-[0.2em] bg-black/10 uppercase font-black">
                      <th className="px-8 py-5">Prospect Details</th>
                      <th className="px-8 py-5">Business Context</th>
                      <th className="px-8 py-5">Industry</th>
                      <th className="px-8 py-5">Volume</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {applications.length > 0 ? applications.map(app => (
                      <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                           <div className="text-white text-lg">{app.fullName}</div>
                           <div className="text-gray-600 text-[10px] font-mono">{app.email}</div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-400">{app.businessName}</td>
                        <td className="px-8 py-6 text-sm text-[#EAB308] tracking-wider">{app.industry}</td>
                        <td className="px-8 py-6 text-white font-black">{app.avgReferrals}</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleDelete('application', app.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-gray-600 font-bold tracking-widest uppercase">No Pending Membership Inquiries</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isAdmin && activeTab === 'landing_requests' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-[#171717] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h2 className="text-2xl font-black tracking-tighter">Inner Circle Customization Pipeline</h2>
                <div className="text-xs text-[#EAB308] font-black tracking-widest">Asset Production</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] text-gray-500 border-b border-white/5 tracking-[0.2em] bg-black/10 uppercase font-black">
                      <th className="px-8 py-5">Circle Member</th>
                      <th className="px-8 py-5">Requested Niche</th>
                      <th className="px-8 py-5">Producer Notes</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {landingRequests.length > 0 ? landingRequests.map(req => (
                      <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                           <div className="text-white text-lg">{req.affiliateName}</div>
                        </td>
                        <td className="px-8 py-6 text-sm text-[#EAB308] tracking-wider">{req.niche}</td>
                        <td className="px-8 py-6 text-sm text-gray-400 max-w-md truncate">{req.notes || 'None'}</td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleDelete('landing_request', req.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-600 font-bold tracking-widest uppercase">No Customization Assets in Pipeline</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recycle_bin' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-4xl font-black tracking-tighter mb-2">Recycling Bin</h1>
                   <p className="text-gray-500 tracking-widest text-xs font-bold uppercase">Vault Recovery & Data Purge</p>
                </div>
             </div>

             <div className="space-y-10">
                {isAdmin ? (
                  <>
                    <RecycleTable 
                      title="Deleted Membership Inquiries" 
                      items={deletedApps} 
                      onRestore={(id: string) => handleRestore('application', id)} 
                      onPurge={(id: string) => handlePurge('application', id)}
                      renderRow={(app: any) => (
                        <>
                          <td className="px-8 py-6"><div className="text-white">{app.fullName}</div><div className="text-[10px] text-gray-500 font-mono">{app.email}</div></td>
                          <td className="px-8 py-6 text-gray-400 text-sm">{app.businessName}</td>
                          <td className="px-8 py-6 text-[#EAB308] text-xs font-black tracking-widest">{app.industry}</td>
                        </>
                      )}
                    />
                    <RecycleTable 
                      title="Deleted Landing Assets" 
                      items={deletedLandingReqs} 
                      onRestore={(id: string) => handleRestore('landing_request', id)} 
                      onPurge={(id: string) => handlePurge('landing_request', id)}
                      renderRow={(req: any) => (
                        <>
                          <td className="px-8 py-6 text-white">{req.affiliateName}</td>
                          <td className="px-8 py-6 text-[#EAB308] text-xs font-black tracking-widest">{req.niche}</td>
                          <td className="px-8 py-6 text-gray-500 text-sm italic">"{req.notes}"</td>
                        </>
                      )}
                    />
                    <RecycleTable 
                      title="Deleted Inner Circle Members" 
                      items={deletedAffiliates} 
                      onRestore={(id: string) => handleRestore('affiliate', id)} 
                      onPurge={(id: string) => handlePurge('affiliate', id)}
                      renderRow={(aff: any) => (
                        <>
                          <td className="px-8 py-6 text-white">{aff.name}</td>
                          <td className="px-8 py-6 text-gray-400 text-xs font-mono">@{aff.username}</td>
                          <td className="px-8 py-6 text-gray-500 text-xs">{aff.referralCode}</td>
                        </>
                      )}
                    />
                  </>
                ) : (
                  <RecycleTable 
                    title="Deleted Lead Transactions" 
                    items={deletedLeads} 
                    onRestore={(id: string) => handleRestore('lead', id)} 
                    onPurge={(id: string) => handlePurge('lead', id)}
                    renderRow={(lead: any) => (
                      <>
                        <td className="px-8 py-6 text-white">{lead.name}</td>
                        <td className="px-8 py-6 text-gray-400 text-sm">{lead.productType}</td>
                        <td className="px-8 py-6 text-gray-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      </>
                    )}
                  />
                )}
             </div>
          </div>
        )}

        {isAdmin && activeTab === 'affiliate_manager' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#111] p-8 rounded-3xl border-2 border-dashed border-[#EAB308]/20 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                  <div className="bg-[#EAB308]/10 p-4 rounded-2xl">
                    <svg className="w-8 h-8 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Vault Synchronization Tool</h3>
                    <p className="text-sm text-gray-500 font-bold">Backup or sync the entire Insurance Boss Inner Circle database package.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <Button variant="outline" onClick={handleExportVault} className="text-xs uppercase">Export Vault</Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportVault} 
                    accept=".json" 
                    className="hidden" 
                  />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs uppercase">Import Vault</Button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-[#171717] p-8 rounded-3xl border border-white/5 shadow-2xl">
                <h3 className="text-2xl font-black tracking-tighter mb-6">Provision New Member</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <FormInput label="Full Name" value={newUser.name} onChange={(v: string) => setNewUser({...newUser, name: v})} placeholder="e.g. John Doe" />
                  <FormInput label="Email Address" type="email" value={newUser.email} onChange={(v: string) => setNewUser({...newUser, email: v})} placeholder="john@example.com" />
                  <FormInput label="Assigned Username" value={newUser.username} onChange={(v: string) => setNewUser({...newUser, username: v})} placeholder="jdoe" />
                  <FormInput label="Assigned Password" type="text" value={newUser.password} onChange={(v: string) => setNewUser({...newUser, password: v})} placeholder="••••••••" />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#EAB308] tracking-widest uppercase">System Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'partner' | 'admin'})}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 font-bold text-white appearance-none"
                    >
                        <option value="partner">Inner Circle Member</option>
                        <option value="admin">Executive Desk</option>
                    </select>
                  </div>
                  <Button fullWidth type="submit" className="mt-4">Authorize Member</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-[#171717] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h2 className="text-2xl font-black tracking-tighter">Inner Circle Roll Call</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] text-gray-500 border-b border-white/5 tracking-[0.2em] bg-black/10 uppercase font-black">
                        <th className="px-8 py-5">Member Name</th>
                        <th className="px-8 py-5">Access Level</th>
                        <th className="px-8 py-5">Vault Code</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-bold">
                      {affiliates.map(aff => (
                        <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-6">
                            <div className="text-white text-base">{aff.name}</div>
                            <div className="text-gray-500 text-[10px] font-mono tracking-widest">@{aff.username}</div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${aff.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20'}`}>
                              {aff.role === 'admin' ? 'EXECUTIVE' : 'MEMBER'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-400 font-mono">{aff.referralCode}</td>
                          <td className="px-8 py-6 text-right flex justify-end gap-4">
                            <button onClick={() => copyToClipboard(`${baseUrl}/#/${aff.slug}`)} className="text-[10px] text-gray-500 hover:text-white font-black uppercase tracking-widest transition-colors">Copy URL</button>
                            {aff.username !== user.username && (
                               <button onClick={() => handleDelete('affiliate', aff.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAdmin && activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
               <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2">Inner Circle Dashboard</h1>
                  <p className="text-gray-500 tracking-widest text-xs font-bold uppercase">Personal Priority Performance</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Circle Referrals" value={leads.length} />
              <StatCard label="Contracts Secured" value={leads.filter(l => l.status !== LeadStatus.RECEIVED && l.status !== LeadStatus.QUOTED).length} />
              <StatCard label="Active Portfolio" value={activePolicies} color="#3b82f6" />
              <StatCard label="Monthly Residuals" value={`$${monthlyResiduals}`} color="#EAB308" />
              <StatCard label="Lifetime Dividends" value={`$${lifetimeEarnings}`} color="#22c55e" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#111] border border-white/5 p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-black tracking-tighter">Inner Circle Assets</h2>
                  <div className="space-y-4">
                    <div className="bg-black p-4 rounded-xl border border-white/10 flex flex-col items-center gap-4">
                      <div className="bg-white p-2 rounded-lg w-32 h-32 flex items-center justify-center">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referralLink)}`} alt="QR Code" className="w-full h-full" />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 tracking-widest">Priority Member QR</span>
                    </div>
                    <Button fullWidth onClick={() => copyToClipboard()} variant={copySuccess ? 'outline' : 'primary'}>
                      {copySuccess ? 'Inner Circle Link Copied!' : 'Copy Priority Link'}
                    </Button>
                  </div>
                </div>

                <div className="bg-[#171717] p-8 rounded-3xl border border-white/5">
                  <h2 className="text-xl font-black tracking-tighter mb-4">Executive Support</h2>
                  <p className="text-sm text-gray-500 font-bold mb-6">Need underwriting prioritization? Contact your dedicated manager.</p>
                  <a href="https://theinsuranceboss.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" fullWidth className="text-xs">Access Priority Desk</Button>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-2 bg-[#EAB308] text-black p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <h2 className="text-3xl font-black tracking-tighter mb-2">Priority Lead Intake</h2>
                   <p className="text-black/80 font-bold mb-8">Directly deposit lead data into the Inner Circle vault.</p>
                   <div className="bg-[#0a0a0a] rounded-[32px] p-2 overflow-hidden shadow-2xl">
                    {!formSubmitted ? (
                      <MultiStepForm 
                        affiliateId={user.id} 
                        onSuccess={() => {
                          setFormSubmitted(true);
                          updateData();
                          setTimeout(() => setFormSubmitted(false), 5000);
                        }} 
                      />
                    ) : (
                      <div className="bg-[#111] p-12 text-center text-white rounded-[30px]">
                        <div className="w-20 h-20 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-6">
                           <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter mb-2">Transmission Verified</h3>
                        <Button onClick={() => setFormSubmitted(false)}>Submit Another</Button>
                      </div>
                    )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAdmin && activeTab === 'leads' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#171717] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h2 className="text-2xl font-black tracking-tighter">Inner Circle Lead Vault</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] text-gray-500 border-b border-white/5 tracking-[0.2em] bg-black/10 uppercase font-black">
                      <th className="px-8 py-5">Prospect Identity</th>
                      <th className="px-8 py-5">Product Target</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Accrued Commission</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {leads.length > 0 ? leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                           <div className="text-white text-lg">{lead.name}</div>
                           <div className="text-gray-600 text-[10px] font-mono">{lead.email}</div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-400">{lead.productType || 'In Underwriting'}</td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-white">${lead.commissionEarned?.toFixed(2) || '0.00'}</td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete('lead', lead.id); }} 
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-gray-700 font-bold tracking-widest">Lead Vault Currently Empty</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!isAdmin && activeTab === 'payouts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95">
             <div className="bg-[#171717] p-10 rounded-3xl border border-white/5">
                <h3 className="text-2xl font-black mb-8 tracking-tighter">Inner Circle Statement</h3>
                <div className="space-y-6">
                   <PayoutRow label="Current Month Dividends" value={`$${monthlyResiduals}`} />
                   <PayoutRow label="Pending Disbursements" value="$0.00" />
                   <PayoutRow label="Next Payout Date" value="June 1, 2024" />
                   <div className="pt-6 border-t border-white/5">
                     <Button variant="outline" fullWidth>Request Priority Disbursement</Button>
                   </div>
                </div>
             </div>
             <div className="bg-[#171717] p-10 rounded-3xl border border-white/5">
                <h3 className="text-2xl font-black mb-8 tracking-tighter">Financial Routing</h3>
                <div className="bg-black/40 p-6 rounded-2xl border border-[#EAB308]/20 mb-8 flex items-center gap-6">
                   <div className="w-12 h-12 rounded-xl bg-[#EAB308] text-black flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3-3v8a3 3 0 003 3z" /></svg>
                   </div>
                   <div>
                      <div className="font-black text-sm">Priority Direct Deposit</div>
                      <div className="text-xs text-gray-500 font-mono">**** **** **** 8842</div>
                   </div>
                </div>
                <Button variant="secondary" fullWidth className="text-xs">Update Routing Protocol</Button>
             </div>
          </div>
        )}

        {!isAdmin && activeTab === 'tools' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ToolCard 
                title="Priority Email Scripts" 
                desc="High-conversion templates for Inner Circle member networking." 
                onClick={() => setSelectedAsset('email')}
              />
              <ToolCard 
                title="Inner Circle Digital Assets" 
                desc="Exclusive pre-branded PDFs for prioritized client distribution." 
                onClick={() => setSelectedAsset('flyers')}
              />
              <ToolCard 
                title="Elite SMS Templates" 
                desc="Quick priority snippets for member referral distribution." 
                onClick={() => setSelectedAsset('sms')}
              />
              <ToolCard 
                title="Custom Vault Generator" 
                desc="Request a specialized landing page from our marketing producers." 
                onClick={() => setSelectedAsset('generator')}
              />
           </div>
        )}

        {!isAdmin && activeTab === 'program' && <PromotionPage standalone={false} />}
      </main>

      {/* ASSET MODAL SYSTEM */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
           <div className="relative w-full max-w-4xl bg-[#171717] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                 <h2 className="text-2xl font-black tracking-tighter">
                   {selectedAsset === 'email' && "Inner Circle Email Scripts"}
                   {selectedAsset === 'flyers' && "Inner Circle Digital Assets"}
                   {selectedAsset === 'sms' && "Elite SMS Templates"}
                   {selectedAsset === 'generator' && "Inner Circle Vault Customization"}
                 </h2>
                 <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <div className="p-8 overflow-y-auto no-scrollbar flex-grow">
                 {selectedAsset === 'email' && (
                   <div className="space-y-12">
                      <AssetItem 
                        title="Elite Template: For Real Estate Partners"
                        content={`Subject: Priority Insurance Support for Your Closings\n\nHi [Name],\n\nI'm ${user.name}, part of the Executive Desk at The Insurance Boss Inner Circle. I'm reaching out because I know that securing clear-to-close is your top priority.\n\nMy team handles white-glove insurance reviews for high-value home buyers. We handle the market shopping across 50+ national carriers so your clients get the absolute best rates with priority turnaround.\n\nWould you like to authorize a quick 5-min briefing on how we can speed up your next closing?\n\nBest,\n${user.name}`}
                        onCopy={(text) => copyToClipboard(text)}
                      />
                      <AssetItem 
                        title="Elite Template: For High-Volume Mortgage Brokers"
                        content={`Subject: Accelerating Clear-To-Close with Priority Underwriting\n\nHi [Name],\n\nStalling a closing due to insurance binders is a thing of the past. I'm ${user.name}, and I currently hold Inner Circle priority access to a senior underwriting desk that specializes in lightning-fast turnaround.\n\nIf you have high-DTI clients or complex files needing immediate binders, I can prioritize them through my verified vault.\n\nPoint them directly to my priority link here: ${referralLink}\n\nI'll personally monitor the underwriting and provide status updates.\n\nRegards,\n${user.name}`}
                        onCopy={(text) => copyToClipboard(text)}
                      />
                   </div>
                 )}

                 {selectedAsset === 'sms' && (
                   <div className="space-y-12">
                      <AssetItem 
                        title="Inner Circle Intro (Casual)"
                        content={`Hey [Name]! If you need a solid coverage review, I have priority access to The Insurance Boss Inner Circle. They are the best in the business. Check it out through my verified link: ${referralLink}`}
                        onCopy={(text) => copyToClipboard(text)}
                      />
                      <AssetItem 
                        title="Priority Referral (Professional)"
                        content={`Hi [Name], for your commercial coverage needs, I'm recommending my partners at The Insurance Boss Inner Circle. They handle nationwide priority accounts. Use my link to get moved to the top of the queue: ${referralLink}`}
                        onCopy={(text) => copyToClipboard(text)}
                      />
                   </div>
                 )}

                 {selectedAsset === 'flyers' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FlyerCard title="Inner Circle Referral Flyer" preview="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400" />
                      <FlyerCard title="Inner Circle Business One-Pager" preview="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400" />
                      <FlyerCard title="Priority Claims Breakdown" preview="https://images.unsplash.com/photo-1454165833767-02a1e74a8368?auto=format&fit=crop&q=80&w=400" />
                      <FlyerCard title="Member Onboarding Package" preview="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400" />
                   </div>
                 )}

                 {selectedAsset === 'generator' && (
                   <div className="max-w-xl mx-auto space-y-8 py-10">
                      <div className="text-center">
                        <h3 className="text-xl font-black mb-2">Request Specialized Vault</h3>
                        <p className="text-gray-500 text-sm font-bold">Our executive marketing desk will build a custom-niche vault for your verified account.</p>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 tracking-widest">Target Niche</label>
                           <select 
                            value={customNiche}
                            onChange={(e) => setCustomNiche(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 font-bold text-white appearance-none"
                           >
                              <option>Medical & Healthcare Elite</option>
                              <option>Ecommerce & Tech SaaS</option>
                              <option>VIP Hospitality & Venues</option>
                              <option>Real Estate & Development</option>
                              <option>Logistics & Nationwide Fleet</option>
                              <option>Specialized Request...</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 tracking-widest">Executive Briefing Notes</label>
                           <textarea 
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 font-bold text-white h-32 no-scrollbar" 
                            placeholder="Describe your target audience and strategic objective..."
                           ></textarea>
                        </div>
                        <Button fullWidth onClick={handleCustomizationSubmit}>Dispatch Request</Button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const RecycleTable = ({ title, items, onRestore, onPurge, renderRow }: any) => (
  <div className="bg-[#171717] rounded-3xl border border-white/5 overflow-hidden shadow-2xl mb-8">
    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
      <h2 className="text-2xl font-black tracking-tighter">{title}</h2>
      <div className="text-xs text-red-500 font-black tracking-widest">Recovery Repository</div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[9px] text-gray-500 border-b border-white/5 tracking-[0.2em] bg-black/10 uppercase font-black">
            <th className="px-8 py-5">Record Details</th>
            <th className="px-8 py-5">Member Context</th>
            <th className="px-8 py-5">Vault Timestamp</th>
            <th className="px-8 py-5 text-right">Synchronization</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-bold">
          {items.length > 0 ? items.map((item: any) => (
            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
              {renderRow(item)}
              <td className="px-8 py-6 text-right flex justify-end gap-3">
                <button 
                  onClick={() => onRestore(item.id)} 
                  className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-lg border border-green-500/20 font-black tracking-widest hover:bg-green-500 hover:text-black transition-all"
                >
                  Restore
                </button>
                <button 
                  onClick={() => onPurge(item.id)} 
                  className="text-[10px] bg-red-500/10 text-red-500 px-3 py-1 rounded-lg border border-red-500/20 font-black tracking-widest hover:bg-red-500 hover:text-black transition-all"
                >
                  Purge
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4} className="px-8 py-20 text-center text-gray-800 font-bold tracking-widest">Recovery Vault Empty</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const StatCard = ({ label, value, color = 'white' }: any) => (
  <div className="bg-[#171717] p-6 rounded-2xl border border-white/5 shadow-xl">
    <div className="text-gray-500 text-[9px] font-black mb-2 tracking-widest">{label}</div>
    <div className="text-3xl font-black" style={{ color }}>{value}</div>
  </div>
);

const PayoutRow = ({ label, value }: any) => (
  <div className="flex justify-between items-center group">
    <span className="text-gray-400 font-bold text-sm group-hover:text-white transition-colors">{label}</span>
    <span className="font-black text-white">{value}</span>
  </div>
);

const ToolCard = ({ title, desc, onClick }: any) => (
  <div className="bg-[#111] p-10 rounded-3xl border border-white/5 hover:border-[#EAB308]/30 transition-all flex flex-col justify-between group">
    <div>
      <h3 className="text-2xl font-black mb-4 tracking-tighter group-hover:text-[#EAB308] transition-colors">{title}</h3>
      <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8">{desc}</p>
    </div>
    <Button variant="outline" onClick={onClick} className="text-xs tracking-widest">Deploy Asset</Button>
  </div>
);

const AssetItem = ({ title, content, onCopy }: { title: string, content: string, onCopy: (t: string) => void }) => {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = () => {
    onCopy(content);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end">
          <h4 className="font-black text-lg tracking-tight text-[#EAB308]">{title}</h4>
          <button 
            onClick={handleCopy} 
            className={`text-[10px] font-black tracking-widest transition-colors ${justCopied ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
          >
            {justCopied ? 'COPIED!' : 'COPY TEXT'}
          </button>
       </div>
       <div className="bg-black/50 border border-white/5 p-6 rounded-2xl font-mono text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
          {content}
       </div>
    </div>
  );
};

const FlyerCard = ({ title, preview }: { title: string, preview: string }) => (
  <div className="bg-black/50 border border-white/5 rounded-2xl overflow-hidden hover:border-[#EAB308]/50 transition-all group">
     <div className="aspect-[4/5] relative overflow-hidden">
        <img src={preview} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt={title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
           <div className="text-xs font-black tracking-widest text-[#EAB308] mb-1">Elite Kit</div>
           <div className="font-black truncate">{title}</div>
        </div>
     </div>
     <div className="p-4 bg-black/80">
        <Button variant="outline" fullWidth className="text-[10px] py-2">Download PDF Asset</Button>
     </div>
  </div>
);
