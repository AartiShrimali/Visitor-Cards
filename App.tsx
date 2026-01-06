
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
import { saveToSheet, initGapiClient, initGisClient, requestAccessToken } from './services/googleSheetsService';

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
  const [googleInited, setGoogleInited] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  // 1. Data Subscription
  useEffect(() => {
    const unsubscribeContacts = subscribeToContacts(user.uid, (data) => {
      setContacts(data);
    });
    return () => unsubscribeContacts();
  }, [user.uid]);

  // 2. Google Sheets Init
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initGapiClient();
        initGisClient((tokenResponse) => {
          setGoogleInited(true);
        });
      } catch (err) {
        console.warn("Google Sheets initialization bypassed (Keys not set)");
      }
    };
    initGoogle();
  }, []);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onCapture(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (data: ContactData) => {
    setIsSaving(true);
    const processingTime = Date.now() - startTimeRef.current;

    try {
      await saveContactToFirebase(data, user.uid, user.name, user.email, processingTime);
      
      if (googleInited) {
        try {
          await saveToSheet(data);
        } catch (sheetErr) {
          console.warn("Sheet sync failed");
        }
      }

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
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {appState === AppState.IDLE && (
          <div className="max-w-3xl mx-auto text-center space-y-12 py-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Powered by Gemini 3 Flash
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#003366] tracking-tight leading-tight">
                Business Intelligence <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#059669]">Starts with a Scan</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto">
                Securely extract contact details from ID cards and sync them to your centralized database in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button 
                onClick={() => setAppState(AppState.SCANNING)}
                className="group flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-[2rem] hover:border-[#10b981] hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-10 h-10 text-[#10b981] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="3" strokeWidth={2} />
                  </svg>
                </div>
                <span className="text-xl font-bold text-[#003366]">Launch Camera</span>
                <span className="text-sm text-slate-400 mt-2 font-medium">Real-time Capture</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-[2rem] hover:border-[#003366] hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-[#003366] group-hover:-rotate-6 transition-all duration-500">
                  <svg className="w-10 h-10 text-[#003366] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-[#003366]">Upload Photo</span>
                <span className="text-sm text-slate-400 mt-2 font-medium">PNG, JPG or JPEG</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />

            {!googleInited && (
              <div className="mt-8 p-6 bg-white border border-slate-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <img src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png" className="w-6" alt="Sheets" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-sm">Direct Sheets Sync</h4>
                    <p className="text-xs text-slate-500">Auto-save data to Google Spreadsheets</p>
                  </div>
                </div>
                <Button variant="outline" onClick={requestAccessToken} className="w-full sm:w-auto text-xs py-2 px-6 rounded-xl border-slate-200 hover:bg-slate-50">
                  Authorize Sync
                </Button>
              </div>
            )}
          </div>
        )}

        {appState === AppState.SCANNING && (
          <div className="flex justify-center max-w-3xl mx-auto">
            <Camera onCapture={onCapture} onCancel={() => setAppState(AppState.IDLE)} />
          </div>
        )}

        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-24 space-y-8 max-w-lg mx-auto text-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-emerald-100 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#10b981] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-[#003366]">Gemini 3 Processing</h3>
              <p className="text-slate-500 mt-2 font-medium">Extracting structured data with Advanced OCR</p>
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
          <div className="max-w-md mx-auto bg-white border border-emerald-100 p-10 rounded-[2.5rem] text-center shadow-2xl shadow-emerald-50 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-2xl font-black text-[#003366]">Data Captured</h3>
            <p className="text-slate-500 mt-3 font-medium">Information has been successfully archived in your contact history.</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto bg-white border border-red-100 p-10 rounded-[2.5rem] text-center shadow-2xl shadow-red-50">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800">Scan Failed</h3>
            <p className="text-slate-500 mt-3 font-medium mb-8 leading-relaxed">{error}</p>
            <Button onClick={() => setAppState(AppState.IDLE)} className="w-full bg-[#003366] text-white py-4 font-bold rounded-2xl">Return to Dashboard</Button>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="mt-16">
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
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#003366] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40 group overflow-hidden"
        title="Admin Dashboard"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      </button>

      {showAnalytics && <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />}
      
      <footer className="bg-white border-t border-slate-100 py-8 text-center mt-auto">
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
           © {new Date().getFullYear()} MCCIA Applied AI Studio • Built for Excellence
         </p>
      </footer>
    </div>
  );
};

export default App;
