
import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <nav className="bg-[#003366] text-white shadow-lg z-10 w-full relative">
      <div className="h-1 bg-[#10b981] w-full absolute top-0 left-0"></div>
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded shadow-inner hidden sm:block">
               <span className="text-[#003366] font-black text-xl leading-none block px-1">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter leading-none text-white uppercase">
                MCCIA
              </span>
              <span className="text-[8px] text-[#10b981] font-black tracking-[0.3em] leading-tight mt-1 uppercase">
                APPLIED AI STUDIO
              </span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 bg-white/5 py-1.5 px-4 rounded-xl border border-white/10 shadow-sm">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{user.name}</span>
                <span className="text-[8px] font-bold text-slate-400">{user.email}</span>
              </div>
              <div className="w-8 h-8 rounded bg-emerald-500 text-white flex items-center justify-center font-black text-sm border border-white/20">
                {user.name.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
