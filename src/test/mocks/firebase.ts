import { vi } from 'vitest';

// Mocking Firebase Auth
export const auth = {
  currentUser: { uid: 'test-user-id', email: 'test@example.com' },
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
};

// Mocking Firestore
export const db = {};

export const collection = vi.fn();
export const doc = vi.fn();
export const getDoc = vi.fn();
export const getDocs = vi.fn();
export const setDoc = vi.fn();
export const updateDoc = vi.fn();
export const query = vi.fn();
export const where = vi.fn();
export const onSnapshot = vi.fn(() => vi.fn()); // Returns unsubscribe function
export const arrayUnion = vi.fn((val) => val);
export const arrayRemove = vi.fn((val) => val);

// Mocking Storage
export const storage = {};
export const ref = vi.fn();
export const uploadBytes = vi.fn();
export const getDownloadURL = vi.fn();

// Mocking Functions
export const functions = {};
export const httpsCallable = vi.fn();

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => auth),
  initializeAuth: vi.fn(() => auth),
  GoogleAuthProvider: vi.fn(),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => db),
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => storage),
  ref,
  uploadBytes,
  getDownloadURL,
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => functions),
  httpsCallable,
}));

// Mocking local firebase lib
vi.mock('../lib/firebase', () => ({
  auth,
  db,
  storage,
  functions,
  googleProvider: {},
}));
