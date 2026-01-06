import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface HeaderProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (user && user.trialExpiresAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const distance = user.trialExpiresAt! - now;

        if (distance < 0) {
          setTimeLeft("EXPIRED");
          clearInterval(interval);
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d : ${hours}h : ${minutes}m`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <nav className="bg-[#003366] text-white shadow-lg z-10 w-full relative">
      {/* Green Top Accent Bar */}
      <div className="h-1 bg-[#10b981] w-full absolute top-0 left-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-20 items-center py-2 sm:py-0 gap-2 sm:gap-0">
          {/* Logo Section */}
          <div className="flex items-center gap-4 self-start sm:self-center">
            <div className="bg-white p-2 rounded shadow-md hidden sm:block border-b-2 border-[#10b981]">
               {/* Placeholder for a logo icon */}
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

          {/* Center/Right Section: CTA & User */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto">
            
            {/* Consultation CTA - Captivating Text Update */}
            <a 
              href="https://linktr.ee/MCCIA_AI_Experience" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#047857] text-white py-2 px-5 rounded-xl shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] transition-all hover:-translate-y-0.5 flex items-center gap-3 border border-white/20 relative overflow-hidden"
            >
              {/* Shine effect overlay */}
              <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -ml-4 w-1/2"></div>
              
              <div className="flex flex-col items-start sm:items-end relative z-10">
                <span className="text-[11px] font-bold text-emerald-50 uppercase tracking-wider leading-tight mb-0.5">
                  Accelerate Your Business
                </span>
                <span className="text-sm sm:text-base font-black tracking-wide flex items-center gap-2 drop-shadow-sm">
                  BOOK FREE AI CONSULTATION
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3px] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              </div>
            </a>

            {/* User Section with Timer */}
            {user && (
              <div className="flex items-center gap-3">
                 {/* Countdown Timer */}
                 <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-[10px] text-gray-300 uppercase tracking-wide">Trial Ends In</span>
                    <span className={`font-mono text-sm font-bold ${timeLeft === "EXPIRED" ? "text-red-400" : "text-[#64ffda]"}`}>
                      {timeLeft || "Calculating..."}
                    </span>
                 </div>

                <div className="flex items-center gap-3 bg-[#0a2540] py-1.5 px-3 rounded-full border border-gray-600 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-200 hidden lg:block truncate max-w-[100px]">
                    {user.name}
                  </span>
                </div>
                {onLogout && (
                  <button 
                    onClick={onLogout} 
                    className="text-gray-300 hover:text-white text-sm font-medium transition-colors border-l border-gray-600 pl-3 ml-1"
                  >
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Timer Bar (only visible on small screens if user exists) */}
        {user && (
          <div className="sm:hidden w-full bg-[#0a2540] text-center py-1 text-xs border-t border-gray-700">
             <span className="text-gray-400 mr-2">Trial Ends:</span>
             <span className={`font-mono font-bold ${timeLeft === "EXPIRED" ? "text-red-400" : "text-[#64ffda]"}`}>
               {timeLeft || "..."}
             </span>
          </div>
        )}
      </div>
    </nav>
  );
};