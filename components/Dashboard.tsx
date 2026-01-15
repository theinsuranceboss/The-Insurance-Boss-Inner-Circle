
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../services/dbService';
import { Affiliate, Lead, LeadStatus } from '../types';
import { Button } from './Button';

interface DashboardProps {
  user: Affiliate;
  onLogout: () => void;
}

type Tab = 'overview' | 'leads' | 'payouts' | 'tools' | 'lead_management' | 'applications' | 'landing_requests' | 'member_management';

const StatusDropdown = ({ value, onChange, disabled = false }: { value: LeadStatus, onChange: (s: LeadStatus) => void, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (s: LeadStatus) => {
    switch (s) {
      case LeadStatus.BOUND: return 'bg-green-500/10 text-green-500 border-green-500/20';
      case LeadStatus.RECEIVED: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case LeadStatus.IN_PROGRESS: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case LeadStatus.QUOTED: return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case LeadStatus.REJECTED: return 'bg-red-500/10 text-red-500 border-red-500/20';
      case LeadStatus.BOUNCED: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 border px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all outline-none ${getStatusColor(value)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-125'}`}
      >
        {value}
        {!disabled && (
          <svg className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute left-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {(Object.values(LeadStatus) as LeadStatus[]).map((status) => (
            <div
              key={status}
              onClick={() => {
                onChange(status);
                setIsOpen(false);
              }}
              className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border-b border-white/5 last:border-none ${value === status ? 'bg-[#EAB308] text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              {status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children?: React.ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
    <div className="relative bg-[#111] border border-white/10 w-full max-w-3xl rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center p-8 border-b border-white/5">
        <h3 className="text-2xl font-black tracking-tighter text-white uppercase">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [globalLeads, setGlobalLeads] = useState<Lead[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(user.role === 'admin' ? 'lead_management' : 'overview');
  const [activeToolModal, setActiveToolModal] = useState<'email' | 'digital' | 'sms' | 'vault' | 'add_member' | null>(null);
  const [vaultNiche, setVaultNiche] = useState('Medical & Healthcare Elite');
  const [vaultNotes, setVaultNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewRecycleBin, setViewRecycleBin] = useState(false);

  // Add Member State
  const [newMember, setNewMember] = useState({ name: '', email: '', username: '', password: '', role: 'partner' as const });

  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/#/${user.slug}`;

  const updateData = useCallback(() => {
    if (user.role === 'admin') {
      const allLeads = db.getGlobalLeads(true);
      setGlobalLeads(allLeads);
      const allAffiliates = db.getAffiliates(true);
      setAffiliates(allAffiliates);
    } else {
      const allLeads = db.getLeadsForAffiliate(user.id, true);
      setLeads(allLeads);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [updateData]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Content copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleVaultRequest = () => {
    if (!vaultNotes) return alert("Please provide executive briefing notes.");
    db.submitLandingPageRequest({
      affiliateId: user.id,
      affiliateName: user.name,
      niche: vaultNiche,
      notes: vaultNotes
    });
    alert("Request dispatched to executive marketing desk!");
    setActiveToolModal(null);
    setVaultNotes('');
  };

  const handleUpdateStatus = (leadId: string, status: LeadStatus) => {
    db.updateLeadStatus(leadId, status);
    updateData();
  };

  const handleDeleteLead = (leadId: string) => {
    db.deleteEntry('lead', leadId);
    updateData();
  };

  const handleRestoreLead = (leadId: string) => {
    db.restoreEntry('lead', leadId);
    updateData();
    alert("Prospect restored to primary vault.");
  };

  const handlePurgeLead = (leadId: string) => {
    if (confirm("This will permanently erase the lead record from the vault. Continue?")) {
      db.purgeEntry('lead', leadId);
      updateData();
    }
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.username || !newMember.password || !newMember.email) {
      return alert("Please fill all member profile fields.");
    }
    db.createAffiliate({
      name: newMember.name,
      username: newMember.username,
      password: newMember.password,
      email: newMember.email,
      role: newMember.role,
      slug: '' // Generated by dbService
    });
    alert("New Inner Circle member authorized!");
    setActiveToolModal(null);
    setNewMember({ name: '', email: '', username: '', password: '', role: 'partner' });
    updateData();
  };

  const isAdmin = user.role === 'admin';

  const toolAssets = [
    {
      title: "Priority Email Scripts",
      description: "High-conversion templates for Inner Circle member networking.",
      action: () => setActiveToolModal('email')
    },
    {
      title: "Inner Circle Digital Assets",
      description: "Exclusive pre-branded PDFs for prioritized client distribution.",
      action: () => setActiveToolModal('digital')
    },
    {
      title: "Elite SMS Templates",
      description: "Quick priority snippets for member referral distribution.",
      action: () => setActiveToolModal('sms')
    },
    {
      title: "Custom Vault Generator",
      description: "Request a specialized landing page from our marketing producers.",
      action: () => setActiveToolModal('vault')
    }
  ];

  const filteredLeads = (isAdmin ? globalLeads : leads).filter(l => 
    (viewRecycleBin ? l.isDeleted : !l.isDeleted) && (
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#EAB308] selection:text-black">
      <nav className="border-b border-white/5 bg-[#111]/80 px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="bg-[#EAB308] text-black font-black p-2 rounded text-lg leading-none">IB</div>
          <div className="hidden md:flex items-center gap-6">
            {!isAdmin ? (
              (['overview', 'leads', 'payouts', 'tools'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab === 'leads' ? 'Lead Vault' : tab === 'payouts' ? 'Earnings' : tab === 'tools' ? 'Tools' : tab}
                </button>
              ))
            ) : (
              (['lead_management', 'member_management', 'applications', 'landing_requests'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab === 'lead_management' ? 'Global Vault' : tab === 'applications' ? 'Inquiries' : tab === 'member_management' ? 'Members' : 'Vault Requests'}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:block text-right">
            <div className="text-[9px] text-gray-500 font-black tracking-widest uppercase">{isAdmin ? 'Executive Desk' : 'Commercial Partner'}</div>
            <div className="text-sm font-bold">{user.name}</div>
          </div>
          <button onClick={onLogout} className="text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 font-black tracking-widest uppercase">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* OVERVIEW TAB */}
        {!isAdmin && activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard label="Active Portfolio" value={leads.filter(l => l.status === LeadStatus.BOUND).length} color="#3b82f6" />
              <StatCard label="Monthly Residuals" value={`$${user.monthlyResiduals || 0}`} color="#EAB308" />
              <StatCard label="Lifetime Dividends" value={`$${user.lifetimeEarnings || 0}`} color="#22c55e" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-2xl">
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-8 uppercase">Inner Circle Assets</h3>
                  <div className="bg-black aspect-square rounded-[24px] mb-8 flex flex-col items-center justify-center p-8 border border-white/5">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`} className="w-full max-w-[200px] grayscale invert" alt="QR Link" />
                    <p className="text-[10px] text-gray-600 font-black tracking-widest uppercase mt-4">Priority Member QR</p>
                  </div>
                  <button onClick={() => copyToClipboard(referralLink)} className="w-full bg-[#EAB308] text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm shadow-[0_10px_20px_rgba(234,179,8,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
                    Copy Priority Link
                  </button>
                </div>

                <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-2xl">
                  <h3 className="text-2xl font-black text-white tracking-tighter mb-4 uppercase">Executive Support</h3>
                  <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8">Need underwriting prioritization? Contact your dedicated manager.</p>
                  <button onClick={() => alert("Connecting to Inner Circle Executive Desk...")} className="w-full border-2 border-[#EAB308] text-[#EAB308] font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-[#EAB308] hover:text-black transition-all">
                    Access Priority Desk
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-[#EAB308] p-10 rounded-[40px] shadow-2xl">
                  <h2 className="text-4xl font-black text-black tracking-tighter mb-2 uppercase">Priority Lead Intake</h2>
                  <p className="text-black/80 font-bold text-sm mb-10">Directly deposit lead data into the Inner Circle vault.</p>
                  <DashboardForm affiliateId={user.id} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EARNINGS TAB */}
        {!isAdmin && activeTab === 'payouts' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div>
              <h1 className="text-5xl font-black tracking-tighter mb-2 text-white uppercase">Financial Hub</h1>
              <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase">Dividend Disbursement & Routing</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#111] border border-white/5 rounded-[40px] p-12 shadow-2xl flex flex-col justify-between min-h-[400px]">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Inner Circle Statement</h2>
                  <div className="text-[10px] text-[#EAB308] font-black tracking-[0.2em] uppercase mb-8">Yield: 3% of Gross Premium per Bound Policy</div>
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-400 font-bold text-sm">Current Month Dividends</span>
                      <span className="text-white font-black text-2xl tracking-tighter">${user.monthlyResiduals || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-gray-400 font-bold text-sm">Pending Disbursements</span>
                      <span className="text-white font-black text-2xl tracking-tighter">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center pb-4">
                      <span className="text-gray-400 font-bold text-sm">Next Payout Date</span>
                      <span className="text-white font-black text-xl tracking-tight uppercase">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => alert("Priority disbursement request sent to treasury.")} className="w-full mt-10 border-2 border-[#EAB308] text-[#EAB308] font-black uppercase tracking-widest text-[11px] py-5 rounded-xl hover:bg-[#EAB308] hover:text-black transition-all">Request Priority Disbursement</button>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-[40px] p-12 shadow-2xl flex flex-col justify-between min-h-[400px]">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-12 uppercase">Financial Routing</h2>
                  <div className="bg-black border border-white/5 rounded-3xl p-8 flex items-center gap-6">
                    <div className="w-14 h-14 bg-[#EAB308] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <div>
                      <div className="text-white font-black text-lg tracking-tight mb-1">Priority Direct Deposit</div>
                      <div className="text-gray-600 font-bold text-xs tracking-[0.2em]">**** **** **** 8842</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => alert("Redirecting to secure financial vault for routing updates...")} className="w-full mt-10 bg-white/5 text-gray-300 font-black uppercase tracking-widest text-[11px] py-5 rounded-xl hover:bg-white/10 transition-all border border-white/5">Update Routing Protocol</button>
              </div>
            </div>
          </div>
        )}

        {/* LEAD VAULT TAB */}
        {(activeTab === 'leads' || activeTab === 'lead_management') && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-black tracking-tighter mb-2 text-white uppercase">
                  {viewRecycleBin ? 'Leads Recycle Bin' : (isAdmin ? 'Global Lead Vault' : 'Your Lead Vault')}
                </h1>
                <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase">
                  {viewRecycleBin ? 'DELETED RECORDS PENDING PURGE' : 'Live Underwriting Transmission Feed'}
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => setViewRecycleBin(!viewRecycleBin)}
                  className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${viewRecycleBin ? 'bg-[#EAB308] text-black border-[#EAB308]' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                >
                  {viewRecycleBin ? 'Back To Vault' : 'Recycle Bin'}
                </button>
                <div className="w-full md:w-96 relative">
                  <input type="text" placeholder="Search prospects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-2xl px-12 py-4 focus:outline-none focus:border-[#EAB308] transition-all text-sm font-bold placeholder:text-gray-700" />
                  <svg className="w-5 h-5 absolute left-4 top-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[40px] shadow-2xl overflow-visible min-h-[600px] mb-20">
              <div className="overflow-visible">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Prospect Details</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Categorization</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Date</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6"><div className="space-y-1"><div className="font-black text-white text-base tracking-tight">{lead.details?.businessName || lead.name}</div><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lead.details?.businessName ? lead.name : 'Individual Contact'}</div></div></td>
                          <td className="px-8 py-6"><div className="text-sm font-bold text-gray-400">{lead.productType || 'Underwriting Review'}</div>{lead.details?.businessTypes && lead.details.businessTypes.length > 0 && (<div className="inline-block mt-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] text-[#EAB308] font-black uppercase tracking-tighter">{lead.details.businessTypes[0]}</div>)}</td>
                          <td className="px-8 py-6"><StatusDropdown value={lead.status} onChange={(s) => handleUpdateStatus(lead.id, s)} /></td>
                          <td className="px-8 py-6"><div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{new Date(lead.createdAt).toLocaleDateString()}</div></td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {viewRecycleBin ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleRestoreLead(lead.id)} className="p-2 bg-green-500/10 rounded-lg text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center gap-2 group/restore" title="Restore Lead">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-[8px] font-black uppercase tracking-widest pr-1">Restore</span>
                                  </button>
                                  <button onClick={() => handlePurgeLead(lead.id)} className="p-2 bg-red-500/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Purge Lead Permanently">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleDeleteLead(lead.id)} className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Move to Trash">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="px-8 py-20 text-center"><div className="text-gray-600 font-black text-xs uppercase tracking-[0.3em]">No matching records in the {viewRecycleBin ? 'recycle bin' : 'vault'}.</div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MEMBER MANAGEMENT TAB (ADMIN ONLY) */}
        {isAdmin && activeTab === 'member_management' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-black tracking-tighter mb-2 text-white uppercase">Inner Circle Members</h1>
                <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase">Identity & Authentication Authority</p>
              </div>
              <button 
                onClick={() => setActiveToolModal('add_member')}
                className="bg-[#EAB308] text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Authorize Member
              </button>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden min-h-[500px]">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Member Info</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Credentials</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Role</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {affiliates.map((aff) => (
                    <tr key={aff.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-black text-white text-base tracking-tight">{aff.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{aff.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-[#EAB308] tracking-tight">u: {aff.username}</div>
                        <div className="text-[10px] text-gray-600 font-black uppercase">p: {aff.password}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${aff.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                          {aff.role || 'partner'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button onClick={() => alert("Member modification is restricted for the test build.")} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Edit Identity</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
             <div className="text-center md:text-left">
                <h1 className="text-5xl font-black tracking-tighter mb-4 text-white uppercase">Inner Circle Tools</h1>
                <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase">Authorized Member Networking Assets</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {toolAssets.map((tool, idx) => (
                 <div key={idx} className="bg-[#111] border border-white/5 p-12 rounded-[40px] shadow-2xl flex flex-col justify-between hover:border-white/10 transition-all group">
                   <div><h2 className="text-3xl font-black tracking-tighter mb-4 text-white group-hover:text-[#EAB308] transition-colors uppercase">{tool.title}</h2><p className="text-gray-500 font-bold text-base leading-relaxed mb-10">{tool.description}</p></div>
                   <button onClick={tool.action} className="w-full border-2 border-[#EAB308] text-[#EAB308] font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-[#EAB308] hover:text-black transition-all">Deploy Asset</button>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* --- MODALS --- */}
        {activeToolModal === 'add_member' && (
          <Modal title="Authorize New Inner Circle Member" onClose={() => setActiveToolModal(null)}>
            <form onSubmit={handleCreateMember} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" value={newMember.name} onChange={(v: string) => setNewMember({...newMember, name: v})} placeholder="Executive Name" />
                <Field label="Email Address" type="email" value={newMember.email} onChange={(v: string) => setNewMember({...newMember, email: v})} placeholder="work@email.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Member Username" value={newMember.username} onChange={(v: string) => setNewMember({...newMember, username: v})} placeholder="Login Username" />
                <Field label="Member Password" type="text" value={newMember.password} onChange={(v: string) => setNewMember({...newMember, password: v})} placeholder="Vault Password" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Access Role</label>
                <div className="flex bg-black p-1 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setNewMember({...newMember, role: 'partner'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${newMember.role === 'partner' ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Commercial Partner</button>
                  <button type="button" onClick={() => setNewMember({...newMember, role: 'admin'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${newMember.role === 'admin' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Desk Administrator</button>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#EAB308] text-black font-black text-[11px] py-5 rounded-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4">Grant Vault Access</button>
            </form>
          </Modal>
        )}

        {activeToolModal === 'email' && (
          <Modal title="Inner Circle Email Scripts" onClose={() => setActiveToolModal(null)}>
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[#EAB308] font-black text-sm uppercase tracking-widest">Elite Template: For Real Estate Partners</h4>
                  <button onClick={() => copyToClipboard("Subject: Priority Insurance Support for Closings\n\nHi [Name],\n\nI'm " + user.name + ", part of the Executive Desk at The Insurance Boss Inner Circle...")} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Copy Text</button>
                </div>
                <div className="bg-black p-6 rounded-2xl border border-white/5 font-mono text-[13px] text-gray-400 leading-relaxed">
                  <p className="mb-4">Subject: Priority Insurance Support for Your Closings</p>
                  <p className="mb-4">Hi [Name],</p>
                  <p className="mb-4">I'm {user.name}, part of the Executive Desk at The Insurance Boss Inner Circle. I'm reaching out because I know that securing clear-to-close is your top priority.</p>
                  <p>...</p>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {activeToolModal === 'digital' && (
          <Modal title="Digital Distribution Assets" onClose={() => setActiveToolModal(null)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: "Inner Circle Referral Flyer", img: "https://images.unsplash.com/photo-1586281380349-631531a34d4f?auto=format&fit=crop&q=80&w=800" },
                { name: "Executive One-Pager", img: "https://images.unsplash.com/photo-1454165833762-02651d5b191a?auto=format&fit=crop&q=80&w=800" }
              ].map((asset, i) => (
                <div key={i} className="aspect-[4/5] bg-neutral-900 rounded-[32px] overflow-hidden relative group border border-white/5">
                  <img src={asset.img} className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-all" alt={asset.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="text-[#EAB308] text-[10px] font-black uppercase tracking-widest mb-2">Elite Kit</div>
                    <h4 className="text-white font-black text-xl tracking-tight mb-4">{asset.name}</h4>
                    <button onClick={() => alert("Downloading PDF Asset...")} className="w-full border border-[#EAB308] text-[#EAB308] font-black text-[10px] py-4 rounded-xl uppercase tracking-widest hover:bg-[#EAB308] hover:text-black transition-all">Download PDF</button>
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {activeToolModal === 'sms' && (
          <Modal title="Elite SMS Templates" onClose={() => setActiveToolModal(null)}>
            <div className="space-y-12">
              {[
                { name: "Inner Circle Intro (Casual)", text: "Hey! If you need a solid coverage review, I have priority access to The Insurance Boss Inner Circle. Check it out through my verified link: " + referralLink },
                { name: "Priority Referral (Professional)", text: "Hi, for your commercial coverage needs, I'm recommending my partners at The Insurance Boss Inner Circle. Use my link to get moved to the top of the queue: " + referralLink }
              ].map((sms, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[#EAB308] font-black text-sm uppercase tracking-widest">{sms.name}</h4>
                    <button onClick={() => copyToClipboard(sms.text)} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Copy Text</button>
                  </div>
                  <div className="bg-black p-6 rounded-2xl border border-white/5 font-mono text-[13px] text-gray-400 leading-relaxed">
                    {sms.text}
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {activeToolModal === 'vault' && (
          <Modal title="Custom Vault Generator" onClose={() => setActiveToolModal(null)}>
            <div className="space-y-10 py-4">
              <div className="text-center">
                <h4 className="text-2xl font-black text-white tracking-tighter mb-4 uppercase">Request Specialized Vault</h4>
                <p className="text-gray-500 font-bold text-sm max-w-md mx-auto">Our executive marketing desk will build a custom-niche vault for your verified account.</p>
              </div>
              <div className="space-y-6">
                <Field label="Target Niche" value={vaultNiche} onChange={setVaultNiche} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Executive Briefing Notes</label>
                  <textarea 
                    value={vaultNotes}
                    onChange={(e) => setVaultNotes(e.target.value)}
                    placeholder="Describe your target audience..."
                    className="w-full h-40 bg-black border border-white/10 rounded-xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#EAB308] transition-all resize-none"
                  />
                </div>
                <button onClick={handleVaultRequest} className="w-full bg-[#EAB308] text-black font-black text-[10px] py-5 rounded-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Dispatch Request</button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, color = 'white' }: any) => (
  <div className="bg-[#111] p-8 rounded-[32px] border border-white/5 shadow-2xl transition-all hover:border-white/10 group">
    <div className="text-gray-500 text-[9px] font-black mb-3 tracking-widest uppercase group-hover:text-gray-400 transition-colors">{label}</div>
    <div className="text-4xl font-black tracking-tighter transition-all" style={{ color }}>{value}</div>
  </div>
);

const DashboardForm = ({ affiliateId }: { affiliateId: string }) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = 8;
  const progress = step === 1 ? 13 : step === 2 ? 25 : step === 3 ? 38 : step === 5 ? 63 : step === 7 ? 88 : 100;

  const [formData, setFormData] = useState({
    businessName: '', dba: '', fein: '', yearsInBusiness: '',
    address: '', city: '', state: '', zip: '',
    businessTypes: [] as string[],
    hasActiveCoverage: false, knowsPremium: false, hasDeclarations: false,
    contactName: '', email: '', phone: '',
  });

  const nextStep = () => {
    if (step === 3) setStep(5);
    else if (step === 5) setStep(7);
    else if (step === 7) setStep(8);
    else setStep(s => Math.min(s + 1, totalSteps));
  };
  const prevStep = () => {
    if (step === 5) setStep(3);
    else if (step === 7) setStep(5);
    else if (step === 8) setStep(7);
    else setStep(s => Math.max(s - 1, 1));
  };

  const industries = ["Construction", "Real Estate", "Healthcare", "Professional Services", "Cyber", "Finance", "Manufacturing", "Legal", "Wholesale", "Automotive", "Logistics", "Retail", "Food & Beverage", "Other"];

  const toggleBusinessType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      businessTypes: [type] 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.addLead(affiliateId, formData.contactName, formData.email, formData.phone, {
      businessName: formData.businessName, dba: formData.dba, fein: formData.fein, yearsInBusiness: formData.yearsInBusiness,
      address: formData.address, city: formData.city, state: formData.state, zipCode: formData.zip,
      businessTypes: formData.businessTypes, hasActiveCoverage: formData.hasActiveCoverage,
      knowsPremium: formData.knowsPremium, hasDeclarations: formData.hasDeclarations,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-[#111] rounded-[32px] p-12 text-center animate-in zoom-in-95 duration-500 shadow-2xl border border-white/5">
        <div className="w-20 h-20 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-8 uppercase">Transmission Verified</h2>
        <button onClick={() => { setSubmitted(false); setStep(1); }} className="bg-[#EAB308] text-black font-black px-12 py-4 rounded-xl uppercase tracking-widest text-xs hover:brightness-110 transition-all active:scale-95 shadow-xl">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="bg-black/95 rounded-[32px] p-8 min-h-[500px] flex flex-col border border-white/10 shadow-2xl">
      <div className="mb-10 space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[#EAB308] text-[10px] font-black tracking-widest uppercase opacity-70">Step {step} of {totalSteps}</span>
          <span className="text-white text-xl font-black">{progress}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-[#EAB308] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-grow">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Business Basics</h3>
            <div className="space-y-5">
              <Field label="Business Legal Name *" value={formData.businessName} onChange={(v: string) => setFormData({...formData, businessName: v})} />
              <Field label="DBA (Doing Business As)" value={formData.dba} onChange={(v: string) => setFormData({...formData, dba: v})} />
              <div className="grid grid-cols-2 gap-5">
                <Field label="FEIN / EIN *" value={formData.fein} onChange={(v: string) => setFormData({...formData, fein: v})} />
                <Field label="Years in Business *" value={formData.yearsInBusiness} onChange={(v: string) => setFormData({...formData, yearsInBusiness: v})} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Location</h3>
            <div className="space-y-5">
              <Field label="Address Line 1 *" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} />
              <Field label="City *" value={formData.city} onChange={(v: string) => setFormData({...formData, city: v})} />
              <div className="grid grid-cols-2 gap-5">
                <Field label="State *" value={formData.state} onChange={(v: string) => setFormData({...formData, state: v})} />
                <Field label="Zip Code *" value={formData.zip} onChange={(v: string) => setFormData({...formData, zip: v})} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Business Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {industries.map(ind => (
                <button 
                  key={ind}
                  onClick={() => toggleBusinessType(ind)}
                  className={`px-4 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all ${formData.businessTypes.includes(ind) ? 'bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Coverage Info</h3>
            <div className="space-y-6">
              <ToggleRow label="Active Coverage?" value={formData.hasActiveCoverage} onChange={(v: boolean) => setFormData({...formData, hasActiveCoverage: v})} />
              <ToggleRow label="Know Your Premium?" value={formData.knowsPremium} onChange={(v: boolean) => setFormData({...formData, knowsPremium: v})} />
              <ToggleRow label="Have Dec Page?" value={formData.hasDeclarations} onChange={(v: boolean) => setFormData({...formData, hasDeclarations: v})} />
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Contact</h3>
            <div className="space-y-5">
              <Field label="Contact Name *" value={formData.contactName} onChange={(v: string) => setFormData({...formData, contactName: v})} />
              <Field label="Email Address *" type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
              <Field label="Phone Number *" type="tel" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Ready to Transmit</h3>
            <p className="text-gray-500 font-bold mb-10">Please review your profile before initializing desk deposit.</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <SummaryItem label="Business" value={formData.businessName} />
              <SummaryItem label="Authorized Rep" value={formData.contactName} />
              <SummaryItem label="Industry" value={formData.businessTypes.join(', ')} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex gap-4">
        {step > 1 && (
          <button onClick={prevStep} className="px-10 py-5 rounded-xl bg-[#111] border border-white/10 text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-[#222] transition-all">Back</button>
        )}
        {step < totalSteps ? (
          <button onClick={nextStep} className="flex-1 bg-[#EAB308] text-black font-black py-5 rounded-xl uppercase tracking-widest text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all">Continue</button>
        ) : (
          <button onClick={handleSubmit} className="flex-1 bg-[#EAB308] text-black font-black py-5 rounded-xl uppercase tracking-widest text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all">Initialize Transmission</button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', placeholder = '...' }: any) => (
  <div className="space-y-2">
    <label className="block text-[9px] font-black text-[#EAB308] tracking-widest uppercase">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#EAB308] transition-all placeholder:text-gray-800"
    />
  </div>
);

const ToggleRow = ({ label, value, onChange }: any) => (
  <div className="flex items-center justify-between bg-black/30 border border-white/10 p-6 rounded-2xl">
    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</span>
    <div className="flex bg-black p-1 rounded-lg">
      <button onClick={() => onChange(true)} className={`px-4 py-1 rounded text-[10px] font-black transition-all ${value ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Yes</button>
      <button onClick={() => onChange(false)} className={`px-4 py-1 rounded text-[10px] font-black transition-all ${!value ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>No</button>
    </div>
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div className="flex justify-between border-b border-white/5 pb-3 last:border-none last:pb-0">
    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-white uppercase">{value || 'N/A'}</span>
  </div>
);
