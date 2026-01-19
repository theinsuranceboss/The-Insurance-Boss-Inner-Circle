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
    const scopeText = "This Agreement governs your participation in The Insurance Boss Inner Circle. You agree to refer entities for insurance reviews. You acknowledge that you are not a licensed agent and will not engage in selling or negotiating contracts. The Insurance Boss provides the licensing and expertise to close and service the leads provided.";
    const scopeLines = doc.splitTextToSize(scopeText, 170);
    doc.text(scopeLines, margin, y);
    y += (scopeLines.length * 7) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("2. Referral Fees", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const feesText = "Fees are calculated based on gross commission received. Disbursements are made via ACH on the 1st of each month following receipt of funds from carrier partners. Residual payments recur annually for as long as the policy remains active and in-force.";
    const feesLines = doc.splitTextToSize(feesText, 170);
    doc.text(feesLines, margin, y);
    y += (feesLines.length * 7) + 5;

    doc.setFont("helvetica", "bold");
    doc.text("3. Confidentiality", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    const confText = "All client data and underwriting processes shared via the Inner Circle vault are strictly confidential and protected by non-disclosure protocols.";
    const confLines = doc.splitTextToSize(confText, 170);
    doc.text(confLines, margin, y);
    y += (confLines.length * 7) + 15;

    doc.setDrawColor(234, 179, 8);
    doc.line(margin, y, 190, y);
    y += 15;

    doc.setFontSize(10);
    doc.text(`Digital Signature: ${appData.fullName || "Awaiting Signature"}`, margin, y);
    y += 7;
    doc.text(`Verification Date: ${new Date().toLocaleDateString('en-US')}`, margin, y);

    doc.save("Inner_Circle_Master_Agreement.pdf");
  };

  const categories = [
    {
      title: "Logistics & Fleet",
      items: ["Trucking Liability", "Owner-Operator Programs", "Motor Truck Cargo", "Amazon Delivery Fleet (DSP)", "Workers' Comp"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2a1 1 0 01-1 1h-1m-4-14H5a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V4z" />
        </svg>
      )
    },
    {
      title: "Tech & Corporate",
      items: ["Cyber Liability", "D&O Liability", "E&O Professional", "Employment Practices", "Tech Errors & Omissions"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Construction & Dev",
      items: ["General Liability", "Builder's Risk", "Contractor Bonds", "Umbrella/Excess", "Project Specific Wrap"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Hospitality & Retail",
      items: ["Liquor Liability", "Inventory/Stock Coverage", "Inland Marine", "Assault & Battery", "Business Interruption"],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className={`bg-[#0a0a0a] text-white ${standalone ? 'min-h-screen' : ''} selection:bg-[#EAB308] selection:text-black scroll-smooth`}>
      {/* Hero Section */}
      <section className={`relative ${standalone ? 'py-48' : 'py-16'} px-6 overflow-hidden`}>
        <div className="absolute top-0 right-0 w-full h-full opacity-20 z-0 grayscale contrast-125">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/90 to-[#0a0a0a]" />
          <img 
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover"
            alt="Hero Background"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-block px-5 py-1.5 bg-[#EAB308] text-black text-[10px] font-black rounded-full mb-8 tracking-[0.15em] uppercase shadow-lg">
            THE INSURANCE BOSS INNER CIRCLE
          </div>
          <h1 className={`${standalone ? 'text-6xl md:text-[100px]' : 'text-4xl md:text-6xl'} font-black mb-8 leading-[0.85] tracking-tighter`}>
            <span className="text-white block">Earn Residual Income</span>
            <span className="text-[#EAB308] block">Without Selling</span>
            <span className="text-[#EAB308] block">Insurance</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-400 mb-14 max-w-4xl mx-auto leading-relaxed">
            Join the premier <span className="text-white font-bold">Inner Circle</span> program. We quote, close, service, and retain the client. You collect <span className="text-white font-bold underline decoration-[#EAB308] decoration-2 underline-offset-8">monthly residual income</span> for life of the policy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/login?type=partner">
              <Button variant="outline" className="px-16 py-7 text-xl border-white/10 text-white hover:border-[#EAB308]">
                Inner Circle Members Login
              </Button>
            </Link>
            <Link to="/login?type=admin">
              <Button variant="secondary" className="px-16 py-7 text-xl bg-neutral-800 text-white border-none hover:bg-neutral-700">
                Executive Desk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Matrix */}
      <section className="py-32 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-[80px] font-black tracking-tighter leading-none mb-4 text-white">
              High-Volume <br/><span className="text-[#EAB308]">Inner Circle Portfolio</span>
            </h2>
            <p className="text-[#4e6c92] font-black tracking-[0.2em] uppercase text-[10px]">Full Carrier Distribution For Every Segment.</p>
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
          <div className="max-w-4xl mx-auto">
            {!appSubmitted ? (
              <div className="space-y-32">
                <div>
                  <div className="text-center mb-20">
                    <h2 className="text-5xl md:text-[80px] font-black tracking-tighter mb-4 text-white leading-none">Initialize Inner Circle Membership</h2>
                    <p className="text-gray-500 font-black tracking-[0.2em] uppercase text-[10px]">SUBMIT YOUR PROSPECTUS BELOW TO START EARNING MONTHLY RESIDUALS.</p>
                  </div>
                  <form onSubmit={handleAppSubmit} className="space-y-6 bg-[#111] p-10 rounded-[40px] border border-white/5 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Full Name *" placeholder="..." value={appData.fullName} onChange={v => setAppData({...appData, fullName: v})} />
                      <Input label="Business Name *" placeholder="..." value={appData.businessName} onChange={v => setAppData({...appData, businessName: v})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Work Email *" placeholder="..." value={appData.email} onChange={v => setAppData({...appData, email: v})} />
                      <Input label="Direct Phone *" placeholder="..." value={appData.phone} onChange={v => setAppData({...appData, phone: v})} />
                    </div>
                    <Input label="Primary B2B Industry *" placeholder="e.g. Accounting, Consulting" value={appData.industry} onChange={v => setAppData({...appData, industry: v})} />
                    <Input label="Avg. Monthly Referrals *" placeholder="e.g. 5-10 Businesses" value={appData.avgReferrals} onChange={v => setAppData({...appData, avgReferrals: v})} />
                    <Button type="submit" fullWidth className="py-6 text-lg uppercase tracking-[0.2em] shadow-2xl mt-4">Initialize Membership</Button>
                  </form>
                </div>

                {/* Master Agreement Section */}
                <div id="agreement" className="space-y-12">
                  <div className="text-left md:text-center">
                    <h2 className="text-5xl md:text-[80px] font-black tracking-tighter mb-4 text-white leading-none">Inner Circle Master Agreement</h2>
                    <p className="text-gray-500 font-black tracking-[0.15em] uppercase text-[10px]">COMPLIANCE & ENGAGEMENT STANDARDS</p>
                  </div>
                  
                  <div className="bg-[#111] border border-white/10 rounded-[40px] p-8 md:p-16 shadow-2xl">
                    <div className="text-sm text-gray-400 font-medium leading-relaxed space-y-10">
                      <div className="space-y-4">
                        <p className="font-black text-white text-xl">1. Scope Of Inner Circle</p>
                        <p>This Agreement governs your participation in The Insurance Boss Inner Circle. You agree to refer entities for insurance reviews. You acknowledge that you are not a licensed agent and will not engage in selling or negotiating contracts. The Insurance Boss provides the licensing and expertise to close and service the leads provided.</p>
                      </div>

                      <div className="space-y-4">
                        <p className="font-black text-white text-xl">2. Referral Fees</p>
                        <p>Fees are calculated based on gross commission received. Disbursements are made via ACH on the 1st of each month following receipt of funds from carrier partners.</p>
                      </div>

                      <div className="space-y-4">
                        <p className="font-black text-white text-xl">3. Confidentiality</p>
                        <p>All client data and underwriting processes shared via the Inner Circle vault are strictly confidential and protected by non-disclosure protocols.</p>
                      </div>

                      <div className="pt-10 border-t border-white/5 italic text-[11px] text-gray-600 font-bold">
                        Last Updated: January 2026. Official digital log for the Insurance Boss Inner Circle.
                      </div>
                    </div>

                    <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div 
                        className="flex items-center gap-6 group cursor-pointer select-none" 
                        onClick={() => setAgreementAccepted(!agreementAccepted)}
                      >
                        <div className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${agreementAccepted ? 'bg-[#EAB308] border-[#EAB308]' : 'border-white/20 group-hover:border-white/40'}`}>
                          {agreementAccepted && <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-black tracking-tight text-white uppercase">I ACKNOWLEDGE THE MASTER AGREEMENT</div>
                          <div className="text-[9px] text-gray-500 font-black uppercase tracking-[0.1em]">DIGITAL SIGNATURE REQUIRED</div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={generateMasterAgreementPDF}
                        className="px-10 py-5 rounded-xl border-2 border-[#EAB308] text-[#EAB308] font-black text-xs tracking-widest hover:bg-[#EAB308] hover:text-black transition-all uppercase"
                      >
                        DOWNLOAD PDF COPY
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                   <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 text-white uppercase">Inquiry Received</h2>
                <p className="text-gray-400 font-bold mb-10 uppercase tracking-widest text-xs">Our executive desk will contact you to finalize your credentials.</p>
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
