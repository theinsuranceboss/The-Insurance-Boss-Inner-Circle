
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RequestQuoteForm } from './RequestQuoteForm';
import { db } from '../services/dbService';
import { Affiliate, Lead, LeadStatus } from '../types';
import { Button } from './Button';

interface DashboardProps {
  user: Affiliate;
  onLogout: () => void;
}

type Tab = 'overview' | 'leads' | 'payouts' | 'lead_management' | 'member_management' | 'settings';

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

  const getStatusStyles = (s: LeadStatus) => {
    switch (s) {
      case LeadStatus.CLOSED: return 'text-green-500 border-green-500/20';
      case LeadStatus.RECEIVED: return 'text-blue-500 border-blue-500/20';
      case LeadStatus.QUOTED: return 'text-yellow-500 border-yellow-500/20';
      case LeadStatus.REJECTED: return 'text-red-500 border-red-500/20';
      case LeadStatus.BOUNCED: return 'text-orange-500 border-orange-500/20';
      default: return 'text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 border px-3 py-1 rounded-lg text-[11px] font-bold transition-all outline-none bg-white/5 ${getStatusStyles(value)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
      >
        {value}
        {!disabled && (
          <svg className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute left-0 mt-2 w-40 bg-[#171717] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden">
          {(Object.values(LeadStatus) as LeadStatus[]).map((status) => (
            <div
              key={status}
              onClick={() => {
                onChange(status);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-[11px] font-bold cursor-pointer transition-colors border-b border-white/5 last:border-none ${value === status ? 'bg-[#EAB308] text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
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
  const [activeToolModal, setActiveToolModal] = useState<'add_member' | 'edit_member' | 'change_password' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewRecycleBin, setViewRecycleBin] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeCode, setPasswordChangeCode] = useState<string | null>(null);

  // Add Member State
  const [newMember, setNewMember] = useState({ name: '', email: '', username: '', password: '', role: 'partner' as const });
  
  // Edit Member State
  const [editingMember, setEditingMember] = useState<Affiliate | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return alert("Please provide a new personalized password.");
    if (newPassword.length < 4) return alert("Password must be at least 4 characters.");
    
    try {
      // Step 1: Update local database immediately for responsive UI
      db.updateAffiliatePassword(user.id, newPassword);
      
      // Step 2: Generate the protocol code
      const code = `[ADMIN_ACTION: Update_PWD, Email=${user.email}, New_Value=${newPassword}]`;
      setPasswordChangeCode(code);

      // Step 3: Attempt to sync with Google Sheets via Apps Script Web App
      const APPS_SCRIPT_URL = localStorage.getItem('boss_apps_script_url') || 'https://script.google.com/macros/s/AKfycbxFjHXurwZNAT5fAZua6amUBK4r9Uh62WlUfSMv0-zXo_zOub-gG0F4dAJ6nUCFLB6B/exec';
      
      if (APPS_SCRIPT_URL) {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Google Apps Script requires no-cors for simple POSTs
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updatePassword',
            email: user.email,
            newPassword: newPassword
          })
        });
        console.log("Sync request sent to Google Sheets");
      }
    } catch (err) {
      console.error("Password sync error:", err);
    }
  };

  const referralLink = `https://theinsuranceboss.com/inner-circle-referal-link/`;

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
      role: newMember.role
    });
    alert("New Inner Circle member authorized!");
    setActiveToolModal(null);
    setNewMember({ name: '', email: '', username: '', password: '', role: 'partner' });
    updateData();
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    db.updateAffiliate(editingMember.id, {
      name: editingMember.name,
      email: editingMember.email,
      username: editingMember.username,
      password: editingMember.password,
      role: editingMember.role
    });
    alert("Member identity updated!");
    setActiveToolModal(null);
    setEditingMember(null);
    updateData();
  };

  const isAdmin = user.role === 'admin';

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
              (['overview'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))
            ) : (
              (['lead_management', 'member_management', 'settings'] as Tab[]).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab === 'lead_management' ? 'Global Vault' : tab === 'member_management' ? 'Members' : 'Settings'}
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
          <button onClick={() => setActiveToolModal('change_password')} className="text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 font-black tracking-widest uppercase">Security</button>
          <button onClick={onLogout} className="text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 font-black tracking-widest uppercase">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* OVERVIEW TAB */}
        {!isAdmin && activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="mb-10">
              <h1 className="text-4xl font-black tracking-tight mb-2">
                Welcome back, <span className="text-[#EAB308]">{user.name}</span>
              </h1>
              <p className="text-gray-500 font-medium">Here's an overview of your affiliate performance</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard 
                label="Total Leads" 
                value={leads.length} 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                color="#EAB308" 
              />
              <StatCard 
                label="Received" 
                value={leads.filter(l => l.status === LeadStatus.RECEIVED && !l.isDeleted).length} 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="#3b82f6" 
              />
              <StatCard 
                label="Quoted" 
                value={leads.filter(l => l.status === LeadStatus.QUOTED && !l.isDeleted).length} 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                color="#EAB308" 
              />
              <StatCard 
                label="Closed" 
                value={leads.filter(l => l.status === LeadStatus.CLOSED && !l.isDeleted).length} 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="#22c55e" 
              />
              <StatCard 
                label="Recycle Bin" 
                value={leads.filter(l => l.isDeleted).length} 
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                color="#ef4444" 
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewRecycleBin(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!viewRecycleBin ? 'bg-[#EAB308] text-black shadow-lg' : 'bg-[#171717] text-gray-400 hover:text-white'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Active Leads ({leads.filter(l => !l.isDeleted).length})
                </button>
                <button 
                  onClick={() => setViewRecycleBin(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewRecycleBin ? 'bg-[#EAB308] text-black shadow-lg' : 'bg-[#171717] text-gray-400 hover:text-white'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Recycle Bin ({leads.filter(l => l.isDeleted).length})
                </button>
                <button 
                  onClick={updateData}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#171717] text-gray-400 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5">
                  <h3 className="text-xl font-bold">Your Leads</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-8 py-4">Name</th>
                        <th className="px-8 py-4">Email</th>
                        <th className="px-8 py-4">Phone</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-6 font-bold text-white">{lead.name}</td>
                            <td className="px-8 py-6 text-gray-400 text-sm">{lead.email}</td>
                            <td className="px-8 py-6 text-gray-400 text-sm">{lead.phone}</td>
                            <td className="px-8 py-6">
                              <StatusDropdown value={lead.status} onChange={(s) => handleUpdateStatus(lead.id, s)} />
                            </td>
                            <td className="px-8 py-6 text-gray-500 text-sm">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                {viewRecycleBin ? (
                                  <>
                                    <button onClick={() => handleRestoreLead(lead.id)} className="text-green-500 hover:text-green-400 transition-colors flex items-center gap-1 text-xs font-bold">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                      Restore
                                    </button>
                                    <button onClick={() => handlePurgeLead(lead.id)} className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 text-xs font-bold">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      Purge
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => handleDeleteLead(lead.id)} className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 text-xs font-bold">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center text-gray-600 font-bold italic">
                            No leads found in this section.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
              <div className="lg:col-span-12">
                <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-5 h-5 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Your Referral Link</h3>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-gray-400 font-mono text-sm truncate">
                      {referralLink}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(referralLink)} 
                      className="w-full md:w-auto bg-[#EAB308] text-black font-black px-8 py-4 rounded-xl uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      Copy Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-4">Share this link to generate leads.</p>
                </div>
              </div>

              <div className="lg:col-span-12">
                <div className="bg-[#EAB308] p-10 rounded-[40px] shadow-2xl">
                  <h2 className="text-4xl font-black text-black tracking-tighter mb-2 uppercase">ADD YOUR LEAD TO YOUR DATABASE</h2>
                  <p className="text-black/80 font-bold text-sm mb-10">Directly deposit lead data into your database.</p>
                  <RequestQuoteForm affiliateId={user.id} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GLOBAL LEAD VAULT (ADMIN ONLY) */}
        {isAdmin && activeTab === 'lead_management' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-black tracking-tighter mb-2 text-white uppercase">
                  {viewRecycleBin ? 'Leads Recycle Bin' : 'Global Lead Vault'}
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
                         <button 
                           onClick={() => {
                             setEditingMember({...aff});
                             setActiveToolModal('edit_member');
                           }} 
                           className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors"
                         >
                           Edit Identity
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB (ADMIN ONLY) */}
        {isAdmin && activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h1 className="text-5xl font-black tracking-tighter mb-2 text-white uppercase">System Settings</h1>
              <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase">Core Infrastructure Configuration</p>
            </div>
            
            <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-10">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#EAB308] uppercase tracking-tight">Google Sheets Write Access</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                  To allow the application to update passwords directly in your Google Sheet, you need to deploy a Google Apps Script as a Web App and paste the URL below.
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Apps Script Web App URL</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={localStorage.getItem('boss_apps_script_url') || 'https://script.google.com/macros/s/AKfycbxFjHXurwZNAT5fAZua6amUBK4r9Uh62WlUfSMv0-zXo_zOub-gG0F4dAJ6nUCFLB6B/exec'} 
                      onChange={(e) => {
                        localStorage.setItem('boss_apps_script_url', e.target.value);
                        updateData(); // Trigger re-render
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#EAB308] transition-all placeholder:text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-white">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-4 text-sm text-gray-400">
                  <li>Open your Google Sheet: <span className="text-[#EAB308] break-all">1qGXGMzSokRUXO7-UjePQTdV1RjFqI5A_TdWvx2PHBYM</span></li>
                  <li>Go to <span className="text-white font-bold">Extensions &gt; Apps Script</span>.</li>
                  <li>Delete any existing code and paste the script provided by the assistant.</li>
                  <li>Click <span className="text-white font-bold">Deploy &gt; New Deployment</span>.</li>
                  <li>Select <span className="text-white font-bold">Web App</span>, set "Who has access" to <span className="text-white font-bold">Anyone</span>.</li>
                  <li>Copy the Web App URL and paste it above.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* --- MODALS --- */}
        {activeToolModal === 'change_password' && (
          <Modal title="Security Protocol: Update Access Key" onClose={() => { setActiveToolModal(null); setPasswordChangeCode(null); setNewPassword(''); }}>
            {!passwordChangeCode ? (
              <form onSubmit={handlePasswordChange} className="space-y-6 py-4">
                <div className="text-center mb-6 space-y-2">
                  <p className="text-gray-500 text-sm font-bold">Requesting a new personalized password for <span className="text-[#EAB308]">{user.email}</span></p>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl inline-block">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Current Password</p>
                    <p className="text-lg font-black text-[#EAB308] tracking-tighter">{user.password}</p>
                  </div>
                </div>
                <Field 
                  label="New Personalized Password" 
                  type="text" 
                  value={newPassword} 
                  onChange={setNewPassword} 
                  placeholder="Enter your new secure password" 
                />
                <button type="submit" className="w-full bg-[#EAB308] text-black font-black text-[11px] py-5 rounded-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4">
                  Initialize Sync
                </button>
              </form>
            ) : (
              <div className="space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-black/50 border border-[#EAB308]/20 p-6 rounded-2xl font-mono text-xs text-[#EAB308] break-all">
                  {passwordChangeCode}
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                  <p className="text-green-500 text-sm font-bold leading-relaxed">
                    Your new password has been recorded and is being synced with the Admin Dashboard. Use your new password for your next login.
                  </p>
                </div>
                <button 
                  onClick={() => { setActiveToolModal(null); setPasswordChangeCode(null); setNewPassword(''); }}
                  className="w-full bg-white/5 text-white font-black text-[11px] py-5 rounded-xl uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                >
                  Close Security Portal
                </button>
              </div>
            )}
          </Modal>
        )}
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
        {activeToolModal === 'edit_member' && editingMember && (
          <Modal title="Edit Member Identity" onClose={() => { setActiveToolModal(null); setEditingMember(null); }}>
            <form onSubmit={handleUpdateMember} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" value={editingMember.name} onChange={(v: string) => setEditingMember({...editingMember, name: v})} placeholder="Executive Name" />
                <Field label="Email Address" type="email" value={editingMember.email} onChange={(v: string) => setEditingMember({...editingMember, email: v})} placeholder="work@email.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Member Username" value={editingMember.username} onChange={(v: string) => setEditingMember({...editingMember, username: v})} placeholder="Login Username" />
                <Field label="Member Password" type="text" value={editingMember.password} onChange={(v: string) => setEditingMember({...editingMember, password: v})} placeholder="Vault Password" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Access Role</label>
                <div className="flex bg-black p-1 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setEditingMember({...editingMember, role: 'partner'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${editingMember.role === 'partner' ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Commercial Partner</button>
                  <button type="button" onClick={() => setEditingMember({...editingMember, role: 'admin'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${editingMember.role === 'admin' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Desk Administrator</button>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#EAB308] text-black font-black text-[11px] py-5 rounded-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4">Save Identity Changes</button>
            </form>
          </Modal>
        )}

      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, color = 'white' }: any) => (
  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10 group">
    <div className="mb-4" style={{ color }}>{icon}</div>
    <div className="text-3xl font-black tracking-tighter mb-1" style={{ color }}>{value}</div>
    <div className="text-gray-500 text-[11px] font-bold tracking-tight uppercase">{label}</div>
  </div>
);


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
