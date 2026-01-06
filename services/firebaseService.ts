
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { ContactData, UserProfile } from "../types";

// Robust environment variable accessor for Vite/Studio environments
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
    return (process.env as any)[key];
  }
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) {
    return metaEnv[key];
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

const STUDIO_SESSION_KEY = 'mccia_studio_device_id';

// Initialize Firebase
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const app = firebase.app();
    db = app.firestore();
    auth = app.auth();
    console.log("Cloud Database Engine initialized.");
  }
} catch (error) {
  console.error("Cloud initialization error:", error);
}

/**
 * Automatically initializes a session for the device without UI login.
 * It generates a unique ID for this browser and stores it in localStorage.
 */
export const initStudioSession = async (): Promise<UserProfile> => {
  let deviceId = localStorage.getItem(STUDIO_SESSION_KEY);
  
  if (!deviceId) {
    // Generate a new unique ID if one doesn't exist
    deviceId = 'studio_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem(STUDIO_SESSION_KEY, deviceId);
  }

  // If Auth is available, we sign in anonymously to satisfy security rules
  if (auth) {
    try {
      const userCred = await auth.signInAnonymously();
      const uid = userCred.user?.uid || deviceId;
      return {
        uid: uid,
        name: "Studio Station",
        email: "auto-session@mccia.org"
      };
    } catch (e) {
      console.warn("Anonymous auth failed, falling back to Device ID.");
    }
  }

  return {
    uid: deviceId,
    name: "Studio Station",
    email: "offline-session@mccia.org"
  };
};

// Fix: Added missing loginUser function
export const loginUser = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return await auth.signInWithEmailAndPassword(email, pass);
};

// Fix: Added missing registerUser function with profile initialization
export const registerUser = async (email: string, pass: string, name: string, phone: string, isMember: string) => {
  if (!auth || !db) throw new Error("Firebase Auth or Firestore not initialized");
  const userCred = await auth.createUserWithEmailAndPassword(email, pass);
  const uid = userCred.user?.uid;
  if (uid) {
    await db.collection("users").doc(uid).set({
      name,
      email,
      phone,
      isMember,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      stats: {
        scanCount: 0,
        totalScanTimeMs: 0,
        minScanTimeMs: 0,
        maxScanTimeMs: 0
      }
    });
  }
  return userCred;
};

// Fix: Added missing fetchGlobalAnalytics function
export const fetchGlobalAnalytics = async () => {
  if (!db) throw new Error("Firestore not initialized");
  
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(doc => doc.data());
  
  const totalUsers = usersSnap.size;
  const activeUsers = users.filter((u: any) => (u.stats?.scanCount || 0) > 0).length;
  const totalScansGlobal = users.reduce((acc: number, u: any) => acc + (u.stats?.scanCount || 0), 0);
  
  let totalTime = 0;
  let minTime = Infinity;
  let maxTime = 0;
  
  users.forEach((u: any) => {
    if (u.stats) {
      totalTime += (u.stats.totalScanTimeMs || 0);
      if (u.stats.minScanTimeMs > 0 && u.stats.minScanTimeMs < minTime) minTime = u.stats.minScanTimeMs;
      if (u.stats.maxScanTimeMs > maxTime) maxTime = u.stats.maxScanTimeMs;
    }
  });

  return {
    totalUsers,
    loggedInUsers: totalUsers,
    activeUsers,
    totalScansGlobal,
    avgScansPerUser: totalUsers > 0 ? (totalScansGlobal / totalUsers).toFixed(2) : "0",
    medianScans: 0, 
    avgTimePerScanMs: totalScansGlobal > 0 ? totalTime / totalScansGlobal : 0,
    globalMinTimeMs: minTime === Infinity ? 0 : minTime,
    globalMaxTimeMs: maxTime
  };
};

/**
 * Data Storage logic: users/{deviceId}/scanned_data/DOC
 */
export const saveContactToFirebase = async (
  data: ContactData, 
  userId: string, 
  processingTimeMs: number = 0
): Promise<string> => {
  const contactWithMeta = {
    ...data,
    userId: userId,
    timestamp: new Date(),
    processingTimeMs: processingTimeMs,
    source: "Studio BIZSCAN"
  };

  if (db) {
    try {
      const docRef = await db.collection("users").doc(userId).collection("scanned_data").add({
        ...contactWithMeta,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Fix: Updated to calculate and store running user statistics
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};
      const stats = userData.stats || { scanCount: 0, totalScanTimeMs: 0, minScanTimeMs: 0, maxScanTimeMs: 0 };
      
      const newScanCount = stats.scanCount + 1;
      const newTotalTime = stats.totalScanTimeMs + processingTimeMs;
      const newMinTime = stats.minScanTimeMs === 0 ? processingTimeMs : Math.min(stats.minScanTimeMs, processingTimeMs);
      const newMaxTime = Math.max(stats.maxScanTimeMs, processingTimeMs);

      await userRef.set({
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        deviceType: "Web Studio",
        stats: {
          scanCount: newScanCount,
          totalScanTimeMs: newTotalTime,
          minScanTimeMs: newMinTime,
          maxScanTimeMs: newMaxTime
        }
      }, { merge: true });

      return docRef.id;
    } catch (e) {
      console.error("Cloud write failed:", e);
      throw e;
    }
  }

  // Secondary local fallback if Firebase is disconnected
  const existing = JSON.parse(localStorage.getItem('mccia_local_backup') || '[]');
  const newContact = { ...contactWithMeta, id: `local_${Date.now()}` };
  existing.push(newContact);
  localStorage.setItem('mccia_local_backup', JSON.stringify(existing));
  window.dispatchEvent(new Event('storage_updated'));
  return newContact.id;
};

export const subscribeToContacts = (userId: string, onUpdate: (contacts: ContactData[]) => void) => {
  if (!userId) return () => {};
  
  if (db) {
    const userContactsRef = db.collection("users").doc(userId).collection("scanned_data");
    return userContactsRef.onSnapshot((querySnapshot) => {
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
    }, (error) => console.error("Cloud read error:", error));
  } else {
    const syncLocal = () => {
      const local = JSON.parse(localStorage.getItem('mccia_local_backup') || '[]');
      onUpdate(local.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };
    window.addEventListener('storage_updated', syncLocal);
    syncLocal();
    return () => window.removeEventListener('storage_updated', syncLocal);
  }
};
