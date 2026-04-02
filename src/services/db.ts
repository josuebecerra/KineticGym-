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
  arrayRemove,
  onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { WorkoutSession, ProgressLog, UserProfile, Routine, GymInfo } from '../types';

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

// Delete a workout session
export const deleteWorkoutSession = async (uid: string, session: WorkoutSession) => {
  console.log('Intentando eliminar sesión:', session.id);
  const userRef = getUserRef(uid);
  
  try {
    // We use a manual filter instead of arrayRemove because arrayRemove is extremely sensitive to object identity
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const updatedHistory = (data.history || []).filter(s => s.id !== session.id);
      
      await updateDoc(userRef, {
        history: updatedHistory
      });
      console.log('Sesión eliminada con éxito de Firestore');
    }
  } catch (error) {
    console.error('Error al eliminar sesión de Firestore:', error);
    throw error;
  }
};

// Upload a progress photo as compressed base64 string
export const uploadProgressPhoto = async (uid: string, file: File): Promise<string> => {
  return await compressImage(file, 800);
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

// Listen to Gym Info (Global)
export const listenToGymInfo = (onUpdate: (info: GymInfo) => void) => {
  const infoRef = doc(db, 'gym_configs', 'general');
  
  return onSnapshot(infoRef, 
    async (docSnap) => {
      try {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as GymInfo);
        } else {
          // Initialize with defaults if empty
        const defaults: GymInfo = {
          schedules: [
            { day: 'Lunes', open: '05:00', close: '22:00' },
            { day: 'Martes', open: '05:00', close: '22:00' },
            { day: 'Miércoles', open: '05:00', close: '22:00' },
            { day: 'Jueves', open: '05:00', close: '22:00' },
            { day: 'Viernes', open: '05:00', close: '22:00' },
            { day: 'Sábado', open: '07:00', close: '18:00' },
            { day: 'Domingo', open: '08:00', close: '13:00' }
          ],
            news: [
              { 
                id: '1', 
                title: '¡Bienvenidos a Kinetic!', 
                content: 'Estamos emocionados de tenerte aquí. Revisa tus rutinas asignadas en la pestaña Entrenar.', 
                date: new Date().toISOString(),
                type: 'info'
              }
            ]
          };
          await setDoc(infoRef, defaults);
          onUpdate(defaults);
        }
      } catch (err) {
        console.error("Error internally processing gym info snapshot:", err);
      }
    },
    (error) => {
      console.error("CRITICAL: Firestore Permission Denied for 'gym_configs'.", error);
      // We could trigger a special state here if needed
    }
  );
};

// Update Gym Info (Admin only)
export const updateGymInfo = async (info: Partial<GymInfo>) => {
  const infoRef = doc(db, 'gym_configs', 'general');
  await updateDoc(infoRef, info);
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

// Upload an avatar photo as compressed base64 string
export const uploadAvatarPhoto = async (uid: string, file: File): Promise<string> => {
  return await compressImage(file, 400);
};

// Generic Base64 Compressor to bypass Firebase Storage and fit in < 1MB limit
const compressImage = (file: File, maxWidth: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
