import { db, storage } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  updateDoc, 
  arrayUnion, 
  onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { WorkoutSession, ProgressLog, UserProfile, Routine } from '../types';

// Helper to get a user's reference
const getUserRef = (uid: string) => doc(db, 'users', uid);

// Initialize a new user document if they don't have one
export const initializeUser = async (uid: string, email: string) => {
  const userRef = getUserRef(uid);
  const snap = await getDoc(userRef);
  
  const baseProfile = {
    uid,
    email,
    displayName: email.split('@')[0],
    avatarUrl: '',
    role: 'trainee',
    settings: {
      soundEnabled: true
    },
    history: [],
    progress: [],
    assignedRoutines: []
  };

  if (!snap.exists()) {
    await setDoc(userRef, baseProfile as UserProfile);
  } else {
    // Migrate old profiles that only had history and progress
    const data = snap.data();
    if (!data.role || !data.email) {
      await updateDoc(userRef, {
        ...baseProfile,
        history: data.history || [],
        progress: data.progress || []
      });
    }
  }
};

// Add a new workout session
export const saveWorkoutSession = async (uid: string, session: WorkoutSession) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    history: arrayUnion(session)
  });
};

// Upload a progress photo to Firebase Storage and get public URL
export const uploadProgressPhoto = async (uid: string, file: File): Promise<string> => {
  const timestamp = Date.now();
  const fileRef = ref(storage, `users/${uid}/progress_photos/${timestamp}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};

// Add a new progress log
export const saveProgressLog = async (uid: string, log: ProgressLog) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    progress: arrayUnion(log)
  });
};

// Listen to real-time changes
export const listenToUserData = (
  uid: string, 
  onUpdate: (data: UserProfile | null) => void
) => {
  const userRef = getUserRef(uid);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as UserProfile);
    } else {
      onUpdate(null);
    }
  });
};

// Get all users (Staff only)
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  return snap.docs.map(doc => doc.data() as UserProfile);
};

// Assign a routine to a specific user
export const assignRoutineToUser = async (uid: string, routine: Routine) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    assignedRoutines: arrayUnion(routine)
  });
};

// Update user settings/profile
export const updateUserProfile = async (uid: string, changes: Partial<UserProfile>) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, changes);
};

// Upload an avatar photo
export const uploadAvatarPhoto = async (uid: string, file: File): Promise<string> => {
  const timestamp = Date.now();
  const fileRef = ref(storage, `users/${uid}/avatar/${timestamp}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
};
