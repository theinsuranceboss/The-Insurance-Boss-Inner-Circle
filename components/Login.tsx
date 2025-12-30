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
  const [error, setError] = useState('');

  const type = searchParams.get('type') || 'partner';
  const heading = type === 'admin' ? 'Executive Desk Authorization' : 'Inner Circle Member Login';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.login(username, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Invalid identity credentials.');
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
          <p className="text-gray-500 tracking-widest text-[10px] font-bold">Authorized Inner Circle Access Only</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#171717] border border-white/5 rounded-2xl p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm text-center font-bold">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">Member Identity</label>
            <input 
              required
              type="text" 
              value={username}
              onChange={(e) => {setUsername(e.target.value); setError('');}}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-4 focus:outline-none focus:border-[#EAB308] transition-colors text-lg text-white font-bold"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 tracking-widest">Vault Access Key</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => {setPassword(e.target.value); setError('');}}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-4 focus:outline-none focus:border-[#EAB308] transition-colors text-lg text-white font-bold"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" fullWidth className="py-4 shadow-xl tracking-widest">Synchronize & Unlock</Button>
          
          <div className="text-center">
            <Link to="/affiliate" className="text-xs text-gray-500 hover:text-[#EAB308] transition-colors font-bold tracking-tighter">Inquire for Inner Circle Access</Link>
          </div>
        </form>

        <p className="text-center mt-10 text-[10px] text-gray-600 tracking-[0.3em] font-black">
          Official Insurance Boss Executive Network
        </p>
      </div>
    </div>
  );
};