/**
 * FormConfigEditor.tsx
 * Allows admin AND members to customize the "Add Your Lead To Your Database" form.
 * Config is persisted in localStorage under 'boss_form_config'.
 */

import React, { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
export interface StepConfig {
  id: number;
  title: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'toggle' | 'tags';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for 'tags' type (industry selector)
}

export interface FormConfig {
  formTitle: string;
  formSubtitle: string;
  steps: StepConfig[];
}

// ── Defaults ───────────────────────────────────────────────────────────────
export const DEFAULT_FORM_CONFIG: FormConfig = {
  formTitle: 'ADD YOUR LEAD TO YOUR DATABASE',
  formSubtitle: 'Directly deposit lead data into your database.',
  steps: [
    {
      id: 1,
      title: 'Business Basics',
      fields: [
        { key: 'businessName', label: 'Business Legal Name *', type: 'text', required: true, placeholder: '...' },
        { key: 'dba', label: 'DBA (Doing Business As)', type: 'text', placeholder: '...' },
        { key: 'fein', label: 'FEIN / EIN *', type: 'text', required: true, placeholder: '...' },
        { key: 'yearsInBusiness', label: 'Years in Business *', type: 'text', required: true, placeholder: '...' },
      ],
    },
    {
      id: 2,
      title: 'Location',
      fields: [
        { key: 'address', label: 'Address Line 1 *', type: 'text', required: true, placeholder: '...' },
        { key: 'city', label: 'City *', type: 'text', required: true, placeholder: '...' },
        { key: 'state', label: 'State *', type: 'text', required: true, placeholder: '...' },
        { key: 'zip', label: 'Zip Code *', type: 'text', required: true, placeholder: '...' },
      ],
    },
    {
      id: 3,
      title: 'Business Type',
      fields: [
        {
          key: 'businessTypes',
          label: 'Industry / Business Type',
          type: 'tags',
          options: ['Construction', 'Real Estate', 'Healthcare', 'Professional Services', 'Cyber', 'Finance', 'Manufacturing', 'Legal', 'Wholesale', 'Automotive', 'Logistics', 'Retail', 'Food & Beverage', 'Other'],
        },
      ],
    },
    {
      id: 5,
      title: 'Coverage Info',
      fields: [
        { key: 'hasActiveCoverage', label: 'Active Coverage?', type: 'toggle' },
        { key: 'knowsPremium', label: 'Know Your Premium?', type: 'toggle' },
        { key: 'hasDeclarations', label: 'Have Dec Page?', type: 'toggle' },
      ],
    },
    {
      id: 7,
      title: 'Contact',
      fields: [
        { key: 'contactName', label: 'Contact Name *', type: 'text', required: true, placeholder: '...' },
        { key: 'email', label: 'Email Address *', type: 'email', required: true, placeholder: '...' },
        { key: 'phone', label: 'Phone Number *', type: 'tel', required: true, placeholder: '...' },
      ],
    },
  ],
};

// ── Storage helpers ────────────────────────────────────────────────────────
export function loadFormConfig(): FormConfig {
  try {
    const raw = localStorage.getItem('boss_form_config');
    if (raw) return JSON.parse(raw) as FormConfig;
  } catch { /* ignore */ }
  return DEFAULT_FORM_CONFIG;
}

export function saveFormConfig(cfg: FormConfig) {
  localStorage.setItem('boss_form_config', JSON.stringify(cfg));
}

// ── Editor Component ───────────────────────────────────────────────────────
interface FormConfigEditorProps {
  onClose: () => void;
}

export const FormConfigEditor: React.FC<FormConfigEditorProps> = ({ onClose }) => {
  const [cfg, setCfg] = useState<FormConfig>(() => loadFormConfig());
  const [activeStep, setActiveStep] = useState<number>(cfg.steps[0]?.id ?? 1);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveFormConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Reset form to default? This will remove all your customizations.')) {
      setCfg(DEFAULT_FORM_CONFIG);
      saveFormConfig(DEFAULT_FORM_CONFIG);
    }
  };

  const updateStep = (stepId: number, changes: Partial<StepConfig>) => {
    setCfg(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, ...changes } : s),
    }));
  };

  const updateField = (stepId: number, fieldKey: string, changes: Partial<FieldConfig>) => {
    setCfg(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.id === stepId
          ? { ...s, fields: s.fields.map(f => f.key === fieldKey ? { ...f, ...changes } : f) }
          : s
      ),
    }));
  };

  const addField = (stepId: number) => {
    const key = `custom_${Date.now()}`;
    const newField: FieldConfig = { key, label: 'New Field', type: 'text', placeholder: '...' };
    setCfg(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.id === stepId ? { ...s, fields: [...s.fields, newField] } : s
      ),
    }));
  };

  const removeField = (stepId: number, fieldKey: string) => {
    setCfg(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.id === stepId ? { ...s, fields: s.fields.filter(f => f.key !== fieldKey) } : s
      ),
    }));
  };

  const updateTagOptions = (stepId: number, fieldKey: string, raw: string) => {
    const options = raw.split(',').map(o => o.trim()).filter(Boolean);
    updateField(stepId, fieldKey, { options });
  };

  const currentStep = cfg.steps.find(s => s.id === activeStep);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Form Editor</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Customize the Lead Database Form</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 border border-white/10 rounded-xl transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${saved ? 'bg-green-500 text-black' : 'bg-[#EAB308] text-black hover:brightness-110'}`}
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white border border-white/10 rounded-xl transition-all"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-2 overflow-y-auto">
            {/* Form Header */}
            <div className="mb-4">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Form Header</p>
              <div className="space-y-2">
                <input
                  value={cfg.formTitle}
                  onChange={e => setCfg(prev => ({ ...prev, formTitle: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-[#EAB308] transition-all"
                  placeholder="Form title..."
                />
                <input
                  value={cfg.formSubtitle}
                  onChange={e => setCfg(prev => ({ ...prev, formSubtitle: e.target.value }))}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-xs font-bold focus:outline-none focus:border-[#EAB308] transition-all"
                  placeholder="Subtitle..."
                />
              </div>
            </div>

            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Form Steps</p>
            {cfg.steps.map(step => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeStep === step.id ? 'bg-[#EAB308] text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                Step {step.id}: {step.title}
              </button>
            ))}
          </div>

          {/* Main editor panel */}
          <div className="flex-1 overflow-y-auto p-8">
            {currentStep && (
              <div className="space-y-6">
                {/* Step title */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#EAB308] uppercase tracking-widest">Step Title</label>
                  <input
                    value={currentStep.title}
                    onChange={e => updateStep(currentStep.id, { title: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white font-black text-xl focus:outline-none focus:border-[#EAB308] transition-all"
                  />
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fields</p>
                    {currentStep.fields[0]?.type !== 'tags' && (
                      <button
                        onClick={() => addField(currentStep.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-[#EAB308] hover:text-yellow-300 transition-colors flex items-center gap-1"
                      >
                        + Add Field
                      </button>
                    )}
                  </div>

                  {currentStep.fields.map(field => (
                    <div key={field.key} className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                          {field.type.toUpperCase()} field
                        </span>
                        {!['contactName', 'email', 'phone', 'businessTypes', 'businessName'].includes(field.key) && (
                          <button
                            onClick={() => removeField(currentStep.id, field.key)}
                            className="text-[9px] font-black text-red-500/50 hover:text-red-400 uppercase tracking-widest transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Label */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Label</label>
                        <input
                          value={field.label}
                          onChange={e => updateField(currentStep.id, field.key, { label: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[#EAB308] transition-all"
                        />
                      </div>

                      {/* Type selector (for non-toggle, non-tags) */}
                      {field.type !== 'toggle' && field.type !== 'tags' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Field Type</label>
                          <select
                            value={field.type}
                            onChange={e => updateField(currentStep.id, field.key, { type: e.target.value as any })}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[#EAB308] transition-all"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                          </select>
                        </div>
                      )}

                      {/* Placeholder (for text inputs) */}
                      {field.type !== 'toggle' && field.type !== 'tags' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Placeholder</label>
                          <input
                            value={field.placeholder || ''}
                            onChange={e => updateField(currentStep.id, field.key, { placeholder: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-gray-400 font-bold text-sm focus:outline-none focus:border-[#EAB308] transition-all"
                          />
                        </div>
                      )}

                      {/* Tag options editor */}
                      {field.type === 'tags' && field.options && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                            Options (comma separated)
                          </label>
                          <textarea
                            rows={3}
                            value={field.options.join(', ')}
                            onChange={e => updateTagOptions(currentStep.id, field.key, e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[#EAB308] transition-all resize-none"
                          />
                          <p className="text-[9px] text-gray-600 font-bold">
                            Preview: {field.options.length} options
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
