
export interface ContactData {
  id?: string;
  userId?: string; 
  name: string;
  company_name: string;
  designation: string;
  email_1: string;
  email_2: string;
  phone_1: string;
  phone_2: string;
  address: string;
  timestamp?: any;
  createdAt?: any;
  processingTimeMs?: number; 
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  BATCH_PROCESSING = 'BATCH_PROCESSING',
  REVIEW = 'REVIEW',
  SAVING = 'SAVING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface UserProfile {
  uid: string; 
  name: string;
  email: string;
  picture?: string;
  
  stats?: {
    scanCount: number;       
    totalScanTimeMs: number; 
    minScanTimeMs: number;   
    maxScanTimeMs: number;   
    lastActive?: any;
  }
}

export enum AuthStep {
  LOGIN = 'LOGIN',
  REGISTER_STEP_1 = 'REGISTER_STEP_1', 
  REGISTER_STEP_2 = 'REGISTER_STEP_2'  
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_GOOGLE_SCRIPT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
