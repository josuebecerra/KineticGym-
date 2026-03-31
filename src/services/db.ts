import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot 
} from 'firebase/firestore';
import { WorkoutSession, ProgressLog } from '../types';

// Helper to get a user's reference
const getUserRef = (uid: string) => doc(db, 'users', uid);

// Initialize a new user document if they don't have one
export const initializeUser = async (uid: string) => {
  const userRef = getUserRef(uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    await setDoc(userRef, {
      history: [],
      progress: []
    });
  }
};

// Add a new workout session
export const saveWorkoutSession = async (uid: string, session: WorkoutSession) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    history: arrayUnion(session)
  });
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
  onUpdate: (data: { history: WorkoutSession[], progress: ProgressLog[] }) => void
) => {
  const userRef = getUserRef(uid);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onUpdate({
        history: data.history || [],
        progress: data.progress || []
      });
    } else {
      onUpdate({ history: [], progress: [] });
    }
  });
};
