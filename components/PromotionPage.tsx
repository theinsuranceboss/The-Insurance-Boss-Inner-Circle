
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { db } from '../services/dbService';
import { jsPDF } from 'jspdf';

interface PromotionPageProps {
  standalone?: boolean;
}

export const PromotionPage: React.FC<PromotionPageProps> = ({ standalone = true }) => {
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

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (standalone && !agreementAccepted) {
      alert("Please acknowledge the Master Agreement before submitting.");
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
    doc.text("Inner Circle Master Agreement", margin, y);
    y += 20;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Scope Of Inner Circle", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const scopeText = "This Agreement governs your participation in The Insurance Boss Inner Circle. You agree to refer potential clients for insurance reviews. You acknowledge that you are not a licensed agent and will not engage in selling or negotiating contracts. The Insurance Boss provides the infrastructure, licensing, and expertise to close and service the leads provided.";
    const scopeLines = doc.splitTextToSize(scopeText, 170);
    doc.text(scopeLines, margin, y);
    y += (scopeLines.length * 7) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("2. Referral Fees & Residuals", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const feesText = "Fees are calculated based on gross commission received from the carrier. Disbursements are made via ACH on the 1st of each month following receipt of funds from carrier partners. Residual payments recur annually for as long as the policy remains active and the partner is in good standing with the Inner Circle program.";
    const feesLines = doc.splitTextToSize(feesText, 170);
    doc.text(feesLines, margin, y);
    y += (feesLines.length * 7) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("3. Confidentiality & Data Protection", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const confText = "All client data, leads, and underwriting processes shared via the Inner Circle vault are strictly confidential. You agree to protect this information and use it solely for the purposes of the referral program. Unauthorized distribution of proprietary systems or client lists is strictly prohibited.";
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
    doc.text(`Company: ${appData.businessName || "Pending Enrollment"}`, margin, y);
    y += 7;
    doc.text(`Verification Date: ${new Date().toLocaleDateString('en-US')}`, margin, y);
    y += 7;
    doc.text("This document constitutes a binding digital agreement upon submission of the application form.", margin, y);

    doc.save("Master_Agreement_Inner_Circle.pdf");
  };

  const handleGuidelinesDownload = () => {
    const link = document.createElement('a');
    link.href = 'https://drive.google.com/uc?export=download&id=1HKe5ZZRFm1gI-9XFgY7FimEs6nbaHmOO';
    link.setAttribute('download', 'The_Insurance_Boss_Full_Guidelines.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    {
      title: "Commercial Lines",
      items: ["General Liability", "Business Owner’s Policy (BOP)", "Workers’ Comp", "Commercial Auto", "Cyber Liability"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Life & Health",
      items: ["Term Life", "Whole Life", "Universal Life", "Mortgage Protection", "Disability", "Medicare Supplement", "ACA Health"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      title: "Retirement & Investment",
      items: ["Annuities", "IRAs", "401(k) Rollovers", "College Savings"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Personal Lines",
      items: ["Flood Insurance", "Renters Insurance", "Landlord / Dwelling", "Specialty Vehicles (ATVs, Boats, etc.)"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    }
  ];

  const partnerProfiles = [
    {
      title: "Real Estate Professionals",
      desc: "Agents and brokers with active homebuyers who need policies to close escrow immediately.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      )
    },
    {
      title: "Financial Advisors",
      desc: "Wealth managers looking to protect client assets through Life, Annuity, and Estate planning solutions.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      )
    },
    {
      title: "Mortgage Lenders",
      desc: "Loan officers requiring fast, reliable insurance binders to fund loans on time without delays.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v20M12 11v23M16 17v17M4 14V4h16v10" /></svg>
      )
    },
    {
      title: "Tax Professionals & CPAs",
      desc: "Trusted advisors seeking to add value and revenue by referring business owners for Commercial Lines.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      )
    },
    {
      title: "Auto Dealerships",
      desc: "Sales teams needing instant proof of insurance to let customers drive off the lot legally.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11l-1.35 1.1c-.45.37-1.03.57-1.65.57H8c-.62 0-1.2-.2-1.65-.57L5 11M5 11l-1.5 3.5h17L19 11M5 11V9c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2m-14 3.5v3.5c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-3.5m-15 0h16M7 18v1m10-1v1" />
        </svg>
      )
    },
    {
      title: "Property Management",
      desc: "Firms needing streamlined tracking for tenant liability and landlord dwelling policies.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      )
    },
    {
      title: "Business Brokers",
      desc: "Intermediaries facilitating acquisitions who need immediate GL & Workers' Comp binders to close the deal.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    {
      title: "Home Service Professionals",
      desc: "High-volume contractors (Solar, Roofing, HVAC) who can monetize their direct access to homeowners by referring leads.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>
      )
    }
  ];

  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <div className={`bg-[#0a0a0a] text-white ${standalone ? 'min-h-screen' : ''} selection:bg-[#EAB308] selection:text-black scroll-smooth`}>
      {/* Hero Section */}
      <section className={`relative ${standalone ? 'py-48' : 'py-16'} px-6 overflow-hidden`}>
        <div className="absolute top-0 right-0 w-full h-full opacity-20 z-0 grayscale contrast-125">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/90 to-[#0a0a0a]" />
          <img 
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover"
            alt="The Bosses in a Circle"
          />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="inline-block px-4 py-1 bg-[#EAB308] text-black text-[10px] font-black rounded-full mb-8 tracking-[0.2em] uppercase">
            The Insurance Boss Inner Circle
          </div>
          <h1 className={`${standalone ? 'text-6xl md:text-[100px]' : 'text-4xl md:text-6xl'} font-black mb-10 leading-[0.85] tracking-tighter text-white`}>
            Earn Residual Income <br />
            <span className="text-[#EAB308]">Without Selling Insurance</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
            Join the premier <span className="text-white font-black">Inner Circle</span> program. We quote, close, service, and retain the client. You collect <span className="text-white font-extrabold underline decoration-[#EAB308] decoration-2 underline-offset-4">monthly residual income</span> for life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/login?type=partner">
              <Button variant="outline" className="px-16 py-7 text-xl border-white/10 text-white hover:border-[#EAB308]">
                Inner Circle Login
              </Button>
            </Link>
            <Link to="/login?type=admin">
              <Button variant="secondary" className="px-16 py-7 text-xl bg-neutral-800 text-white border-none hover:bg-neutral-700">
                Executive Desk Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ideal Partner Profiles Section */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6 text-white">Ideal <br/><span className="text-[#EAB308]">Partner Profiles</span></h2>
            <p className="text-gray-500 font-bold max-w-2xl mx-auto uppercase tracking-widest text-xs">Partners With Recurring Clients, Regulated Industries, Or Transaction-Based Workflows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnerProfiles.map((profile, idx) => (
              <div key={idx} className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col hover:border-[#EAB308]/30 transition-all group">
                <div className="text-[#EAB308] mb-8 bg-[#EAB308]/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-[#EAB308] group-hover:text-black transition-all">
                  {profile.icon}
                </div>
                <h3 className="text-2xl font-black mb-6 tracking-tight text-white group-hover:text-[#EAB308] transition-colors">
                  {profile.title}
                </h3>
                <p className="text-sm font-bold text-gray-400 group-hover:text-gray-200 transition-colors leading-tight">
                  {profile.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Matrix */}
      <section className="py-32 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6 text-white">High-Volume <br/><span className="text-[#EAB308]">Inner Circle Portfolio</span></h2>
            <p className="text-gray-500 font-bold max-w-2xl mx-auto uppercase tracking-widest text-xs">Full Carrier Distribution for Every Segment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((cat, idx) => (
              <div key={idx} className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col hover:border-[#EAB308]/30 transition-all group">
                <div className="text-[#EAB308] mb-8 bg-[#EAB308]/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-[#EAB308] group-hover:text-black transition-all">
                  {cat.icon}
                </div>
                <h3 className="text-2xl font-black mb-6 tracking-tight text-white group-hover:text-[#EAB308] transition-colors">{cat.title}</h3>
                <ul className="space-y-4 flex-grow">
                  {cat.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-[#EAB308] mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-sm font-bold text-gray-400 group-hover:text-gray-200 transition-colors leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      {standalone && (
        <section id="apply" className="py-40 px-6 bg-[#0d0d0d] border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            {!appSubmitted ? (
              <div className="space-y-20">
                <div>
                  <div className="text-center mb-16">
                    <h2 className="text-5xl font-black tracking-tighter mb-4 text-white">Initialize Inner Circle Membership</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Submit your prospectus below to start earning monthly residuals.</p>
                  </div>
                  <form onSubmit={handleAppSubmit} className="space-y-6 bg-[#111] p-10 rounded-[40px] border border-white/5 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Full Name *" placeholder="..." value={appData.fullName} onChange={v => setAppData({...appData, fullName: v})} />
                      <Input label="Business Name *" placeholder="..." value={appData.businessName} onChange={v => setAppData({...appData, businessName: v})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Email Address *" placeholder="..." value={appData.email} onChange={v => setAppData({...appData, email: v})} />
                      <Input label="Phone Number *" placeholder="..." value={appData.phone} onChange={v => setAppData({...appData, phone: v})} />
                    </div>
                    <Input label="Industry *" placeholder="e.g. Real Estate" value={appData.industry} onChange={v => setAppData({...appData, industry: v})} />
                    <Input label="Avg. Monthly Leads *" placeholder="e.g. 5-10" value={appData.avgReferrals} onChange={v => setAppData({...appData, avgReferrals: v})} />
                    <Button type="submit" fullWidth className="py-5 text-lg uppercase tracking-widest shadow-2xl">Send Inner Circle Prospectus</Button>
                  </form>
                </div>

                {/* Master Agreement Section */}
                <div id="agreement" className="animate-in slide-in-from-bottom-6 duration-700">
                  <div className="mb-8">
                    <h2 className="text-4xl font-black tracking-tighter mb-2 text-white">Inner Circle Master Agreement</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Compliance & Engagement Standards</p>
                  </div>
                  
                  <div className="bg-[#111] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-8 mb-8">
                    <div className="h-[350px] overflow-y-auto pr-4 no-scrollbar text-sm text-gray-400 font-medium leading-relaxed space-y-6">
                      <p className="font-black text-white text-lg">1. Scope Of Inner Circle</p>
                      <p>This Agreement governs your participation in The Insurance Boss Inner Circle. You agree to refer potential clients for insurance reviews. You acknowledge that you are not a licensed agent and will not engage in selling or negotiating contracts.</p>
                      <p className="font-black text-white text-lg">2. Referral Fees</p>
                      <p>Fees are calculated based on gross commission received. Disbursements are made via ACH on the 1st of each month following receipt of funds from carrier partners.</p>
                      <p className="font-black text-white text-lg">3. Confidentiality</p>
                      <p>All client data and underwriting processes shared via the Inner Circle vault are strictly confidential and protected by non-disclosure protocols.</p>
                      <div className="pt-10 border-t border-white/5 italic text-xs">
                        Last Updated: {currentMonthName} {currentYear}. Official digital log for the Insurance Boss Inner Circle.
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
                          <div className="text-sm font-black tracking-tight text-white uppercase">I acknowledge the Master Agreement</div>
                          <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Digital Signature Required</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="text-xs py-3 px-8 uppercase hover:scale-[1.05] transition-transform" 
                        onClick={generateMasterAgreementPDF}
                      >
                        Download PDF Copy
                      </Button>
                    </div>
                  </div>

                  {/* Download Guidelines Button */}
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      className="text-xs py-5 px-12 uppercase tracking-widest border-[#EAB308]/50 hover:border-[#EAB308] hover:scale-[1.05] transition-all" 
                      onClick={handleGuidelinesDownload}
                    >
                      Download The Full Inner Circle Guidelines
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                   <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 text-white">Membership Inquiry Received</h2>
                <p className="text-gray-400 font-bold mb-10 uppercase tracking-widest text-xs">Our executive team will reach out shortly to finalize your Inner Circle credentials.</p>
              </div>
            )}
          </div>
        </section>
      )}
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
