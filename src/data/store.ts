import {
  User,
  RegistryFile,
  FileMovement,
  CourtSession,
  CourtOutcome,
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
  UrgentAlert
} from '../types';

import {
  INITIAL_FIRMS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_FILES,
  INITIAL_MOVEMENTS,
  INITIAL_COURT_SESSIONS,
  INITIAL_COURT_OUTCOMES,
  INITIAL_BRING_UP_ITEMS,
  INITIAL_INSURANCE_CLAIMS,
  INITIAL_PENDING_CHEQUES,
  INITIAL_COMMISSIONS,
  INITIAL_AUDIT_LOGS
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
  URGENT_ALERTS: 'lfr_urgent_alerts_v2'
};



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

export function getStoredFirms(): LawFirmProfile[] {
  return loadItem(STORAGE_KEYS.FIRMS, INITIAL_FIRMS);
}

export function saveFirms(firms: LawFirmProfile[]): void {
  saveItem(STORAGE_KEYS.FIRMS, firms);
}

export function getStoredSettings(): SystemSettings {
  return loadItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
}

export function saveSettings(settings: SystemSettings): void {
  saveItem(STORAGE_KEYS.SETTINGS, settings);
}

export function getStoredUsers(): User[] {
  const stored = loadItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  if (!Array.isArray(stored) || stored.length === 0) {
    saveUsers(INITIAL_USERS);
    return INITIAL_USERS;
  }
  // Ensure Super Admin exists
  const storedIds = new Set(stored.map(u => u.id));
  const missingFromInitial = INITIAL_USERS.filter(u => !storedIds.has(u.id));
  if (missingFromInitial.length > 0) {
    const merged = [...stored, ...missingFromInitial];
    saveUsers(merged);
    return merged;
  }
  return stored;
}

export function saveUsers(users: User[]): void {
  saveItem(STORAGE_KEYS.USERS, users);
}

export function getStoredFiles(): RegistryFile[] {
  return loadItem<RegistryFile[]>(STORAGE_KEYS.FILES, []);
}

export function saveFiles(files: RegistryFile[]): void {
  saveItem(STORAGE_KEYS.FILES, files);
}

export function getStoredMovements(): FileMovement[] {
  return loadItem(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
}

export function saveMovements(movements: FileMovement[]): void {
  saveItem(STORAGE_KEYS.MOVEMENTS, movements);
}

export function getStoredCourtSessions(): CourtSession[] {
  return loadItem(STORAGE_KEYS.COURT_SESSIONS, INITIAL_COURT_SESSIONS);
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
  return loadItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
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

export function getCurrentUser(): User | null {
  return loadItem(STORAGE_KEYS.CURRENT_USER, null);
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

