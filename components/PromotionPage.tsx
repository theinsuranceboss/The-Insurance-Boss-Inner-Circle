import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { db } from '../services/dbService';
import { Affiliate } from '../types';
import { jsPDF } from 'jspdf';

const CountUp = ({ end, duration = 2000, prefix = '', suffix = '' }: any) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    // Extract numbers and decimals from the string
    const endValue = parseFloat(end.replace(/[^0-9.]/g, '')) || 0;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * endValue);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  // Format the number back with commas if needed
  const formattedCount = count.toLocaleString();
  
  return (
    <span>{prefix}{formattedCount}{suffix}</span>
  );
};

interface PromotionPageProps {
  standalone?: boolean;
  referralAffiliate?: Affiliate | null;
}

export const PromotionPage: React.FC<PromotionPageProps> = ({ standalone = true, referralAffiliate = null }) => {
  const [appSubmitted, setAppSubmitted] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [appData, setAppData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    industry: '',
    avgReferrals: '',
    website: ''
  });

  const stats = [
    { label: "Active Affiliates", value: "500+", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { label: "Paid to Affiliates", value: "$20k+", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { label: "Leads Processed", value: "10.000+", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { label: "Carrier Partners", value: "50+", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )}
  ];

  const categories = [
    {
      title: "Logistics & Fleet",
      items: ["Trucking Liability", "Motor Truck Cargo", "Physical Damage", "Workers' Compensation", "Owner-Operator Programs", "Amazon Delivery Fleet (DSP)"],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2a1 1 0 01-1 1h-1m-4-14H5a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4z" />
        </svg>
      )
    },
    {
      title: "Tech & Corporate",
      items: ["Cyber Liability", "Directors & Officers (D&O)", "Errors & Omissions (E&O)", "Employment Practices", "Key Person Insurance", "Business Interruption"],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Construction & Dev",
      items: ["General Liability", "Builder's Risk", "Surety Bonds", "Workers' Compensation", "Commercial Auto", "Contractor Equipment"],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Hospitality & Retail",
      items: ["General Liability", "Liquor Liability", "Property Insurance", "Inventory Coverage", "Business Interruption", "Food Contamination"],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (standalone && !agreementAccepted) {
      alert("Please acknowledge the Master Commercial Agreement before submitting.");
      return;
    }
    db.submitApplication(appData);
    setAppSubmitted(true);
  };

  const generateMasterAgreementPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Inner Circle Master Commercial Agreement", margin, y);
    y += 20;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Scope Of Commercial Inner Circle", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const scopeText = "This Agreement governs your participation in The Insurance Boss Commercial Inner Circle. You agree to refer business entities for commercial risk reviews. You acknowledge that you are not a licensed agent and will not engage in selling or negotiating contracts. The Insurance Boss provides the licensing and commercial expertise to close and service the B2B leads provided.";
    const scopeLines = doc.splitTextToSize(scopeText, 170);
    doc.text(scopeLines, margin, y);
    y += (scopeLines.length * 7) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("2. Commercial Referral Fees", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const feesText = "Referral fees are calculated as 3% of the gross annual premium received from the carrier for policies bound through the Inner Circle. Disbursements are made via ACH on the 1st of each month. Residual payments recur annually for as long as the commercial policy remains active and in-force, for the life of the policy.";
    const feesLines = doc.splitTextToSize(feesText, 170);
    doc.text(feesLines, margin, y);
    y += (feesLines.length * 7) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("3. Corporate Confidentiality", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const confText = "All business data, EINs, and commercial underwriting processes shared via the vault are strictly confidential. You agree to protect this corporate information and use it solely for the purposes of the referral program.";
    const confLines = doc.splitTextToSize(confText, 170);
    doc.text(confLines, margin, y);
    y += (confLines.length * 7) + 15;

    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(1);
    doc.line(margin, y, 190, y);
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Digital Signature: ${appData.fullName || "Awaiting Signature"}`, margin, y);
    y += 7;
    doc.text(`Business: ${appData.businessName || "Pending Enrollment"}`, margin, y);
    y += 7;
    doc.text(`Verification Date: ${new Date().toLocaleDateString('en-US')}`, margin, y);
    y += 7;
    doc.text("This document constitutes a binding digital commercial agreement upon submission.", margin, y);

    doc.save("Master_Commercial_Agreement_InsuranceBoss.pdf");
  };

  const handleGuidelinesDownload = () => {
    const link = document.createElement('a');
    link.href = 'https://drive.google.com/uc?export=download&id=1HKe5ZZRFm1gI-9XFgY7FimEs6nbaHmOO';
    link.setAttribute('download', 'The_Insurance_Boss_Commercial_Guidelines.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={`bg-[#0a0a0a] text-white ${standalone ? 'min-h-screen' : ''} selection:bg-[#EAB308] selection:text-black scroll-smooth`}>
      {/* Referral Header */}
      {referralAffiliate && (
        <div className="bg-[#EAB308] py-3 px-6 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-[#EAB308]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-black text-[11px] font-black uppercase tracking-widest">
              You were referred by <span className="underline">{referralAffiliate.name}</span>
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className={`relative ${standalone ? 'py-32 md:py-40' : 'py-16'} px-6 overflow-hidden`}>
        <div className="absolute top-0 right-0 w-full h-full z-0">
          <div className="absolute inset-0 bg-black/75 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover grayscale contrast-125 object-center"
            alt="Hero Background"
          />
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto text-center">
          <div className="inline-block px-6 py-2 bg-[#EAB308] text-black text-[11px] font-black rounded-full mb-10 tracking-[0.1em] uppercase shadow-xl">
            THE COMMERCIAL BOSS INNER CIRCLE
          </div>
          <h1 className={`${standalone ? 'text-6xl md:text-[110px]' : 'text-4xl md:text-6xl'} font-black mb-8 leading-[0.9] tracking-tighter`}>
            <span className="text-[#EAB308] block">Earn Residual Income</span>
            <span className="text-white block">Without Selling Insurance</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
            Join our exclusive network of affiliates and earn passive income by connecting clients with our insurance experts. <span className="text-[#EAB308] font-black">No license required.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link to="/login?type=partner">
              <Button className="px-10 py-5 text-sm bg-[#EAB308] text-black border-none hover:bg-[#d9a406] flex items-center gap-2 uppercase font-black tracking-widest">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Inner Circle Login
              </Button>
            </Link>
            <Link to="/login?type=admin">
              <Button className="px-10 py-5 text-sm bg-[#EAB308] text-black border-none hover:bg-[#d9a406] flex items-center gap-2 uppercase font-black tracking-widest">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Executive Desk
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center">
                <div className="text-[#EAB308] flex justify-center mb-2">{stat.icon}</div>
                <div className="text-3xl font-black text-[#EAB308] mb-1">
                  <CountUp 
                    end={stat.value} 
                    prefix={stat.value.startsWith('$') ? '$' : ''} 
                    suffix={stat.value.endsWith('+') ? '+' : ''} 
                  />
                </div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Matrix */}
      <section className="py-32 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6 text-white">
              High-Volume <span className="text-[#EAB308]">Inner Circle Portfolio</span>
            </h2>
            <p className="text-gray-400 font-black tracking-[0.2em] uppercase text-[11px]">FULL CARRIER DISTRIBUTION FOR EVERY SEGMENT</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <div key={idx} className="bg-[#111] border border-white/5 rounded-[32px] p-10 flex flex-col hover:border-[#EAB308]/30 transition-all group">
                <div className="text-[#EAB308] mb-8 bg-[#EAB308]/10 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:bg-[#EAB308] group-hover:text-black transition-all">
                  {cat.icon}
                </div>
                <h3 className="text-2xl font-black mb-8 tracking-tight text-white transition-colors">{cat.title}</h3>
                <ul className="space-y-4 flex-grow">
                  {cat.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-[#EAB308] mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm font-bold text-gray-400 group-hover:text-gray-200 transition-colors leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-6 bg-[#0d0d0d] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-6 text-white">
              How It <span className="text-[#EAB308]">Works</span>
            </h2>
            <p className="text-gray-400 font-black tracking-[0.2em] uppercase text-[11px]">Start earning residual income in three simple steps</p>
          </div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-16 md:gap-8">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-[#EAB308]/20 hidden md:block -translate-y-1/2 z-0" />
            
            <div className="relative z-10 flex flex-col items-center text-center max-w-[300px]">
              <div className="relative mb-10">
                <div className="w-24 h-24 rounded-full border-4 border-[#EAB308]/20 flex items-center justify-center bg-[#111] shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                  <svg className="w-10 h-10 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#EAB308] rounded-full flex items-center justify-center text-black font-black text-xs">01</div>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Join the Network</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">Sign up and get your referral link instantly. No insurance license required.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-[300px]">
              <div className="relative mb-10">
                <div className="w-24 h-24 rounded-full border-4 border-[#EAB308]/20 flex items-center justify-center bg-[#111] shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                  <svg className="w-10 h-10 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826l2.991-3.012m7.509-3.012a4 4 0 115.656 5.656l-1.103 1.103m-5.707-5.707a4 4 0 00-5.656 0l-1.103 1.103" /></svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#EAB308] rounded-full flex items-center justify-center text-black font-black text-xs">02</div>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Share Your Link</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">Send your link to clients, friends, or your network. We handle all the selling.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-[300px]">
              <div className="relative mb-10">
                <div className="w-24 h-24 rounded-full border-4 border-[#EAB308]/20 flex items-center justify-center bg-[#111] shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                  <svg className="w-10 h-10 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#EAB308] rounded-full flex items-center justify-center text-black font-black text-xs">03</div>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Earn Residuals</h3>
              <p className="text-gray-400 text-sm font-medium leading-relaxed">Get paid ongoing commissions for every policy that closes. Income that grows over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Section */}
      {standalone && (
        <section id="apply" className="py-40 px-6 bg-[#0d0d0d] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            {!appSubmitted ? (
              <div className="space-y-20">
                <div>
                  <div className="text-center mb-16">
                    <h2 className="text-5xl font-black tracking-tighter mb-4 text-white uppercase">Initialize B2B Partnership</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Submit your commercial prospectus to start earning monthly residuals.</p>
                  </div>
                  <form onSubmit={handleAppSubmit} className="space-y-6 bg-[#111] p-10 rounded-[40px] border border-white/5 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Full Name *" placeholder="..." value={appData.fullName} onChange={(v: string) => setAppData({...appData, fullName: v})} />
                      <Input label="Business Name *" placeholder="..." value={appData.businessName} onChange={(v: string) => setAppData({...appData, businessName: v})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Work Email *" placeholder="..." value={appData.email} onChange={(v: string) => setAppData({...appData, email: v})} />
                      <Input label="Direct Phone *" placeholder="..." value={appData.phone} onChange={(v: string) => setAppData({...appData, phone: v})} />
                    </div>
                    <Input label="Primary B2B Industry *" placeholder="e.g. Accounting, Consulting" value={appData.industry} onChange={(v: string) => setAppData({...appData, industry: v})} />
                    <Input label="Avg. Monthly Referrals *" placeholder="e.g. 5-10 Businesses" value={appData.avgReferrals} onChange={(v: string) => setAppData({...appData, avgReferrals: v})} />
                    <Button type="submit" fullWidth className="py-5 text-lg uppercase tracking-widest shadow-2xl">Send Commercial Prospectus</Button>
                  </form>
                </div>

                {/* Master Agreement Section */}
                <div id="agreement" className="animate-in slide-in-from-bottom-6 duration-700">
                  <div className="mb-8 text-center">
                    <h2 className="text-4xl font-black tracking-tighter mb-2 text-white uppercase">Commercial Master Agreement</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Corporate Compliance Standards</p>
                  </div>
                  
                  <div className="bg-[#111] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-8 mb-8">
                    <div className="h-[350px] overflow-y-auto pr-4 no-scrollbar text-sm text-gray-400 font-medium leading-relaxed space-y-6">
                      <p className="font-black text-white text-lg uppercase">1. Scope of B2B Inner Circle</p>
                      <p>This Agreement governs your participation in The Insurance Boss Commercial Inner Circle. You agree to refer business entities for insurance reviews. You acknowledge that you are not a licensed agent.</p>
                      <p className="font-black text-white text-lg uppercase">2. B2B Referral Residuals</p>
                      <p>Referral fees are calculated as 3% of the gross annual premium received from the carrier for policies bound through the Inner Circle. Disbursements are made via ACH on the 1st of each month.</p>
                      <p className="font-black text-white text-lg uppercase">3. Corporate Data Privacy</p>
                      <p>All business data, FEINs, and commercial records shared via the vault are strictly confidential and protected by enterprise-grade security.</p>
                      <div className="pt-10 border-t border-white/5 italic text-xs">
                        Last Updated: {new Date().toLocaleString('en-US', { month: 'long' })} {currentYear}. Official digital log for the Commercial Inner Circle.
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div 
                        className="flex items-center gap-4 group cursor-pointer select-none" 
                        onClick={() => setAgreementAccepted(!agreementAccepted)}
                      >
                        <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center shrink-0 ${agreementAccepted ? 'bg-[#EAB308] border-[#EAB308]' : 'border-white/20 group-hover:border-white/40'}`}>
                          {agreementAccepted && <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div>
                          <div className="text-sm font-black tracking-tight text-white uppercase">Acknowledge Master Agreement</div>
                          <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Digital Signature Required</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="text-xs py-3 px-8 uppercase hover:scale-[1.05] transition-transform font-black tracking-widest" 
                        onClick={generateMasterAgreementPDF}
                      >
                        Get PDF Copy
                      </Button>
                    </div>
                  </div>

                  {/* Download Guidelines Button */}
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      className="text-xs py-5 px-12 uppercase tracking-widest border-[#EAB308]/50 hover:border-[#EAB308] hover:scale-[1.05] transition-all font-black" 
                      onClick={handleGuidelinesDownload}
                    >
                      Download Commercial Guidelines
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                   <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 text-white uppercase">Commercial Inquiry Received</h2>
                <p className="text-gray-400 font-bold mb-10 uppercase tracking-widest text-xs">Our executive B2B desk will contact you to finalize your credentials.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em]">© {currentYear} The Insurance Boss. All rights reserved.</p>
      </footer>
    </div>
  );
};

const Input = ({ label, placeholder, value, onChange, type = 'text' }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-[#EAB308] tracking-[0.2em] uppercase">{label}</label>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-[#EAB308] transition-colors font-bold text-white placeholder:text-gray-800"
    />
  </div>
);
