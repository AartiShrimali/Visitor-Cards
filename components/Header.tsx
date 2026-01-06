
import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
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

          {user && (
            <div className="flex items-center gap-2.5 bg-white/5 py-1 px-3 rounded-lg border border-white/10">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{user.name}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase">{user.email}</span>
              </div>
              <div className="w-7 h-7 rounded bg-emerald-500 text-white flex items-center justify-center font-black text-xs border border-white/20">
                {user.name.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
