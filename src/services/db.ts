import { db, storage, functions } from '../lib/firebase';
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
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { WorkoutSession, ProgressLog, UserProfile, Routine, GymInfo, AssessmentData, SubscriptionData, MembershipPlan, TaxData, GymTaxConfig, Invoice } from '../types';
import { generateConsecutivo, generateClave, calculateInvoiceTotals } from '../utils/taxUtils';

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
    ],
    membershipPlans: [
      { id: '1month', name: 'Mensual', price: '40', description: 'Acceso total por 30 días' },
      { id: '6months', name: 'Semestral', price: '200', description: '¡Ahorra 15%! Acceso por 180 días' },
      { id: '1year', name: 'Anual', price: '350', description: '¡Mejor Valor! Acceso ilimitado por 365 días' }
    ]
  };

  return onSnapshot(infoRef,
    async (docSnap) => {
      try {
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as GymInfo;
          // Merge with defaults to ensure missing fields (like membershipPlans) are always present
          onUpdate({
            ...defaults,
            ...cloudData
          });
        } else {
          // Initialize with defaults if empty (this might fail if not admin, which is fine)
          try {
            await setDoc(infoRef, defaults);
          } catch (e) {
            console.warn("Could not auto-initialize gym_configs. This is normal for non-admins.");
          }
          onUpdate(defaults);
        }
      } catch (err) {
        console.error("Error processing gym info snapshot:", err);
        onUpdate(defaults);
      }
    },
    (error) => {
      console.error("CRITICAL: Firestore Permission Denied for 'gym_configs'. Using local defaults.", error);
      onUpdate(defaults);
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
export const assignRoutineToUser = async (uid: string, routine: Routine, authorId?: string, authorName?: string) => {
  const userRef = getUserRef(uid);
  const routineWithAuthor = {
    ...routine,
    authorId: authorId || routine.authorId,
    authorName: authorName || routine.authorName
  };

  await updateDoc(userRef, {
    assignedRoutines: arrayUnion(routineWithAuthor)
  });
};

// Assign a trainer to a specific user
export const assignTrainerToUser = async (clientUid: string, trainerUid: string, trainerName: string) => {
  const clientRef = getUserRef(clientUid);
  await updateDoc(clientRef, {
    trainerId: trainerUid,
    trainerName: trainerName
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

// Save assessment results
export const saveAssessment = async (uid: string, data: AssessmentData) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    assessment: data
  });
};

// Update user subscription (Admin only)
export const updateUserSubscription = async (uid: string, data: SubscriptionData) => {
  const userRef = getUserRef(uid);
  const snap = await getDoc(userRef);

  await updateDoc(userRef, {
    subscription: data,
    subscriptionHistory: arrayUnion(data),
    membershipRequest: null
  });

  if (snap.exists()) {
    const userData = snap.data() as UserProfile;
    // CRITICAL FIX: Merge the approved subscription into userData before invoicing
    const freshUserData = { ...userData, subscription: data };
    try {
      await triggerAutoInvoice(uid, freshUserData, data.planId as any);
    } catch (invErr) {
      console.error("Auto-invoicing failed during manual update, but subscription was saved:", invErr);
    }
  }
};

// Request a membership plan (Trainee)
export const requestMembership = async (uid: string, planId: '1month' | '6months' | '1year') => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    membershipRequest: {
      planId,
      requestDate: new Date().toISOString(),
      status: 'pending'
    }
  });
};

// Approve a pending membership (Admin)
export const approveMembership = async (uid: string, planId: '1month' | '6months' | '1year') => {
  const userRef = getUserRef(uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const userData = snap.data() as UserProfile;
  const now = new Date();
  let startDate = now;

  // Extension logic: if active, start from its end date
  if (userData.subscription && userData.subscription.status === 'active') {
    const currentEnd = new Date(userData.subscription.endDate);
    if (currentEnd > now) {
      startDate = currentEnd;
    }
  }

  const endDate = new Date(startDate);
  if (planId === '1month') endDate.setMonth(endDate.getMonth() + 1);
  else if (planId === '6months') endDate.setMonth(endDate.getMonth() + 6);
  else if (planId === '1year') endDate.setFullYear(endDate.getFullYear() + 1);

  const subscription: SubscriptionData = {
    planId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active'
  };

  await updateDoc(userRef, {
    subscription,
    subscriptionHistory: arrayUnion(subscription),
    membershipRequest: null // Request fulfilled
  });

  // CRITICAL FIX: Merge the approved subscription into userData before invoicing
  const freshUserData = { ...userData, subscription };
  try {
    await triggerAutoInvoice(uid, freshUserData, planId);
  } catch (invErr) {
    console.error("Auto-invoicing failed during approval, but membership was granted:", invErr);
  }
};

// HELPER: Auto-invoicing logic
const triggerAutoInvoice = async (uid: string, userData: UserProfile, planId: '1month' | '6months' | '1year') => {
  try {
    const configRef = doc(db, 'gym_configs', 'invoicing');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      const gymConfig = configSnap.data() as GymTaxConfig;
      const lastNum = gymConfig.lastConsecutive || 0;
      const consecutivo = generateConsecutivo(lastNum);
      const clave = generateClave(gymConfig, consecutivo);

      const prices: Record<string, number> = { '1month': 40, '6months': 200, '1year': 350 };
      const amount = prices[planId] || 0;
      const totals = calculateInvoiceTotals(amount);

      const invoice: Invoice = {
        id: clave,
        consecutive: consecutivo,
        clave: clave,
        date: new Date().toISOString(),
        amount: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        status: 'accepted',
        planId,
        emisorName: gymConfig.name,
        emisorId: gymConfig.id,
        receptorName: userData.taxData?.name || userData.displayName || 'Consumidor Final',
        receptorId: userData.taxData?.id || '000000000',
        currency: 'USD',
        condition: '01',
        method: '04',
        planStartDate: userData.subscription?.startDate
      };

      await saveInvoice(uid, invoice);
      await updateDoc(configRef, { lastConsecutive: lastNum + 1 });
      console.log(`Invoice ${clave} generated successfully for ${uid}`);
    } else {
      console.warn("Auto-invoicing skipped: No gym_configs/invoicing found.");
    }
  } catch (err) {
    console.error("Auto-invoicing failed:", err);
    throw err; // Re-throw to catch in parent callers
  }
};

// Cancel a membership (Admin)
export const cancelMembership = async (uid: string, reason: string) => {
  const userRef = getUserRef(uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const userData = snap.data() as UserProfile;
  if (!userData.subscription) return;

  const now = new Date().toISOString();
  const cancelledSub: SubscriptionData = {
    ...userData.subscription,
    status: 'canceled',
    endDate: now,
    cancelReason: reason
  };

  // Update history: find the matching active subscription and mark it
  const history = userData.subscriptionHistory || [];
  const updatedHistory = history.map(sub => {
    if (sub.startDate === userData.subscription?.startDate && sub.planId === userData.subscription?.planId) {
      return cancelledSub;
    }
    return sub;
  });

  await updateDoc(userRef, {
    subscription: cancelledSub,
    subscriptionHistory: updatedHistory,
    membershipRequest: null // Clear any requests too
  });
};

// Reject a membership request (Admin)
export const rejectMembership = async (uid: string) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    'membershipRequest.status': 'rejected'
  });
};

// Global Maintenance: Clear all routines for all users (Admin only)
export const clearAllRoutines = async () => {
  const { writeBatch, collection, getDocs, deleteField } = await import('firebase/firestore');
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);

  const batch = writeBatch(db);
  snap.docs.forEach(userDoc => {
    batch.update(userDoc.ref, {
      assignedRoutines: [],
      // Clear session persistence fields if any
      workoutState: deleteField(),
      activeExercises: deleteField()
    });
  });

  await batch.commit();
};

// Maintenance/Global: Clear all routines
// (Already exists above)

/**
 * INVOICING & TAX DATA
 */

// Save/Update user tax data
export const updateTaxData = async (uid: string, data: TaxData) => {
  const userRef = getUserRef(uid);
  await updateDoc(userRef, {
    taxData: data
  });
};

// Listen to Gym Tax Config (Admin Only)
export const listenToGymTaxConfig = (onUpdate: (config: GymTaxConfig | null) => void) => {
  const configRef = doc(db, 'gym_configs', 'invoicing');

  return onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as GymTaxConfig);
    } else {
      onUpdate(null);
    }
  });
};

// Update Gym Tax Config (Admin Only)
export const updateGymTaxConfig = async (config: Partial<GymTaxConfig>) => {
  const configRef = doc(db, 'gym_configs', 'invoicing');
  const snap = await getDoc(configRef);

  if (!snap.exists()) {
    await setDoc(configRef, config);
  } else {
    await updateDoc(configRef, config);
  }
};

// Save an invoice to the user's records
export const saveInvoice = async (uid: string, invoice: Invoice) => {
  // 1. Try to save to user profile
  try {
    const userRef = getUserRef(uid);
    await updateDoc(userRef, {
      invoices: arrayUnion(invoice)
    });
    console.log(`Invoice ${invoice.id} saved to user ${uid} profile.`);
  } catch (error) {
    console.error(`Error saving invoice to user profile (${uid}):`, error);
    // Continue anyway to global collection
  }

  // 2. Try to save to global collection
  try {
    const invoiceRef = doc(db, 'invoices', invoice.id);
    await setDoc(invoiceRef, {
      ...invoice,
      userId: uid,
      createdAt: new Date().toISOString()
    });
    console.log(`Invoice ${invoice.id} saved to global collection.`);
  } catch (error) {
    console.error(`Error saving invoice to global collection:`, error);
    throw error; // Re-throw so parent knows it failed globally
  }
};

// Call Electronic Invoicing Cloud Function
export const requestElectronicInvoice = async (userId: string, data: { amount: number, planId: string, currency: string }) => {
  const createInvoiceFn = httpsCallable(functions, 'createElectronicInvoice');
  const result = await createInvoiceFn({ userId, ...data });
  return result.data as { success: boolean, clave: string, status: string };
};

// Get all invoices (Admin only)
export const getGlobalInvoices = async (): Promise<Invoice[]> => {
  const invoicesRef = collection(db, 'invoices');
  const snap = await getDocs(invoicesRef);
  return snap.docs.map(doc => doc.data() as Invoice);
};

// BULK GENERATE: Create invoices for all active users without one
export const bulkGenerateInvoices = async () => {
  const usersRef = collection(db, 'users');
  const userSnap = await getDocs(usersRef);

  const invoicesRef = collection(db, 'invoices');
  const existingInvoicesSnap = await getDocs(invoicesRef);
  const existingInvoices = existingInvoicesSnap.docs.map(d => d.data() as Invoice);

  let count = 0;
  for (const uDoc of userSnap.docs) {
    const userData = uDoc.data() as UserProfile;
    if (userData.subscription && userData.subscription.status === 'active') {
      // ROBUST CHECK: Unique user ID + Plan ID + Start Date
      const hasInvoice = existingInvoices.some(inv =>
        inv.id === uDoc.id &&
        inv.planId === userData.subscription?.planId &&
        inv.planStartDate === userData.subscription?.startDate
      );

      if (!hasInvoice) {
        try {
          // Pass the specific userData from this doc snapshot
          await triggerAutoInvoice(uDoc.id, userData, userData.subscription.planId as any);
          count++;
        } catch (err) {
          console.error(`Error generating invoice for ${uDoc.id}:`, err);
        }
      }
    }
  }
  console.log(`Synchronization complete: ${count} invoices generated.`);
  return count;
};

// Generic Base64 Compressor
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
