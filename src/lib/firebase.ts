// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAKDpbwmCgl3A8D_k6ifgI0525adApGBHs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kinetic-647bb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kinetic-647bb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kinetic-647bb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '119582380691',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:119582380691:web:65a1bb9b7687eb59cbf366',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-999LHFFLKR'
};

const app = initializeApp(firebaseConfig);

// Initialize App Check
if (typeof window !== 'undefined') {
  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    const isPlaceholder = !siteKey || siteKey.includes('placeholder');
    
    if (import.meta.env.DEV) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (!isPlaceholder) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    } else if (!import.meta.env.DEV) {
      console.warn("App Check ignored: Missing VITE_RECAPTCHA_SITE_KEY in production.");
    }
  } catch (err) {
    console.error("App Check failed to initialize:", err);
  }
}

let firebaseAuth;
const isNative = typeof window !== 'undefined' && Capacitor?.isNativePlatform?.();

if (isNative) {
  firebaseAuth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence]
  });
} else {
  firebaseAuth = getAuth(app);
}

export const auth = firebaseAuth;
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
