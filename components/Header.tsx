
import React from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <nav className="bg-[#003366] text-white shadow-lg z-10 w-full relative">
      {/* Green Top Accent Bar */}
      <div className="h-1 bg-[#10b981] w-full absolute top-0 left-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-20 items-center py-4 sm:py-0 gap-4 sm:gap-0">
          {/* Logo Section */}
          <div className="flex items-center gap-4 self-start sm:self-center">
            <div className="bg-white p-2 rounded shadow-md hidden sm:block border-b-2 border-[#10b981]">
               <span className="text-[#003366] font-bold text-xl leading-none block px-1">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight leading-none text-white">
                MCCIA
              </span>
              <span className="text-[10px] md:text-xs text-[#10b981] font-bold tracking-[0.2em] leading-tight mt-1 uppercase">
                APPLIED AI STUDIO
              </span>
            </div>
          </div>

          {/* Center/Right Section: CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto">
            
            <a 
              href="https://linktr.ee/MCCIA_AI_Experience" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#047857] text-white py-2.5 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] transition-all hover:-translate-y-0.5 flex items-center gap-3 border border-white/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -ml-4 w-1/2"></div>
              
              <div className="flex flex-col items-start sm:items-end relative z-10">
                <span className="text-[11px] font-bold text-emerald-50 uppercase tracking-wider leading-tight mb-0.5">
                  Accelerate Your Business
                </span>
                <span className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2 drop-shadow-sm">
                  FREE AI CONSULTATION
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3px] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              </div>
            </a>

            {user && (
              <div className="flex items-center gap-3 bg-[#0a2540] py-1.5 px-4 rounded-full border border-gray-600 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {user.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
