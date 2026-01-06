
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { ContactData, UserProfile } from "../types";

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

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const app = firebase.app();
    db = app.firestore();
    auth = app.auth();
    console.log("🔥 Cloud Engine: Connected to", firebaseConfig.projectId);
  }
} catch (error) {
  console.error("❌ Cloud Error:", error);
}

export const isCloudConnected = () => !!db;

export const initStudioSession = async (): Promise<UserProfile> => {
  let deviceId = localStorage.getItem(STUDIO_SESSION_KEY);
  if (!deviceId) {
    deviceId = 'studio_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(STUDIO_SESSION_KEY, deviceId);
  }

  if (auth) {
    try {
      const userCred = await auth.signInAnonymously();
      const uid = userCred.user?.uid || deviceId;
      return {
        uid,
        name: "Studio Station",
        email: "auto-session@mccia.org"
      };
    } catch (e) {
      console.warn("Auth: Using Local Session ID.");
    }
  }

  return { uid: deviceId, name: "Studio Station", email: "local-session@mccia.org" };
};

export const saveContactToFirebase = async (
  data: ContactData, 
  userId: string, 
  processingTimeMs: number = 0
): Promise<string> => {
  const payload = {
    ...data,
    userId: userId,
    processingTimeMs: processingTimeMs,
    source: "Studio BIZSCAN",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (db) {
    try {
      const docRef = await db.collection("contacts").add(payload);
      console.log(`✅ SCANNED: ${data.name} -> contacts/${docRef.id}`);
      
      const userRef = db.collection("users").doc(userId);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};
        const stats = userData.stats || { scanCount: 0, totalScanTimeMs: 0, minScanTimeMs: 0, maxScanTimeMs: 0 };
        
        const newScanCount = stats.scanCount + 1;
        const newTotalTime = stats.totalScanTimeMs + processingTimeMs;
        const newMinTime = stats.minScanTimeMs === 0 ? processingTimeMs : Math.min(stats.minScanTimeMs, processingTimeMs);
        const newMaxTime = Math.max(stats.maxScanTimeMs, processingTimeMs);

        transaction.set(userRef, {
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          device: "Web Browser",
          stats: {
            scanCount: newScanCount,
            totalScanTimeMs: newTotalTime,
            minScanTimeMs: newMinTime,
            maxScanTimeMs: newMaxTime
          }
        }, { merge: true });
      });

      return docRef.id;
    } catch (e) {
      console.error("❌ Cloud Write Failed:", e);
      throw e;
    }
  }

  const existing = JSON.parse(localStorage.getItem('mccia_local_backup') || '[]');
  const newContact = { ...payload, id: `local_${Date.now()}`, timestamp: new Date() };
  existing.push(newContact);
  localStorage.setItem('mccia_local_backup', JSON.stringify(existing));
  window.dispatchEvent(new Event('storage_updated'));
  return newContact.id;
};

export const subscribeToContacts = (userId: string, onUpdate: (contacts: ContactData[]) => void) => {
  if (!userId) return () => {};
  if (db) {
    const q = db.collection("contacts").where("userId", "==", userId);
    return q.onSnapshot((querySnapshot) => {
      const contacts: ContactData[] = [];
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        contacts.push({ id: doc.id, ...d } as ContactData);
      });
      contacts.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() || a.timestamp?.getTime?.() || 0;
        const tB = b.createdAt?.toMillis?.() || b.timestamp?.getTime?.() || 0;
        return tB - tA;
      });
      onUpdate(contacts);
    }, (error) => console.error("Cloud Error:", error));
  } else {
    const syncLocal = () => {
      const local = JSON.parse(localStorage.getItem('mccia_local_backup') || '[]');
      onUpdate(local.reverse());
    };
    window.addEventListener('storage_updated', syncLocal);
    syncLocal();
    return () => window.removeEventListener('storage_updated', syncLocal);
  }
};

export const fetchGlobalAnalytics = async () => {
  if (!db) throw new Error("Firestore not initialized");
  
  const usersSnap = await db.collection("users").get();
  const contactsSnap = await db.collection("contacts").get();
  
  const totalUsers = usersSnap.size;
  const totalScansGlobal = contactsSnap.size;
  
  let totalTime = 0;
  let minTime = Infinity;
  let maxTime = 0;
  const userStatsMap: Record<string, boolean> = {};

  contactsSnap.forEach(doc => {
    const d = doc.data();
    if (d.userId) userStatsMap[d.userId] = true;
    const time = d.processingTimeMs || 0;
    totalTime += time;
    if (time > 0 && time < minTime) minTime = time;
    if (time > maxTime) maxTime = time;
  });

  return {
    totalUsers,
    loggedInUsers: totalUsers,
    activeUsers: Object.keys(userStatsMap).length,
    totalScansGlobal,
    avgScansPerUser: totalUsers > 0 ? (totalScansGlobal / totalUsers).toFixed(1) : "0",
    medianScans: 0,
    avgTimePerScanMs: totalScansGlobal > 0 ? totalTime / totalScansGlobal : 0,
    globalMinTimeMs: minTime === Infinity ? 0 : minTime,
    globalMaxTimeMs: maxTime
  };
};

export const loginUser = async (email: string, pass: string) => {
  if (auth) return auth.signInWithEmailAndPassword(email, pass);
  throw new Error("Auth not ready");
};

export const registerUser = async (email: string, pass: string, name: string, phone: string, isMember: string) => {
  if (auth && db) {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    if (cred.user) {
      await db.collection("users").doc(cred.user.uid).set({
        name, email, phone, isMember,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    return cred;
  }
  throw new Error("Cloud not ready");
};
