import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { FormConfig, loadFormConfig } from './FormConfigEditor';

interface RequestQuoteFormProps {
  affiliateId: string;
  onSuccess?: () => void;
  title?: string;
  config?: FormConfig;
}

export const RequestQuoteForm: React.FC<RequestQuoteFormProps> = ({ affiliateId, onSuccess, config }) => {
  const [formConfig, setFormConfig] = useState<FormConfig>(() => config || loadFormConfig());
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (config) {
      setFormConfig(config);
    } else {
      setFormConfig(loadFormConfig());
    }
  }, [config]);

  // Initialize form values from config fields to prevent undefined state
  useEffect(() => {
    if (formConfig) {
      setFormData(prev => {
        const updated = { ...prev };
        formConfig.steps.forEach(step => {
          step.fields.forEach(field => {
            if (updated[field.key] === undefined) {
              if (field.type === 'toggle') {
                updated[field.key] = false;
              } else if (field.type === 'tags') {
                updated[field.key] = [];
              } else {
                updated[field.key] = '';
              }
            }
          });
        });
        return updated;
      });
    }
  }, [formConfig]);

  const steps = formConfig.steps;
  const totalSteps = steps.length + 1; // +1 for the Summary/Review step
  const progress = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;

  const currentStep = stepIndex < steps.length ? steps[stepIndex] : null;

  const nextStep = () => {
    if (stepIndex < steps.length && isStepValid()) {
      setStepIndex(s => s + 1);
    }
  };

  const prevStep = () => {
    setStepIndex(s => Math.max(s - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // contactName, email, and phone are standard fields
    const name = formData.contactName || '';
    const email = formData.email || '';
    const phone = formData.phone || '';

    // Copy all fields into details metadata
    const details: Record<string, any> = {};
    steps.forEach(s => {
      s.fields.forEach(f => {
        if (f.key === 'zip') {
          details['zipCode'] = formData[f.key];
        } else {
          details[f.key] = formData[f.key];
        }
      });
    });

    db.addLead(affiliateId, name, email, phone, details);
    setSubmitted(true);
    if (onSuccess) onSuccess();
  };

  // Check if all required fields in the current step are filled out
  const isStepValid = () => {
    if (!currentStep) return true; // review step is always valid
    return currentStep.fields.every(field => {
      if (field.required) {
        if (field.type === 'tags') {
          return (formData[field.key] || []).length > 0;
        }
        return String(formData[field.key] || '').trim() !== '';
      }
      return true;
    });
  };

  if (submitted) {
    return (
      <div className="bg-[#111] rounded-[32px] p-12 text-center animate-in zoom-in-95 duration-500 shadow-2xl border border-white/5">
        <div className="w-20 h-20 bg-[#EAB308] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-8 uppercase">Lead Added To Database</h2>
        <button onClick={() => { setSubmitted(false); setStepIndex(0); }} className="bg-[#EAB308] text-black font-black px-12 py-4 rounded-xl uppercase tracking-widest text-xs hover:brightness-110 transition-all active:scale-95 shadow-xl">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="bg-black/95 rounded-[32px] p-8 min-h-[500px] flex flex-col border border-white/10 shadow-2xl">
      <div className="mb-10 space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[#EAB308] text-[10px] font-black tracking-widest uppercase opacity-70">Step {stepIndex + 1} of {totalSteps}</span>
          <span className="text-white text-xl font-black">{progress}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-[#EAB308] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-grow">
        {currentStep ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">{currentStep.title}</h3>
            <div className="space-y-5">
              {currentStep.fields.map(field => {
                if (field.type === 'toggle') {
                  return (
                    <ToggleRow
                      key={field.key}
                      label={field.label}
                      value={!!formData[field.key]}
                      onChange={(v: boolean) => setFormData(prev => ({ ...prev, [field.key]: v }))}
                    />
                  );
                }
                if (field.type === 'tags') {
                  return (
                    <div key={field.key} className="space-y-4">
                      <label className="block text-[9px] font-black text-[#EAB308] tracking-widest uppercase mb-2">{field.label}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(field.options || []).map(ind => {
                          const isSelected = (formData[field.key] || []).includes(ind);
                          return (
                            <button 
                              key={ind}
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const current = prev[field.key] || [];
                                  // Since businessTypes was single-select in original toggleBusinessType:
                                  const updated = field.key === 'businessTypes'
                                    ? (current.includes(ind) ? [] : [ind])
                                    : (current.includes(ind) ? current.filter((x: string) => x !== ind) : [...current, ind]);
                                  return { ...prev, [field.key]: updated };
                                });
                              }}
                              className={`px-4 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all ${isSelected ? 'bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                            >
                              {ind}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <Field
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={(v: string) => setFormData(prev => ({ ...prev, [field.key]: v }))}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Ready to Transmit</h3>
            <p className="text-gray-500 font-bold mb-10">Please review your profile before adding lead to database.</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 max-h-[300px] overflow-y-auto">
              {steps.flatMap(s => s.fields).map(field => {
                let displayVal = formData[field.key];
                if (field.type === 'toggle') {
                  displayVal = displayVal ? 'Yes' : 'No';
                } else if (field.type === 'tags') {
                  displayVal = (displayVal || []).join(', ');
                }
                return (
                  <SummaryItem
                    key={field.key}
                    label={field.label.replace(' *', '')}
                    value={displayVal}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex gap-4">
        {stepIndex > 0 && (
          <button onClick={prevStep} className="px-10 py-5 rounded-xl bg-[#111] border border-white/10 text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-[#222] transition-all">Back</button>
        )}
        {stepIndex < steps.length ? (
          <button 
            disabled={!isStepValid()}
            onClick={nextStep} 
            className={`flex-1 font-black py-5 rounded-xl uppercase tracking-widest text-sm shadow-xl transition-all ${isStepValid() ? 'bg-[#EAB308] text-black hover:brightness-110 active:scale-95' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
          >
            Continue
          </button>
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
