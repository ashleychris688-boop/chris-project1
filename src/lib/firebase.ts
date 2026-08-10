import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, disableNetwork } from 'firebase/firestore';
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

let isQuotaExceeded = typeof window !== 'undefined' && localStorage.getItem('lfr_firestore_quota_exceeded') === 'true';

if (isQuotaExceeded) {
  disableNetwork(db).catch(() => {});
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
export async function syncCollectionToFirebase<T extends { id: string }>(
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
      setTimeout(() => reject(new Error('Firestore connection timeout')), 2500)
    );

    const snapshot = await Promise.race([
      docsPromise,
      timeoutPromise
    ]);

    if (snapshot.empty) {
      // Seed Firebase with initialItems asynchronously without blocking
      for (const item of initialItems) {
        if (isQuotaExceeded) break;
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
    if (isQuotaError(err)) {
      handleQuotaExceeded(err);
    } else {
      console.warn(`Firebase sync for ${collectionName} timed out or failed, using local storage fallback.`);
    }
    return initialItems;
  }
}

export async function saveDocumentToFirebase<T extends { id: string }>(collectionName: string, item: T) {
  if (isQuotaExceeded) return;

  try {
    const docPromise = setDoc(doc(db, collectionName, item.id), item).catch((err) => {
      if (isQuotaError(err)) {
        handleQuotaExceeded(err);
      }
      throw err;
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firestore save timeout')), 2500)
    );

    await Promise.race([
      docPromise,
      timeoutPromise
    ]);
  } catch (err) {
    if (isQuotaError(err)) {
      handleQuotaExceeded(err);
    } else {
      console.warn(`Failed or timed out saving ${item.id} to Firebase ${collectionName}:`, err);
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

    const physicalFiles = parse('lfr_physical_files_v1');
    const fileMovements = parse('lfr_file_movements_v1');
    const auditLogs = parse('lfr_audit_logs_v1');
    const courtSessions = parse('lfr_court_sessions_v1');
    const courtOutcomes = parse('lfr_court_outcomes_v1');
    const bringUps = parse('lfr_bring_ups_v1');
    const insuranceClaims = parse('lfr_insurance_claims_v1');
    const cheques = parse('lfr_cheques_v1');
    const registeredFirms = parse('lfr_registered_firms_v1');
    const chaserLogs = parse('lfr_chaser_logs_v1');
    const chaserResponsibilities = parse('lfr_chaser_responsibilities_v1');
    const chaserTasks = parse('lfr_chaser_tasks_v1');
    const unprocessedRecords = parse('lfr_unprocessed_records_v1');
    const urgentAlerts = parse('lfr_urgent_alerts_v1');

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
        bringUps: bringUps.length,
        insuranceClaims: insuranceClaims.length,
        cheques: cheques.length,
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
        bringUps,
        insuranceClaims,
        cheques,
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

