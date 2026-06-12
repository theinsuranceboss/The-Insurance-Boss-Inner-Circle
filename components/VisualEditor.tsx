import React, { useState, useEffect } from 'react';
import { Affiliate, LandingSettings, LandingBlock } from '../types';

interface VisualEditorProps {
  affiliate: Affiliate;
  onSave: (updatedSettings: LandingSettings, updatedPhoto: string) => void;
  isAdminMode?: boolean;
  onCancel?: () => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({
  affiliate,
  onSave,
  isAdminMode = false,
  onCancel
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(affiliate.photoUrl || '');
  const [settings, setSettings] = useState<LandingSettings>(() => {
    if (affiliate.landingSettings) {
      return JSON.parse(JSON.stringify(affiliate.landingSettings));
    }
    return {
      backgroundColor: '#0a0a0a',
      backgroundType: 'color',
      backgroundImageUrl: '',
      textColor: '#ffffff',
      accentColor: '#EAB308',
      blocks: []
    };
  });

  const [activeAccordionBlock, setActiveAccordionBlock] = useState<string | null>('block-hero');
  const [saving, setSaving] = useState(false);

  // Preset Professional Avatar photos
  const presetAvatars = [
    { name: "Executive Dark Suit", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250" },
    { name: "Professional Corporate Female", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250" },
    { name: "Sleek Partner Portrait", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250" },
    { name: "Modern Consulting Partner", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250" }
  ];

  // Preset Corporate Stock Backgrounds for image choice
  const presetBackgrounds = [
    { name: "Sovereign Glass Corner", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920" },
    { name: "Underwriting Executive Office", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920" },
    { name: "Geometric Abstract Dark Grid", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1920" },
    { name: "Deep Premium Carbon", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1920" }
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateBlockProperty = (blockId: string, property: keyof LandingBlock, value: any) => {
    setSettings(prev => {
      const updatedBlocks = prev.blocks.map(b => {
        if (b.id === blockId) {
          return { ...b, [property]: value };
        }
        return b;
      });
      return { ...prev, blocks: updatedBlocks };
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= settings.blocks.length) return;

    setSettings(prev => {
      const copy = [...prev.blocks];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, blocks: copy };
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(settings, photoUrl);
      setSaving(false);
    }, 600);
  };

  // Helper styles for preview Background mockup
  const getPreviewBackgroundStyle = () => {
    if (settings.backgroundType === 'image' && settings.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.88), rgba(0, 0, 0, 0.95)), url(${settings.backgroundImageUrl})`,
        color: settings.textColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (settings.backgroundType === 'gradient') {
      return {
        backgroundImage: `linear-gradient(135deg, ${settings.backgroundColor}, #080808)`,
        color: settings.textColor
      };
    } else {
      return {
        backgroundColor: settings.backgroundColor,
        color: settings.textColor
      };
    }
  };

  const getFontSizeClass = (sz: string) => {
    switch (sz) {
      case 'sm': return 'text-[10px] m-1';
      case 'md': return 'text-xs m-1';
      case 'lg': return 'text-sm m-1';
      case 'xl': return 'text-base m-1';
      case '2xl': return 'text-lg m-1';
      case '3xl': return 'text-xl m-1';
      case '4xl': return 'text-2xl m-1';
      case '5xl': return 'text-3xl m-1';
      default: return 'text-sm';
    }
  };

  const getAlignmentClass = (align: string) => {
    switch (align) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20 px-3 py-1 rounded-full font-black uppercase tracking-widest block w-fit mb-2">
            visual layout designer
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
            {isAdminMode ? `Customize Member Lander: ${affiliate.name}` : "Customize Your Landing Page"}
          </h1>
          <p className="text-gray-500 text-xs font-bold leading-relaxed max-w-2xl mt-1">
            Re-order sections, override typography alignments, toggle displays, customize backgrounds, and upload your profile photos below. Fully personalized.
          </p>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button 
              onClick={onCancel}
              className="bg-white/5 hover:bg-white/10 text-white font-black px-6 py-4 rounded-xl uppercase tracking-widest text-[10px] transition-all border border-white/10"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#EAB308] hover:bg-[#d9a406] text-black font-black px-10 py-4 rounded-xl uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 border-none"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Publishing...
              </span>
            ) : "Publish Custom Lander"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: CUSTOMIZER CONTROLS (45% on desktop) */}
        <div className="lg:col-span-5 space-y-8 select-none">
          
          {/* PROFILE PICTURE BOX */}
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black uppercase text-white tracking-wide border-b border-white/5 pb-3">
              📸 Profile Photograph Settings
            </h3>

            <div className="flex items-center gap-6">
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#EAB308] to-transparent blur opacity-40" />
                <img 
                  src={photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-black relative z-10" 
                  alt={affiliate.name}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-grow space-y-2">
                <label className="block text-[9px] font-black tracking-widest text-[#EAB308] uppercase">
                  Upload Custom Image
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:text-white file:text-xs file:font-semibold hover:file:bg-white/10 file:cursor-pointer"
                />
                <p className="text-[10px] text-gray-600">Supports JPG, PNG, or modern webp formats.</p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2 pt-2">
              <span className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">
                Or Select Professional Preset Portrais
              </span>
              <div className="grid grid-cols-4 gap-3">
                {presetAvatars.map((av, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setPhotoUrl(av.url)}
                    className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${photoUrl === av.url ? 'border-[#EAB308]' : 'border-transparent hover:border-white/20'}`}
                    title={av.name}
                  >
                    <img src={av.url} className="w-full h-full object-cover" alt="preset" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PAGE DESIGN & BACKGROUND TYPE */}
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black uppercase text-white tracking-wide border-b border-white/5 pb-3">
              🎨 Page Backdrop Canvas
            </h3>

            {/* Background Style Switcher */}
            <div className="space-y-2">
              <label className="block text-[9px] font-black tracking-widest text-[#EAB308] uppercase">Backdrop Engine</label>
              <div className="flex bg-black p-1 rounded-xl border border-white/5">
                {(['color', 'gradient', 'image'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, backgroundType: type }))}
                    className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${settings.backgroundType === type ? 'bg-[#EAB308] text-black shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Image Inputs */}
            {settings.backgroundType === 'image' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">Custom Image URL</label>
                  <input 
                    type="text" 
                    value={settings.backgroundImageUrl}
                    onChange={(e) => setSettings(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                    placeholder="Pase an Unsplash or direct URL..."
                    className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-[#EAB308] placeholder:text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">Preset Stock Landscapes</span>
                  <div className="grid grid-cols-4 gap-3">
                    {presetBackgrounds.map((bg, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSettings(prev => ({ ...prev, backgroundImageUrl: bg.url }))}
                        className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${settings.backgroundImageUrl === bg.url ? 'border-[#EAB308]' : 'border-transparent hover:border-white/20'}`}
                        title={bg.name}
                      >
                        <img src={bg.url} className="w-full h-full object-cover" alt="stock backgrounds" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Style Parameters Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">Base BG Color</label>
                <div className="flex items-center gap-2 bg-black border border-white/5 rounded-xl p-2">
                  <input 
                    type="color" 
                    value={settings.backgroundColor} 
                    onChange={e => setSettings(p => ({ ...p, backgroundColor: e.target.value }))}
                    className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-gray-300 truncate">{settings.backgroundColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">Base Text</label>
                <div className="flex items-center gap-2 bg-black border border-white/5 rounded-xl p-2">
                  <input 
                    type="color" 
                    value={settings.textColor} 
                    onChange={e => setSettings(p => ({ ...p, textColor: e.target.value }))}
                    className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-gray-300 truncate">{settings.textColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-black tracking-widest text-[#EAB308] uppercase">Accent Theme</label>
                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-2">
                  <input 
                    type="color" 
                    value={settings.accentColor} 
                    onChange={e => setSettings(p => ({ ...p, accentColor: e.target.value }))}
                    className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-[#EAB308] truncate">{settings.accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* REORDERABLE VISUAL SECTIONS DRAG-UP-DOWN */}
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black uppercase text-white tracking-wide border-b border-white/5 pb-3">
              🧱 Reorderable Visual Sections
            </h3>

            <div className="space-y-4">
              {settings.blocks.map((block, i) => {
                const isAccordionOpen = activeAccordionBlock === block.id;

                return (
                  <div 
                    key={block.id} 
                    className={`bg-black/40 border border-white/5 rounded-2xl overflow-hidden transition-all ${isAccordionOpen ? 'border-white/15 ring-1 ring-white/5' : 'hover:border-white/10'}`}
                  >
                    {/* Header bar */}
                    <div className="p-4 flex justify-between items-center bg-white/[0.01]">
                      <div className="flex items-center gap-3">
                        {/* Shuffling Position Arrows */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            disabled={i === 0} 
                            onClick={() => moveBlock(i, 'up')}
                            className="text-gray-600 hover:text-[#EAB308] disabled:opacity-20 disabled:hover:text-gray-600 transition-colors"
                            title="Move Block Up"
                          >
                            ▲
                          </button>
                          <button 
                            disabled={i === settings.blocks.length - 1} 
                            onClick={() => moveBlock(i, 'down')}
                            className="text-gray-600 hover:text-[#EAB308] disabled:opacity-20 disabled:hover:text-gray-600 transition-colors"
                            title="Move Block Down"
                          >
                            ▼
                          </button>
                        </div>

                        <div>
                          <div className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-2">
                            {block.title || `Custom ${block.type} section`}
                          </div>
                          <p className="text-[9px] text-[#EAB308] font-bold uppercase tracking-widest">{block.type === 'about' ? 'about partner' : block.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Show Hide eye */}
                        <button
                          onClick={() => updateBlockProperty(block.id, 'visible', !block.visible)}
                          className={`p-1.5 rounded bg-black border border-white/5 transition-colors ${block.visible ? 'text-green-400 hover:text-green-500' : 'text-red-500 hover:text-red-600 bg-red-500/5'}`}
                          title={block.visible ? "Visible on page" : "Hidden"}
                        >
                          {block.visible ? "👁️" : "🙈"}
                        </button>
                        
                        {/* Toggle settings details */}
                        <button
                          onClick={() => setActiveAccordionBlock(isAccordionOpen ? null : block.id)}
                          className="text-xs text-[#EAB308] font-black hover:underline uppercase tracking-wide px-2 py-1 bg-white/5 rounded-lg border border-white/5"
                        >
                          {isAccordionOpen ? "Close" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {/* Accordion Content Edit fields */}
                    {isAccordionOpen && (
                      <div className="p-5 border-t border-white/5 bg-black/60 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        {/* Block Title */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-[#EAB308] uppercase">Section Title</label>
                          <input 
                            type="text" 
                            value={block.title}
                            onChange={(e) => updateBlockProperty(block.id, 'title', e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-[#EAB308]"
                          />
                        </div>

                        {/* Block Content Paragraph */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-[#EAB308] uppercase">Paragraph Context Content</label>
                          <textarea 
                            rows={4}
                            value={block.content}
                            onChange={(e) => updateBlockProperty(block.id, 'content', e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-[#EAB308]"
                          />
                        </div>

                        {/* Text Alignment & Text Sizing row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">Text Align</label>
                            <div className="flex bg-black p-1 rounded-xl border border-white/10">
                              {(['left', 'center', 'right'] as const).map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => updateBlockProperty(block.id, 'alignment', align)}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase transition-all ${block.alignment === align ? 'bg-[#EAB308] text-black shadow font-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-black tracking-widest text-gray-500 uppercase">Text Size</label>
                            <select
                              value={block.fontSize}
                              onChange={e => updateBlockProperty(block.id, 'fontSize', e.target.value)}
                              className="w-full bg-black border border-white/15 rounded-xl px-4 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#EAB308] h-[34px]"
                            >
                              {['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'].map(sz => (
                                <option key={sz} value={sz} className="bg-black text-white font-bold">{sz.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTEGRATED SMARTPHONE LIVE PREVIEW (55% width) */}
        <div className="lg:col-span-7 flex flex-col justify-center sticky top-28 select-none">
          <div className="w-full max-w-[420px] mx-auto bg-[#0a0a0a] rounded-[52px] border-[12px] border-[#1c1c1c] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative aspect-[9/19]">
            
            {/* Phone Notch/Dynamic Island simulation */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-3xl z-50 flex items-center justify-around px-2">
              <div className="w-2.5 h-2.5 bg-[#171717] rounded-full" />
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Smart Phone Content scroll container */}
            <div 
              className="flex-1 overflow-y-auto no-scrollbar pt-10 pb-5 flex flex-col transition-all duration-300"
              style={getPreviewBackgroundStyle()}
            >
              {/* Dynamic simulated lander headers */}
              <header className="px-5 py-4 border-b border-white/5 bg-black/50 backdrop-blur-md flex justify-between items-center text-[10px]">
                <div className="font-black text-white shrink-0">IB PORTAL</div>
                <div className="px-2 py-0.5 rounded bg-white/10 text-[8px] truncate max-w-[130px]">{affiliate.name}</div>
              </header>

              {/* Dynamic Blocks Preview Mapping */}
              <div className="flex-grow space-y-8 py-5">
                {settings.blocks.map((block) => {
                  if (!block.visible) return null;

                  const textAlignmentClass = getAlignmentClass(block.alignment);
                  const fsClass = getFontSizeClass(block.fontSize);

                  switch (block.type) {
                    case 'hero':
                      return (
                        <div key={block.id} className={`px-5 py-6 ${textAlignmentClass}`}>
                          <div className="inline-block px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase mb-3 bg-white/10" style={{ color: settings.accentColor }}>
                            Affiliate route
                          </div>
                          <h1 className="font-extrabold leading-none mb-3" style={{ fontSize: block.fontSize === '5xl' || block.fontSize === '4xl' ? '20px' : '15px', color: settings.accentColor }}>
                            {block.title}
                          </h1>
                          <p className="text-[10px] text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {block.content}
                          </p>
                        </div>
                      );

                    case 'about':
                      return (
                        <div key={block.id} className="px-5 py-6 bg-white/[0.02] border-y border-white/5 flex flex-col items-center gap-4 text-center">
                          <img 
                            src={photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'} 
                            className="w-20 h-20 rounded-full object-cover border-2 border-black" 
                            alt={affiliate.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className={`w-full ${textAlignmentClass}`}>
                            <h2 className="font-extrabold text-[#EAB308] mb-1" style={{ fontSize: '13px', color: settings.accentColor }}>{block.title}</h2>
                            <span className="text-[7px] text-gray-500 font-black uppercase block tracking-wider mb-2">Member Code: ID: {affiliate.referralCode}</span>
                            <p className="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {block.content}
                            </p>
                          </div>
                        </div>
                      );

                    case 'insurance_types':
                      const previewProducts = [
                        { name: "Logistics & Fleet", icon: "🚚" },
                        { name: "Tech & Corporate", icon: "💻" },
                        { name: "Construction & Dev", icon: "🏗️" },
                        { name: "Hospitality & Retail", icon: "🏨" }
                      ];
                      return (
                        <div key={block.id} className={`px-5 py-6 ${textAlignmentClass}`}>
                          <h2 className="font-extrabold mb-1" style={{ fontSize: '13px', color: settings.accentColor }}>{block.title}</h2>
                          <p className="text-[9px] text-gray-500 mb-4">{block.content}</p>

                          <div className="grid grid-cols-2 gap-3 text-left">
                            {previewProducts.map((p, cidx) => (
                              <div key={cidx} className="bg-white/[0.01] border border-white/5 rounded-xl p-3">
                                <span className="text-sm block">{p.icon}</span>
                                <h4 className="text-[10px] font-black text-white mt-1 mb-1">{p.name}</h4>
                                <span className="text-[7px] text-gray-500 block leading-tight">Underwritten direct syndicates premium.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );

                    case 'custom_text':
                      return (
                        <div key={block.id} className={`px-5 py-6 ${textAlignmentClass}`}>
                          <h2 className="font-extrabold mb-2" style={{ fontSize: '13px', color: settings.accentColor }}>{block.title}</h2>
                          <p className="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {block.content}
                          </p>
                        </div>
                      );

                    case 'quote_form':
                      return (
                        <div key={block.id} className={`px-5 py-6 bg-black/40 border border-white/5 rounded-2xl ${textAlignmentClass}`}>
                          <h2 className="font-extrabold mb-1" style={{ fontSize: '13px', color: settings.accentColor }}>{block.title}</h2>
                          <p className="text-[9px] text-gray-500 mb-4">{block.content}</p>
                          
                          {/* Simulated mini form */}
                          <div className="space-y-2 text-left bg-black rounded-xl p-3 border border-white/5">
                            <span className="block text-[7px] font-black text-gray-500 uppercase tracking-widest">Intake basics (Mock form)</span>
                            <div className="h-6 w-full rounded bg-white/5 border border-white/5" />
                            <div className="h-6 w-full rounded bg-white/5 border border-white/5" />
                            <div className="h-7 w-full bg-[#EAB308] rounded flex items-center justify-center text-[8px] font-black text-black">CONTINUE IN PORTAL</div>
                          </div>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </div>

              {/* Elegant foot label inside Phone */}
              <footer className="mt-8 border-t border-white/5 py-4 bg-black/40 text-center text-[7px] text-gray-600 select-none">
                © {new Date().getFullYear()} CORE PLACEMENT CO.
              </footer>
            </div>
            
            {/* Phone Home Indicator bar */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full z-50" />
          </div>
          
          <div className="text-center mt-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Simulated Smartphone Preview Layout</span>
          </div>
        </div>

      </div>

    </div>
  );
};
