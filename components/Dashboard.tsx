import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RequestQuoteForm } from './RequestQuoteForm';
import { db } from '../services/dbService';
import { Affiliate, Lead, LeadStatus, LandingSettings } from '../types';
import { Button } from './Button';
import { CampaignTemplates } from './CampaignTemplates';
import { VisualEditor } from './VisualEditor';

interface DashboardProps {
  user: Affiliate;
  onLogout: () => void;
}

type Tab = 'overview' | 'landing_editor' | 'templates' | 'lead_management' | 'member_management' | 'settings';

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
    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
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
  // Sync state reactively with local updates
  const [currentUser, setCurrentUser] = useState<Affiliate>(() => {
    return db.getAffiliateById(user.id) || user;
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [globalLeads, setGlobalLeads] = useState<Lead[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  
  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'lead_management' : 'overview');
  const [activeToolModal, setActiveToolModal] = useState<'add_member' | 'edit_member' | 'change_password' | 'view_member_profile' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewRecycleBin, setViewRecycleBin] = useState(false);

  // Admin Customizer & profile States
  const [adminEditingMember, setAdminEditingMember] = useState<Affiliate | null>(null);
  const [inspectingMember, setInspectingMember] = useState<Affiliate | null>(null);

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
      db.updateAffiliatePassword(currentUser.id, newPassword);
      const code = `[ADMIN_ACTION: Update_PWD, Email=${currentUser.email}, New_Value=${newPassword}]`;
      setPasswordChangeCode(code);

      // Refresh current user identity reactively
      const fresh = db.getAffiliateById(currentUser.id);
      if (fresh) setCurrentUser(fresh);

      const APPS_SCRIPT_URL = localStorage.getItem('boss_apps_script_url') || 'https://script.google.com/macros/s/AKfycbxFjHXurwZNAT5fAZua6amUBK4r9Uh62WlUfSMv0-zXo_zOub-gG0F4dAJ6nUCFLB6B/exec';
      if (APPS_SCRIPT_URL) {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updatePassword',
            email: currentUser.email,
            newPassword: newPassword
          })
        });
      }
    } catch (err) {
      console.error("Password sync error:", err);
    }
  };

  const referralLink = `${window.location.origin}${window.location.pathname}#/inner-circle/${currentUser.slug}`;

  const updateData = useCallback(() => {
    if (currentUser.role === 'admin') {
      const allLeads = db.getGlobalLeads(true);
      setGlobalLeads(allLeads);
      const allAffiliates = db.getAffiliates(true);
      setAffiliates(allAffiliates);
    } else {
      const allLeads = db.getLeadsForAffiliate(currentUser.id, true);
      setLeads(allLeads);
    }
    // Refresh current user identity
    const fresh = db.getAffiliateById(currentUser.id);
    if (fresh) setCurrentUser(fresh);
  }, [currentUser.id, currentUser.role]);

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
      console.error('Failed to copy text:', err);
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

  // Callback to handle visual custom page edits for regular member
  const handleSaveLander = (updatedSettings: LandingSettings, updatedPhoto: string) => {
    db.updateAffiliate(currentUser.id, {
      landingSettings: updatedSettings,
      photoUrl: updatedPhoto
    });
    const fresh = db.getAffiliateById(currentUser.id);
    if (fresh) {
      setCurrentUser(fresh);
    }
    alert("Your Personalized Referral Page has been published!");
    setActiveTab('overview');
  };

  // Callback to handle visual custom page edits for Admin managing a member
  const handleAdminSaveMemberLander = (updatedSettings: LandingSettings, updatedPhoto: string) => {
    if (!adminEditingMember) return;
    db.updateAffiliate(adminEditingMember.id, {
      landingSettings: updatedSettings,
      photoUrl: updatedPhoto
    });
    alert(`Personalized page for ${adminEditingMember.name} has been published successfully!`);
    setAdminEditingMember(null);
    updateData();
  };

  const filteredLeads = (isAdmin ? globalLeads : leads).filter(l => 
    (viewRecycleBin ? l.isDeleted : !l.isDeleted) && (
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#EAB308] selection:text-black">
      
      {/* HEADER NAVIGATION */}
      <nav className="border-b border-white/5 bg-[#111]/80 px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="bg-[#EAB308] text-black font-black px-3 py-1.5 rounded text-lg leading-none">IB</div>
          
          {/* Tabs switch panel (Hides if admin is inside customizer page) */}
          {!adminEditingMember && (
            <div className="hidden md:flex items-center gap-6">
              {!isAdmin ? (
                (['overview', 'landing_editor', 'templates'] as Tab[]).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                  >
                    {tab === 'overview' ? 'Performance Panel' : tab === 'landing_editor' ? 'Visual Landers' : 'Campaign Templates'}
                  </button>
                ))
              ) : (
                (['lead_management', 'member_management', 'settings'] as Tab[]).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === tab ? 'text-[#EAB308]' : 'text-gray-500 hover:text-white'}`}
                  >
                    {tab === 'lead_management' ? 'Global Lead Vault' : tab === 'member_management' ? 'Members Matrix' : 'Settings'}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 text-right">
            {currentUser.photoUrl && (
              <img 
                src={currentUser.photoUrl} 
                className="w-8 h-8 rounded-full object-cover border border-white/20" 
                alt="Identity"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <div className="text-[9px] text-gray-500 font-black tracking-widest uppercase">{isAdmin ? 'Executive Desk' : 'Commercial Partner'}</div>
              <div className="text-sm font-bold leading-none">{currentUser.name}</div>
            </div>
          </div>
          <button onClick={() => setActiveToolModal('change_password')} className="text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 font-black tracking-widest uppercase outline-none">Security</button>
          <button onClick={onLogout} className="text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10 font-black tracking-widest uppercase outline-none">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* IF ADMIN IS VISUALLY EDITING A SELECTED MEMBER'S PAGE */}
        {adminEditingMember ? (
          <VisualEditor 
            affiliate={adminEditingMember} 
            onSave={handleAdminSaveMemberLander} 
            isAdminMode={true} 
            onCancel={() => setAdminEditingMember(null)}
          />
        ) : (
          <>
            {/* PERFORMANCE PANEL / OVERVIEW TAB (MEMBER ONLY) */}
            {!isAdmin && activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">
                      Welcome back, <span className="text-[#EAB308]">{currentUser.name}</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-xs uppercase tracking-widest font-mono">Affiliate Code Account: {currentUser.referralCode}</p>
                  </div>
                  
                  {/* Shortcut customizer */}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveTab('landing_editor')}
                      className="bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 hover:bg-[#EAB308] hover:text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[9px] transition-all"
                    >
                      Customize My Refer link page
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard label="Total Referrals" value={leads.length} color="#EAB308" />
                  <StatCard label="In Review" value={leads.filter(l => l.status === LeadStatus.RECEIVED && !l.isDeleted).length} color="#3b82f6" />
                  <StatCard label="Carrier Quoted" value={leads.filter(l => l.status === LeadStatus.QUOTED && !l.isDeleted).length} color="#ea580c" />
                  <StatCard label="Policies Closed" value={leads.filter(l => l.status === LeadStatus.CLOSED && !l.isDeleted).length} color="#22c55e" />
                  <StatCard label="Lead Trash" value={leads.filter(l => l.isDeleted).length} color="#ef4444" />
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setViewRecycleBin(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!viewRecycleBin ? 'bg-[#EAB308] text-black shadow-lg' : 'bg-[#171717] text-gray-400 hover:text-white'}`}
                    >
                      Active Leads List ({leads.filter(l => !l.isDeleted).length})
                    </button>
                    <button 
                      onClick={() => setViewRecycleBin(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewRecycleBin ? 'bg-[#EAB308] text-black shadow-lg' : 'bg-[#171717] text-gray-400 hover:text-white'}`}
                    >
                      Trash ({leads.filter(l => l.isDeleted).length})
                    </button>
                  </div>

                  <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/5">
                      <h3 className="text-lg font-bold">Leads generated via referral Page</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                            <th className="px-8 py-4">Prospect Business</th>
                            <th className="px-8 py-4">Authorized Rep / Contact</th>
                            <th className="px-8 py-4">Email</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">Date Added</th>
                            <th className="px-8 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-sm">
                          {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead) => (
                              <tr key={lead.id} className="hover:bg-white/[0.01]">
                                <td className="px-8 py-5 text-white font-bold">{lead.details?.businessName || "Individual Prospect"}</td>
                                <td className="px-8 py-5 text-gray-300">{lead.name}</td>
                                <td className="px-8 py-5 text-gray-400 text-xs">{lead.email}</td>
                                <td className="px-8 py-5">
                                  <StatusDropdown value={lead.status} onChange={(s) => handleUpdateStatus(lead.id, s)} disabled={true} />
                                </td>
                                <td className="px-8 py-5 text-gray-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    {viewRecycleBin ? (
                                      <button onClick={() => handleRestoreLead(lead.id)} className="text-green-500 hover:text-green-400 text-xs font-bold uppercase tracking-wider">Restore</button>
                                    ) : (
                                      <button onClick={() => handleDeleteLead(lead.id)} className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider">Delete</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-8 py-16 text-center text-gray-600 font-bold italic">
                                No referrals registered in this panel block.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* REFERRAL LINK DECK & QUICK SUBMISSION FORM */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                  <div className="lg:col-span-12">
                    <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🔗</span>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Your Customized Referral Link</h3>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mb-6">
                        Distribute this secure landing link. Prospects visiting this page will be greeted with your custom photograph, personalized copy, key product details, and can trigger direct underwriting quote submissions directly assigned to you.
                      </p>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-[#EAB308] uppercase tracking-widest font-mono">Production Link:</span>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Global Live DNS</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1 w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-gray-300 font-mono text-xs truncate">
                              theinsuranceboss.com/inner-circle/{currentUser.slug}
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`theinsuranceboss.com/inner-circle/${currentUser.slug}`);
                                alert("Production Link copied to clipboard!");
                              }}
                              className="w-full sm:w-auto bg-[#EAB308] text-black font-black px-8 py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all outline-none border-none shrink-0"
                            >
                              Copy production link
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">Preview / Sandbox Link (for this environment):</span>
                            <span className="text-[9px] font-black text-green-400/70 uppercase tracking-widest">Active Testbed</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1 w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-gray-400 font-mono text-xs truncate">
                              {referralLink}
                            </div>
                            <button 
                              onClick={() => {
                                copyToClipboard(referralLink);
                              }}
                              className="w-full sm:w-auto bg-white/5 text-gray-300 border border-white/10 font-bold px-8 py-4 rounded-xl uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all outline-none shrink-0"
                            >
                              Copy preview link
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DIRECT REFERRAL ASSIGNMENT DECK */}
                  <div className="lg:col-span-12">
                    <div className="bg-[#EAB308] p-10 rounded-[32px] shadow-xl">
                      <h2 className="text-3xl font-black text-black tracking-tighter mb-2 uppercase">DIRECT INTAKE PORTAL SUBMISSION</h2>
                      <p className="text-black/80 font-bold text-xs mb-8 uppercase tracking-widest font-mono">Manually append and register warm prospects directly into your list.</p>
                      <RequestQuoteForm affiliateId={currentUser.id} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VISUAL LANDERS EDIT TAB */}
            {!isAdmin && activeTab === 'landing_editor' && (
              <VisualEditor 
                affiliate={currentUser} 
                onSave={handleSaveLander} 
                isAdminMode={false} 
              />
            )}

            {/* CAMPAIGN TEMPLATES TAB */}
            {!isAdmin && activeTab === 'templates' && (
              <CampaignTemplates user={currentUser} />
            )}

            {/* GLOBAL LEAD VAULT (ADMIN ONLY) */}
            {isAdmin && activeTab === 'lead_management' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase m-0 leading-none">
                      {viewRecycleBin ? 'Lead Recycle Vault' : 'Global Lead Vault'}
                    </h1>
                    <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase mt-1">
                      {viewRecycleBin ? 'DELETED REFERRALS PENDING PLACEMENT' : 'Live Global Intakes Transmission'}
                    </p>
                  </div>
                  <div className="flex gap-4 items-center w-full md:w-auto">
                    <button 
                      onClick={() => setViewRecycleBin(!viewRecycleBin)}
                      className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${viewRecycleBin ? 'bg-[#EAB308] text-black border-[#EAB308]' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                    >
                      {viewRecycleBin ? 'View Active Vault' : 'Recycle Vault'}
                    </button>
                    <div className="flex-1 md:w-80 relative">
                      <input 
                        type="text" 
                        placeholder="Search portfolios..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-[#111] border border-white/5 rounded-2xl px-11 py-3 text-sm focus:outline-none focus:border-[#EAB308] font-bold" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02] text-gray-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="px-8 py-5">Prospect Risk</th>
                        <th className="px-8 py-5">Underwriting Niche</th>
                        <th className="px-8 py-5">Referrer Partner</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Transmit Date</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-sm">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => {
                          const owner = affiliates.find(a => a.id === lead.affiliateId);

                          return (
                            <tr key={lead.id} className="hover:bg-white/[0.01]">
                              <td className="px-8 py-5">
                                <div className="font-extrabold text-white text-base leading-tight">
                                  {lead.details?.businessName || lead.name}
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">
                                  {lead.details?.businessName ? lead.name : 'Individual Policy'}
                                </div>
                              </td>
                              <td className="px-8 py-5 font-bold text-gray-400">
                                {lead.productType || 'Intake review'}
                                {lead.details?.businessTypes && lead.details.businessTypes.length > 0 && (
                                  <span className="block mt-1 text-[9px] text-[#EAB308] uppercase font-black">{lead.details.businessTypes[0]}</span>
                                )}
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-gray-300 font-bold">{owner ? owner.name : 'Corporate Direct'}</span>
                                <span className="block text-[8px] text-gray-600 font-bold uppercase mt-0.5">{lead.affiliateId}</span>
                              </td>
                              <td className="px-8 py-5">
                                <StatusDropdown value={lead.status} onChange={(s) => handleUpdateStatus(lead.id, s)} />
                              </td>
                              <td className="px-8 py-5 text-gray-500 text-xs font-mono">{new Date(lead.createdAt).toLocaleDateString()}</td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-3">
                                  {viewRecycleBin ? (
                                    <>
                                      <button onClick={() => handleRestoreLead(lead.id)} className="px-3 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold uppercase tracking-wider">Restore</button>
                                      <button onClick={() => handlePurgeLead(lead.id)} className="px-3 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold uppercase tracking-wider">Purge</button>
                                    </>
                                  ) : (
                                    <button onClick={() => handleDeleteLead(lead.id)} className="px-3 py-1 bg-red-500/10 text-red-500 rounded text-xs font-medium uppercase tracking-wider hover:bg-red-500 hover:text-white transition-colors">Trash</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-16 text-center text-gray-600 font-bold uppercase tracking-widest text-xs">
                            No records registered in the Vault.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MEMBERS MATRIX TAB (ADMIN ONLY) */}
            {isAdmin && activeTab === 'member_management' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Sovereign Inner Circle Members</h1>
                    <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase mt-1">Academics Identity & Authentication Engine</p>
                  </div>
                  <button 
                    onClick={() => setActiveToolModal('add_member')}
                    className="bg-[#EAB308] text-black font-black px-6 py-4 rounded-xl uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-2 border-none"
                  >
                    Authorize New Member
                  </button>
                </div>

                <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02] text-gray-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="px-8 py-5">Profile Image</th>
                        <th className="px-8 py-5">Partner Name / Email</th>
                        <th className="px-8 py-5">System Credentials</th>
                        <th className="px-8 py-5">Reference Slug</th>
                        <th className="px-8 py-5">Authority Role</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-sm">
                      {affiliates.map((aff) => (
                        <tr key={aff.id} className="hover:bg-white/[0.01]">
                          <td className="px-8 py-5">
                            <img 
                              src={aff.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'} 
                              className="w-12 h-12 rounded-full object-cover border border-white/20" 
                              alt="avatar"
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td className="px-8 py-5">
                            <div className="font-extrabold text-white text-base leading-tight">{aff.name}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-0.5">{aff.email}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-xs font-bold text-[#EAB308] font-mono">u: {aff.username}</div>
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">pwd: {aff.password}</div>
                          </td>
                          <td className="px-8 py-5 font-mono text-xs text-gray-400">
                            /{aff.slug}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${aff.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                              {aff.role || 'partner'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => {
                                  setInspectingMember(aff);
                                  setActiveToolModal('view_member_profile');
                                }}
                                className="text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
                              >
                                View full Profile
                              </button>
                              <button 
                                onClick={() => setAdminEditingMember(aff)}
                                className="text-xs text-black bg-[#EAB308] hover:brightness-110 px-3 py-1.5 rounded-lg transition-all font-black uppercase"
                              >
                                Customize Page
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingMember({ ...aff });
                                  setActiveToolModal('edit_member');
                                }} 
                                className="text-xs text-gray-400 hover:text-white hover:underline transition-all"
                              >
                                Edit Credentials
                              </button>
                            </div>
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
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-white uppercase">System Settings</h1>
                  <p className="text-gray-500 tracking-widest text-[10px] font-black uppercase mt-1">Core Infrastructure Configuration</p>
                </div>
                
                <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-xl space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-[#EAB308] uppercase tracking-tight">Google Sheets Write Link</h3>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-2xl font-semibold">
                      Deploy a Google Apps Script to synchronize Inner Circle affiliate login credentials from Google Sheets.
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Script Web App Endpoint</label>
                      <input 
                        type="text" 
                        value={localStorage.getItem('boss_apps_script_url') || 'https://script.google.com/macros/s/AKfycbxFjHXurwZNAT5fAZua6amUBK4r9Uh62WlUfSMv0-zXo_zOub-gG0F4dAJ6nUCFLB6B/exec'} 
                        onChange={(e) => {
                          localStorage.setItem('boss_apps_script_url', e.target.value);
                          updateData();
                        }}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-xs font-bold font-mono text-white focus:outline-none focus:border-[#EAB308]"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#EAB308]">Setup Checklist</h4>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-gray-400 leading-relaxed font-semibold">
                      <li>Excel Spreadsheet ID: <span className="text-[#EAB308] font-mono select-all">1qGXGMzSokRUXO7-UjePQTdV1RjFqI5A_TdWvx2PHBYM</span></li>
                      <li>In Google sheets, choose <span className="text-white font-bold">Extensions &gt; Apps Script</span>.</li>
                      <li>Deploy as <span className="text-white font-bold">Web App</span>, authorized "Who has access" as <span className="text-white font-bold">Anyone</span>.</li>
                      <li>Copy the endpoint URL and register it in the box above. Saved.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- DYNAMIC WINDOW MODALS --- */}
        {activeToolModal === 'view_member_profile' && inspectingMember && (
          <Modal title={`Full Profile Audit: ${inspectingMember.name}`} onClose={() => { setActiveToolModal(null); setInspectingMember(null); }}>
            <div className="space-y-8 py-4 font-semibold">
              <div className="flex flex-col md:flex-row items-center gap-6 border-b border-white/5 pb-6">
                <img 
                  src={inspectingMember.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-black shadow-xl" 
                  alt={inspectingMember.name}
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-2xl font-black text-white leading-none mb-1">{inspectingMember.name}</h4>
                  <p className="text-xs text-[#EAB308] uppercase font-black">Referral ID: {inspectingMember.referralCode}</p>
                  <p className="text-xs text-gray-400">Account login address: {inspectingMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-3">
                  <span className="block text-[10px] font-black text-[#EAB308] uppercase tracking-widest border-b border-white/5 pb-2">Vault Credentials</span>
                  <SummaryItem label="Sign Username" value={inspectingMember.username} />
                  <SummaryItem label="Sign Password" value={inspectingMember.password} />
                  <SummaryItem label="Ref Page Slug" value={inspectingMember.slug} />
                </div>

                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-3">
                  <span className="block text-[10px] font-black text-[#EAB308] uppercase tracking-widest border-b border-white/5 pb-2">Risk Placement metrics</span>
                  <SummaryItem label="Total Leads Submitted" value={db.getLeadsForAffiliate(inspectingMember.id, true).length} />
                  <SummaryItem label="Lifetime Earnings" value={`$${inspectingMember.lifetimeEarnings || 0}`} />
                  <SummaryItem label="Monthly Residual" value={`$${inspectingMember.monthlyResiduals || 0}`} />
                </div>
              </div>

              {/* List of Leads specifically of this member */}
              <div className="space-y-4 pt-4">
                <span className="block text-[10px] font-black text-[#EAB308] uppercase tracking-widest border-b border-white/5 pb-2">Associated Referrals registered ({db.getLeadsForAffiliate(inspectingMember.id).length})</span>
                <div className="max-h-60 overflow-y-auto bg-black/50 border border-white/5 rounded-2xl p-4 space-y-2 text-xs scrollbar-thin">
                  {db.getLeadsForAffiliate(inspectingMember.id).length > 0 ? (
                    db.getLeadsForAffiliate(inspectingMember.id).map((l) => (
                      <div key={l.id} className="flex justify-between items-center p-3.5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10">
                        <div>
                          <div className="font-extrabold text-white text-sm">{l.details?.businessName || l.name}</div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold block mt-0.5">Authorised: {l.name} ({l.email})</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded bg-white/5 font-black uppercase text-[8px] border border-white/5 text-gray-300`}>{l.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-600 font-bold italic">No referrals mapped to this member database.</div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => {
                    setActiveToolModal(null);
                    setInspectingMember(null);
                    setAdminEditingMember(inspectingMember);
                  }}
                  className="flex-1 bg-[#EAB308] text-black font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all text-center"
                >
                  Edit Visual Custom Layout
                </button>
                <button 
                  onClick={() => { setActiveToolModal(null); setInspectingMember(null); }}
                  className="flex-1 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl hover:bg-white/10 transition-all text-center border border-white/10"
                >
                  Exit profile view
                </button>
              </div>
            </div>
          </Modal>
        )}

        {activeToolModal === 'change_password' && (
          <Modal title="Security Protocol: Update Key Access" onClose={() => { setActiveToolModal(null); setPasswordChangeCode(null); setNewPassword(''); }}>
            {!passwordChangeCode ? (
              <form onSubmit={handlePasswordChange} className="space-y-6 py-4">
                <div className="text-center mb-6 space-y-2">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Requesting a new customized password for <span className="text-[#EAB308]">{currentUser.email}</span></p>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl inline-block mt-2">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Active Password</p>
                    <p className="text-lg font-black text-[#EAB308] tracking-tighter">{currentUser.password}</p>
                  </div>
                </div>
                <Field 
                  label="New Secure Password" 
                  type="text" 
                  value={newPassword} 
                  onChange={setNewPassword} 
                  placeholder="Enter your new password" 
                />
                <button type="submit" className="w-full bg-[#EAB308] text-black font-black text-[10px] py-4.5 rounded-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4 border-none">
                  Sync & Record Password
                </button>
              </form>
            ) : (
              <div className="space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-black/50 border border-[#EAB308]/20 p-6 rounded-2xl font-mono text-xs text-[#EAB308] break-all select-all">
                  {passwordChangeCode}
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-xs">
                  <p className="text-green-500 font-bold leading-relaxed">
                    Your password has been changed in the vault and is now synced with your profile. Use it for your next session log.
                  </p>
                </div>
                <button 
                  onClick={() => { setActiveToolModal(null); setPasswordChangeCode(null); setNewPassword(''); }}
                  className="w-full bg-white/5 text-white font-black text-[10px] py-4.5 rounded-xl uppercase tracking-[0.2em] hover:bg-white/10 transition-all border border-white/10"
                >
                  Exit Security Desk
                </button>
              </div>
            )}
          </Modal>
        )}

        {activeToolModal === 'add_member' && (
          <Modal title="Authorize New Inner Circle Affiliate" onClose={() => setActiveToolModal(null)}>
            <form onSubmit={handleCreateMember} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" value={newMember.name} onChange={(v: string) => setNewMember({...newMember, name: v})} placeholder="Broker Partner Name" />
                <Field label="Email Address" type="email" value={newMember.email} onChange={(v: string) => setNewMember({...newMember, email: v})} placeholder="partner@email.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="System Username" value={newMember.username} onChange={(v: string) => setNewMember({...newMember, username: v})} placeholder="Login email/username" />
                <Field label="Vaut Password (8-Digits)" type="text" value={newMember.password} onChange={(v: string) => setNewMember({...newMember, password: v})} placeholder="Assigned secure password" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Authority Role</label>
                <div className="flex bg-black p-1 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setNewMember({...newMember, role: 'partner'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${newMember.role === 'partner' ? 'bg-[#EAB308] text-black shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}>Commercial Partner</button>
                  <button type="button" onClick={() => setNewMember({...newMember, role: 'admin'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${newMember.role === 'admin' ? 'bg-red-500 text-white shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}>Sovereign Exec Administrator</button>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#EAB308] text-black font-black text-[10px] py-4.5 rounded-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4 border-none">Grant Member Access</button>
            </form>
          </Modal>
        )}

        {activeToolModal === 'edit_member' && editingMember && (
          <Modal title="Edit Member Credentials & Identity" onClose={() => { setActiveToolModal(null); setEditingMember(null); }}>
            <form onSubmit={handleUpdateMember} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" value={editingMember.name} onChange={(v: string) => setEditingMember({...editingMember, name: v})} placeholder="Broker Partner Name" />
                <Field label="Email Address" type="email" value={editingMember.email} onChange={(v: string) => setEditingMember({...editingMember, email: v})} placeholder="partner@email.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="System Username" value={editingMember.username} onChange={(v: string) => setEditingMember({...editingMember, username: v})} placeholder="Login username" />
                <Field label="Vaut Password" type="text" value={editingMember.password} onChange={(v: string) => setEditingMember({...editingMember, password: v})} placeholder="Assigned secure password" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Authority Role</label>
                <div className="flex bg-black p-1 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setEditingMember({...editingMember, role: 'partner'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${editingMember.role === 'partner' ? 'bg-[#EAB308] text-black shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}>Commercial Partner</button>
                  <button type="button" onClick={() => setEditingMember({...editingMember, role: 'admin'})} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${editingMember.role === 'admin' ? 'bg-red-500 text-white shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}>Sovereign Exec Administrator</button>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#EAB308] text-black font-black text-[10px] py-4.5 rounded-xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all mt-4 border-none font-black">Save credential Changes</button>
            </form>
          </Modal>
        )}

      </main>
    </div>
  );
};

const StatCard = ({ label, value, color = 'white' }: any) => (
  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10">
    <div className="text-2xl font-black tracking-tighter mb-1 select-none" style={{ color }}>{value}</div>
    <div className="text-gray-500 text-[10px] font-bold tracking-widest uppercase select-none">{label}</div>
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
      className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white font-bold focus:outline-none focus:border-[#EAB308] transition-all placeholder:text-gray-800 text-xs"
    />
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div className="flex justify-between border-b border-white/5 pb-2.5 last:border-none last:pb-0 font-medium">
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-bold text-white uppercase">{value !== undefined && value !== null ? String(value) : 'N/A'}</span>
  </div>
);
