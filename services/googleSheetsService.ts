import { ContactData } from "../types";

// Helper to get env vars safely using Vite's native import.meta.env
const getClientId = () => {
  const env = (import.meta as any).env;
  // Try Vite standard first (Most reliable on Vercel)
  if (env && env.VITE_GOOGLE_CLIENT_ID) {
    return env.VITE_GOOGLE_CLIENT_ID;
  }
  // Fallback to process.env replacement
  if (typeof process !== 'undefined' && process.env.GOOGLE_CLIENT_ID) {
    return process.env.GOOGLE_CLIENT_ID;
  }
  return '';
};

const CLIENT_ID = getClientId();

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGapiClient = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if(!window.gapi) {
      // Graceful fallback if script fails to load
      reject("Google API script not loaded");
      return;
    }
    
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const initGisClient = (onTokenReceived: (tokenResponse: any) => void): void => {
  // Defensive check for Google Identity Services script
  if(!window.google || !window.google.accounts) {
    console.warn("Google Identity Services script not loaded.");
    return;
  }
  
  if (!CLIENT_ID) {
    console.warn("GOOGLE_CLIENT_ID is missing. OAuth features will be disabled. Check VITE_GOOGLE_CLIENT_ID in Vercel.");
    // We throw here so the App can catch it and enable Demo mode
    throw new Error("MISSING_CLIENT_ID");
  }

  console.log("Initializing Google Auth with Client ID:", CLIENT_ID.substring(0, 10) + "...");

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (resp: any) => {
        if (resp.error) {
           console.error("OAuth Error:", resp);
           if (resp.error.includes("redirect_uri_mismatch") || resp.error.includes("origin_mismatch")) {
             alert(`Google Connection Failed.\n\nError: ${resp.error}\n\nFix: Go to Google Cloud Console > Credentials > OAuth Client.\nAdd this URI to "Authorized Javascript Origins":\n${window.location.origin}`);
           }
           return;
        }
        onTokenReceived(resp);
      },
      error_callback: (err: any) => {
         console.error("GIS Error Callback:", err);
         alert("Popup closed or connection failed.");
      }
    });
    gisInited = true;
  } catch (err) {
    console.error("Failed to initialize Token Client", err);
  }
};

export const requestAccessToken = () => {
  if(!tokenClient) {
     if (!CLIENT_ID) throw new Error("MISSING_CLIENT_ID");
     throw new Error("Google Sign-In not initialized. Refresh page.");
  }
  // Prompt the user to select an account and consent to the scopes
  tokenClient.requestAccessToken({ prompt: 'consent' });
};

const findOrCreateSheet = async (sheetName: string): Promise<string> => {
  let spreadsheetId = localStorage.getItem('contacts_spreadsheet_id');

  if (spreadsheetId) {
    try {
      // Validate it exists
      await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
      return spreadsheetId;
    } catch (e) {
      console.warn("Stored spreadsheet ID invalid, creating new one.");
    }
  }

  // Create new
  const response = await window.gapi.client.sheets.spreadsheets.create({
    resource: {
      properties: {
        title: sheetName,
      },
    },
  });

  spreadsheetId = response.result.spreadsheetId;
  localStorage.setItem('contacts_spreadsheet_id', spreadsheetId || '');
  
  // Add headers
  if (spreadsheetId) {
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Name', 'Company', 'Designation', 'Email 1', 'Email 2', 'Phone 1', 'Phone 2', 'Address']]
      }
    });
  }

  return spreadsheetId || '';
};

export const saveToSheet = async (data: ContactData): Promise<void> => {
  try {
    const spreadsheetId = await findOrCreateSheet('contacts');
    
    const values = [
      [
        data.name,
        data.company_name,
        data.designation,
        data.email_1,
        data.email_2,
        data.phone_1,
        data.phone_2,
        data.address
      ]
    ];

    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values,
      },
    });
  } catch (error) {
    console.error("Error saving to sheet:", error);
    throw error;
  }
};