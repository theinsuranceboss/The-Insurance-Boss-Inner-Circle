import React, { useState } from 'react';
import { Affiliate } from '../types';

interface CampaignTemplatesProps {
  user: Affiliate;
}

export const CampaignTemplates: React.FC<CampaignTemplatesProps> = ({ user }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Compute live referral link
  const refLink = `${window.location.origin}${window.location.pathname}#/inner-circle/${user.slug}`;

  const templates = [
    {
      title: "LinkedIn B2B Outreach Layout",
      description: "Direct business partner prospecting to target trucking fleet operators, construction builders, and corporate risks.",
      icon: "💼",
      text: `Hi {First_Name}, I noticed your firm is navigating high capacity operations in the commercial space.

As a certified partner with The Insurance Boss, we formulate direct-carrier premium placements (logistics trucking fleet, GL, D&O) across 50+ gold-rated carrier syndicates to bypass expensive middleman markups.

You can use my secure route link to trigger a rapid premium assessment or request a custom proposal in under 5 minutes:
👉 {LINK}

Let me know if you would like to run a direct premium audit. We protect your margin.

Best regards,
{MY_NAME}
Inner Circle Consultant`
    },
    {
      title: "Direct SME Referral Email Template",
      description: "A professional, direct referral email to send to business owners, fleet managers, or warm contacts.",
      icon: "✉️",
      text: `Subject: Direct Premium Audit: Secure Custom Commercial Protection for {Company_Name}

Dear {Contact_Name},

I am writing to connect you directly with elite commercial underwriters.

Through my accredited position inside the Inner Circle at The Insurance Boss, I assist operators in securing direct-line liability options. Representing over 50 leading carrier trusts, we handle long-haul trucking liabilities, workers' comp matrices, contract builder bonds, and enterprise cyber protection packages.

I have established a personalized referral portal for your risk assessment. Completing this intake form routes your business specifics directly to our executive underwriting desks:
👉 {LINK}

The process takes less than five minutes. If you have any active commercial coverages, our underwriters can execute a complimentary premium audit to locate potential carrier savings.

Best regards,

{MY_NAME}
Commercial Risk Advisor
The Insurance Boss Networks`
    },
    {
      title: "Sovereign SMS / Casual Messaging",
      description: "Optimized for high-conversion warm outreach on WhatsApp, direct SMS, or corporate Slack.",
      icon: "💬",
      text: `Hey! I am now a certified Commercial Partner with The Insurance Boss network. 

We deliver direct commercial carrier quotes (trucking liability, builder risk bonds, workers' comp, commercial auto, cyber risk) representing over 50 top carrier trusts.

If you are looking to audit your business premiums or need a quick custom proposal, try my secure link here to run an intake review:
👉 {LINK}

Let me know if you have any questions! Best, {MY_NAME}`
    },
    {
      title: "Social Media Campaign Post (X / LinkedIn / Facebook)",
      description: "Fully styled post complete with hashtags and professional layout to share on your feed.",
      icon: "🚀",
      text: `🚀 Exciting professional update! I have officially joined the elite Inner Circle at The Insurance Boss.

We deliver engineered risk mitigation and direct underwriting channels, bypassing middleman markups. Leveraging direct distribution contracts with over 50 premier US carrier syndicates, we build customized portfolios across:
✅ Logistics & Fleet (Trucking cargo, DSP, Long-haul Auto)
✅ Tech & Corporate (Cyber breach response, D&O, E&O)
✅ Contractors & Builders (Contractor general liability, Surety bonds, Builder Risk)
✅ Hospitality & Retail (Liquor liability, Property cargo)

If you are a business owner or operator looking to audit your active liability premiums, trigger an expert assessment in 5 minutes via my secure broker portal:
👉 {LINK}

#CommercialInsurance #RiskManagement #Logistics #AffiliateMarketing #TheInsuranceBoss`
    }
  ];

  const handleCopy = async (rawText: string, index: number) => {
    // Interpolate values
    const interpolated = rawText
      .replace(/{LINK}/g, refLink)
      .replace(/{MY_NAME}/g, user.name);

    try {
      await navigator.clipboard.writeText(interpolated);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 3000);
    } catch (err) {
      console.error("Failed to copy campaign text:", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      alert("Referral Link copied directly!");
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Campaign outreach templates</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">High-Performance Conversion Matrix</p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="bg-[#EAB308] hover:bg-[#d9a406] text-black font-black px-6 py-3.5 rounded-xl uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 border-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
          Copy My Referral Link Only
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 bg-[#EAB308]/15 rounded-2xl flex items-center justify-center text-[#EAB308] shrink-0 text-2xl font-black">ℹ️</div>
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Dynamic Link Interpolation Active</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            The layouts listed below dynamically process and interpolate your name (<span className="text-[#EAB308] font-bold">{user.name}</span>) and your custom Referrer Slug landing page (<span className="text-[#EAB308] font-bold font-mono">{refLink}</span>). Simply copy and distribute!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {templates.map((tpl, idx) => {
          const renderedText = tpl.text
            .replace(/{LINK}/g, refLink)
            .replace(/{MY_NAME}/g, user.name);

          return (
            <div key={idx} className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col justify-between hover:border-white/10 transition-all shadow-xl group">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl shadow-inner group-hover:bg-[#EAB308]/10 transition-colors">
                    {tpl.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">{tpl.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{tpl.description}</p>
                  </div>
                </div>

                <div className="relative mt-4">
                  <pre className="p-5 bg-black/40 border border-white/5 rounded-2xl text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-72 leading-relaxed scrollbar-thin">
                    {renderedText}
                  </pre>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleCopy(tpl.text, idx)}
                  className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${copiedIndex === idx ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-[#EAB308] hover:text-black hover:border-[#EAB308]'}`}
                >
                  {copiedIndex === idx ? "✓ Campaign Saved to Clipboard" : "Copy Template Text"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
