import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/dbService';
import { Affiliate, LandingBlock } from '../types';
import { Button } from './Button';
import { RequestQuoteForm } from './RequestQuoteForm';

export const LandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const data = db.getAffiliateBySlug(slug);
      setAffiliate(data || null);
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <img src="https://lh3.googleusercontent.com/d/1Lr3oT5chJbkjpbHTHW8f-A32Achcby6v" alt="The Insurance Boss" className="h-16 w-auto object-contain mx-auto mb-4 animate-pulse" />
          <div className="text-[#EAB308] font-black tracking-widest text-xs">Initializing secure referral page...</div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-black mb-4 tracking-tighter text-white uppercase">Affiliate Not Found</h1>
        <p className="text-gray-400 mb-8 tracking-widest text-xs font-bold uppercase">This referral link is invalid or has expired.</p>
        <Link to="/"><Button className="bg-[#EAB308] text-black border-none">Return to Corporate Hub</Button></Link>
      </div>
    );
  }

  const s = affiliate.landingSettings || {
    backgroundColor: '#0a0a0a',
    backgroundType: 'color',
    backgroundImageUrl: '',
    textColor: '#ffffff',
    accentColor: '#EAB308',
    blocks: []
  };

  const getBackgroundStyle = () => {
    if (s.backgroundType === 'image' && s.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.95)), url(${s.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: s.textColor
      };
    } else if (s.backgroundType === 'gradient') {
      return {
        backgroundImage: `linear-gradient(135deg, ${s.backgroundColor}, #0e0e0e)`,
        color: s.textColor
      };
    } else {
      return {
        backgroundColor: s.backgroundColor,
        color: s.textColor
      };
    }
  };

  const getFontSizeClass = (sz: string) => {
    switch (sz) {
      case 'sm': return 'text-xs md:text-sm';
      case 'md': return 'text-sm md:text-base';
      case 'lg': return 'text-lg md:text-xl';
      case 'xl': return 'text-xl md:text-2xl';
      case '2xl': return 'text-2xl md:text-3xl';
      case '3xl': return 'text-3xl md:text-4xl';
      case '4xl': return 'text-4xl md:text-6xl';
      case '5xl': return 'text-5xl md:text-7xl';
      default: return 'text-base';
    }
  };

  const getAlignmentClass = (align: string) => {
    switch (align) {
      case 'left': return 'text-left justify-start items-start';
      case 'right': return 'text-right justify-end items-end';
      default: return 'text-center justify-center items-center';
    }
  };

  const getBlockAlignClass = (align: string) => {
    switch (align) {
      case 'left': return 'mr-auto text-left';
      case 'right': return 'ml-auto text-right';
      default: return 'mx-auto text-center';
    }
  };

  // Render specific blocks
  const renderBlock = (b: LandingBlock) => {
    if (!b.visible) return null;

    const alignClass = getAlignmentClass(b.alignment);
    const blockAlignClass = getBlockAlignClass(b.alignment);
    const titleSize = b.fontSize;
    // Map content font size offset
    const contentSize = b.type === 'hero' ? 'lg' : 'md';

    switch (b.type) {
      case 'hero':
        return (
          <section key={b.id} className="py-20 md:py-28 px-4 flex flex-col items-center">
            <div className={`max-w-4xl w-full ${blockAlignClass}`}>
              <div className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6" style={{ backgroundColor: s.accentColor, color: '#000000' }}>
                Accredited Affiliate Route
              </div>
              <h1 className={`${getFontSizeClass(titleSize)} font-black tracking-tighter leading-[1] mb-6`} style={{ color: s.accentColor }}>
                {b.title}
              </h1>
              <p className={`${getFontSizeClass(contentSize)} text-gray-300 max-w-2xl leading-relaxed whitespace-pre-wrap ${blockAlignClass}`}>
                {b.content}
              </p>
            </div>
          </section>
        );

      case 'about':
        return (
          <section key={b.id} className="py-16 px-4 bg-white/[0.02] border-y border-white/5">
            <div className={`max-w-4xl w-full mx-auto flex flex-col md:flex-row items-center gap-10 ${b.alignment === 'right' ? 'md:flex-row-reverse' : ''}`}>
              {/* Photo Frame */}
              <div className="shrink-0 relative group">
                <div className="absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-70 transition duration-300" style={{ backgroundColor: s.accentColor }} />
                <img 
                  src={affiliate.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'} 
                  className="w-36 h-36 rounded-full object-cover border-4 border-black relative z-10 shadow-2xl" 
                  alt={affiliate.name}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Text content */}
              <div className={`flex-1 flex flex-col ${alignClass}`}>
                <h2 className={`${getFontSizeClass(titleSize)} font-black tracking-tighter mb-4`} style={{ color: s.accentColor }}>
                  {b.title}
                </h2>
                <p className="text-gray-400 text-sm font-black uppercase tracking-widest mb-2">Representing Member ID: {affiliate.referralCode}</p>
                <div className="h-0.5 w-12 rounded-full mb-4" style={{ backgroundColor: s.accentColor }} />
                <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                  {b.content}
                </p>
              </div>
            </div>
          </section>
        );

      case 'insurance_types':
        const products = [
          {
            title: "Logistics & Fleet",
            items: ["Trucking Liability", "Motor Truck Cargo", "Physical Damage", "Workers' Compensation", "Owner-Operator Programs", "Amazon DSP Fleets"],
            icon: "🚚"
          },
          {
            title: "Tech & Corporate",
            items: ["Cyber Liability Breach", "Directors & Officers (D&O)", "Errors & Omissions (E&O)", "Employment Practices", "Key Person Coverage", "Interruption Shields"],
            icon: "💻"
          },
          {
            title: "Construction & Dev",
            items: ["Commercial General Liability", "Builder's Risk Insurance", "Accredited Surety Bonds", "Contractor Tools Coverage", "Commercial Vehicle Auto"],
            icon: "🏗️"
          },
          {
            title: "Hospitality & Retail",
            items: ["Enterprise General Liability", "Accredited Liquor Liability", "Commercial Property Space", "High-Value Inventory cover", "Sovereign Food Contamination"],
            icon: "🏨"
          }
        ];

        return (
          <section key={b.id} className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className={`mb-12 ${blockAlignClass}`}>
                <h2 className={`${getFontSizeClass(titleSize)} font-black tracking-tighter mb-4`} style={{ color: s.accentColor }}>
                  {b.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                  {b.content}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {products.map((p, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 hover:border-white/10 transition-all flex flex-col justify-between">
                    <div>
                      <div className="text-3xl mb-4">{p.icon}</div>
                      <h3 className="text-lg font-black mb-4 tracking-tight" style={{ color: s.accentColor }}>{p.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {p.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.accentColor }} />
                          <span className="font-bold">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'custom_text':
        return (
          <section key={b.id} className="py-16 px-4">
            <div className={`max-w-4xl w-full ${blockAlignClass}`}>
              <h2 className={`${getFontSizeClass(titleSize)} font-black tracking-tighter mb-6`} style={{ color: s.accentColor }}>
                {b.title}
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap max-w-3xl">
                {b.content}
              </p>
            </div>
          </section>
        );

      case 'quote_form':
        return (
          <section key={b.id} className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <div className={`mb-12 ${blockAlignClass}`}>
                <h2 className={`${getFontSizeClass(titleSize)} font-black tracking-tighter mb-4`} style={{ color: s.accentColor }}>
                  {b.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                  {b.content}
                </p>
              </div>

              <div className="rounded-[40px] p-1.5 bg-gradient-to-br from-white/10 to-transparent">
                <RequestQuoteForm affiliateId={affiliate.id} title="" />
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative selection:bg-[#EAB308] selection:text-black font-sans leading-relaxed" style={getBackgroundStyle()}>
      {/* Dynamic Navigation Header */}
      <nav className="border-b border-white/5 bg-black/60 px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#EAB308] text-black font-black px-2.5 py-1.5 rounded text-sm leading-none">IB</div>
            <span className="font-black text-xs uppercase tracking-widest text-white">THE INSURANCE BOSS</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider hidden sm:inline">Partner Broker:</span>
            <span className="text-xs font-black px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-200">{affiliate.name}</span>
          </div>
        </div>
      </nav>

      {/* Frame announcement bar */}
      <div className="bg-black/80 py-2 border-b border-white/5 text-center text-[10px] tracking-widest font-bold text-gray-400 uppercase">
        Accredited commercial syndications placement portal
      </div>

      {/* Render Blocks in order */}
      <div className="max-w-5xl mx-auto py-10">
        {s.blocks && s.blocks.length > 0 ? (
          s.blocks.map(b => renderBlock(b))
        ) : (
          <div className="text-center py-20 text-gray-500 italic">This landing page has no customizable blocks enabled.</div>
        )}
      </div>

      {/* Lead Submission Form at the bottom */}
      <section className="py-20 px-4 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase" style={{ color: s.accentColor }}>
              Submit a Client Lead
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto">
              Ready to submit a commercial risk or policy placement? Input the details below to log the lead under {affiliate.name}'s profile.
            </p>
          </div>
          <div className="rounded-[40px] p-1.5 bg-gradient-to-br from-white/10 to-transparent">
            <RequestQuoteForm affiliateId={affiliate.id} title="" />
          </div>
        </div>
      </section>

      {/* Elegant minimalist footer */}
      <footer className="py-16 border-t border-white/5 text-center bg-black/40">
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">© {new Date().getFullYear()} THE INSURANCE BOSS. ALL PRIVILEGES RESERVED.</p>
        <p className="text-gray-700 text-[9px] font-bold max-w-md mx-auto leading-relaxed uppercase">The Insurance Boss is a carrier solicitation and intake portal. Affiliate programs operate independently. All placements are routed directly to licensed underwriting trusts.</p>
      </footer>
    </div>
  );
};

