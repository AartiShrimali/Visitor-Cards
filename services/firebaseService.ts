
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";
import "firebase/compat/performance";
import { ContactData, UserProfile } from "../types";

// Helper to get env vars
const getEnv = (key: string) => {
  const env = (import.meta as any).env;
  return env ? env[key] : '';
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
let perf: firebase.performance.Performance | null = null;

try {
  if (firebaseConfig.apiKey) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    // Access the default app instance
    const app = firebase.app();
    db = app.firestore();
    auth = app.auth();
    
    // Initialize Analytics and Performance if in browser environment
    if (typeof window !== 'undefined') {
      analytics = app.analytics();
      perf = app.performance();
    }
    
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase Config missing. Check VITE_FIREBASE_... variables.");
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

// --- ANALYTICS HELPER ---
export const logAnalyticsEvent = (eventName: string, params?: { [key: string]: any }) => {
  if (analytics) {
    try {
      analytics.logEvent(eventName, params);
    } catch (e) {
      console.warn("Analytics log failed", e);
    }
  }
};

// --- AUTHENTICATION FUNCTIONS ---

export const registerUser = async (email: string, password: string, name: string, phone: string, isMember: string): Promise<UserProfile> => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;
  
  if (!user) throw new Error("User creation failed");

  // Update display name
  await user.updateProfile({ displayName: name });
  
  // Initialize trial in DB immediately
  const trialEnd = Date.now() + (5 * 24 * 60 * 60 * 1000); // 5 days from now
  
  if (db) {
    await db.collection("users").doc(user.uid).set({
      name: name,
      email: user.email,
      phone: phone,      
      isMember: isMember, 
      trialExpiresAt: trialEnd,
      expiryEmailSent: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(), // Set initial login
      stats: {
        scanCount: 0,
        totalScanTimeMs: 0,
        minScanTimeMs: 0,
        maxScanTimeMs: 0
      }
    }, { merge: true });
  }

  logAnalyticsEvent('sign_up', { method: 'email' });

  return {
    uid: user.uid,
    name: name,
    email: user.email || "",
    picture: "",
    trialExpiresAt: trialEnd,
    expiryEmailSent: false
  };
};

export const loginUser = async (email: string, password: string): Promise<UserProfile> => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;
  
  if (!user) throw new Error("Login failed");

  logAnalyticsEvent('login', { method: 'email' });

  return {
    uid: user.uid,
    name: user.displayName || "User",
    email: user.email || "",
    picture: user.photoURL || ""
  };
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await auth.signOut();
};

export const subscribeToAuthChanges = (callback: (user: UserProfile | null) => void) => {
  if (!auth) return () => {};
  return auth.onAuthStateChanged(async (user: firebase.User | null) => {
    if (user) {
      let trialExpiresAt = Date.now() + (5 * 24 * 60 * 60 * 1000);
      let expiryEmailSent = false;
      let stats = undefined;

      try {
        if (db) {
          const userDocRef = db.collection("users").doc(user.uid);
          // Update lastLogin on every auth state change (page refresh/login)
          await userDocRef.update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });

          const userSnap = await userDocRef.get();
          
          if (userSnap.exists) {
             const data = userSnap.data();
             if (data) {
                 if (data.trialExpiresAt) trialExpiresAt = data.trialExpiresAt;
                 if (data.expiryEmailSent) expiryEmailSent = data.expiryEmailSent;
                 if (data.stats) stats = data.stats;
             }
          } else {
            // Fallback for first-time logic (should be handled by register, but good safety)
            await userDocRef.set({
              name: user.displayName || "User",
              email: user.email || "",
              trialExpiresAt: trialExpiresAt,
              expiryEmailSent: false,
              lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }
      } catch (e) {
        console.error("Error fetching user data", e);
      }
      
      // Log login event for analytics tracking
      logAnalyticsEvent('app_access', { uid: user.uid });

      callback({
        uid: user.uid,
        name: user.displayName || "User",
        email: user.email || "",
        picture: user.photoURL || "",
        trialExpiresAt: trialExpiresAt,
        expiryEmailSent: expiryEmailSent,
        stats: stats
      });
    } else {
      callback(null);
    }
  });
};

export const markExpiryEmailSent = async (userId: string): Promise<void> => {
  if (!db || !userId) return;
  try {
    const userDocRef = db.collection("users").doc(userId);
    await userDocRef.update({
      expiryEmailSent: true,
      emailSentAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error("Error marking expiry email as sent:", e);
  }
};

export const expireUserTrialNow = async (userId: string): Promise<void> => {
  if (!db || !userId) return;
  try {
    const userDocRef = db.collection("users").doc(userId);
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    await userDocRef.update({
      trialExpiresAt: yesterday,
      expiryEmailSent: false 
    });
    console.log("TEST: Trial forced to expire for user", userId);
  } catch (e) {
    console.error("Error forcing trial expiry:", e);
  }
};

// --- DATABASE FUNCTIONS ---

/**
 * Save a contact AND update user analytics stats
 */
export const saveContactToFirebase = async (
  data: ContactData, 
  userId: string, 
  userName?: string, 
  userEmail?: string,
  processingTimeMs: number = 0 // New parameter for analytics
): Promise<string> => {
  if (!db) throw new Error("Firebase not initialized");
  if (!userId) throw new Error("User ID is required to save data");

  try {
    const userRef = db.collection("users").doc(userId);

    // 1. Transaction to update User Stats safely
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw "User does not exist!";
      }

      const userData = userDoc.data();
      const currentStats = userData?.stats || { 
        scanCount: 0, 
        totalScanTimeMs: 0, 
        minScanTimeMs: 999999, 
        maxScanTimeMs: 0 
      };

      // Calculate new stats
      const newCount = (currentStats.scanCount || 0) + 1;
      const newTotalTime = (currentStats.totalScanTimeMs || 0) + processingTimeMs;
      
      // Min time: if it's 0 (first run) or current is smaller, take current
      let newMin = currentStats.minScanTimeMs;
      if (processingTimeMs > 0) {
        if (!newMin || newMin === 0 || processingTimeMs < newMin) {
          newMin = processingTimeMs;
        }
      }

      // Max time
      let newMax = currentStats.maxScanTimeMs || 0;
      if (processingTimeMs > newMax) {
        newMax = processingTimeMs;
      }

      // Update User Doc with new stats
      transaction.set(userRef, {
        name: userName || "Unknown User",
        email: userEmail || "",
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        stats: {
          scanCount: newCount,
          totalScanTimeMs: newTotalTime,
          minScanTimeMs: newMin,
          maxScanTimeMs: newMax,
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    });

    // 2. Save the contact to the subcollection
    const docRef = await db.collection("users").doc(userId).collection("contacts").add({
      ...data,
      userId: userId,
      createdBy: userName || "Unknown",
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      processingTimeMs: processingTimeMs
    });
    
    // 3. Log Custom Analytics Event
    logAnalyticsEvent('scan_complete', {
      duration_ms: processingTimeMs,
      result: 'success'
    });
    
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    logAnalyticsEvent('scan_failed', { error: String(e) });
    throw e;
  }
};

export const subscribeToContacts = (userId: string, onUpdate: (contacts: ContactData[]) => void) => {
  if (!db || !userId) return () => {};
  const userContactsRef = db.collection("users").doc(userId).collection("contacts");
  const unsubscribe = userContactsRef.onSnapshot((querySnapshot) => {
    const contacts: ContactData[] = [];
    querySnapshot.forEach((doc) => {
      const d = doc.data();
      contacts.push({ id: doc.id, ...d } as ContactData);
    });
    contacts.sort((a, b) => {
      const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return tB - tA;
    });
    onUpdate(contacts);
  }, (error) => {
    console.error("Firebase Real-time Listener Error:", error);
  });
  return unsubscribe;
};

// --- ANALYTICS ADMIN FUNCTION ---
export const fetchGlobalAnalytics = async () => {
  if (!db) throw new Error("Firebase not initialized");
  
  // Fetch all users to aggregate stats
  const usersSnap = await db.collection("users").get();
  
  let totalUsers = 0;
  let activeUsers = 0; // Users with at least 1 scan
  let loggedInUsers = 0; // Users who have logged in at least once
  let totalScansGlobal = 0;
  
  let globalMinTime = 999999;
  let globalMaxTime = 0;
  let globalTotalTime = 0;
  
  const scanCounts: number[] = [];

  usersSnap.forEach(doc => {
    const data = doc.data();
    totalUsers++;
    
    // Check if user has ever logged in (has lastLogin field)
    if (data.lastLogin || data.createdAt) {
      loggedInUsers++;
    }
    
    if (data.stats && data.stats.scanCount > 0) {
      activeUsers++;
      const s = data.stats;
      
      totalScansGlobal += s.scanCount;
      globalTotalTime += s.totalScanTimeMs;
      scanCounts.push(s.scanCount);
      
      if (s.minScanTimeMs < globalMinTime && s.minScanTimeMs > 0) globalMinTime = s.minScanTimeMs;
      if (s.maxScanTimeMs > globalMaxTime) globalMaxTime = s.maxScanTimeMs;
    }
  });

  // Calculate Median
  scanCounts.sort((a, b) => a - b);
  let medianScans = 0;
  if (scanCounts.length > 0) {
    const mid = Math.floor(scanCounts.length / 2);
    medianScans = scanCounts.length % 2 !== 0 ? scanCounts[mid] : (scanCounts[mid - 1] + scanCounts[mid]) / 2;
  }

  // Averages
  const avgScansPerUser = activeUsers > 0 ? (totalScansGlobal / activeUsers) : 0;
  const avgTimePerScan = totalScansGlobal > 0 ? (globalTotalTime / totalScansGlobal) : 0;

  return {
    totalUsers,
    loggedInUsers, // New Metric
    activeUsers,
    totalScansGlobal,
    avgScansPerUser: avgScansPerUser.toFixed(1),
    medianScans,
    avgTimePerScanMs: Math.round(avgTimePerScan),
    globalMinTimeMs: globalMinTime === 999999 ? 0 : globalMinTime,
    globalMaxTimeMs: globalMaxTime
  };
};
