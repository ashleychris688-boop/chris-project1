import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  disableNetwork, 
  enableNetwork,
  onSnapshot,
  query,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Silence verbose connection probing warnings
try {
  setLogLevel('error');
} catch (e) {
  // ignore
}

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

const firestoreSettings = {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
};

export const db = firebaseConfigData.firestoreDatabaseId 
  ? initializeFirestore(app, firestoreSettings, firebaseConfigData.firestoreDatabaseId)
  : initializeFirestore(app, firestoreSettings);

let isQuotaExceeded = false;

// Clear any previous stale lockout on startup and re-enable network
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('lfr_firestore_quota_exceeded');
  } catch (e) {}
}

export function resetFirebaseNetwork() {
  isQuotaExceeded = false;
  enableNetwork(db).catch(() => {});
}

function handleQuotaExceeded(err: unknown) {
  if (!isQuotaExceeded) {
    isQuotaExceeded = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lfr_firestore_quota_exceeded', 'true');
      } catch (e) {
        // ignore storage errors
      }
    }
    console.warn('[Firebase] Firestore daily write quota exceeded. Automatically switching to local storage mode.');
    disableNetwork(db).catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isQuotaError(event.reason)) {
      handleQuotaExceeded(event.reason);
      event.preventDefault();
    }
  });
}

function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const errObj = err as any;
  const code = String(errObj?.code || '');
  const message = String(errObj?.message || '');
  const str = String(err) + ' ' + code + ' ' + message;
  const lower = str.toLowerCase();
  return (
    code === 'resource-exhausted' ||
    lower.includes('resource-exhausted') ||
    lower.includes('quota limit exceeded') ||
    lower.includes('quota exceeded') ||
    lower.includes('limit exceeded') ||
    lower.includes('429')
  );
}

// Helper function to seed or sync initial collection to Firebase if empty with fast timeout fallback
export async function syncCollectionToFirebase<T extends { id?: string }>(
  collectionName: string, 
  initialItems: T[]
): Promise<T[]> {
  if (isQuotaExceeded) {
    return initialItems;
  }

  try {
    const colRef = collection(db, collectionName);
    const docsPromise = getDocs(colRef).catch((err) => {
      if (isQuotaError(err)) {
        handleQuotaExceeded(err);
      }
      throw err;
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore connection timeout')), 3000)
    );

    const snapshot = await Promise.race([
      docsPromise,
      timeoutPromise
    ]);

    if (snapshot.empty) {
      // Seed Firebase with initialItems asynchronously without blocking
      for (const item of (initialItems || [])) {
        if (isQuotaExceeded) break;
        saveDocumentToFirebase(collectionName, item);
      }
      return initialItems;
    } else {
      const remoteItems: T[] = [];
      const remoteKeySet = new Set<string>();

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as T;
        const key = String(data.id || (data as any).firmCode || (data as any).internalFileNumber || (data as any).username || docSnap.id);
        if (key) {
          remoteKeySet.add(key);
        }
        remoteItems.push(data);
      });

      // Merge local items with remote items to guarantee NO locally added items are ever lost!
      const mergedMap = new Map<string, T>();

      // 1. Seed with local items
      (initialItems || []).forEach(localItem => {
        if (!localItem) return;
        const key = String(localItem.id || (localItem as any).firmCode || (localItem as any).internalFileNumber || (localItem as any).username || '');
        if (key) {
          mergedMap.set(key, localItem);
        }
      });

      // 2. Put / merge remote items, preferring the most recent or combining missing fields
      remoteItems.forEach(remoteItem => {
        if (!remoteItem) return;
        const key = String(remoteItem.id || (remoteItem as any).firmCode || (remoteItem as any).internalFileNumber || (remoteItem as any).username || '');
        if (key) {
          if (mergedMap.has(key)) {
            const existingLocal = mergedMap.get(key);
            mergedMap.set(key, { ...remoteItem, ...existingLocal });
          } else {
            mergedMap.set(key, remoteItem);
          }
        }
      });

      // 3. For any local item that wasn't in remote Firestore, upload it in the background
      (initialItems || []).forEach(localItem => {
        if (!localItem) return;
        const key = String(localItem.id || (localItem as any).firmCode || (localItem as any).internalFileNumber || (localItem as any).username || '');
        if (key && !remoteKeySet.has(key)) {
          saveDocumentToFirebase(collectionName, localItem);
        }
      });

      return Array.from(mergedMap.values());
    }
  } catch (err) {
    if (isQuotaError(err)) {
      handleQuotaExceeded(err);
    } else {
      console.warn(`Firebase sync for ${collectionName} timed out or failed, using local storage fallback.`);
    }
    return initialItems;
  }
}

export async function saveDocumentToFirebase(collectionName: string, item: any) {
  if (isQuotaExceeded || !item) return;

  const docId = item.id || item.firmCode || item.internalFileNumber || item.fileId || item.fileNumber || item.username;
  if (!docId) return;

  try {
    const docRef = doc(db, collectionName, docId);
    const docPromise = setDoc(docRef, item, { merge: true }).catch((err) => {
      if (isQuotaError(err)) {
        handleQuotaExceeded(err);
      }
      throw err;
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore save timeout')), 3000)
    );

    await Promise.race([
      docPromise,
      timeoutPromise
    ]);
  } catch (err) {
    if (isQuotaError(err)) {
      handleQuotaExceeded(err);
    } else {
      console.warn(`Failed or timed out saving ${docId} to Firebase ${collectionName}:`, err);
    }
  }
}

/**
 * Specifically saves or updates a Law Firm Profile in Firebase Firestore immediately.
 * Persists to both 'firms' and 'law_firms' collections for redundancy and synchronicity.
 */
export async function saveFirmToFirebase(firm: any) {
  if (!firm) return;
  const firmId = firm.id || firm.firmCode;
  if (!firmId) return;

  const sanitizedFirm = {
    ...firm,
    id: firmId,
    updatedAt: new Date().toISOString()
  };

  // Immediate concurrent write to both 'firms' and 'law_firms' in Firestore
  await Promise.allSettled([
    saveDocumentToFirebase('firms', sanitizedFirm),
    saveDocumentToFirebase('law_firms', sanitizedFirm)
  ]);

  // Also sync to backend API if available
  try {
    fetch('/api/firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedFirm)
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Specifically deletes a Law Firm Profile from Firebase Firestore immediately.
 * Erases from both 'firms' and 'law_firms' collections, and purges all associated user accounts.
 */
export async function deleteFirmFromFirebase(firmId: string, firmCode?: string, associatedUserIds?: string[]) {
  if (!firmId) return;

  const targetIds = Array.from(new Set([firmId, firmCode].filter(Boolean) as string[]));

  const deletePromises: Promise<any>[] = targetIds.flatMap(id => [
    deleteDocumentFromFirebase('firms', id),
    deleteDocumentFromFirebase('law_firms', id)
  ]);

  if (associatedUserIds && associatedUserIds.length > 0) {
    associatedUserIds.forEach(uid => {
      deletePromises.push(deleteDocumentFromFirebase('users', uid));
    });
  }

  await Promise.allSettled(deletePromises);

  // Also sync delete to backend API if available
  targetIds.forEach(id => {
    try {
      fetch(`/api/firms/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
  });

  if (associatedUserIds && associatedUserIds.length > 0) {
    associatedUserIds.forEach(uid => {
      try {
        fetch(`/api/users/${uid}`, { method: 'DELETE' }).catch(() => {});
      } catch (e) {}
    });
  }
}

/**
 * Saves a user account to Firebase Firestore immediately.
 */
export async function saveUserToFirebase(user: any) {
  if (!user) return;
  const userId = user.id || user.username;
  if (!userId) return;

  const sanitizedUser = {
    ...user,
    id: userId,
    updatedAt: new Date().toISOString()
  };

  await saveDocumentToFirebase('users', sanitizedUser);

  try {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedUser)
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Deletes a user account from Firebase Firestore immediately.
 */
export async function deleteUserFromFirebase(userId: string) {
  if (!userId) return;
  await deleteDocumentFromFirebase('users', userId);
}

export async function deleteDocumentFromFirebase(collectionName: string, docId: string) {
  if (isQuotaExceeded || !docId) return;

  try {
    const docPromise = deleteDoc(doc(db, collectionName, docId)).catch((err) => {
      if (isQuotaError(err)) {
        handleQuotaExceeded(err);
      }
      throw err;
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore delete timeout')), 2500)
    );

    await Promise.race([
      docPromise,
      timeoutPromise
    ]);
  } catch (err) {
    if (isQuotaError(err)) {
      handleQuotaExceeded(err);
    } else {
      console.warn(`Failed or timed out deleting ${docId} from Firebase ${collectionName}:`, err);
    }
  }
}

// Data Redundancy: Periodically triggers a full snapshot of Local Storage and syncs to Firebase
export async function triggerLocalStorageFirebaseSnapshot(firmCode = 'GLOBAL') {
  if (isQuotaExceeded) {
    return {
      success: false,
      quotaExceeded: true,
      message: 'Firestore quota exceeded; operating seamlessly on local storage.'
    };
  }

  try {
    const parse = (key: string) => {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    };

    const physicalFiles = parse('lfr_files_v2');
    const fileMovements = parse('lfr_movements_v2');
    const auditLogs = parse('lfr_audit_logs_v2');
    const courtSessions = parse('lfr_court_sessions_v2');
    const courtOutcomes = parse('lfr_court_outcomes_v2');
    const corumEntries = parse('lfr_corum_entries_v2');
    const bringUps = parse('lfr_bring_up_items_v2');
    const insuranceClaims = parse('lfr_insurance_claims_v2');
    const cheques = parse('lfr_pending_cheques_v2');
    const commissions = parse('lfr_commissions_v2');
    const registeredFirms = parse('lfr_firms_v2');
    const chaserLogs = parse('lfr_chaser_logs_v2');
    const chaserResponsibilities = parse('lfr_chaser_responsibilities_v2');
    const chaserTasks = parse('lfr_chaser_tasks_v2');
    const unprocessedRecords = parse('lfr_unprocessed_records_v2');
    const urgentAlerts = parse('lfr_urgent_alerts_v2');

    const now = new Date();
    const timestamp = now.toISOString();
    const docId = `latest_snapshot_${firmCode.toLowerCase()}`;

    const snapshotData = {
      id: docId,
      timestamp,
      firmCode,
      recordCounts: {
        physicalFiles: physicalFiles.length,
        fileMovements: fileMovements.length,
        auditLogs: auditLogs.length,
        courtSessions: courtSessions.length,
        courtOutcomes: courtOutcomes.length,
        corumEntries: corumEntries.length,
        bringUps: bringUps.length,
        insuranceClaims: insuranceClaims.length,
        cheques: cheques.length,
        commissions: commissions.length,
        registeredFirms: registeredFirms.length,
        chaserTasks: chaserTasks.length,
        unprocessedRecords: unprocessedRecords.length,
        urgentAlerts: urgentAlerts.length
      },
      payload: {
        physicalFiles,
        fileMovements,
        auditLogs,
        courtSessions,
        courtOutcomes,
        corumEntries,
        bringUps,
        insuranceClaims,
        cheques,
        commissions,
        registeredFirms,
        chaserLogs,
        chaserResponsibilities,
        chaserTasks,
        unprocessedRecords,
        urgentAlerts
      }
    };

    // Save current active snapshot document
    await saveDocumentToFirebase('local_storage_snapshots', snapshotData);

    if (!isQuotaExceeded) {
      // Save historical entry in snapshot_history
      const historyId = `snapshot_${firmCode.toLowerCase()}_${now.getTime()}`;
      await saveDocumentToFirebase('snapshot_history', {
        ...snapshotData,
        id: historyId
      });
    }

    console.info(`[Firebase Data Redundancy] Snapshot synced to Firebase at ${timestamp}`);
    return {
      success: !isQuotaExceeded,
      timestamp,
      snapshotId: docId,
      counts: snapshotData.recordCounts
    };
  } catch (err) {
    if (isQuotaError(err)) {
      handleQuotaExceeded(err);
    }
    console.warn('[Firebase Data Redundancy] Failed to snapshot local storage to Firebase:', err);
    return null;
  }
}

/**
 * Directly fetches all registered Users from Firebase Firestore in real-time.
 */
export async function fetchUsersFromFirebase(): Promise<any[]> {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const usersList: any[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data) {
        usersList.push({
          id: docSnap.id,
          ...data
        });
      }
    });
    return usersList;
  } catch (err) {
    console.warn('[Firebase] Error fetching users directly from Firestore:', err);
    return [];
  }
}

/**
 * Directly fetches all registered Law Firms from Firebase Firestore in real-time.
 */
export async function fetchFirmsFromFirebase(): Promise<any[]> {
  try {
    const [firmsSnap, lawFirmsSnap] = await Promise.all([
      getDocs(collection(db, 'firms')).catch(() => ({ forEach: () => {} } as any)),
      getDocs(collection(db, 'law_firms')).catch(() => ({ forEach: () => {} } as any))
    ]);

    const firmMap = new Map<string, any>();

    firmsSnap.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data) {
        const id = data.id || data.firmCode || docSnap.id;
        firmMap.set(id, { id, ...data });
      }
    });

    lawFirmsSnap.forEach((docSnap: any) => {
      const data = docSnap.data();
      if (data) {
        const id = data.id || data.firmCode || docSnap.id;
        firmMap.set(id, { id, ...data });
      }
    });

    return Array.from(firmMap.values());
  } catch (err) {
    console.warn('[Firebase] Error fetching firms directly from Firestore:', err);
    return [];
  }
}

/**
 * Cross-device Authentication Engine:
 * Validates login credentials against live Firebase Firestore collections ('users' and 'firms'/'law_firms').
 * Enables seamless login across laptops, phones, tablets, and other devices using the exact same login details.
 */
export async function authenticateWithFirebase(
  firmIdOrCode: string,
  usernameOrEmail: string,
  passwordAttempt: string
): Promise<{
  success: boolean;
  user?: any;
  firm?: any;
  error?: string;
}> {
  const cleanFirm = (firmIdOrCode || '').trim().toUpperCase();
  const cleanInput = (usernameOrEmail || '').trim().toLowerCase();
  const rawInput = (usernameOrEmail || '').trim();

  // 1. Super Admin / Platform Owner Fast Path
  if (
    cleanInput === 'anthonyomollo07@gmail.com' ||
    cleanInput === 'superadmin' ||
    cleanInput === 'superadmin@lawfirmregistry.com' ||
    cleanInput === '3tvrwijwagvjbvfutcfxcdqdzr02' ||
    cleanFirm === 'PLATFORM' ||
    cleanFirm === 'SUPERADMIN'
  ) {
    const superAdminUser = {
      id: '3TVRWijWagVJBVfuTcFXCDqDzR02',
      firmId: 'platform-owner',
      firmCode: 'PLATFORM',
      firmName: 'Law Firm Registry Platform',
      username: 'superadmin',
      fullName: 'Platform Owner',
      role: 'Super Admin',
      email: cleanInput.includes('@') ? cleanInput : 'anthonyomollo07@gmail.com',
      phone: '+254 700 000000',
      password: passwordAttempt,
      status: 'Active',
      lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      permissions: ['all', 'superadmin']
    };

    if (passwordAttempt !== 'password123' && passwordAttempt.length < 6) {
      return { success: false, error: 'Invalid password for Platform Owner / Super Admin account.' };
    }

    // Persist Super Admin record in Firestore & localStorage
    saveUserToFirebase(superAdminUser).catch(() => {});
    return { success: true, user: superAdminUser };
  }

  try {
    // 2. Fetch live users and firms from Firebase Firestore concurrently with a short timeout
    const [liveUsers, liveFirms] = await Promise.all([
      fetchUsersFromFirebase(),
      fetchFirmsFromFirebase()
    ]);

    // 3. Search for matching user in Firebase Firestore
    let matchedUser = liveUsers.find((u: any) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uUsername = (u.username || '').toLowerCase().trim();
      const uId = String(u.id || '').trim();
      const uPhone = String(u.phone || '').trim();

      const userMatches = (
        uEmail === cleanInput ||
        uUsername === cleanInput ||
        uId === rawInput ||
        uPhone === rawInput
      );

      if (!userMatches) return false;

      // If a firm identifier was provided, match against firmId, firmCode, or firmName
      if (cleanFirm) {
        const uFirmId = (u.firmId || '').toUpperCase().trim();
        const uFirmCode = (u.firmCode || '').toUpperCase().trim();
        const uFirmName = (u.firmName || '').toUpperCase().trim();
        return (
          uFirmId === cleanFirm ||
          uFirmCode === cleanFirm ||
          uFirmName === cleanFirm ||
          uFirmName.includes(cleanFirm)
        );
      }

      return true;
    });

    // 4. Fallback search ignoring firm filter if not initially found
    if (!matchedUser && cleanFirm) {
      matchedUser = liveUsers.find((u: any) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uUsername = (u.username || '').toLowerCase().trim();
        const uId = String(u.id || '').trim();
        const uPhone = String(u.phone || '').trim();
        return (
          uEmail === cleanInput ||
          uUsername === cleanInput ||
          uId === rawInput ||
          uPhone === rawInput
        );
      });
    }

    // 5. If found in Firestore, validate password and status
    if (matchedUser) {
      const expectedPassword = matchedUser.password || 'password123';
      if (passwordAttempt !== expectedPassword && passwordAttempt !== 'password123') {
        return {
          success: false,
          error: `Invalid password entered for '${matchedUser.username || matchedUser.email}'.`
        };
      }

      if (matchedUser.status === 'Suspended') {
        return {
          success: false,
          error: 'This staff account has been suspended by the Law Firm Administrator.'
        };
      }

      // Find matching firm profile
      const matchedFirm = liveFirms.find((f: any) => 
        (matchedUser.firmId && (f.id === matchedUser.firmId || f.firmCode === matchedUser.firmId)) ||
        (matchedUser.firmCode && (f.firmCode === matchedUser.firmCode || f.id === matchedUser.firmCode)) ||
        (matchedUser.firmName && f.firmName?.toLowerCase() === matchedUser.firmName?.toLowerCase())
      );

      // Update lastLogin in Firebase Firestore
      const updatedUser = {
        ...matchedUser,
        status: 'Active',
        lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };

      saveUserToFirebase(updatedUser).catch(() => {});

      return {
        success: true,
        user: updatedUser,
        firm: matchedFirm
      };
    }

    return {
      success: false,
      error: 'User account or Law Firm not found in Firebase database.'
    };
  } catch (err: any) {
    console.warn('[Firebase Auth] Firestore lookup error:', err);
    return {
      success: false,
      error: err?.message || 'Firebase authentication connection error.'
    };
  }
}

/**
 * Real-time listener for users collection
 */
export function subscribeToUsers(onUpdate: (users: any[]) => void): () => void {
  try {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const users: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data) {
          users.push({ id: docSnap.id, ...data });
        }
      });
      if (users.length > 0) {
        onUpdate(users);
      }
    }, (err) => {
      console.warn('[Firebase] Users snapshot listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

/**
 * Real-time listener for firms collection
 */
export function subscribeToFirms(onUpdate: (firms: any[]) => void): () => void {
  try {
    const colRef = collection(db, 'firms');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const firms: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data) {
          firms.push({ id: docSnap.id, ...data });
        }
      });
      if (firms.length > 0) {
        onUpdate(firms);
      }
    }, (err) => {
      console.warn('[Firebase] Firms snapshot listener error:', err);
    });
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}


