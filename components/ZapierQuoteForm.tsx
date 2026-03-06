
import React, { useEffect } from 'react';

export const ZapierQuoteForm: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://interfaces.zapier.com/assets/web-components/zapier-interfaces/zapier-interfaces.esm.js';
    document.head.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-[900px] mx-auto bg-[#EAB308] rounded-[40px] shadow-2xl overflow-hidden p-10 md:p-16 animate-in fade-in zoom-in-95 duration-700">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-black tracking-tighter mb-2 uppercase">Request Your Free Quote</h2>
        <p className="text-black/80 font-bold text-sm">Directly deposit lead data into the Inner Circle vault.</p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-black border border-black/10 shadow-inner">
        {/* @ts-ignore */}
        <zapier-interfaces-page-embed 
          page-id='cmmffkxfq0066rcctb6s1s1gz' 
          test-id='cmmffkxfq0066rcctb6s1s1gz-zapier-interfaces-page-embed-iframe'
          no-background='false' 
          style={{ maxWidth: '900px', height: '600px' }}
        />
      </div>

      <div className="mt-10 text-center">
        <p className="text-[10px] text-black/60 font-black uppercase tracking-[0.3em]">
          Powered by The Insurance Boss Executive Underwriting Engine
        </p>
      </div>
    </div>
  );
};
