
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Camera } from './components/Camera';
import { ContactCard } from './components/ContactCard';
import { ContactHistoryTable } from './components/ContactHistoryTable';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Button } from './components/Button';
import { 
  AppState, 
  ContactData, 
  UserProfile 
} from './types';
import { 
  subscribeToContacts, 
  saveContactToFirebase 
} from './services/firebaseService';
import { extractContactInfo } from './services/geminiService';

const GUEST_USER: UserProfile = {
  uid: 'public_mccia_access',
  name: 'Studio Guest',
  email: 'studio@mccia.org'
};

const App: React.FC = () => {
  const [user] = useState<UserProfile>(GUEST_USER);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [scannedData, setScannedData] = useState<ContactData | null>(null);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Batch processing state
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribeContacts = subscribeToContacts(user.uid, (data) => {
      setContacts(data);
    });
    return () => unsubscribeContacts();
  }, [user.uid]);

  const onCapture = async (base64: string) => {
    setAppState(AppState.PROCESSING);
    setError('');
    startTimeRef.current = Date.now();
    
    try {
      const result = await extractContactInfo(base64);
      setScannedData(result);
      setAppState(AppState.REVIEW);
    } catch (err: any) {
      setError(err.message || 'Failed to process card');
      setAppState(AppState.ERROR);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const reader = new FileReader();
      reader.onloadend = () => onCapture(reader.result as string);
      reader.readAsDataURL(files[0]);
    } else {
      // Batch processing (up to 50 cards)
      const fileList = Array.from(files).slice(0, 50);
      setBatchTotal(fileList.length);
      setBatchCurrent(0);
      setAppState(AppState.BATCH_PROCESSING);
      setError('');

      for (let i = 0; i < fileList.length; i++) {
        setBatchCurrent(i + 1);
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(fileList[i]);
          });
          
          const start = Date.now();
          const result = await extractContactInfo(base64);
          const duration = Date.now() - start;
          
          // Auto-save each card in batch mode
          await saveContactToFirebase(result, user.uid, user.name, user.email, duration);
        } catch (err) {
          console.error(`Batch item ${i + 1} failed:`, err);
          // We continue the batch even if one card fails
        }
      }
      
      setAppState(AppState.SUCCESS);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (data: ContactData) => {
    setIsSaving(true);
    const processingTime = Date.now() - startTimeRef.current;

    try {
      await saveContactToFirebase(data, user.uid, user.name, user.email, processingTime);
      setAppState(AppState.SUCCESS);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    } catch (err: any) {
      setError('Failed to save to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-6 md:py-10">
        {appState === AppState.IDLE && (
          <div className="max-w-4xl mx-auto text-center space-y-10 py-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-[0.2em] mb-1 border border-emerald-100 shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Secure AI Scanner
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-[#003366] tracking-tight leading-tight uppercase">
                MCCIA BIZSCAN <br/>
                <span className="text-[#10b981]">AI POWERED BUSINESS CARD SCANNER</span>
              </h2>
              <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">
                Professional extraction and management of business contacts. <br/>
                Process single cards or batch uploads up to 50 cards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button 
                onClick={() => setAppState(AppState.SCANNING)}
                className="group flex flex-col items-center justify-center p-10 bg-white border border-slate-200 rounded-[2rem] hover:border-[#10b981] hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-all duration-300">
                  <svg className="w-8 h-8 text-[#10b981] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="3" strokeWidth={2} />
                  </svg>
                </div>
                <span className="text-xl font-black text-[#003366]">Use Camera</span>
                <span className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Single Capture</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center p-10 bg-white border border-slate-200 rounded-[2rem] hover:border-[#003366] hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#003366] transition-all duration-300">
                  <svg className="w-8 h-8 text-[#003366] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xl font-black text-[#003366]">Upload Photo</span>
                <span className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Max 50 Cards</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileUpload}
            />
          </div>
        )}

        {appState === AppState.SCANNING && (
          <div className="flex justify-center max-w-3xl mx-auto">
            <Camera onCapture={onCapture} onCancel={() => setAppState(AppState.IDLE)} />
          </div>
        )}

        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 max-w-lg mx-auto text-center">
            <div className="w-16 h-16 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="text-2xl font-black text-[#003366]">Analyzing Card...</h3>
              <p className="text-slate-500 mt-1 font-medium">Gemini 3 is extracting contact details</p>
            </div>
          </div>
        )}

        {appState === AppState.BATCH_PROCESSING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-8 max-w-xl mx-auto text-center">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner max-w-sm">
              <div 
                className="bg-[#10b981] h-full transition-all duration-500"
                style={{ width: `${(batchCurrent / batchTotal) * 100}%` }}
              ></div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-[#003366]">Batch Scan Active</h3>
              <p className="text-lg text-slate-500 mt-2 font-bold uppercase tracking-widest">
                Card <span className="text-[#10b981]">{batchCurrent}</span> of {batchTotal}
              </p>
            </div>
          </div>
        )}

        {appState === AppState.REVIEW && scannedData && (
          <ContactCard 
            data={scannedData} 
            onSave={handleSave} 
            onCancel={() => setAppState(AppState.IDLE)}
            isSaving={isSaving}
          />
        )}

        {appState === AppState.SUCCESS && (
          <div className="max-w-sm mx-auto bg-white border border-emerald-100 p-8 rounded-[2rem] text-center shadow-xl animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-black text-[#003366]">Data Synced</h3>
            <p className="text-slate-500 mt-2 font-medium">Information added to history.</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto bg-white border border-red-100 p-8 rounded-[2rem] text-center shadow-lg">
            <h3 className="text-xl font-black text-slate-800">Scan Failed</h3>
            <p className="text-slate-500 mt-2 font-medium mb-6">{error}</p>
            <Button onClick={() => setAppState(AppState.IDLE)} className="w-full bg-[#003366] text-white py-3 font-bold rounded-xl">Dismiss</Button>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="mt-12 bg-white rounded-[1.5rem] p-1 shadow-lg border border-slate-100 overflow-hidden">
            <ContactHistoryTable 
              history={contacts} 
              userName={user.name} 
              userEmail={user.email} 
            />
          </div>
        )}
      </main>

      <button 
        onClick={() => setShowAnalytics(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#003366] text-white rounded-xl shadow-2xl flex items-center justify-center hover:scale-105 transition-all z-40"
        title="Dashboard Stats"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      </button>

      {showAnalytics && <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />}
      
      <footer className="bg-white border-t border-slate-50 py-6 text-center mt-auto">
         <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">
           © {new Date().getFullYear()} MCCIA Applied AI Studio • Secure Extraction Engine
         </p>
      </footer>
    </div>
  );
};

export default App;
