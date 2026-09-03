import {
  User,
  RegistryFile,
  FileMovement,
  CourtSession,
  CourtOutcome,
  CorumEntry,
  BringUpItem,
  InsuranceClaim,
  PendingCheque,
  CommissionRecord,
  AuditLogEntry,
  SystemSettings,
  LawFirmProfile,
  CaseChaserProfile,
  ChaserFollowUpLog,
  ChaserFileResponsibility,
  ChaserTask,
  UnprocessedClientRecord,
  UrgentAlert,
  FileDocumentAttachment
} from '../types';

import {
  INITIAL_FIRMS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_FILES,
  INITIAL_MOVEMENTS,
  INITIAL_COURT_SESSIONS,
  INITIAL_COURT_OUTCOMES,
  INITIAL_CORUM_ENTRIES,
  INITIAL_BRING_UP_ITEMS,
  INITIAL_INSURANCE_CLAIMS,
  INITIAL_PENDING_CHEQUES,
  INITIAL_COMMISSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FILE_DOCUMENTS
} from './initialData';

import {
  INITIAL_CASE_CHASERS,
  INITIAL_FOLLOW_UP_LOGS,
  INITIAL_FILE_RESPONSIBILITIES,
  INITIAL_TASKS,
  INITIAL_UNPROCESSED_RECORDS
} from './chaserData';

import {
  saveDocumentToFirebase,
  syncCollectionToFirebase
} from '../lib/firebase';

const STORAGE_KEYS = {
  FIRMS: 'lfr_firms_v2',
  SETTINGS: 'lfr_settings_v2',
  USERS: 'lfr_users_v2',
  FILES: 'lfr_files_v2',
  MOVEMENTS: 'lfr_movements_v2',
  COURT_SESSIONS: 'lfr_court_sessions_v2',
  COURT_OUTCOMES: 'lfr_court_outcomes_v2',
  CORUM_ENTRIES: 'lfr_corum_entries_v2',
  BRING_UP_ITEMS: 'lfr_bring_up_items_v2',
  INSURANCE_CLAIMS: 'lfr_insurance_claims_v2',
  CHEQUES: 'lfr_pending_cheques_v2',
  COMMISSIONS: 'lfr_commissions_v2',
  AUDIT_LOGS: 'lfr_audit_logs_v2',
  CURRENT_USER: 'lfr_current_user_v2',
  IS_AUTHENTICATED: 'lfr_is_auth_v2',
  CHASERS: 'lfr_case_chasers_v2',
  FOLLOW_UP_LOGS: 'lfr_chaser_logs_v2',
  RESPONSIBILITIES: 'lfr_chaser_responsibilities_v2',
  TASKS: 'lfr_chaser_tasks_v2',
  UNPROCESSED: 'lfr_unprocessed_records_v2',
  URGENT_ALERTS: 'lfr_urgent_alerts_v2',
  FILE_DOCUMENTS: 'lfr_file_documents_v2',
  DELETED_FIRMS: 'lfr_deleted_firms_v2',
  DELETED_FILES: 'lfr_deleted_files_v2',
  DEMO_FILES_PURGED: 'lfr_demo_files_purged_v1',
  LAST_ACTIVE_TIME: 'lfr_last_active_time_v2',
  CURRENT_TAB: 'lfr_current_tab_v2',
  VIEW_STATE: 'lfr_view_state_v2'
};

export const DEMO_CLIENT_NAMES = new Set([
  'apex hauliers kenya ltd',
  'dr. beatrice wanjiru',
  'bahari logistics ltd',
  'john kiprono',
  'eldo farmers co-op union',
  'rift valley flour mills ltd',
  'hezron kamau',
  'safaricom plc',
  'kenya commercial bank ltd',
  'crown paints kenya ltd',
  'east african breweries plc',
  'equity bank kenya ltd',
  'bamburi cement plc',
  'naivas supermarkets ltd',
  'kakuzi plc',
  'unga group ltd',
  'kenolkobil kenya ltd',
  'nation media group plc',
  'centum investment co.',
  'sameer africa plc',
  'kcb group ltd',
  'kenya airways plc',
  'car & general kenya ltd',
  'express kenya ltd',
  'tps eastern africa ltd',
  'totalenergies marketing kenya',
  'mumias sugar company ltd',
  'eveready east africa plc',
  'williamson tea kenya plc',
  'kapchorua tea plc',
  'standard group plc',
  'james mwangi maina',
  'grace wanjiru njoroge',
  'estate of david ochieng odhiambo',
  'faith chebet korir',
  'samuel kamau ndegwa',
  'kenya power & lighting co. (kplc)',
  'cooperative bank of kenya ltd',
  'kenya revenue authority (kra)',
  'kengen plc',
  'ncba bank kenya plc',
  'stanbic bank kenya ltd',
  'kakamega county government',
  'nakuru tea estates ltd',
  'hassan abdi mohammed',
  'meru farmers co-operative union',
  'patrick muturi kimani',
  'coast bus company ltd',
  'beatrice achieng otieno',
  'kericho tea packers ltd',
  'mount kenya bottlers ltd',
  'machakos water & sanitation co.',
  'diamond trust bank kenya',
  'family bank kenya ltd',
  'josephat kiprop cheruiyot',
  'agnes wambui kinyanjui',
  'estate of samuel omwamba nyamweya',
  'garissa livestock farmers sacco',
  'trans nzoia produce board',
  'emmanuel wafula simiyu',
  'lucy nyambura mwangi'
]);

export function isDemoFile(file: Partial<RegistryFile>): boolean {
  if (!file) return false;
  if ((file as any).isDemo) return true;
  const id = String(file.id || '').trim();
  const num = String(file.internalFileNumber || '').trim().toUpperCase();
  const client = String(file.clientName || '').trim().toLowerCase();

  if (/^f-1[0-6]\d$/.test(id)) return true;
  if (id === 'f-1785344239668' || num === 'LFR/2026/0449') return true;
  if (/^LFR\/2026\/0(142|119|204|088|310|045|449)$/.test(num)) return true;
  if (/^NGA\/1[0-6]\d\/2026$/.test(num)) return true;
  if (DEMO_CLIENT_NAMES.has(client)) return true;
  return false;
}

export function getStoredDeletedFiles(): string[] {
  return loadItem<string[]>(STORAGE_KEYS.DELETED_FILES, []);
}

export function saveDeletedFileId(fileIdOrNumber: string): void {
  const clean = String(fileIdOrNumber || '').trim().toLowerCase();
  if (!clean) return;
  const current = getStoredDeletedFiles();
  if (!current.includes(clean)) {
    saveItem(STORAGE_KEYS.DELETED_FILES, [...current, clean]);
  }
}

export function saveDeletedFileIds(ids: string[]): void {
  const current = new Set(getStoredDeletedFiles());
  ids.forEach(id => {
    const c = String(id || '').trim().toLowerCase();
    if (c) current.add(c);
  });
  saveItem(STORAGE_KEYS.DELETED_FILES, Array.from(current));
}

export function removeDeletedFileId(fileIdOrNumber: string): void {
  const clean = String(fileIdOrNumber || '').trim().toLowerCase();
  if (!clean) return;
  const current = getStoredDeletedFiles();
  const filtered = current.filter(d => d.toLowerCase() !== clean);
  saveItem(STORAGE_KEYS.DELETED_FILES, filtered);
}

export function isFileDeleted(fileId?: string, fileNumber?: string): boolean {
  if (!fileId && !fileNumber) return false;
  const deleted = getStoredDeletedFiles();
  if (!Array.isArray(deleted) || deleted.length === 0) return false;
  const id = String(fileId || '').trim().toLowerCase();
  const num = String(fileNumber || '').trim().toLowerCase();
  return deleted.some(d => (id && d === id) || (num && d === num));
}

export interface DeletedFirmRecord {
  id: string;
  firmCode?: string;
  firmName?: string;
  deletedAt: string;
}

export function getStoredDeletedFirms(): DeletedFirmRecord[] {
  return loadItem<DeletedFirmRecord[]>(STORAGE_KEYS.DELETED_FIRMS, []);
}

export function saveDeletedFirmRecord(firmId: string, firmCode?: string, firmName?: string): void {
  const cleanId = String(firmId || '').trim();
  const cleanCode = String(firmCode || '').trim();
  const cleanName = String(firmName || '').trim();
  if (!cleanId && !cleanCode) return;

  const current = getStoredDeletedFirms();

  const exists = current.some(r => 
    (cleanId && r.id === cleanId) || 
    (cleanCode && r.firmCode === cleanCode)
  );

  if (!exists) {
    const newRecord: DeletedFirmRecord = {
      id: cleanId || cleanCode,
      firmCode: cleanCode,
      firmName: cleanName,
      deletedAt: new Date().toISOString()
    };
    saveItem(STORAGE_KEYS.DELETED_FIRMS, [newRecord, ...current]);
  }
}

export function removeDeletedFirmRecord(firmId?: string, firmCode?: string, firmName?: string): void {
  const current = getStoredDeletedFirms();
  const cleanId = (firmId || '').trim().toLowerCase();
  const cleanCode = (firmCode || '').trim().toLowerCase();
  const cleanName = (firmName || '').trim().toLowerCase();

  const filtered = current.filter(r => {
    const rId = (r.id || '').trim().toLowerCase();
    const rCode = (r.firmCode || '').trim().toLowerCase();
    const rName = (r.firmName || '').trim().toLowerCase();

    if (cleanId && (rId === cleanId || rCode === cleanId)) return false;
    if (cleanCode && (rCode === cleanCode || rId === cleanCode)) return false;
    if (cleanName && rName === cleanName) return false;
    return true;
  });

  saveItem(STORAGE_KEYS.DELETED_FIRMS, filtered);
}

export function isFirmDeleted(firmId?: string, firmCode?: string, firmName?: string): boolean {
  if (!firmId && !firmCode && !firmName) return false;

  const cleanId = (firmId || '').trim().toLowerCase();
  const cleanCode = (firmCode || '').trim().toLowerCase();

  // Platform admin is never deleted
  if (cleanId === 'platform-owner' || cleanId === 'platform' || cleanCode === 'platform') {
    return false;
  }

  const deletedList = getStoredDeletedFirms();
  if (!Array.isArray(deletedList) || deletedList.length === 0) return false;

  return deletedList.some(r => {
    const rId = (r.id || '').trim().toLowerCase();
    const rCode = (r.firmCode || '').trim().toLowerCase();

    // Strict ID / Code matching only to prevent accidental name collisions
    if (cleanId && rId && (cleanId === rId || cleanId === rCode)) return true;
    if (cleanCode && rCode && (cleanCode === rCode || cleanCode === rId)) return true;
    if (cleanId && rCode && cleanId === rCode) return true;
    if (cleanCode && rId && cleanCode === rId) return true;

    return false;
  });
}

function loadItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
}

const DEMO_USER_IDS = new Set([
  'usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 
  'usr-abc-admin', 'usr-abc-clerk'
]);
const DEMO_USERNAMES = new Set([
  'proprietor', 'adv.kamau', 'adv.otieno', 'sec.wafula', 'clerk.mutua', 'chaser.kinuthia', 'abcproprietor'
]);

export function getStoredFirms(): LawFirmProfile[] {
  const stored = loadItem<LawFirmProfile[]>(STORAGE_KEYS.FIRMS, INITIAL_FIRMS);
  const DEMO_FIRM_IDS = new Set(['firm-1', 'firm-2']);
  const cleaned = (Array.isArray(stored) ? stored : []).filter(f => 
    f &&
    !DEMO_FIRM_IDS.has(f.id) && 
    f.firmCode !== 'OM-ADV-001' && 
    f.firmCode !== 'ABC-ADV-002' &&
    !isFirmDeleted(f.id, f.firmCode)
  );
  if (Array.isArray(stored) && cleaned.length !== stored.length) {
    saveFirms(cleaned);
  }
  return cleaned;
}

export function saveFirms(firms: LawFirmProfile[]): void {
  // Ensure any active saved firms are un-marked from tombstones
  if (Array.isArray(firms)) {
    firms.forEach(f => {
      if (f && (f.id || f.firmCode)) {
        removeDeletedFirmRecord(f.id, f.firmCode, f.firmName);
      }
    });
  }
  saveItem(STORAGE_KEYS.FIRMS, firms);
}

export function getStoredSettings(): SystemSettings {
  const settings = loadItem<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  if (
    settings && (
      isFirmDeleted(settings.firmCode)
    )
  ) {
    saveSettings(INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }
  return settings;
}

export function saveSettings(settings: SystemSettings): void {
  saveItem(STORAGE_KEYS.SETTINGS, settings);
}

export function getStoredUsers(): User[] {
  const stored = loadItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const userList = Array.isArray(stored) ? stored : INITIAL_USERS;
  
  // Retain all valid user accounts without dropping them
  let cleaned = userList.filter(u => {
    if (!u) return false;
    // Retain Platform Owner / Super Admin
    if (
      u.role === 'Super Admin' || 
      u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02' || 
      u.username === 'superadmin' || 
      u.email === 'anthonyomollo07@gmail.com' ||
      u.firmId === 'platform-owner' ||
      u.firmCode === 'PLATFORM'
    ) {
      return true;
    }

    // Strip legacy hardcoded dummy demo users
    if (DEMO_USER_IDS.has(u.id) || DEMO_USERNAMES.has(u.username)) {
      return false;
    }

    // Filter out users of deleted firms using strict ID/Code check
    if (
      isFirmDeleted(u.firmId, u.firmCode)
    ) {
      return false;
    }

    return Boolean(u.id || u.username || u.email);
  });

  // Ensure Super Admin exists
  const superAdminExists = cleaned.some(u => u.role === 'Super Admin' || u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02');
  if (!superAdminExists) {
    cleaned = [...INITIAL_USERS, ...cleaned];
  }

  if (cleaned.length !== userList.length || !Array.isArray(stored)) {
    saveUsers(cleaned);
  }
  return cleaned;
}

export function saveUsers(users: User[]): void {
  saveItem(STORAGE_KEYS.USERS, users);
}

export function getStoredFiles(): RegistryFile[] {
  const stored = loadItem<RegistryFile[]>(STORAGE_KEYS.FILES, []);
  if (Array.isArray(stored) && stored.length > 0) {
    const active = stored.filter(f => 
      f && 
      !isFirmDeleted(f.firmId) && 
      !isFirmDeleted(f.firmCode) &&
      !isFileDeleted(f.id, f.internalFileNumber)
    );
    if (active.length !== stored.length) {
      saveFiles(active);
    }
    return active;
  }
  const legacy = loadItem<RegistryFile[]>('lfr_physical_files_v1', []);
  if (Array.isArray(legacy) && legacy.length > 0) {
    const active = legacy.filter(f => 
      f && 
      !isFirmDeleted(f.firmId) && 
      !isFirmDeleted(f.firmCode) &&
      !isFileDeleted(f.id, f.internalFileNumber)
    );
    saveFiles(active);
    return active;
  }
  return [];
}

export function saveFiles(files: RegistryFile[]): void {
  saveItem(STORAGE_KEYS.FILES, files);
}

export function cleanUpDemoRecords(): { deletedCount: number; remainingFiles: RegistryFile[] } {
  const storedFiles = loadItem<RegistryFile[]>(STORAGE_KEYS.FILES, []);
  const demoFiles = storedFiles.filter(isDemoFile);
  const demoIds: string[] = [];

  demoFiles.forEach(f => {
    if (f.id) demoIds.push(f.id);
    if (f.internalFileNumber) demoIds.push(f.internalFileNumber);
  });

  saveDeletedFileIds(demoIds);
  try {
    localStorage.setItem(STORAGE_KEYS.DEMO_FILES_PURGED, 'true');
  } catch (e) {}

  const remainingFiles = storedFiles.filter(f => !isDemoFile(f) && !isFileDeleted(f.id, f.internalFileNumber));
  saveFiles(remainingFiles);

  // Clean court sessions associated with demo files
  const storedSessions = loadItem<CourtSession[]>(STORAGE_KEYS.COURT_SESSIONS, []);
  const remainingSessions = storedSessions.filter(s => {
    const fId = String(s.fileId || '').toLowerCase().trim();
    const fNum = String(s.fileNumber || '').toLowerCase().trim();
    return !demoIds.some(d => {
      const cd = d.toLowerCase().trim();
      return cd === fId || cd === fNum;
    });
  });
  saveCourtSessions(remainingSessions);

  // Clean insurance claims
  const storedClaims = loadItem<InsuranceClaim[]>(STORAGE_KEYS.INSURANCE_CLAIMS, []);
  const remainingClaims = storedClaims.filter(c => {
    const fId = String(c.fileId || '').toLowerCase().trim();
    const fNum = String(c.fileNumber || '').toLowerCase().trim();
    return !demoIds.some(d => {
      const cd = d.toLowerCase().trim();
      return cd === fId || cd === fNum;
    });
  });
  saveInsuranceClaims(remainingClaims);

  // Clean cheques
  const storedCheques = loadItem<PendingCheque[]>(STORAGE_KEYS.CHEQUES, []);
  const remainingCheques = storedCheques.filter(ch => {
    const fNum = String(ch.fileNumber || '').toLowerCase().trim();
    return !demoIds.some(d => d.toLowerCase().trim() === fNum);
  });
  savePendingCheques(remainingCheques);

  // Clean commissions
  const storedCommissions = loadItem<CommissionRecord[]>(STORAGE_KEYS.COMMISSIONS, []);
  const remainingCommissions = storedCommissions.filter(co => {
    const fNum = String(co.fileNumber || '').toLowerCase().trim();
    return !demoIds.some(d => d.toLowerCase().trim() === fNum);
  });
  saveCommissions(remainingCommissions);

  // Clean tasks associated with demo files
  const storedTasks = loadItem<ChaserTask[]>(STORAGE_KEYS.TASKS, []);
  const remainingTasks = storedTasks.filter(t => {
    const fId = String(t.fileId || '').toLowerCase().trim();
    const fNum = String(t.fileNumber || '').toLowerCase().trim();
    return !demoIds.some(d => {
      const cd = d.toLowerCase().trim();
      return cd === fId || cd === fNum;
    });
  });
  saveTasks(remainingTasks);

  return { deletedCount: demoFiles.length, remainingFiles };
}

export function cleanUpDiaryAndTasks(): { removedSessions: number; removedTasks: number } {
  const storedSessions = loadItem<CourtSession[]>(STORAGE_KEYS.COURT_SESSIONS, []);
  const storedTasks = loadItem<ChaserTask[]>(STORAGE_KEYS.TASKS, []);
  const removedSessions = storedSessions.length;
  const removedTasks = storedTasks.length;

  saveCourtSessions([]);
  saveTasks([]);
  saveBringUpItems([]);
  saveCourtOutcomes([]);
  saveCorumEntries([]);

  return { removedSessions, removedTasks };
}

export function getStoredMovements(): FileMovement[] {
  return loadItem(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
}

export function saveMovements(movements: FileMovement[]): void {
  saveItem(STORAGE_KEYS.MOVEMENTS, movements);
}

export function getStoredCourtSessions(): CourtSession[] {
  const sessions = loadItem<CourtSession[]>(STORAGE_KEYS.COURT_SESSIONS, INITIAL_COURT_SESSIONS);
  const storedFiles = loadItem<RegistryFile[]>(STORAGE_KEYS.FILES, []);
  // If the physical file registry has zero files, court diary must have zero files/sessions
  if (!storedFiles || storedFiles.length === 0) {
    if (sessions.length > 0) {
      saveCourtSessions([]);
    }
    return [];
  }
  // Filter out any sessions referencing non-existent files
  const validSessions = sessions.filter(s => {
    if (!s) return false;
    const fId = String(s.fileId || '').toLowerCase().trim();
    const fNum = String(s.fileNumber || '').toLowerCase().trim();
    return storedFiles.some(f => 
      (f.id && String(f.id).toLowerCase().trim() === fId) ||
      (f.internalFileNumber && String(f.internalFileNumber).toLowerCase().trim() === fNum)
    );
  });
  if (validSessions.length !== sessions.length) {
    saveCourtSessions(validSessions);
  }
  return validSessions;
}

export function saveCourtSessions(sessions: CourtSession[]): void {
  saveItem(STORAGE_KEYS.COURT_SESSIONS, sessions);
}

export function getStoredCourtOutcomes(): CourtOutcome[] {
  return loadItem(STORAGE_KEYS.COURT_OUTCOMES, INITIAL_COURT_OUTCOMES);
}

export function saveCourtOutcomes(outcomes: CourtOutcome[]): void {
  saveItem(STORAGE_KEYS.COURT_OUTCOMES, outcomes);
}

export function getStoredCorumEntries(): CorumEntry[] {
  return loadItem(STORAGE_KEYS.CORUM_ENTRIES, INITIAL_CORUM_ENTRIES);
}

export function saveCorumEntries(entries: CorumEntry[]): void {
  saveItem(STORAGE_KEYS.CORUM_ENTRIES, entries);
}

export function getStoredBringUpItems(): BringUpItem[] {
  return loadItem(STORAGE_KEYS.BRING_UP_ITEMS, INITIAL_BRING_UP_ITEMS);
}

export function saveBringUpItems(items: BringUpItem[]): void {
  saveItem(STORAGE_KEYS.BRING_UP_ITEMS, items);
}

export function getStoredInsuranceClaims(): InsuranceClaim[] {
  return loadItem(STORAGE_KEYS.INSURANCE_CLAIMS, INITIAL_INSURANCE_CLAIMS);
}

export function saveInsuranceClaims(claims: InsuranceClaim[]): void {
  saveItem(STORAGE_KEYS.INSURANCE_CLAIMS, claims);
}

export function getStoredPendingCheques(): PendingCheque[] {
  return loadItem(STORAGE_KEYS.CHEQUES, INITIAL_PENDING_CHEQUES);
}

export function savePendingCheques(cheques: PendingCheque[]): void {
  saveItem(STORAGE_KEYS.CHEQUES, cheques);
}

export function getStoredCommissions(): CommissionRecord[] {
  return loadItem(STORAGE_KEYS.COMMISSIONS, INITIAL_COMMISSIONS);
}

export function saveCommissions(commissions: CommissionRecord[]): void {
  saveItem(STORAGE_KEYS.COMMISSIONS, commissions);
}

export function getStoredAuditLogs(): AuditLogEntry[] {
  return loadItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
}

export function addAuditLog(
  user: string,
  role: string,
  action: string,
  category: AuditLogEntry['category'],
  details: string
): AuditLogEntry {
  const currentLogs = getStoredAuditLogs();
  const now = new Date();
  const formattedTime = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
  
  const newLog: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    timestamp: formattedTime,
    user,
    role,
    action,
    category,
    details,
    ipAddress: "192.168.1.100"
  };

  const updatedLogs = [newLog, ...currentLogs];
  saveItem(STORAGE_KEYS.AUDIT_LOGS, updatedLogs);
  return newLog;
}

export function getStoredChasers(): CaseChaserProfile[] {
  return loadItem(STORAGE_KEYS.CHASERS, INITIAL_CASE_CHASERS);
}

export function saveChasers(chasers: CaseChaserProfile[]): void {
  saveItem(STORAGE_KEYS.CHASERS, chasers);
}

export function getStoredFollowUpLogs(): ChaserFollowUpLog[] {
  return loadItem(STORAGE_KEYS.FOLLOW_UP_LOGS, INITIAL_FOLLOW_UP_LOGS);
}

export function saveFollowUpLogs(logs: ChaserFollowUpLog[]): void {
  saveItem(STORAGE_KEYS.FOLLOW_UP_LOGS, logs);
}

export function getStoredResponsibilities(): ChaserFileResponsibility[] {
  return loadItem(STORAGE_KEYS.RESPONSIBILITIES, INITIAL_FILE_RESPONSIBILITIES);
}

export function saveResponsibilities(items: ChaserFileResponsibility[]): void {
  saveItem(STORAGE_KEYS.RESPONSIBILITIES, items);
}

export function getStoredTasks(): ChaserTask[] {
  const tasks = loadItem<ChaserTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  const storedFiles = loadItem<RegistryFile[]>(STORAGE_KEYS.FILES, []);
  // If the physical file registry has zero files, task management must have zero files/tasks
  if (!storedFiles || storedFiles.length === 0) {
    if (tasks.length > 0) {
      saveTasks([]);
    }
    return [];
  }
  // Filter out any tasks referencing non-existent files
  const validTasks = tasks.filter(t => {
    if (!t) return false;
    if (t.fileNumber || t.fileId) {
      const fNum = String(t.fileNumber || '').toLowerCase().trim();
      const fId = String(t.fileId || '').toLowerCase().trim();
      return storedFiles.some(f =>
        (f.id && String(f.id).toLowerCase().trim() === fId) ||
        (f.internalFileNumber && String(f.internalFileNumber).toLowerCase().trim() === fNum)
      );
    }
    return true;
  });
  if (validTasks.length !== tasks.length) {
    saveTasks(validTasks);
  }
  return validTasks;
}

export function saveTasks(tasks: ChaserTask[]): void {
  saveItem(STORAGE_KEYS.TASKS, tasks);
}

export function getStoredUnprocessedRecords(): UnprocessedClientRecord[] {
  return loadItem(STORAGE_KEYS.UNPROCESSED, INITIAL_UNPROCESSED_RECORDS);
}

export function saveUnprocessedRecords(records: UnprocessedClientRecord[]): void {
  saveItem(STORAGE_KEYS.UNPROCESSED, records);
}

export function getStoredUrgentAlerts(): UrgentAlert[] {
  return loadItem(STORAGE_KEYS.URGENT_ALERTS, []);
}

export function saveUrgentAlerts(alerts: UrgentAlert[]): void {
  saveItem(STORAGE_KEYS.URGENT_ALERTS, alerts);
}

export function getStoredFileDocuments(): FileDocumentAttachment[] {
  return loadItem(STORAGE_KEYS.FILE_DOCUMENTS, INITIAL_FILE_DOCUMENTS);
}

export function saveFileDocuments(docs: FileDocumentAttachment[]): void {
  saveItem(STORAGE_KEYS.FILE_DOCUMENTS, docs);
}

/**
 * Verifies if an object contains the minimum required user properties.
 * Checks for non-empty string ID, role, and mandatory identifier/firmCode attributes.
 */
export function isValidUserObject(user: any): user is User {
  if (!user || typeof user !== 'object' || Array.isArray(user)) return false;
  
  const id = typeof user.id === 'string' ? user.id.trim() : '';
  const role = typeof user.role === 'string' ? user.role.trim() : '';
  const username = typeof user.username === 'string' ? user.username.trim() : '';
  const email = typeof user.email === 'string' ? user.email.trim() : '';
  const firmCode = typeof user.firmCode === 'string' ? user.firmCode.trim() : '';
  const firmId = typeof user.firmId === 'string' ? user.firmId.trim() : '';

  // An object must have an ID or valid username/email, and a role
  if (!id && !username && !email) return false;
  if (!role) return false;

  // Platform admin exception (firmCode is PLATFORM or firmId is platform-owner)
  if (role === 'Super Admin' || role === 'Platform Owner' || id === '3TVRWijWagVJBVfuTcFXCDqDzR02') {
    return true;
  }

  // Mandatory fields for general users: ID, and firmCode or firmId
  return Boolean((id || username) && (firmCode || firmId));
}

/**
 * Validates and repairs an incomplete user object using matching stored users or default firm settings.
 * Prevents corrupted or partial objects from causing session failures.
 */
export function validateAndRepairUser(user: any): User | null {
  if (!user || typeof user !== 'object' || Array.isArray(user)) return null;

  const id = String(user.id || user.uid || user.username || '').trim();
  const username = String(user.username || id || '').trim();
  const email = String(user.email || '').trim();
  const role = (user.role || 'Advocate') as any;

  if (!id && !username && !email) return null;

  const isSuperAdmin = role === 'Super Admin' || role === 'Platform Owner' || id === '3TVRWijWagVJBVfuTcFXCDqDzR02';

  // Try to find matching full user in stored users
  try {
    const rawStored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawStored) {
      const storedUsers = JSON.parse(rawStored);
      if (Array.isArray(storedUsers)) {
        const found = storedUsers.find((u: any) => 
          u && ((id && u.id === id) || (username && u.username === username) || (email && u.email?.toLowerCase() === email.toLowerCase()))
        );
        if (found && found.id && (found.firmCode || isSuperAdmin)) {
          return {
            ...found,
            ...user,
            id: found.id || id,
            firmCode: found.firmCode || user.firmCode || (isSuperAdmin ? 'PLATFORM' : 'LFR-001'),
            firmId: found.firmId || user.firmId || (isSuperAdmin ? 'platform-owner' : 'firm-001'),
            role: found.role || role
          };
        }
      }
    }
  } catch (e) {}

  const defaultFirmCode = isSuperAdmin ? 'PLATFORM' : (user.firmCode || user.firmId || 'LFR-001');
  const defaultFirmId = isSuperAdmin ? 'platform-owner' : (user.firmId || user.firmCode || 'firm-001');

  const repaired: User = {
    id: id || `usr-${Date.now()}`,
    firmId: user.firmId || defaultFirmId,
    firmCode: user.firmCode || defaultFirmCode,
    firmName: user.firmName || (isSuperAdmin ? 'Platform Administration' : 'Law Firm Registry'),
    username: username || id,
    fullName: user.fullName || username || 'Authorized User',
    role: role,
    email: email || `${username || id}@registry.law`,
    phone: user.phone || '+254 700 000 000',
    status: user.status || 'Active',
    lastLogin: user.lastLogin || new Date().toISOString(),
    permissions: Array.isArray(user.permissions) ? user.permissions : []
  };

  return repaired;
}

export function getCurrentUser(): User | null {
  const user = loadItem<any>(STORAGE_KEYS.CURRENT_USER, null);
  if (!user) return null;
  const repaired = validateAndRepairUser(user);
  return repaired;
}

export function setCurrentUser(user: User | null): void {
  saveItem(STORAGE_KEYS.CURRENT_USER, user);
}

export function getIsAuthenticated(): boolean {
  return loadItem(STORAGE_KEYS.IS_AUTHENTICATED, false);
}

export function setIsAuthenticated(auth: boolean): void {
  saveItem(STORAGE_KEYS.IS_AUTHENTICATED, auth);
}

export function getLastActiveTime(): number {
  return loadItem(STORAGE_KEYS.LAST_ACTIVE_TIME, 0);
}

export function setLastActiveTime(timestamp: number = Date.now()): void {
  saveItem(STORAGE_KEYS.LAST_ACTIVE_TIME, timestamp);
}

/**
 * Evaluates whether the current user session has expired due to inactivity.
 * Includes user object verification to ensure incomplete or corrupted objects
 * do NOT falsely trigger an automatic logout sequence.
 */
export function isSessionExpired(maxInactiveMs: number = 3600000, user?: User | null): boolean {
  const targetUser = user !== undefined ? user : getCurrentUser();
  if (!targetUser) return false;

  // Validate mandatory fields (id, role, firmCode)
  if (!isValidUserObject(targetUser)) {
    // Corrupted or incomplete user object - do not trigger session expiration logout
    return false;
  }

  const lastActive = getLastActiveTime();
  if (!lastActive || typeof lastActive !== 'number' || isNaN(lastActive)) {
    return false;
  }

  const elapsed = Date.now() - lastActive;
  if (elapsed < 0) return false;

  return elapsed > maxInactiveMs;
}

export function getStoredActiveTab(): string {
  return loadItem(STORAGE_KEYS.CURRENT_TAB, 'dashboard');
}

export function saveStoredActiveTab(tab: string): void {
  saveItem(STORAGE_KEYS.CURRENT_TAB, tab);
}

export function getStoredViewState(): 'landing' | 'login' | 'app' | null {
  return loadItem(STORAGE_KEYS.VIEW_STATE, null);
}

export function saveStoredViewState(state: 'landing' | 'login' | 'app'): void {
  saveItem(STORAGE_KEYS.VIEW_STATE, state);
}

export function resetToDefaults(): void {
  saveItem(STORAGE_KEYS.FIRMS, INITIAL_FIRMS);
  saveItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  saveItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  saveItem(STORAGE_KEYS.FILES, INITIAL_FILES);
  saveItem(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  saveItem(STORAGE_KEYS.COURT_SESSIONS, INITIAL_COURT_SESSIONS);
  saveItem(STORAGE_KEYS.COURT_OUTCOMES, INITIAL_COURT_OUTCOMES);
  saveItem(STORAGE_KEYS.BRING_UP_ITEMS, INITIAL_BRING_UP_ITEMS);
  saveItem(STORAGE_KEYS.INSURANCE_CLAIMS, INITIAL_INSURANCE_CLAIMS);
  saveItem(STORAGE_KEYS.CHEQUES, INITIAL_PENDING_CHEQUES);
  saveItem(STORAGE_KEYS.COMMISSIONS, INITIAL_COMMISSIONS);
  saveItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  saveItem(STORAGE_KEYS.CHASERS, INITIAL_CASE_CHASERS);
  saveItem(STORAGE_KEYS.FOLLOW_UP_LOGS, INITIAL_FOLLOW_UP_LOGS);
  saveItem(STORAGE_KEYS.RESPONSIBILITIES, INITIAL_FILE_RESPONSIBILITIES);
  saveItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  saveItem(STORAGE_KEYS.UNPROCESSED, INITIAL_UNPROCESSED_RECORDS);
}

export function clearAllDataForProduction(): void {
  saveItem(STORAGE_KEYS.FIRMS, []);
  saveItem(STORAGE_KEYS.FILES, []);
  saveItem(STORAGE_KEYS.MOVEMENTS, []);
  saveItem(STORAGE_KEYS.COURT_SESSIONS, []);
  saveItem(STORAGE_KEYS.COURT_OUTCOMES, []);
  saveItem(STORAGE_KEYS.BRING_UP_ITEMS, []);
  saveItem(STORAGE_KEYS.INSURANCE_CLAIMS, []);
  saveItem(STORAGE_KEYS.CHEQUES, []);
  saveItem(STORAGE_KEYS.COMMISSIONS, []);
  saveItem(STORAGE_KEYS.AUDIT_LOGS, []);
  saveItem(STORAGE_KEYS.CHASERS, []);
  saveItem(STORAGE_KEYS.FOLLOW_UP_LOGS, []);
  saveItem(STORAGE_KEYS.RESPONSIBILITIES, []);
  saveItem(STORAGE_KEYS.TASKS, []);
  saveItem(STORAGE_KEYS.UNPROCESSED, []);
}

