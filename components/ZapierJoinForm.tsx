
import React, { useEffect } from 'react';

export const ZapierJoinForm: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://interfaces.zapier.com/assets/web-components/zapier-interfaces/zapier-interfaces.esm.js';
    document.head.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-[900px] mx-auto bg-[#121212] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden p-10 md:p-16 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4 uppercase">
          Join The Inner Circle
        </h2>
        <p className="text-gray-500 font-black tracking-[0.2em] uppercase text-[11px]">
          SUBMIT YOUR PROSPECTUS BELOW TO START EARNING MONTHLY RESIDUALS.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-black border border-white/5 shadow-inner">
        {/* @ts-ignore */}
        <zapier-interfaces-page-embed 
          page-id='cmmfgqlxi00bhsxhejlj30k4o' 
          no-background='false' 
          style={{ maxWidth: '900px', height: '600px' }}
        />
      </div>

      <div className="mt-10 text-center">
        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
          Official Insurance Boss Executive Network • Priority Enrollment Protocol
        </p>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        /* Attempting to style labels and inputs if they leak out of shadow DOM or if Zapier supports it */
        zapier-interfaces-page-embed label {
          color: #FFC107 !important;
          text-transform: uppercase !important;
          font-weight: 900 !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
        }
        zapier-interfaces-page-embed input, 
        zapier-interfaces-page-embed textarea,
        zapier-interfaces-page-embed select {
          background-color: #000 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px !important;
          color: #fff !important;
        }
        zapier-interfaces-page-embed button {
          background-color: #FFC107 !important;
          color: #000 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          border-radius: 12px !important;
          padding: 1rem 2rem !important;
        }
      `}} />
    </div>
  );
};
