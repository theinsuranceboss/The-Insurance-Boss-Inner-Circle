import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/dbService';
import { Affiliate } from '../types';
import { Button } from './Button';
import { PromotionPage } from './PromotionPage';

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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-black mb-4 tracking-tighter text-white uppercase">Boss Not Found</h1>
        <p className="text-gray-400 mb-8 tracking-widest text-xs font-bold uppercase">This affiliate link is invalid or has expired.</p>
        <Link to="/"><Button className="bg-[#EAB308] text-black border-none">Return to Main Desk</Button></Link>
      </div>
    );
  }

  return (
    <PromotionPage standalone={true} referralAffiliate={affiliate} />
  );
};
