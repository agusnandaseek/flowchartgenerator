import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { ShareHistoryItem } from './storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let app: any = null;
let auth: any = null;
let db: Firestore | null = null;

if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase init warning:', err);
  }
}

export {
  app,
  auth,
  db,
  signInWithEmailAndPassword,
  fbSignOut,
  onAuthStateChanged,
  type User,
};

const COLLECTION_NAME = 'program_design_shares';

/**
 * Menyimpan data riwayat share ke Firebase Firestore.
 */
export async function saveShareToFirebase(item: ShareHistoryItem): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, item.id);
    await setDoc(docRef, {
      id: item.id,
      url: item.url,
      projectName: item.projectName,
      mode: item.mode,
      createdAt: item.createdAt,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firebase Firestore save notice (fallback ke local cache):', err);
  }
}

/**
 * Mengambil seluruh data riwayat share dari Firebase Firestore.
 */
export async function fetchSharesFromFirebase(): Promise<ShareHistoryItem[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const items: ShareHistoryItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: data.id || docSnap.id,
        url: data.url || '',
        projectName: data.projectName || 'Proyek Tanpa Nama',
        mode: data.mode || 'flowchart',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
    return items;
  } catch (err) {
    console.warn('Firebase Firestore fetch notice:', err);
    return [];
  }
}

/**
 * Menghapus record share dari Firebase Firestore.
 */
export async function deleteShareFromFirebase(id: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firebase Firestore delete notice:', err);
  }
}
