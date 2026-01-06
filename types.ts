
// types.ts

export interface ContactData {
  id?: string;
  userId?: string; // Critical for data privacy
  name: string;
  company_name: string;
  designation: string;
  email_1: string;
  email_2: string;
  phone_1: string;
  phone_2: string;
  address: string;
  timestamp?: any;
  processingTimeMs?: number; // Track how long Gemini took
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  SAVING = 'SAVING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  TRIAL_EXPIRED = 'TRIAL_EXPIRED'
}

export interface UserProfile {
  uid: string; // Firebase UID
  name: string;
  email: string;
  picture?: string;
  trialExpiresAt?: number; // Timestamp for 5-day trial end
  expiryEmailSent?: boolean; // Track if the trial end email has been sent
  
  // Analytics Fields
  stats?: {
    scanCount: number;       // Total cards scanned
    totalScanTimeMs: number; // Sum of all processing times (to calc avg)
    minScanTimeMs: number;   // Fastest scan
    maxScanTimeMs: number;   // Slowest scan
    lastActive?: any;
  }
}

export enum AuthStep {
  LOGIN = 'LOGIN',
  REGISTER_STEP_1 = 'REGISTER_STEP_1', // Name, Email
  REGISTER_STEP_2 = 'REGISTER_STEP_2'  // Password, Confirm Password
}

// Global declaration for Google APIs loaded via script tags
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// Vite Environment Variables Type Definition
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  // Google Apps Script URL for emailing
  readonly VITE_GOOGLE_SCRIPT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
