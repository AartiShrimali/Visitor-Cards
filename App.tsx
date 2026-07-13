
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Camera } from './components/Camera';
import { ContactCard } from './components/ContactCard';
import { ContactHistoryTable } from './components/ContactHistoryTable';
import { Button } from './components/Button';
import {
  AppState,
  ContactData,
  UserProfile
} from './types';
import {
  subscribeToContacts,
  saveContactToFirebase,
  initStudioSession
} from './services/firebaseService';
import { extractContactInfo } from './services/geminiService';
import {
  initGapiClient,
  initGisClient,
  requestAccessToken,
  saveToSheet
} from './services/googleSheetsService';


const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [scannedData, setScannedData] = useState<ContactData | null>(null);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGoogleSheetsConnected, setIsGoogleSheetsConnected] = useState(false);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);


  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const startSession = async () => {
      try {
        const profile = await initStudioSession();
        setUser(profile);
      } catch (e) {
        console.error("Session initialization failed", e);
      } finally {
        setIsInitializing(false);
      }
    };
    startSession();
  }, []);

  useEffect(() => {
    const initGoogleApis = async () => {
      try {
        await initGapiClient();
        setIsGapiLoaded(true);

        initGisClient((tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setIsGoogleSheetsConnected(true);
          }
        });
      } catch (err) {
        console.warn("Google Google API Client loading failed or script missing.", err);
      }
    };
    initGoogleApis();
  }, []);

  const handleConnectGoogleSheets = () => {
    try {
      requestAccessToken();
    } catch (error: any) {
      alert(error.message || "Failed to initialize Google Sheets Sync. Please check your configuration.");
    }
  };


  useEffect(() => {
    if (user) {
      const unsubscribeContacts = subscribeToContacts(user.uid, (data) => {
        setContacts(data);
      });
      return () => unsubscribeContacts();
    }
  }, [user]);

  const onCapture = async (base64: string) => {
    setAppState(AppState.PROCESSING);
    setError('');
    startTimeRef.current = Date.now();

    try {
      const result = await extractContactInfo(base64);
      setScannedData(result);
      setAppState(AppState.REVIEW);
    } catch (err: any) {
      setError(err.message || 'Failed to extract data');
      setAppState(AppState.ERROR);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    if (files.length === 1) {
      const reader = new FileReader();
      reader.onloadend = () => onCapture(reader.result as string);
      reader.readAsDataURL(files[0]);
    } else {
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
            reader.readAsDataURL(fileList[i] as File);
          });

          const start = Date.now();
          const result = await extractContactInfo(base64);
          const duration = Date.now() - start;

          const batchPromises: Promise<any>[] = [
            saveContactToFirebase(result, user.uid, duration)
          ];
          const scriptUrl = (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL;
          if (isGoogleSheetsConnected || scriptUrl) {
            batchPromises.push(
              saveToSheet(result).catch((sheetErr) => {
                console.error(`Failed to save batch item ${i + 1} to Google Sheets:`, sheetErr);
              })
            );
          }
          await Promise.all(batchPromises);
        } catch (err) {
          console.error(`Item ${i + 1} failed:`, err);
        }
      }

      setAppState(AppState.SUCCESS);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (data: ContactData) => {
    if (!user) return;
    setIsSaving(true);
    const processingTime = Date.now() - startTimeRef.current;

    try {
      const promises: Promise<any>[] = [
        saveContactToFirebase(data, user.uid, processingTime)
      ];
      const scriptUrl = (import.meta as any).env.VITE_GOOGLE_SCRIPT_URL;
      if (isGoogleSheetsConnected || scriptUrl) {
        promises.push(
          saveToSheet(data).catch((sheetErr) => {
            console.error("Failed to sync to Google Sheets:", sheetErr);
          })
        );
      }
      await Promise.all(promises);

      setAppState(AppState.SUCCESS);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    } catch (err: any) {
      setError('Connection error: Failed to sync with cloud database.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#003366]"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initializing Session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header user={user} />

      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        {appState === AppState.IDLE && (
          <div className="max-w-2xl mx-auto text-center space-y-6 py-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider mb-1 border border-emerald-100 shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Cloud Sync Active
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#003366] tracking-tight leading-tight uppercase">
                MCCIA BIZSCAN <br />
                <span className="text-[#10b981]">AI POWERED BUSINESS CARD SCANNER</span>
              </h2>
              <p className="text-[11px] md:text-xs text-slate-500 max-w-md mx-auto font-medium">
                Extraction session is active. All scanned data is securely <br />
                stored in the cloud folder assigned to this station.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={() => setAppState(AppState.SCANNING)}
                className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-[#10b981] hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-500 transition-all duration-300">
                  <svg className="w-5 h-5 text-[#10b981] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <span className="text-sm font-black text-[#003366]">Live Camera</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Single Extract</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-[#003366] hover:shadow-md transition-all duration-300"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#003366] transition-all duration-300">
                  <svg className="w-5 h-5 text-[#003366] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-sm font-black text-[#003366]">Batch Upload</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Max 50 Cards</span>
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

            {/* Google Sheets Status Card */}
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 mt-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isGoogleSheetsConnected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  <svg className={`w-4 h-4 ${isGoogleSheetsConnected ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-[#003366] block">Google Sheets Sync</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                    {isGoogleSheetsConnected ? 'Syncing active' : 'Not connected'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleConnectGoogleSheets}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 border ${isGoogleSheetsConnected
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {isGoogleSheetsConnected ? 'Connected' : 'Connect Account'}
              </button>
            </div>

          </div>
        )}

        {appState === AppState.SCANNING && (
          <div className="flex justify-center max-w-3xl mx-auto">
            <Camera onCapture={onCapture} onCancel={() => setAppState(AppState.IDLE)} />
          </div>
        )}

        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="text-sm font-black text-[#003366]">Extracting Details...</h3>
              <p className="text-[10px] text-slate-500 font-medium">Gemini AI is processing the image</p>
            </div>
          </div>
        )}

        {appState === AppState.BATCH_PROCESSING && (
          <div className="flex flex-col items-center justify-center py-16 space-y-5 max-w-lg mx-auto text-center">
            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden max-w-xs shadow-inner">
              <div
                className="bg-[#10b981] h-full transition-all duration-500"
                style={{ width: `${(batchCurrent / batchTotal) * 100}%` }}
              ></div>
            </div>
            <div>
              <h3 className="text-base font-black text-[#003366]">Batch Processing</h3>
              <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-[0.2em]">
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
          <div className="max-w-xs mx-auto bg-white border border-emerald-100 p-6 rounded-xl text-center shadow-lg animate-in zoom-in duration-300">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xs font-black text-[#003366]">Scan Recorded</h3>
            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Data synced to your cloud history.</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto bg-white border border-red-100 p-6 rounded-xl text-center shadow-lg">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Process Error</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-medium mb-4">{error}</p>
            <Button onClick={() => setAppState(AppState.IDLE)} className="w-full bg-[#003366] text-white py-2 text-[10px] font-bold rounded-lg">Try Again</Button>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <ContactHistoryTable
              history={contacts}
              userName={user?.name}
              userEmail={user?.email}
            />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-50 py-4 text-center mt-auto">
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} MCCIA Applied AI Studio • Secured Root Storage
        </p>
      </footer>
    </div>
  );
};

export default App;
