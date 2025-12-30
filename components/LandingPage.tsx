
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/dbService';
import { Affiliate, Niche } from '../types';
import { Button } from './Button';
import { PromotionPage } from './PromotionPage';

export const LandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (slug) {
      const data = db.getAffiliateBySlug(slug);
      setAffiliate(data || null);
    }
    setLoading(false);
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="bg-[#EAB308] text-black font-black p-4 rounded-lg inline-block text-2xl mb-4 animate-pulse">IB</div>
        <div className="text-[#EAB308] font-black tracking-widest text-xs">Initializing Secure Portal...</div>
      </div>
    </div>
  );

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-black mb-4 tracking-tighter">Boss Not Found</h1>
        <p className="text-gray-400 mb-8 tracking-widest text-xs font-bold">This affiliate link is invalid or has expired.</p>
        <Link to="/login"><Button>Go To The Portal</Button></Link>
      </div>
    );
  }

  const coverageCategories = [
    {
      title: "Commercial Lines",
      items: ["General Liability", "Business Owner’s Policy (BOP)", "Workers’ Comp", "Commercial Auto", "Cyber Liability"],
      icon: "🏢"
    },
    {
      title: "Life & Health",
      items: ["Term Life", "Whole Life", "Universal Life", "Mortgage Protection", "Disability", "Medicare Supplement", "ACA Health"],
      icon: "🏥"
    },
    {
      title: "Retirement & Investment",
      items: ["Annuities", "IRAs", "401(k) Rollovers", "College Savings"],
      icon: "💰"
    },
    {
      title: "Personal Lines",
      items: ["Flood Insurance", "Renters Insurance", "Landlord / Dwelling", "Specialty Vehicles (ATVs, Boats, etc.)"],
      icon: "🏠"
    }
  ];

  return (
    <div className="bg-[#0a0a0a] text-white selection:bg-[#EAB308] selection:text-black">
      {/* Dynamic Hero Section */}
      <section className="relative min-h-[80vh] flex items-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 grayscale brightness-50">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920" 
            className="w-full h-full object-cover"
            alt="Insurance Boss Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16 py-20">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-block px-4 py-1 bg-[#EAB308] text-black text-[10px] font-black rounded-full mb-6 tracking-[0.2em]">
              Executive Distribution Partner
            </div>
            <h1 className="text-5xl md:text-[80px] font-black leading-[0.85] mb-8 tracking-tighter text-white">
              Exclusive Access <br />
              via <span className="text-[#EAB308]">{affiliate.name}</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-xl font-bold leading-relaxed">
              Unlock prioritized underwriting and nationwide carrier access through the Insurance Boss Network.
            </p>
          </div>

          <div className="w-full max-w-xl">
            {!submitted ? (
              <MultiStepForm 
                affiliateId={affiliate.id} 
                onSuccess={() => setSubmitted(true)} 
              />
            ) : (
              <div className="bg-[#111] border border-white/10 rounded-[32px] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                  <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4 text-white">Transmission Successful</h2>
                <p className="text-gray-400 font-bold tracking-widest text-sm leading-relaxed mb-10">Our senior underwriting desk has received your request.</p>
                <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>New Request</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Coverage Categories Section */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">Comprehensive Coverage Solutions</h2>
            <p className="text-gray-500 font-bold tracking-widest text-xs">Market-Leading Products for Every Requirement</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coverageCategories.map((cat, idx) => (
              <div key={idx} className="bg-[#111] border border-white/10 rounded-3xl p-8 hover:border-[#EAB308]/50 transition-all group">
                <div className="text-4xl mb-6">{cat.icon}</div>
                <h3 className="text-xl font-black mb-6 text-[#EAB308]">{cat.title}</h3>
                <ul className="space-y-3">
                  {cat.items.map((item, i) => (
                    <li key={i} className="text-sm font-bold text-gray-400 flex items-start gap-2">
                      <span className="text-[#EAB308]">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PromotionPage standalone={false} />
    </div>
  );
};

export const MultiStepForm: React.FC<{ affiliateId: string; onSuccess: () => void }> = ({ affiliateId, onSuccess }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const progress = Math.round((step / totalSteps) * 100);

  const [formData, setFormData] = useState({
    businessName: '',
    dba: '',
    fein: '',
    yearsInBusiness: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    businessTypes: [] as string[],
    hasActiveCoverage: false,
    knowsPremium: false,
    hasDeclarations: false,
    contactName: '',
    email: '',
    phone: '',
  });

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const toggleBusinessType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      businessTypes: prev.businessTypes.includes(type)
        ? prev.businessTypes.filter(t => t !== type)
        : [...prev.businessTypes, type]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.addLead(affiliateId, formData.contactName, formData.email, formData.phone, {
      businessName: formData.businessName,
      dba: formData.dba,
      fein: formData.fein,
      yearsInBusiness: formData.yearsInBusiness,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zip,
      businessTypes: formData.businessTypes,
      hasActiveCoverage: formData.hasActiveCoverage,
      knowsPremium: formData.knowsPremium,
      hasDeclarations: formData.hasDeclarations,
    });
    onSuccess();
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black tracking-tighter mb-8 text-white">Business Basics</h2>
            <div className="space-y-4">
              <FormInput label="Business Legal Name *" value={formData.businessName} onChange={v => setFormData({...formData, businessName: v})} placeholder="..." />
              <FormInput label="DBA (Doing Business As)" value={formData.dba} onChange={v => setFormData({...formData, dba: v})} placeholder="..." />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="FEIN / EIN *" value={formData.fein} onChange={v => setFormData({...formData, fein: v})} placeholder="..." />
                <FormInput label="Years in Business *" value={formData.yearsInBusiness} onChange={v => setFormData({...formData, yearsInBusiness: v})} placeholder="..." />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black tracking-tighter mb-8 text-white">Location</h2>
            <div className="space-y-4">
              <FormInput label="Address Line 1 *" value={formData.address} onChange={v => setFormData({...formData, address: v})} placeholder="..." />
              <FormInput label="City *" value={formData.city} onChange={v => setFormData({...formData, city: v})} placeholder="..." />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="State *" value={formData.state} onChange={v => setFormData({...formData, state: v})} placeholder="..." />
                <FormInput label="Zip Code *" value={formData.zip} onChange={v => setFormData({...formData, zip: v})} placeholder="..." />
              </div>
            </div>
          </div>
        );
      case 3:
        const industries = ["Construction", "Real Estate", "Healthcare", "Professional Services", "Cyber", "Finance", "Manufacturing", "Legal", "Wholesale", "Automotive", "Logistics", "Retail"];
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black tracking-tighter mb-8 text-white">Business Type</h2>
            <div className="grid grid-cols-2 gap-3">
              {industries.map(ind => (
                <button 
                  key={ind}
                  type="button"
                  onClick={() => toggleBusinessType(ind)}
                  className={`px-4 py-3 rounded-xl text-xs font-black border transition-all ${formData.businessTypes.includes(ind) ? 'bg-[#EAB308] text-black border-[#EAB308]' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-4xl font-black tracking-tighter mb-8 text-white">Coverage Info</h2>
            <ToggleQuestion label="Active Coverage?" value={formData.hasActiveCoverage} onChange={v => setFormData({...formData, hasActiveCoverage: v})} />
            <ToggleQuestion label="Know Your Premium?" value={formData.knowsPremium} onChange={v => setFormData({...formData, knowsPremium: v})} />
            <ToggleQuestion label="Have Dec Page?" value={formData.hasDeclarations} onChange={v => setFormData({...formData, hasDeclarations: v})} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black tracking-tighter mb-8 text-white">Contact</h2>
            <div className="space-y-4">
              <FormInput label="Contact Name *" value={formData.contactName} onChange={v => setFormData({...formData, contactName: v})} placeholder="..." />
              <FormInput label="Email Address *" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="..." />
              <FormInput label="Phone Number *" type="tel" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="..." />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black tracking-tighter mb-8 text-white">Final Review</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400 text-xs font-bold tracking-widest">Business</span>
                <span className="font-bold text-white">{formData.businessName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400 text-xs font-bold tracking-widest">Contact</span>
                <span className="font-bold text-white">{formData.contactName}</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[#EAB308] text-[9px] font-black tracking-[0.2em]">Step {step} of {totalSteps}</span>
          <span className="text-white text-xl font-black">{progress}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#EAB308] transition-all duration-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 rounded-[32px] p-8 shadow-2xl min-h-[500px] flex flex-col">
        <div className="flex-grow">
          {renderStep()}
        </div>
        <div className="mt-8 flex gap-4">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-xs tracking-widest text-gray-400 hover:bg-white/10 transition-all">Back</button>
          )}
          {step < totalSteps ? (
            <button type="button" onClick={() => {
               if (step === 3) setStep(5);
               else if (step === 5) setStep(7);
               else if (step === 7) setStep(8);
               else nextStep();
            }} className="flex-1 px-6 py-4 rounded-2xl bg-[#EAB308] text-black font-black text-xs tracking-[0.2em] hover:scale-[1.01] active:scale-95 transition-all">Continue</button>
          ) : (
            <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-[#EAB308] text-black font-black text-xs tracking-[0.2em] hover:scale-[1.01] active:scale-95 transition-all">Finish Request</button>
          )}
        </div>
      </form>
    </div>
  );
};

export const FormInput = ({ label, ...props }: any) => (
  <div className="space-y-1">
    <label className="block text-[9px] font-black text-[#EAB308] tracking-widest">{label}</label>
    <input 
      {...props}
      className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-[#EAB308] transition-all font-bold text-white placeholder:text-gray-500"
      onChange={e => props.onChange?.(e.target.value)}
    />
  </div>
);

export const ToggleQuestion = ({ label, value, onChange }: any) => (
  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center gap-4 hover:border-white/20 transition-all">
    <span className="font-black text-gray-200 text-[10px] tracking-wider">{label}</span>
    <div className="flex bg-black p-1 rounded-lg">
      <button type="button" onClick={() => onChange(true)} className={`px-4 py-1 rounded text-[10px] font-black transition-all ${value ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Yes</button>
      <button type="button" onClick={() => onChange(false)} className={`px-4 py-1 rounded text-[10px] font-black transition-all ${!value ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>No</button>
    </div>
  </div>
);
