import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../services/dbService';
import { Button } from './Button';
import { Affiliate } from '../types';

interface LoginProps {
  onLoginSuccess: (user: Affiliate) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const type = searchParams.get('type') || 'partner';
  const heading = type === 'admin' ? 'Executive Desk Authorization' : 'Inner Circle Member Login';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const user = await db.login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        const exists = await db.emailExists(username);
        if (!exists) {
          setError('You must register first at https://theinsuranceboss.com/affiliate-program/.');
        } else {
          setError('Please check your welcome email from info@theinsuranceboss.com for your temporary password.');
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      {/* Home Button in Top Left Corner */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/affiliate">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold tracking-widest text-gray-400 hover:text-[#EAB308] transition-all group border-none shadow-none">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Public Site
          </button>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="bg-[#EAB308] text-black font-black p-4 rounded-lg inline-block text-4xl mb-6 shadow-[0_0_30px_rgba(234,179,8,0.2)]">IB</div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tighter leading-none">{heading}</h1>
          <p className="text-gray-500 tracking-widest text-[10px] font-bold uppercase">Verifying via Inner Circle Auth Log</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#171717] border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm text-center font-bold">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest uppercase">Work Email or Username</label>
            <input 
              required
              disabled={isLoading}
              type="text" 
              value={username}
              onChange={(e) => {setUsername(e.target.value); setError('');}}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-4 focus:outline-none focus:border-[#EAB308] transition-colors text-lg text-white font-bold disabled:opacity-50"
              placeholder="email@company.com or username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest uppercase">Temporary Password</label>
            <div className="relative">
              <input 
                required
                disabled={isLoading}
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => {setPassword(e.target.value); setError('');}}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-4 focus:outline-none focus:border-[#EAB308] transition-colors text-lg text-white font-bold disabled:opacity-50 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth disabled={isLoading} className="py-4 shadow-xl tracking-widest flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Synchronizing...
              </>
            ) : (
              'Enter The Inner Circle'
            )}
          </Button>
          
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="text-gray-500 tracking-widest text-[9px] font-black uppercase text-center">New Member Inquiries</div>
            <Link to="/affiliate?action=apply" className="block w-full">
              <Button type="button" fullWidth className="py-4 shadow-xl tracking-widest flex items-center justify-center gap-2">
                Required For Inner Circle Access
              </Button>
            </Link>
          </div>
        </form>

        <p className="text-center mt-10 text-[10px] text-gray-600 tracking-[0.3em] font-black">
          Official Insurance Boss Executive Network
        </p>
      </div>
    </div>
  );
};