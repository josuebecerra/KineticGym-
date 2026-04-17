import { db, storage } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '../types';

/**
 * Utility to migrate existing Base64 images from Firestore to Cloud Storage.
 * This should be run by an admin once to clean up the database.
 */
export const migrateBase64ToStorage = async (onProgress?: (msg: string) => void) => {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  let migratedAvatars = 0;
  let migratedProgressPhotos = 0;

  for (const userDoc of snap.docs) {
    const userData = userDoc.data() as UserProfile;
    const uid = userDoc.id;
    let updates: any = {};
    let hasChanges = false;

    // 1. Migrate Avatar
    if (userData.avatarUrl && userData.avatarUrl.startsWith('data:image')) {
      onProgress?.(`Migrando avatar de ${userData.displayName || uid}...`);
      try {
        const blob = await (await fetch(userData.avatarUrl)).blob();
        const fileRef = ref(storage, `avatars/${uid}/avatar.jpg`);
        await uploadBytes(fileRef, blob);
        updates.avatarUrl = await getDownloadURL(fileRef);
        hasChanges = true;
        migratedAvatars++;
      } catch (err) {
        console.error(`Failed to migrate avatar for ${uid}:`, err);
      }
    }

    // 2. Migrate Progress Photos
    if (userData.progress && userData.progress.length > 0) {
      let progressChanged = false;
      const updatedProgress = await Promise.all(userData.progress.map(async (log) => {
        if (!log.photos || log.photos.length === 0) return log;

        let photosChanged = false;
        const updatedPhotos = await Promise.all(log.photos.map(async (photo, idx) => {
          if (photo.startsWith('data:image')) {
            onProgress?.(`Migrando foto de progreso de ${userData.displayName || uid} (${log.date})...`);
            try {
              const blob = await (await fetch(photo)).blob();
              const timestamp = new Date(log.date).getTime() + idx;
              const fileRef = ref(storage, `progress/${uid}/${timestamp}.jpg`);
              await uploadBytes(fileRef, blob);
              const url = await getDownloadURL(fileRef);
              photosChanged = true;
              migratedProgressPhotos++;
              return url;
            } catch (err) {
              console.error(`Failed to migrate progress photo for ${uid}:`, err);
              return photo;
            }
          }
          return photo;
        }));

        if (photosChanged) {
          progressChanged = true;
          return { ...log, photos: updatedPhotos };
        }
        return log;
      }));

      if (progressChanged) {
        updates.progress = updatedProgress;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await updateDoc(doc(db, 'users', uid), updates);
    }
  }

  return { migratedAvatars, migratedProgressPhotos };
};
