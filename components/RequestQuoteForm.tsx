
import React, { useState } from 'react';
import { db } from '../services/dbService';

interface RequestQuoteFormProps {
  affiliateId: string;
  onSuccess?: () => void;
  title?: string;
}

export const RequestQuoteForm: React.FC<RequestQuoteFormProps> = ({ affiliateId, onSuccess, title = "ADD YOUR LEAD TO YOUR DATABASE" }) => {
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
    if (onSuccess) onSuccess();
  };

  if (submitted) {
    return (
      <div className="bg-[#111] rounded-[32px] p-12 text-center animate-in zoom-in-95 duration-500 shadow-2xl border border-white/5">
        <div className="w-20 h-20 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-8 uppercase">Lead Added To Database</h2>
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
            <p className="text-gray-500 font-bold mb-10">Please review your profile before adding lead to database.</p>
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
          <button onClick={handleSubmit} className="flex-1 bg-[#EAB308] text-black font-black py-5 rounded-xl uppercase tracking-widest text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all">Add Lead To Database</button>
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
      className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white font-bold focus:outline-none focus:border-[#EAB308] transition-all placeholder:text-gray-800"
    />
  </div>
);

const ToggleRow = ({ label, value, onChange }: any) => (
  <div className="bg-black/40 border border-white/5 rounded-xl p-5 flex justify-between items-center gap-4 hover:border-white/20 transition-all">
    <span className="font-black text-gray-200 text-[10px] tracking-wider uppercase">{label}</span>
    <div className="flex bg-black p-1 rounded-lg">
      <button onClick={() => onChange(true)} className={`px-6 py-2 rounded text-[10px] font-black transition-all ${value ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Yes</button>
      <button onClick={() => onChange(false)} className={`px-6 py-2 rounded text-[10px] font-black transition-all ${!value ? 'bg-[#EAB308] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>No</button>
    </div>
  </div>
);

const SummaryItem = ({ label, value }: any) => (
  <div className="flex justify-between items-center border-b border-white/5 pb-2 last:border-none">
    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
    <span className="text-white font-bold text-sm">{value || 'N/A'}</span>
  </div>
);
