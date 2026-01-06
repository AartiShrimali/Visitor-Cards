
import React from 'react';

const App: React.FC = () => {
  const brandBlue = "#003366";
  const brandGreen = "#10b981";
  const bookingUrl = "https://linktr.ee/MCCIA_AI_Experience";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Simple Clean Header */}
      <nav className="bg-[#003366] text-white shadow-lg w-full relative h-20 flex items-center">
        <div className="h-1 bg-[#10b981] w-full absolute top-0 left-0"></div>
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-extrabold text-xl md:text-2xl tracking-tight leading-none text-white">
              MCCIA
            </span>
            <span className="text-[10px] md:text-xs text-[#10b981] font-bold tracking-[0.2em] leading-tight mt-1 uppercase">
              APPLIED AI STUDIO
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-500">
          
          {/* Top Visual Accent */}
          <div className="h-2 bg-gradient-to-r from-[#003366] via-[#10b981] to-[#003366]"></div>
          
          <div className="p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-8">
              <svg className="w-10 h-10 text-[#003366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-[#003366] mb-4 tracking-tight">
              Experience Concluded
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              The ID Scanner session has successfully ended. We hope you enjoyed exploring the power of Applied AI.
            </p>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-10">
              <h2 className="text-[#059669] font-bold text-lg mb-2">Ready to Transform Your Business?</h2>
              <p className="text-gray-700">
                Unlock custom AI solutions optimized for your specific business needs at the MCCIA APPLIED AI STUDIO.
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <a 
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-white font-black py-5 px-10 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
              >
                <span>BOOK FREE AI CONSULTATION</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              
              <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-bold">
                Limited Slots Available
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                <span className="text-xs font-bold text-gray-500 uppercase">Studio Status: Online</span>
             </div>
             <div className="text-xs text-gray-400 font-medium">
                © {new Date().getFullYear()} MCCIA APPLIED AI STUDIO
             </div>
          </div>
        </div>
      </main>

      {/* Background decoration elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981] opacity-[0.03] rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#003366] opacity-[0.05] rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
};

export default App;
