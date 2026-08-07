import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfigData.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Helper function to seed or sync initial collection to Firebase if empty with fast timeout fallback
export async function syncCollectionToFirebase<T extends { id: string }>(
  collectionName: string, 
  initialItems: T[]
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore connection timeout')), 2500)
    );

    const snapshot = await Promise.race([
      getDocs(colRef),
      timeoutPromise
    ]);

    if (snapshot.empty) {
      // Seed Firebase with initialItems asynchronously without blocking
      for (const item of initialItems) {
        saveDocumentToFirebase(collectionName, item);
      }
      return initialItems;
    } else {
      const items: T[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as T);
      });
      return items;
    }
  } catch (err) {
    console.warn(`Firebase sync for ${collectionName} timed out or failed, using local storage fallback.`);
    return initialItems;
  }
}

export async function saveDocumentToFirebase<T extends { id: string }>(collectionName: string, item: T) {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore save timeout')), 2500)
    );

    await Promise.race([
      setDoc(doc(db, collectionName, item.id), item),
      timeoutPromise
    ]);
  } catch (err) {
    console.warn(`Failed or timed out saving ${item.id} to Firebase ${collectionName}:`, err);
  }
}

