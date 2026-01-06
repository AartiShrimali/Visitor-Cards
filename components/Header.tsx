
import React from 'react';
import { UserProfile } from '../types';
import { isCloudConnected } from '../services/firebaseService';

interface HeaderProps {
  user?: UserProfile | null;
  onShowAnalytics?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onShowAnalytics }) => {
  const connected = isCloudConnected();

  return (
    <nav className="bg-[#003366] text-white shadow-md z-10 w-full relative">
      <div className="h-1 bg-[#10b981] w-full absolute top-0 left-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded shadow-sm hidden sm:block">
               <span className="text-[#003366] font-black text-lg leading-none block px-1">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight leading-none text-white uppercase">
                MCCIA
              </span>
              <span className="text-[7px] text-[#10b981] font-black tracking-[0.2em] leading-tight mt-0.5 uppercase">
                APPLIED AI STUDIO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onShowAnalytics}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors cursor-pointer hover:bg-white/5 ${connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {connected ? 'Cloud Active' : 'Local Mode'}
              </span>
            </button>
            
            {user && (
              <div className="hidden md:flex flex-col items-end opacity-60">
                <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">ID: {user.uid.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
