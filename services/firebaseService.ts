
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";
import "firebase/compat/performance";
import { ContactData, UserProfile } from "../types";

const getEnv = (key: string) => {
  const env = (import.meta as any).env;
  if (env && env[key]) return env[key];
  if (typeof process !== 'undefined' && process.env) {
    if ((process.env as any)[key]) return (process.env as any)[key];
    const noViteKey = key.replace('VITE_', '');
    if ((process.env as any)[noViteKey]) return (process.env as any)[noViteKey];
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let db: firebase.firestore.Firestore | null = null;
let auth: firebase.auth.Auth | null = null;
let analytics: firebase.analytics.Analytics | null = null;

const LOCAL_STORAGE_KEY = 'mccia_permanent_contacts';

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const app = firebase.app();
    db = app.firestore();
    auth = app.auth();
    
    if (typeof window !== 'undefined') {
      try {
        analytics = app.analytics();
      } catch (e) {}
    }
  } else {
    console.warn("Firebase config missing - Using Local Storage mode.");
  }
} catch (error) {
  console.error("Firebase init failed:", error);
}

export const logAnalyticsEvent = (eventName: string, params?: { [key: string]: any }) => {
  if (analytics) {
    try { analytics.logEvent(eventName, params); } catch (e) {}
  }
};

export const loginUser = async (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return auth.signInWithEmailAndPassword(email, password);
};

export const registerUser = async (email: string, password: string, name: string, phone: string, isMember: string) => {
  if (!auth || !db) throw new Error("Firebase Auth/Firestore not initialized");
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;
  if (user) {
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      name,
      email,
      phone,
      isMember,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      stats: {
        scanCount: 0,
        totalScanTimeMs: 0,
        minScanTimeMs: 0,
        maxScanTimeMs: 0
      }
    });
  }
  return userCredential;
};

export const saveContactToFirebase = async (
  data: ContactData, 
  userId: string, 
  userName?: string, 
  userEmail?: string,
  processingTimeMs: number = 0
): Promise<string> => {
  const contactWithMeta = {
    ...data,
    userId: userId,
    createdBy: userName || "Unknown",
    timestamp: new Date(),
    processingTimeMs: processingTimeMs
  };

  if (db) {
    try {
      // Store in sub-collection 'scanned_data' under the user document as requested
      const docRef = await db.collection("users").doc(userId).collection("scanned_data").add({
        ...contactWithMeta,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user stats
      await db.collection("users").doc(userId).update({
        "stats.scanCount": firebase.firestore.FieldValue.increment(1),
        "stats.totalScanTimeMs": firebase.firestore.FieldValue.increment(processingTimeMs),
        "lastActive": firebase.firestore.FieldValue.serverTimestamp()
      });

      logAnalyticsEvent('scan_complete', { duration_ms: processingTimeMs });
      return docRef.id;
    } catch (e) {
      console.error("Firestore save failed:", e);
    }
  }

  const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const newContact = { ...contactWithMeta, id: `local_${Date.now()}` };
  existing.push(newContact);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  window.dispatchEvent(new Event('storage_updated'));
  return newContact.id;
};

export const subscribeToContacts = (userId: string, onUpdate: (contacts: ContactData[]) => void) => {
  let unsubscribeFirebase = () => {};
  
  if (db && userId) {
    // Listen to the 'scanned_data' sub-collection
    const userContactsRef = db.collection("users").doc(userId).collection("scanned_data");
    unsubscribeFirebase = userContactsRef.onSnapshot((querySnapshot) => {
      const contacts: ContactData[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        contacts.push({ id: doc.id, ...d } as ContactData);
      });
      contacts.sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp instanceof Date ? a.timestamp.getTime() : 0);
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp instanceof Date ? b.timestamp.getTime() : 0);
        return tB - tA;
      });
      onUpdate(contacts);
    }, (error) => console.error("Firestore listener error:", error));
  }

  const syncLocal = () => {
    if (!db) {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      onUpdate(local.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  };

  window.addEventListener('storage_updated', syncLocal);
  syncLocal();

  return () => {
    unsubscribeFirebase();
    window.removeEventListener('storage_updated', syncLocal);
  };
};

export const fetchGlobalAnalytics = async () => {
  if (!db) {
    return {
      totalUsers: 1,
      loggedInUsers: 1,
      activeUsers: 1,
      totalScansGlobal: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]').length,
      avgScansPerUser: "0.0",
      medianScans: 0,
      avgTimePerScanMs: 0,
      globalMinTimeMs: 0,
      globalMaxTimeMs: 0
    };
  }
  
  try {
    const usersSnap = await db.collection("users").get();
    let totalUsers = 0, activeUsers = 0, totalScansGlobal = 0, globalTotalTime = 0;
    
    usersSnap.forEach(doc => {
      const data = doc.data();
      totalUsers++;
      if (data.stats && data.stats.scanCount > 0) {
        activeUsers++;
        totalScansGlobal += data.stats.scanCount;
        globalTotalTime += data.stats.totalScanTimeMs;
      }
    });

    return {
      totalUsers,
      loggedInUsers: totalUsers,
      activeUsers,
      totalScansGlobal,
      avgScansPerUser: activeUsers > 0 ? (totalScansGlobal / activeUsers).toFixed(1) : "0",
      medianScans: 0,
      avgTimePerScanMs: totalScansGlobal > 0 ? Math.round(globalTotalTime / totalScansGlobal) : 0,
      globalMinTimeMs: 0,
      globalMaxTimeMs: 0
    };
  } catch (e) {
    return { totalUsers: 0, activeUsers: 0, totalScansGlobal: 0, avgScansPerUser: "0", medianScans: 0, avgTimePerScanMs: 0, globalMinTimeMs: 0, globalMaxTimeMs: 0 };
  }
};
