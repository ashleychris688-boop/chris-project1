import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ToastNotification,
  ToastType
} from './types';

import {
  getStoredFirms, saveFirms,
  getStoredSettings, saveSettings,
  getStoredUsers, saveUsers,
  getStoredFiles, saveFiles,
  getStoredMovements, saveMovements,
  getStoredCourtSessions, saveCourtSessions,
  getStoredCourtOutcomes, saveCourtOutcomes,
  getStoredCorumEntries, saveCorumEntries,
  getStoredBringUpItems, saveBringUpItems,
  getStoredInsuranceClaims, saveInsuranceClaims,
  getStoredPendingCheques, savePendingCheques,
  getStoredCommissions, saveCommissions,
  getStoredAuditLogs, addAuditLog,
  getStoredChasers, saveChasers,
  getStoredFollowUpLogs, saveFollowUpLogs,
  getStoredResponsibilities, saveResponsibilities,
  getStoredTasks, saveTasks,
  getStoredUnprocessedRecords, saveUnprocessedRecords,
  getStoredUrgentAlerts, saveUrgentAlerts,
  getCurrentUser, setCurrentUser,
  getIsAuthenticated, setIsAuthenticated,
  getLastActiveTime, setLastActiveTime,
  isSessionExpired,
  getStoredActiveTab, saveStoredActiveTab,
  getStoredViewState, saveStoredViewState,
  resetToDefaults, clearAllDataForProduction
} from './data/store';

import { 
  saveDocumentToFirebase, 
  deleteDocumentFromFirebase,
  triggerLocalStorageFirebaseSnapshot, 
  saveFirmToFirebase, 
  saveUserToFirebase, 
  deleteFirmFromFirebase, 
  deleteUserFromFirebase 
} from './lib/firebase';
import { ShieldAlert } from 'lucide-react';


import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { LoginPage, SelectedRoleTab } from './components/LoginPage';
import { RegisterFirmModal } from './components/RegisterFirmModal';
import { SuperAdminModule } from './components/SuperAdminModule';
import { DashboardView } from './components/DashboardView';
import { RegistryModule } from './components/RegistryModule';
import { FileTrackerModule } from './components/FileTrackerModule';
import { CourtDiaryModule } from './components/CourtDiaryModule';
import { CourtOutcomeModule } from './components/CourtOutcomeModule';
import { BringUpModule } from './components/BringUpModule';
import { StaffModules } from './components/StaffModules';
import { InsuranceModule } from './components/InsuranceModule';
import { ChequesModule } from './components/ChequesModule';
import { ReportsModule } from './components/ReportsModule';
import { UserManagementModule } from './components/UserManagementModule';
import { SettingsModule } from './components/SettingsModule';
import { AuditLogModule } from './components/AuditLogModule';
import { CaseChaserModule } from './components/CaseChaserModule';
import { UnprocessedSourcingModule } from './components/UnprocessedSourcingModule';
import { CommissionModule } from './components/CommissionModule';
import { TaskManagementModule } from './components/TaskManagementModule';
import { ToastContainer } from './components/Toast';
import { ShortcutsModal } from './components/ShortcutsModal';
import { MobileBottomNav } from './components/MobileBottomNav';


export default function App() {
  // Navigation & Authentication state with session persistence on page refresh & 1-hour timeout
  const [currentUser, setUser] = useState<User | null>(() => {
    const user = getCurrentUser();
    const isAuth = getIsAuthenticated();
    if (user && isAuth && !isSessionExpired(3600000)) {
      return user;
    }
    return null;
  });

  const [isAuthenticated, setAuth] = useState<boolean>(() => {
    const user = getCurrentUser();
    const isAuth = getIsAuthenticated();
    return Boolean(user && isAuth && !isSessionExpired(3600000));
  });

  const [viewState, setViewState] = useState<'landing' | 'login' | 'app'>(() => {
    const user = getCurrentUser();
    const isAuth = getIsAuthenticated();
    if (user && isAuth && !isSessionExpired(3600000)) {
      return 'app';
    }
    const savedView = getStoredViewState();
    if (savedView === 'login') return 'login';
    return 'landing';
  });

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const user = getCurrentUser();
    if (user?.role === 'Super Admin') return 'super-admin';
    return getStoredActiveTab() || 'dashboard';
  });

  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  const setActiveTab = (tab: string, pushHistory: boolean = true) => {
    setActiveTabState(tab);
    saveStoredActiveTab(tab);
    if (pushHistory && typeof window !== 'undefined') {
      try {
        window.history.pushState({ tab, view: 'app' }, '', `?tab=${tab}`);
      } catch {
        // Safe fallback in restricted iframes
      }
    }
  };

  // Interactive Toast Notification System
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (
    type: ToastType, 
    title: string, 
    message?: string, 
    duration: number = 4500,
    action?: { label: string; onClick: () => void }
  ) => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration,
      action
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Application Data States
  const [firms, setFirmsState] = useState<LawFirmProfile[]>(getStoredFirms());
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [settings, setSettingsState] = useState<SystemSettings>(getStoredSettings());
  const [users, setUsersState] = useState<User[]>(getStoredUsers());
  const [files, setFilesState] = useState<RegistryFile[]>(getStoredFiles());
  const [movements, setMovementsState] = useState<FileMovement[]>(getStoredMovements());
  const [courtSessions, setCourtSessionsState] = useState<CourtSession[]>(getStoredCourtSessions());
  const [courtOutcomes, setCourtOutcomesState] = useState<CourtOutcome[]>(getStoredCourtOutcomes());
  const [corumEntries, setCorumEntriesState] = useState<CorumEntry[]>(getStoredCorumEntries());
  const [bringUpItems, setBringUpItemsState] = useState<BringUpItem[]>(getStoredBringUpItems());
  const [claims, setClaimsState] = useState<InsuranceClaim[]>(getStoredInsuranceClaims());
  const [cheques, setChequesState] = useState<PendingCheque[]>(getStoredPendingCheques());
  const [commissions, setCommissionsState] = useState<CommissionRecord[]>(getStoredCommissions());
  const [auditLogs, setAuditLogsState] = useState<AuditLogEntry[]>(getStoredAuditLogs());
  const [chasers, setChasersState] = useState<CaseChaserProfile[]>(getStoredChasers());
  const [followUpLogs, setFollowUpLogsState] = useState<ChaserFollowUpLog[]>(getStoredFollowUpLogs());
  const [responsibilities, setResponsibilitiesState] = useState<ChaserFileResponsibility[]>(getStoredResponsibilities());
  const [tasks, setTasksState] = useState<ChaserTask[]>(getStoredTasks());
  const [unprocessedRecords, setUnprocessedRecordsState] = useState<UnprocessedClientRecord[]>(getStoredUnprocessedRecords());

  // Firm Multi-Tenancy Scoping
  const currentFirmCode = (currentUser?.firmCode || settings.firmCode || 'LFR-001').trim();
  const currentFirmCodeUpper = currentFirmCode.toUpperCase();
  const isSuperAdminView = currentUser?.role === 'Super Admin' && activeTab === 'super-admin';

  const matchesFirm = (itemFirmCode?: string) => {
    if (isSuperAdminView) return true;
    const code = (itemFirmCode || 'LFR-001').trim().toUpperCase();
    return code === currentFirmCodeUpper || (!itemFirmCode && currentFirmCodeUpper === 'LFR-001');
  };

  const activeFirmFiles = useMemo(() => {
    if (isSuperAdminView) return files;
    return files.filter(f => matchesFirm(f.firmCode));
  }, [files, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmCourtSessions = useMemo(() => {
    if (isSuperAdminView) return courtSessions;
    return courtSessions.filter(s => matchesFirm(s.firmCode));
  }, [courtSessions, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmCourtOutcomes = useMemo(() => {
    if (isSuperAdminView) return courtOutcomes;
    return courtOutcomes.filter(o => matchesFirm(o.firmCode));
  }, [courtOutcomes, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmCorumEntries = useMemo(() => {
    if (isSuperAdminView) return corumEntries;
    return corumEntries.filter(c => matchesFirm(c.firmCode));
  }, [corumEntries, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmMovements = useMemo(() => {
    if (isSuperAdminView) return movements;
    return movements.filter(m => matchesFirm(m.firmCode));
  }, [movements, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmClaims = useMemo(() => {
    if (isSuperAdminView) return claims;
    return claims.filter(c => matchesFirm(c.firmCode));
  }, [claims, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmCheques = useMemo(() => {
    if (isSuperAdminView) return cheques;
    return cheques.filter(c => matchesFirm(c.firmCode));
  }, [cheques, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmCommissions = useMemo(() => {
    if (isSuperAdminView) return commissions;
    return commissions.filter(c => matchesFirm(c.firmCode));
  }, [commissions, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmBringUpItems = useMemo(() => {
    if (isSuperAdminView) return bringUpItems;
    return bringUpItems.filter(b => matchesFirm(b.firmCode));
  }, [bringUpItems, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmTasks = useMemo(() => {
    if (isSuperAdminView) return tasks;
    return tasks.filter(t => matchesFirm(t.firmCode));
  }, [tasks, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmUnprocessedRecords = useMemo(() => {
    if (isSuperAdminView) return unprocessedRecords;
    return unprocessedRecords.filter(r => matchesFirm(r.firmCode));
  }, [unprocessedRecords, currentFirmCodeUpper, isSuperAdminView]);

  const activeFirmUsers = useMemo(() => {
    if (isSuperAdminView) return users;
    return users.filter(u => {
      // Platform Owner/Super Admin should not be listed as normal firm staff
      if (u.role === 'Super Admin' || u.role === 'Platform Owner' || u.firmId === 'platform-owner') {
        return false;
      }
      // Strict match by firmId or firmCode or firmName
      const targetFirmId = currentUser?.firmId;
      const targetFirmCode = currentUser?.firmCode || settings.firmCode;
      const targetFirmName = currentUser?.firmName || settings.firmName;

      if (targetFirmId && u.firmId) {
        return u.firmId === targetFirmId;
      }
      if (targetFirmCode && u.firmCode) {
        return u.firmCode === targetFirmCode;
      }
      if (targetFirmName && u.firmName) {
        return u.firmName.toLowerCase() === targetFirmName.toLowerCase();
      }
      return false;
    });
  }, [users, currentUser?.firmId, currentUser?.firmCode, currentUser?.firmName, settings.firmCode, settings.firmName, isSuperAdminView]);

  const activeFirmProfile = useMemo(() => {
    return firms.find(f => f.firmCode === currentFirmCode || f.id === currentFirmCode) || firms[0] || null;
  }, [firms, currentFirmCode]);

  // SaaS Firm Registration Handler
  const handleRegisterFirmSuccess = (newFirm: LawFirmProfile, proprietorUser: User) => {
    const updatedFirms = [newFirm, ...firms];
    setFirmsState(updatedFirms);
    saveFirms(updatedFirms);

    const updatedUsers = [proprietorUser, ...users];
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    // Sync settings to match the new firm
    const nextSettings: SystemSettings = {
      ...settings,
      firmName: newFirm.firmName,
      firmCode: newFirm.firmCode,
      firmRegistrationNumber: newFirm.registrationNumber,
      cityOrBranch: newFirm.cityOrBranch || newFirm.county || 'Nairobi',
      address: newFirm.physicalAddress || `${newFirm.county} Legal Chambers`,
      phone: newFirm.phone,
      email: newFirm.email
    };
    setSettingsState(nextSettings);
    saveSettings(nextSettings);

    setCurrentUser(proprietorUser);
    setUser(proprietorUser);
    setIsAuthenticated(true);
    setAuth(true);
    setViewState('app');
    setActiveTab('dashboard');
    setIsRegisterModalOpen(false);

    // Persist to Firebase Firestore
    saveFirmToFirebase(newFirm).catch(err => console.warn('Background Firebase firm sync:', err));
    saveUserToFirebase(proprietorUser).catch(err => console.warn('Background Firebase user sync:', err));

    addAuditLog(
      proprietorUser.fullName,
      proprietorUser.role,
      'Registered Law Firm SaaS',
      'Settings',
      `Onboarded law firm "${newFirm.firmName}" (${newFirm.firmCode})`
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  const handleUpdateFirm = (updatedFirm: LawFirmProfile) => {
    const updatedList = firms.map(f => (f.id === updatedFirm.id || f.firmCode === updatedFirm.firmCode ? updatedFirm : f));
    setFirmsState(updatedList);
    saveFirms(updatedList);

    // Save immediately to Firebase Firestore
    saveFirmToFirebase(updatedFirm);

    // If current workspace settings match this firm, update workspace settings as well
    if (settings.firmCode === updatedFirm.firmCode || currentUser?.firmCode === updatedFirm.firmCode) {
      setSettingsState(prev => {
        const nextSettings = {
          ...prev,
          firmName: updatedFirm.firmName,
          firmCode: updatedFirm.firmCode,
          firmInitials: updatedFirm.firmInitials || updatedFirm.fileNumberPrefix || prev.firmInitials,
          fileNumberPrefix: updatedFirm.fileNumberPrefix || updatedFirm.firmInitials || prev.fileNumberPrefix,
          fileNumberFormatPattern: updatedFirm.fileNumberFormatPattern || prev.fileNumberFormatPattern,
          fileNumberPadding: updatedFirm.fileNumberPadding !== undefined ? updatedFirm.fileNumberPadding : prev.fileNumberPadding,
          fileNumberDelimiter: updatedFirm.fileNumberDelimiter || prev.fileNumberDelimiter,
          includeCaseTypeInFileNumber: updatedFirm.includeCaseTypeInFileNumber !== undefined ? updatedFirm.includeCaseTypeInFileNumber : prev.includeCaseTypeInFileNumber,
          preliminaryStartingNumber: updatedFirm.preliminaryStartingNumber !== undefined ? updatedFirm.preliminaryStartingNumber : prev.preliminaryStartingNumber,
          preliminaryNextNumber: updatedFirm.preliminaryNextNumber !== undefined ? updatedFirm.preliminaryNextNumber : prev.preliminaryNextNumber,
          preliminaryYear: updatedFirm.preliminaryYear !== undefined ? updatedFirm.preliminaryYear : prev.preliminaryYear,
          annualSequenceReset: updatedFirm.annualSequenceReset !== undefined ? updatedFirm.annualSequenceReset : prev.annualSequenceReset,
          firmRegistrationNumber: updatedFirm.registrationNumber || prev.firmRegistrationNumber,
          cityOrBranch: updatedFirm.cityOrBranch || prev.cityOrBranch
        };
        saveSettings(nextSettings);
        return nextSettings;
      });
    }

    addAuditLog(
      currentUser?.fullName || 'Platform Owner',
      currentUser?.role || 'Super Admin',
      'Updated Law Firm Profile',
      'Settings',
      `Updated details for "${updatedFirm.firmName}" (${updatedFirm.firmCode}). Immediate Firebase sync executed.`
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  // Support Mode: Super Admin Inspecting Law Firm Workspace
  const handleAccessWorkspace = (firm: LawFirmProfile) => {
    setSettingsState(prev => ({
      ...prev,
      firmName: firm.firmName,
      firmCode: firm.firmCode,
      firmRegistrationNumber: firm.registrationNumber,
      cityOrBranch: firm.cityOrBranch || firm.county || 'Nairobi'
    }));
    setActiveTab('dashboard');
    addAuditLog(
      currentUser?.fullName || 'Super Admin',
      currentUser?.role || 'Super Admin',
      'Accessed Law Firm Workspace',
      'Settings',
      `Support mode accessed workspace for "${firm.firmName}" (${firm.firmCode})`
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  // Handlers for Case Chasers Module & Unprocessed Bucket
  const handleAddUnprocessedRecord = (newRecord: UnprocessedClientRecord) => {
    const recordWithFirm = { ...newRecord, firmCode: newRecord.firmCode || currentFirmCode };
    const updated = [recordWithFirm, ...unprocessedRecords];
    setUnprocessedRecordsState(updated);
    saveUnprocessedRecords(updated);
    saveDocumentToFirebase('unprocessed_records', recordWithFirm);

    showToast(
      'success',
      'Client Intake Captured',
      `Client record for ${newRecord.clientFullName} (${newRecord.caseType}) captured into Unprocessed Bucket.`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Captured Client Intake Record', 'Registry', `Captured preliminary client info for ${newRecord.clientFullName} (${newRecord.caseType}) into Unprocessed Bucket`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateUnprocessedRecord = (updatedRecord: UnprocessedClientRecord) => {
    const updated = unprocessedRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    setUnprocessedRecordsState(updated);
    saveUnprocessedRecords(updated);
    saveDocumentToFirebase('unprocessed_records', updatedRecord);

    showToast(
      'info',
      'Client Record Updated',
      `Intake status for ${updatedRecord.clientFullName} updated to "${updatedRecord.status}".`
    );
  };

  const handleAddFollowUpLog = (newLog: ChaserFollowUpLog) => {
    const logWithFirm = { ...newLog, firmCode: newLog.firmCode || currentFirmCode };
    const updated = [logWithFirm, ...followUpLogs];
    setFollowUpLogsState(updated);
    saveFollowUpLogs(updated);
    saveDocumentToFirebase('follow_up_logs', logWithFirm);

    showToast(
      'success',
      'Follow-Up Logged',
      `Follow-up record for file ${newLog.fileNumber} saved (${newLog.outcome}).`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Logged Client Follow-Up', 'Registry', `Recorded interaction for file ${newLog.fileNumber}: "${newLog.outcome}"`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateResponsibility = (resp: ChaserFileResponsibility) => {
    const index = responsibilities.findIndex(r => r.fileId === resp.fileId || r.fileNumber === resp.fileNumber);
    let updated: ChaserFileResponsibility[];
    const respWithFirm = { ...resp, firmCode: resp.firmCode || currentFirmCode };
    if (index >= 0) {
      updated = [...responsibilities];
      updated[index] = respWithFirm;
    } else {
      updated = [respWithFirm, ...responsibilities];
    }
    setResponsibilitiesState(updated);
    saveResponsibilities(updated);
    saveDocumentToFirebase('responsibilities', respWithFirm);

    showToast(
      'info',
      'Chaser Responsibility Assigned',
      `File ${resp.fileNumber} case chaser follow-up checklist updated.`
    );
  };

  const handleAddTask = (newTask: ChaserTask) => {
    const taskWithFirm = { ...newTask, firmCode: newTask.firmCode || currentFirmCode };
    const updated = [taskWithFirm, ...tasks];
    setTasksState(updated);
    saveTasks(updated);
    saveDocumentToFirebase('tasks', taskWithFirm);

    showToast(
      'success',
      'Task Assigned',
      `Task "${newTask.taskTitle}" assigned to ${newTask.assignedToChaserName} (Due: ${newTask.dueDate}).`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Assigned Case Chaser Task', 'Registry', `Assigned task "${newTask.taskTitle}" to ${newTask.assignedToChaserName} due ${newTask.dueDate}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateTask = (updatedTask: ChaserTask) => {
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasksState(updated);
    saveTasks(updated);
    saveDocumentToFirebase('tasks', updatedTask);

    showToast(
      'info',
      'Task Updated',
      `Task "${updatedTask.taskTitle}" status changed to ${updatedTask.status}.`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Updated Task Status', 'Registry', `Updated task "${updatedTask.taskTitle}" status to ${updatedTask.status}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasksState(updated);
    saveTasks(updated);
    deleteDocumentFromFirebase('tasks', taskId);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Deleted Task', 'Registry', `Deleted task ${taskId} from system`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateChaserProfile = (updatedChaser: CaseChaserProfile) => {
    const updated = chasers.map(c => c.id === updatedChaser.id ? updatedChaser : c);
    setChasersState(updated);
    saveChasers(updated);
  };


  // Cross-module action state
  const [selectedFileToMove, setSelectedFileToMove] = useState<RegistryFile | null>(null);
  const [preselectedSessionForOutcome, setPreselectedSessionForOutcome] = useState<CourtSession | null>(null);
  const [openNewFileModalOnRegistry, setOpenNewFileModalOnRegistry] = useState(false);
  const [pendingLoginRoleTab, setPendingLoginRoleTab] = useState<SelectedRoleTab | undefined>(undefined);

  // Urgent Same-Day Alerts for Clerk, Admin & Secretary (Persisted in localStorage)
  const [urgentAlerts, setUrgentAlertsState] = useState<UrgentAlert[]>(() => getStoredUrgentAlerts());

  const saveAlerts = (updatedAlerts: UrgentAlert[]) => {
    setUrgentAlertsState(updatedAlerts);
    saveUrgentAlerts(updatedAlerts);
  };

  const handleAcknowledgeAlert = (alertId?: string) => {
    const ackedAlert = alertId ? urgentAlerts.find(a => a.id === alertId) : urgentAlerts[0];
    const updated = urgentAlerts.filter(a => a.id !== (alertId || ackedAlert?.id));
    saveAlerts(updated);

    if (currentUser && ackedAlert) {
      addAuditLog(
        currentUser.fullName,
        currentUser.role,
        'Acknowledged Same-Day Court Alert',
        'Court',
        `Acknowledged same-day court alert for File ${ackedAlert.fileNumber} scheduled at ${ackedAlert.time}`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  // Last Firebase Local Storage Snapshot Redundancy Sync Time
  const [lastSnapshotSyncTime, setLastSnapshotSyncTime] = useState<string>('');

  const performFirebaseSnapshotSync = async () => {
    if (typeof window !== 'undefined' && localStorage.getItem('lfr_firestore_quota_exceeded') === 'true') {
      return;
    }
    const firmCode = currentUser?.firmCode || 'LFR-001';
    const res = await triggerLocalStorageFirebaseSnapshot(firmCode);
    if (res && res.timestamp) {
      const formatted = new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSnapshotSyncTime(formatted);
    }
  };

  // Periodic Local Storage -> Firebase Redundancy Sync
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('lfr_firestore_quota_exceeded') === 'true') {
      return;
    }
    // Initial snapshot after 10 seconds
    const initialTimer = setTimeout(() => {
      performFirebaseSnapshotSync();
    }, 10000);

    // Periodic interval every 15 minutes (900,000 ms)
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && localStorage.getItem('lfr_firestore_quota_exceeded') === 'true') {
        clearInterval(interval);
        return;
      }
      performFirebaseSnapshotSync();
    }, 900000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [currentUser?.firmCode]);

  // 1-Hour Inactivity Auto-Logout Handler
  const handleInactivityLogout = useCallback(() => {
    if (!isAuthenticated && !currentUser) return;
    
    setIsAuthenticated(false);
    setAuth(false);
    setUser(null);
    setCurrentUser(null);
    setLastActiveTime(0);
    setViewState('login');
    saveStoredViewState('login');
    setIsShortcutsModalOpen(false);
    setIsRegisterModalOpen(false);

    showToast(
      'warning',
      'Session Expired (1-Hour Inactivity)',
      'You were inactive for more than 1 hour. For physical file security and litigation confidentiality, please log in again.',
      8000
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName, 
        currentUser.role, 
        'Auto Logout (Inactivity)', 
        'Auth', 
        'System automatically locked session after 1 hour without user interaction.'
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  }, [isAuthenticated, currentUser]);

  // Activity Tracking & 1-Hour Auto-Logout Monitor
  useEffect(() => {
    if (!isAuthenticated || viewState !== 'app') return;

    // Refresh last active timestamp on mount
    const currentTimestamp = Date.now();
    const storedLastActive = getLastActiveTime();
    
    if (storedLastActive && (currentTimestamp - storedLastActive > 3600000)) {
      handleInactivityLogout();
      return;
    }

    setLastActiveTime(currentTimestamp);

    let lastRecorded = currentTimestamp;
    const handleUserInteraction = () => {
      const now = Date.now();
      const lastActive = getLastActiveTime();
      if (lastActive && (now - lastActive > 3600000)) {
        handleInactivityLogout();
        return;
      }
      // Throttle updating storage to once every 15 seconds
      if (now - lastRecorded > 15000) {
        lastRecorded = now;
        setLastActiveTime(now);
      }
    };

    const interactionEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'focus'];
    interactionEvents.forEach(evt => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Periodic check every 30 seconds
    const intervalTimer = setInterval(() => {
      const now = Date.now();
      const lastActive = getLastActiveTime();
      if (lastActive && (now - lastActive > 3600000)) {
        handleInactivityLogout();
      }
    }, 30000);

    // Tab visibility change check
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const lastActive = getLastActiveTime();
        if (lastActive && (now - lastActive > 3600000)) {
          handleInactivityLogout();
        } else {
          setLastActiveTime(now);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      interactionEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, viewState, handleInactivityLogout]);

  // Phone Back Button & Browser History Handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial history state if not set
    if (!window.history.state) {
      try {
        window.history.replaceState({ tab: activeTab, view: viewState }, '', window.location.pathname);
      } catch {
        // Safe fallback in restricted environments
      }
    }

    const handlePopState = () => {
      // 1. If shortcuts modal is open, close it
      if (isShortcutsModalOpen) {
        setIsShortcutsModalOpen(false);
        return;
      }

      // 2. If register modal is open, close it
      if (isRegisterModalOpen) {
        setIsRegisterModalOpen(false);
        return;
      }

      // 3. If in main app view
      if (viewState === 'app') {
        if (activeTab !== 'dashboard') {
          // Phone back button directly returns to Home Dashboard panel
          setActiveTab('dashboard', false);
          showToast('info', 'Home Panel', 'Phone back returned to Home Panel.', 2000);
        } else {
          // Already on dashboard, maintain state and prevent exiting
          try {
            window.history.pushState({ tab: 'dashboard', view: 'app' }, '', '?tab=dashboard');
          } catch {
            // fallback
          }
        }
      } else if (viewState === 'login') {
        // Phone back button on login screen returns to public landing page
        setViewState('landing');
        saveStoredViewState('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewState, activeTab, isShortcutsModalOpen, isRegisterModalOpen]);

  // Laptop Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      );

      // Escape key: close shortcuts modal, close register modal, or return to dashboard
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isRegisterModalOpen) {
          setIsRegisterModalOpen(false);
          return;
        }
        if (viewState === 'app' && activeTab !== 'dashboard') {
          setActiveTab('dashboard');
          return;
        }
      }

      // '?' key (when not inside typing inputs) -> toggle shortcuts modal
      if (e.key === '?' && !isInputField) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // Alt + Key combinations for laptop shortcuts
      if (e.altKey && viewState === 'app') {
        switch (e.key.toLowerCase()) {
          case 'h': // Alt + H -> Home Panel (Dashboard)
            e.preventDefault();
            setActiveTab('dashboard');
            showToast('info', 'Home Panel (Alt+H)', 'Navigated to Home Dashboard panel.', 1800);
            break;
          case 'r': // Alt + R -> Physical Registry
            e.preventDefault();
            setActiveTab('registry');
            break;
          case 'd': // Alt + D -> Court Diary
            e.preventDefault();
            setActiveTab('court-diary');
            break;
          case 't': // Alt + T -> Tasks
            e.preventDefault();
            setActiveTab('tasks');
            break;
          case 'f': // Alt + F -> Physical File Tracker
            e.preventDefault();
            setActiveTab('file-tracker');
            break;
          case 'o': // Alt + O -> Court Outcomes
            e.preventDefault();
            setActiveTab('court-outcomes');
            break;
          case 'u': // Alt + U -> Upcoming Lists (Bring Up)
            e.preventDefault();
            setActiveTab('bring-up');
            break;
          case 'p': // Alt + P -> Pending Cheques
            e.preventDefault();
            setActiveTab('pending-cheques');
            break;
          case 'c': // Alt + C -> Case Chasers
            e.preventDefault();
            setActiveTab('case-chasers');
            break;
          case 'l': // Alt + L -> Secure Logout
            e.preventDefault();
            handleLogout();
            break;
          case 's': // Alt + S -> Global Search
          case 'k':
            e.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Search file number"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
            break;
        }
      }

      // Ctrl + K / Cmd + K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && viewState === 'app') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search file number"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, activeTab, isShortcutsModalOpen, isRegisterModalOpen]);

  // Load user on startup and sync Firebase collections
  useEffect(() => {
    // Check if user has a valid active session (< 1 hour inactivity)
    const storedUser = getCurrentUser();
    const isAuth = getIsAuthenticated();
    
    if (storedUser && isAuth) {
      if (isSessionExpired(3600000)) {
        // Session expired after 1 hour of inactivity
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUser(null);
        setAuth(false);
        setViewState('login');
        saveStoredViewState('login');
        showToast('warning', 'Session Expired', 'You were inactive for more than 1 hour. Please log in again to continue.');
      } else {
        // Active valid session - stay logged in on refresh
        setUser(storedUser);
        setAuth(true);
        setViewState('app');
        setLastActiveTime(Date.now());
      }
    }

    const loadedFiles = getStoredFiles();
    if (loadedFiles.length > 0) {
      setFilesState(loadedFiles);
    }

    // Async sync with Firebase Firestore
    import('./lib/firebase').then(({ syncCollectionToFirebase }) => {
      // 1. Files
      const activeFiles = loadedFiles.length > 0 ? loadedFiles : getStoredFiles();
      syncCollectionToFirebase('files', activeFiles).then(mergedFiles => {
        if (mergedFiles && mergedFiles.length > 0) {
          setFilesState(mergedFiles);
          saveFiles(mergedFiles);
        } else if (activeFiles.length > 0) {
          saveFiles(activeFiles);
        }
      }).catch(err => console.warn('Files sync error:', err));

      // 2. Movements
      syncCollectionToFirebase('movements', getStoredMovements()).then(merged => {
        if (merged && merged.length > 0) {
          setMovementsState(merged);
          saveMovements(merged);
        }
      }).catch(err => console.warn('Movements sync error:', err));

      // 3. Court Sessions
      syncCollectionToFirebase('court_sessions', getStoredCourtSessions()).then(merged => {
        if (merged && merged.length > 0) {
          setCourtSessionsState(merged);
          saveCourtSessions(merged);
        }
      }).catch(err => console.warn('Court sessions sync error:', err));

      // 4. Court Outcomes
      syncCollectionToFirebase('court_outcomes', getStoredCourtOutcomes()).then(merged => {
        if (merged && merged.length > 0) {
          setCourtOutcomesState(merged);
          saveCourtOutcomes(merged);
        }
      }).catch(err => console.warn('Court outcomes sync error:', err));

      // 5. Corum Entries
      syncCollectionToFirebase('corum_entries', getStoredCorumEntries()).then(merged => {
        if (merged && merged.length > 0) {
          setCorumEntriesState(merged);
          saveCorumEntries(merged);
        }
      }).catch(err => console.warn('Corum entries sync error:', err));

      // 6. Bring Up Items
      syncCollectionToFirebase('bring_up_items', getStoredBringUpItems()).then(merged => {
        if (merged && merged.length > 0) {
          setBringUpItemsState(merged);
          saveBringUpItems(merged);
        }
      }).catch(err => console.warn('Bring up sync error:', err));

      // 7. Insurance Claims
      syncCollectionToFirebase('claims', getStoredInsuranceClaims()).then(merged => {
        if (merged && merged.length > 0) {
          setClaimsState(merged);
          saveInsuranceClaims(merged);
        }
      }).catch(err => console.warn('Claims sync error:', err));

      // 8. Cheques
      syncCollectionToFirebase('cheques', getStoredPendingCheques()).then(merged => {
        if (merged && merged.length > 0) {
          setChequesState(merged);
          savePendingCheques(merged);
        }
      }).catch(err => console.warn('Cheques sync error:', err));

      // 9. Commissions
      syncCollectionToFirebase('commissions', getStoredCommissions()).then(merged => {
        if (merged && merged.length > 0) {
          setCommissionsState(merged);
          saveCommissions(merged);
        }
      }).catch(err => console.warn('Commissions sync error:', err));

      // 10. Tasks
      syncCollectionToFirebase('tasks', getStoredTasks()).then(merged => {
        if (merged && merged.length > 0) {
          setTasksState(merged);
          saveTasks(merged);
        }
      }).catch(err => console.warn('Tasks sync error:', err));

      // 11. Unprocessed Records
      syncCollectionToFirebase('unprocessed_records', getStoredUnprocessedRecords()).then(merged => {
        if (merged && merged.length > 0) {
          setUnprocessedRecordsState(merged);
          saveUnprocessedRecords(merged);
        }
      }).catch(err => console.warn('Unprocessed records sync error:', err));

      // 12. Urgent Alerts
      syncCollectionToFirebase('urgent_alerts', getStoredUrgentAlerts()).then(merged => {
        if (merged && merged.length > 0) {
          setUrgentAlertsState(merged);
          saveUrgentAlerts(merged);
        }
      }).catch(err => console.warn('Urgent alerts sync error:', err));

      // 13. Sync registered Law Firms from both 'firms' and 'law_firms' collections in Firestore
      const localFirms = getStoredFirms();
      Promise.all([
        syncCollectionToFirebase('firms', localFirms),
        syncCollectionToFirebase('law_firms', [])
      ]).then(([remoteFirms, remoteLawFirms]) => {
        const combinedFirms = [...(remoteFirms || []), ...(remoteLawFirms || [])];
        const firmMap = new Map<string, LawFirmProfile>();
        localFirms.forEach(f => {
          if (f && (f.id || f.firmCode)) firmMap.set(f.id || f.firmCode, f);
        });
        combinedFirms.forEach(f => {
          if (f && (f.id || f.firmCode)) firmMap.set(f.id || f.firmCode, f);
        });
        const mergedFirms = Array.from(firmMap.values());
        if (mergedFirms.length > 0) {
          setFirmsState(mergedFirms);
          saveFirms(mergedFirms);
        }
      }).catch(err => console.warn('Law firms sync error:', err));

      // 14. Sync Users from 'users' collection in Firestore
      const localUsers = getStoredUsers();
      syncCollectionToFirebase('users', localUsers).then(remoteUsers => {
        if (remoteUsers && remoteUsers.length > 0) {
          const userMap = new Map<string, User>();
          localUsers.forEach(u => {
            if (u && (u.id || u.username)) userMap.set(u.id || u.username, u);
          });
          remoteUsers.forEach(u => {
            if (u && (u.id || u.username)) userMap.set(u.id || u.username, u);
          });
          const mergedUsers = Array.from(userMap.values());
          setUsersState(mergedUsers);
          saveUsers(mergedUsers);
        }
      }).catch(err => console.warn('Users sync error:', err));

    }).catch(err => console.warn('Firebase sync error:', err));
  }, []);

  const handleRestoreDefaultData = () => {
    resetToDefaults();
    setFirmsState(getStoredFirms());
    setUsersState(getStoredUsers());
    const freshFiles = getStoredFiles();
    setFilesState(freshFiles);
    setCourtSessionsState(getStoredCourtSessions());
    setCourtOutcomesState(getStoredCourtOutcomes());
    setMovementsState(getStoredMovements());
    setBringUpItemsState(getStoredBringUpItems());
    setClaimsState(getStoredInsuranceClaims());
    setChequesState(getStoredPendingCheques());
    setCommissionsState(getStoredCommissions());
    setAuditLogsState(getStoredAuditLogs());
  };

  const handleClearDataForProduction = () => {
    clearAllDataForProduction();
    setFirmsState([]);
    saveFirms([]);
    
    // Retain Platform Owner user account for platform administration
    const platformUsers = users.filter(u => u.role === 'Platform Owner' || u.role === 'Super Admin' || u.firmId === 'PLATFORM');
    if (platformUsers.length > 0) {
      setUsersState(platformUsers);
      saveUsers(platformUsers);
    } else {
      setUsersState([]);
      saveUsers([]);
    }

    setFilesState([]);
    setCourtSessionsState([]);
    setCourtOutcomesState([]);
    setMovementsState([]);
    setBringUpItemsState([]);
    setClaimsState([]);
    setChequesState([]);
    setCommissionsState([]);
    setAuditLogsState([]);
  };

  const handleDeleteFirm = (firmId: string) => {
    const targetFirm = firms.find(f => f.id === firmId || f.firmCode === firmId);
    const targetCode = targetFirm?.firmCode;
    const targetId = targetFirm?.id || firmId;

    // 1. Remove the firm
    const updatedFirms = firms.filter(f => f.id !== targetId && f.firmCode !== targetId && (!targetCode || (f.id !== targetCode && f.firmCode !== targetCode)));
    setFirmsState(updatedFirms);
    saveFirms(updatedFirms);

    // 2. Remove ALL user accounts belonging to this deleted law firm
    const usersToDelete = users.filter(u => 
      (u.firmId === targetId || u.firmCode === targetId || (targetCode && (u.firmId === targetCode || u.firmCode === targetCode))) &&
      u.role !== 'Super Admin' && u.role !== 'Platform Owner' && u.id !== '3TVRWijWagVJBVfuTcFXCDqDzR02' && u.username !== 'superadmin'
    );
    const updatedUsers = users.filter(u => 
      u.role === 'Super Admin' || 
      u.role === 'Platform Owner' || 
      u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02' || 
      u.username === 'superadmin' ||
      (u.firmId !== targetId && u.firmCode !== targetId && (!targetCode || (u.firmId !== targetCode && u.firmCode !== targetCode)))
    );
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    // 3. Remove all files, court sessions, movements, etc. belonging to this firm
    const updatedFiles = files.filter(f => f.firmId !== targetId && (!targetCode || f.firmCode !== targetCode));
    setFilesState(updatedFiles);
    saveFiles(updatedFiles);

    // 4. Logout if the active session belongs to this deleted firm
    if (currentUser?.firmId === targetId || (targetCode && currentUser?.firmCode === targetCode)) {
      setUser(null);
      setAuth(false);
      setViewState('landing');
    }

    // 5. Delete firm and its user accounts from Firebase Firestore and backend API
    deleteFirmFromFirebase(targetId, targetCode, usersToDelete.map(u => u.id));

    addAuditLog(
      currentUser?.fullName || 'Platform Owner',
      'Platform Owner',
      'Delete Law Firm Workspace & Users',
      'SuperAdmin',
      `Erased law firm "${targetFirm?.firmName || targetId}" (${targetCode || targetId}) and purged all ${usersToDelete.length} associated staff user accounts.`
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    if (targetUser.role === 'Super Admin' || targetUser.role === 'Platform Owner' || targetUser.id === '3TVRWijWagVJBVfuTcFXCDqDzR02' || targetUser.username === 'superadmin') {
      alert('Global Super Admin account cannot be deleted.');
      return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    if (currentUser?.id === userId) {
      setUser(null);
      setAuth(false);
      setViewState('landing');
    }

    deleteUserFromFirebase(userId);

    addAuditLog(
      currentUser?.fullName || 'Platform Owner',
      currentUser?.role || 'Super Admin',
      'Delete User Account',
      'User',
      `Deleted user account ${targetUser.fullName} (${targetUser.username}) from ${targetUser.firmName || targetUser.firmCode || 'platform'}`
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  const handleWipeAllFirms = () => {
    setFirmsState([]);
    saveFirms([]);

    const platformUsers = users.filter(u => u.role === 'Platform Owner' || u.role === 'Super Admin' || u.firmId === 'PLATFORM');
    setUsersState(platformUsers);
    saveUsers(platformUsers);

    addAuditLog(
      currentUser?.fullName || 'Platform Owner',
      'Platform Owner',
      'Wipe Platform Law Firms',
      'SuperAdmin',
      'Erased all law firm workspaces from platform owner registry'
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  const handleUpdatePassword = (userId: string, newPassword: string) => {
    let updatedTargetUser: User | null = null;
    const updatedUsers = users.map(u => {
      if (u.id === userId || u.username === userId || u.email === userId) {
        const mod: User = { 
          ...u, 
          password: newPassword, 
          passwordLastChanged: new Date().toISOString().split('T')[0] 
        };
        updatedTargetUser = mod;
        return mod;
      }
      return u;
    });
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    if (updatedTargetUser) {
      saveUserToFirebase(updatedTargetUser);
    }

    if (currentUser && (currentUser.id === userId || currentUser.username === userId || currentUser.email === userId)) {
      const updatedCurrent = { 
        ...currentUser, 
        password: newPassword, 
        passwordLastChanged: new Date().toISOString().split('T')[0] 
      };
      setUser(updatedCurrent);
      setCurrentUser(updatedCurrent);
    }

    addAuditLog(
      currentUser?.fullName || 'User',
      currentUser?.role || 'User',
      'Changed Password',
      'Auth',
      `User updated account password successfully.`
    );
    setAuditLogsState(getStoredAuditLogs());
  };

  const mapRoleToRoleTab = (role?: string): SelectedRoleTab => {
    switch (role) {
      case 'Secretary': return 'SECRETARY';
      case 'Clerk': return 'CLERK';
      case 'Advocate': return 'ADVOCATE';
      case 'Case Chaser': return 'CHASER';
      default: return 'ADMIN';
    }
  };

  // Sync helpers
  const handleLogout = (targetRoleTab?: SelectedRoleTab) => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLastActiveTime(0);
    setAuth(false);
    setUser(null);
    setIsShortcutsModalOpen(false);
    setIsRegisterModalOpen(false);

    if (targetRoleTab) {
      setPendingLoginRoleTab(targetRoleTab);
      setViewState('login');
      saveStoredViewState('login');
    } else {
      setPendingLoginRoleTab(undefined);
      setViewState('landing');
      saveStoredViewState('landing');
    }
    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'User Logout', 'Auth', 'User logged out of session');
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUser(user);
    setIsAuthenticated(true);
    setAuth(true);
    setViewState('app');
    saveStoredViewState('app');
    setLastActiveTime(Date.now());
    
    if (user.role === 'Super Admin' || user.id === '3TVRWijWagVJBVfuTcFXCDqDzR02') {
      setActiveTab('super-admin');
    } else {
      setActiveTab('dashboard');
    }
    
    addAuditLog(user.fullName, user.role, 'User Login', 'Auth', 'Authenticated via Law Firm Registry Portal');
    setAuditLogsState(getStoredAuditLogs());
  };

  const handleSwitchUser = (user: User) => {
    const targetTab = mapRoleToRoleTab(user.role);
    addAuditLog(currentUser?.fullName || 'User', currentUser?.role || 'Staff', 'Initiated User Switch', 'Auth', `Switching session to ${user.fullName} (${user.role}) - requires re-authentication`);
    handleLogout(targetTab);
  };

  // State update handlers
  const handleAddFile = (newFile: RegistryFile) => {
    const fileWithFirm = { ...newFile, firmCode: newFile.firmCode || currentFirmCode };
    const updated = [fileWithFirm, ...files];
    setFilesState(updated);
    saveFiles(updated);
    saveDocumentToFirebase('files', fileWithFirm);

    showToast(
      'success',
      'Physical File Saved',
      `File ${newFile.internalFileNumber} (${newFile.clientName}) has been opened and assigned to Cabinet ${newFile.physicalLocation?.cabinet || 'Central Registry'}.`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Registered Physical File', 'Registry', `Opened physical file ${newFile.internalFileNumber} (${newFile.clientName})`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateFile = (file: RegistryFile) => {
    const updated = files.map(f => f.id === file.id ? file : f);
    setFilesState(updated);
    saveFiles(updated);
    saveDocumentToFirebase('files', file);

    const isSingleEdit = file.isEdited && file.editCount === 1;

    showToast(
      'success',
      isSingleEdit ? 'Proprietor File Edit Finalized' : 'File Record Updated',
      isSingleEdit
        ? `Proprietor one-time file information edit for ${file.internalFileNumber} (${file.clientName}) saved. Edit permission is now permanently locked.`
        : `Physical file ${file.internalFileNumber} (${file.clientName}) records were successfully updated and saved.`
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName, 
        currentUser.role, 
        isSingleEdit ? 'Proprietor 1-Time File Edit' : 'Updated File Record', 
        'Registry', 
        isSingleEdit
          ? `Proprietor finalized single authorized edit for physical file ${file.internalFileNumber} (${file.clientName}). Subsequent edits locked.`
          : `Updated physical file ${file.internalFileNumber} metadata`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleRecordMovement = (
    newMovement: FileMovement, 
    updatedLocation: { room: string; cabinet: string; shelf: string; detail?: string },
    newStatus?: RegistryFile['currentStatus']
  ) => {
    // Add movement
    const movementWithFirm = { ...newMovement, firmCode: newMovement.firmCode || currentFirmCode };
    const updatedMovements = [movementWithFirm, ...movements];
    setMovementsState(updatedMovements);
    saveMovements(updatedMovements);
    saveDocumentToFirebase('movements', movementWithFirm);

    // Update physical location of target file
    let targetUpdatedFile: RegistryFile | null = null;
    const updatedFiles = files.map(f => {
      if (f.id === newMovement.fileId || f.internalFileNumber === newMovement.fileNumber) {
        const mod: RegistryFile = {
          ...f,
          physicalLocation: updatedLocation,
          currentStatus: newStatus || f.currentStatus
        };
        targetUpdatedFile = mod;
        return mod;
      }
      return f;
    });

    setFilesState(updatedFiles);
    saveFiles(updatedFiles);
    if (targetUpdatedFile) {
      saveDocumentToFirebase('files', targetUpdatedFile);
    }

    showToast(
      'info',
      'File Movement Recorded',
      `File ${newMovement.fileNumber} transferred to ${newMovement.toLocation} (${newMovement.reason || 'Relocation'}). Location: ${updatedLocation.room}, ${updatedLocation.cabinet}.`
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName, 
        currentUser.role, 
        'Transferred Physical File', 
        'Movement', 
        `Moved ${newMovement.fileNumber} to ${newMovement.toLocation}. Reason: "${newMovement.reason}"`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleAddCourtSession = (
    newSession: CourtSession, 
    sameDayAlert?: { fileNumber: string; time: string; purpose: string }
  ) => {
    const sessionWithFirm = { ...newSession, firmCode: newSession.firmCode || currentFirmCode };
    const updated = [sessionWithFirm, ...courtSessions];
    setCourtSessionsState(updated);
    saveCourtSessions(updated);
    saveDocumentToFirebase('court_sessions', sessionWithFirm);

    if (sameDayAlert) {
      const newAlert: UrgentAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        firmCode: currentFirmCode,
        fileNumber: sameDayAlert.fileNumber,
        time: sameDayAlert.time,
        purpose: sameDayAlert.purpose,
        date: newSession.hearingDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      saveAlerts([newAlert, ...urgentAlerts]);
      saveDocumentToFirebase('urgent_alerts', newAlert);
    }

    showToast(
      'success',
      'Court Hearing Scheduled',
      `Hearing for file ${newSession.fileNumber} scheduled for ${newSession.hearingDate} (${newSession.hearingTime}) at ${newSession.courtStation}.`
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName, 
        currentUser.role, 
        sameDayAlert ? '🚨 SCHEDULED SAME-DAY COURT HEARING' : 'Scheduled Court Hearing', 
        'Court', 
        `Added hearing for ${newSession.fileNumber} at ${newSession.courtStation} (${newSession.hearingDate} @ ${newSession.hearingTime})`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleAddCourtOutcome = (
    newOutcome: CourtOutcome,
    nextCourtDate?: string,
    updatedCaseStatus?: RegistryFile['currentStatus'],
    sameDayAlert?: { fileNumber: string; time: string; purpose: string }
  ) => {
    const outcomeWithFirm = { ...newOutcome, firmCode: newOutcome.firmCode || currentFirmCode };
    const updatedOutcomes = [outcomeWithFirm, ...courtOutcomes];
    setCourtOutcomesState(updatedOutcomes);
    saveCourtOutcomes(updatedOutcomes);
    saveDocumentToFirebase('court_outcomes', outcomeWithFirm);

    if (sameDayAlert) {
      const newAlert: UrgentAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        firmCode: currentFirmCode,
        fileNumber: sameDayAlert.fileNumber,
        time: sameDayAlert.time,
        purpose: sameDayAlert.purpose,
        date: nextCourtDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      saveAlerts([newAlert, ...urgentAlerts]);
      saveDocumentToFirebase('urgent_alerts', newAlert);
    }

    // Update file's next court date and status
    if (nextCourtDate || updatedCaseStatus) {
      let targetFileUpdated: RegistryFile | null = null;
      const updatedFiles = files.map(f => {
        if (f.id === newOutcome.fileId || f.internalFileNumber === newOutcome.fileNumber) {
          const mod = {
            ...f,
            nextCourtDate: nextCourtDate || f.nextCourtDate,
            currentStatus: updatedCaseStatus || f.currentStatus
          };
          targetFileUpdated = mod;
          return mod;
        }
        return f;
      });
      setFilesState(updatedFiles);
      saveFiles(updatedFiles);
      if (targetFileUpdated) {
        saveDocumentToFirebase('files', targetFileUpdated);
      }
    }

    showToast(
      'success',
      'Court Record Updated',
      `Outcome recorded for ${newOutcome.fileNumber}. Orders: "${newOutcome.ordersIssued}"${nextCourtDate ? ` · Next court date: ${nextCourtDate}` : ''}.`
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName, 
        currentUser.role, 
        sameDayAlert ? '🚨 RECORDED OUTCOME WITH SAME-DAY HEARING' : 'Recorded Court Outcome', 
        'Court', 
        `Recorded outcome for ${newOutcome.fileNumber}: "${newOutcome.ordersIssued}"${nextCourtDate ? ` (Next hearing set for ${nextCourtDate})` : ''}`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleAddCorumEntry = (
    newCorumEntry: CorumEntry,
    nextCourtDate?: string,
    updatedCaseStatus?: RegistryFile['currentStatus']
  ) => {
    const corumWithFirm = { ...newCorumEntry, firmCode: newCorumEntry.firmCode || currentFirmCode };
    const updatedCorum = [corumWithFirm, ...corumEntries];
    setCorumEntriesState(updatedCorum);
    saveCorumEntries(updatedCorum);
    saveDocumentToFirebase('corum_entries', corumWithFirm);

    // Also bridge as CourtOutcome for unified reporting across views
    const outcomeBridge: CourtOutcome = {
      id: `co-${newCorumEntry.id}`,
      firmCode: corumWithFirm.firmCode,
      fileId: newCorumEntry.fileId,
      fileNumber: newCorumEntry.fileNumber,
      appearanceDate: newCorumEntry.date,
      courtStation: newCorumEntry.courtStation,
      courtNumber: newCorumEntry.courtNumber,
      coram: newCorumEntry.coram,
      magistrate: newCorumEntry.coram,
      advocatePresent: newCorumEntry.advocatePresent,
      defendantAdvocate: newCorumEntry.defendantAdvocate,
      comingUpFor: newCorumEntry.comingUpFor,
      outcomeDetails: `${newCorumEntry.comingUpFor}: ${newCorumEntry.remarks}`,
      ordersIssued: newCorumEntry.orders,
      remarks: newCorumEntry.remarks,
      officeAction: newCorumEntry.officeAction,
      nextHearingDate: newCorumEntry.nextCourtDate,
      nextHearingTime: newCorumEntry.nextCourtTime,
      caseStatusAfter: newCorumEntry.caseStatusAfter || updatedCaseStatus || 'Active',
      recordedBy: newCorumEntry.recordedBy,
      recordedAt: newCorumEntry.recordedAt
    };
    const updatedOutcomes = [outcomeBridge, ...courtOutcomes.filter(o => o.id !== outcomeBridge.id)];
    setCourtOutcomesState(updatedOutcomes);
    saveCourtOutcomes(updatedOutcomes);
    saveDocumentToFirebase('court_outcomes', outcomeBridge);

    // If next court date is fixed, schedule diary entry
    if (nextCourtDate) {
      const targetFile = files.find(f => f.id === newCorumEntry.fileId || f.internalFileNumber === newCorumEntry.fileNumber);
      const validPurpose: CourtSession['purpose'] = (
        ['Mention', 'Hearing', 'Ruling', 'Judgment', 'Notice of Motion', 'Pre-Trial Conference'].includes(newCorumEntry.nextComingUpFor || '')
          ? (newCorumEntry.nextComingUpFor as CourtSession['purpose'])
          : 'Mention'
      );

      const newSession: CourtSession = {
        id: `cs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        firmCode: currentFirmCode,
        fileId: newCorumEntry.fileId,
        fileNumber: newCorumEntry.fileNumber,
        clientName: targetFile?.clientName || 'Client on Record',
        opposingParty: targetFile?.opposingParty || 'Opposing Party',
        hearingDate: nextCourtDate,
        hearingTime: newCorumEntry.nextCourtTime || '09:00 AM',
        courtStation: newCorumEntry.courtStation,
        courtNumber: newCorumEntry.courtNumber,
        magistrate: newCorumEntry.coram,
        advocateName: newCorumEntry.advocatePresent || targetFile?.advocateName || 'Advocate on Record',
        purpose: validPurpose,
        status: 'Upcoming'
      };
      const updatedSessions = [newSession, ...courtSessions];
      setCourtSessionsState(updatedSessions);
      saveCourtSessions(updatedSessions);
      saveDocumentToFirebase('court_sessions', newSession);
    }

    // Update physical file metadata
    if (nextCourtDate || updatedCaseStatus) {
      let targetFileUpdated: RegistryFile | null = null;
      const updatedFiles = files.map(f => {
        if (f.id === newCorumEntry.fileId || f.internalFileNumber === newCorumEntry.fileNumber) {
          const mod = {
            ...f,
            nextCourtDate: nextCourtDate || f.nextCourtDate,
            currentStatus: updatedCaseStatus || f.currentStatus
          };
          targetFileUpdated = mod;
          return mod;
        }
        return f;
      });
      setFilesState(updatedFiles);
      saveFiles(updatedFiles);
      if (targetFileUpdated) {
        saveDocumentToFirebase('files', targetFileUpdated);
      }
    }

    showToast(
      'success',
      'Court Proceedings Saved',
      `Coram & proceedings for ${newCorumEntry.fileNumber} before ${newCorumEntry.coram} saved.${nextCourtDate ? ` Next date: ${nextCourtDate}` : ''}`
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName,
        currentUser.role,
        'Recorded CORUM Court Proceedings',
        'Court',
        `Recorded CORUM for ${newCorumEntry.fileNumber} (Coram: ${newCorumEntry.coram}, Def: ${newCorumEntry.defendantAdvocate}, Orders: "${newCorumEntry.orders.substring(0, 60)}...")`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateCorumEntry = (
    updatedCorumEntry: CorumEntry,
    nextCourtDate?: string,
    updatedCaseStatus?: RegistryFile['currentStatus']
  ) => {
    const corumWithFirm: CorumEntry = {
      ...updatedCorumEntry,
      firmCode: updatedCorumEntry.firmCode || currentFirmCode,
      isEdited: true,
      editedAt: new Date().toISOString(),
      editedBy: currentUser?.fullName || updatedCorumEntry.recordedBy || 'Advocate on Record',
      editCount: (updatedCorumEntry.editCount || 0) + 1
    };

    const updatedCorum = corumEntries.map(c => c.id === corumWithFirm.id ? corumWithFirm : c);
    setCorumEntriesState(updatedCorum);
    saveCorumEntries(updatedCorum);
    saveDocumentToFirebase('corum_entries', corumWithFirm);

    // Update bridged CourtOutcome
    const outcomeId = `co-${corumWithFirm.id}`;
    const outcomeBridge: CourtOutcome = {
      id: outcomeId,
      firmCode: corumWithFirm.firmCode,
      fileId: corumWithFirm.fileId,
      fileNumber: corumWithFirm.fileNumber,
      appearanceDate: corumWithFirm.date,
      courtStation: corumWithFirm.courtStation,
      courtNumber: corumWithFirm.courtNumber,
      coram: corumWithFirm.coram,
      magistrate: corumWithFirm.coram,
      advocatePresent: corumWithFirm.advocatePresent,
      defendantAdvocate: corumWithFirm.defendantAdvocate,
      comingUpFor: corumWithFirm.comingUpFor,
      outcomeDetails: `${corumWithFirm.comingUpFor}: ${corumWithFirm.remarks}`,
      ordersIssued: corumWithFirm.orders,
      remarks: corumWithFirm.remarks,
      officeAction: corumWithFirm.officeAction,
      nextHearingDate: corumWithFirm.nextCourtDate,
      nextHearingTime: corumWithFirm.nextCourtTime,
      caseStatusAfter: corumWithFirm.caseStatusAfter || updatedCaseStatus || 'Active',
      recordedBy: corumWithFirm.recordedBy,
      recordedAt: corumWithFirm.recordedAt
    };
    const updatedOutcomes = courtOutcomes.map(o => (o.id === outcomeId || o.id === corumWithFirm.id) ? outcomeBridge : o);
    setCourtOutcomesState(updatedOutcomes);
    saveCourtOutcomes(updatedOutcomes);
    saveDocumentToFirebase('court_outcomes', outcomeBridge);

    // Update physical file metadata if changed
    if (nextCourtDate || updatedCaseStatus) {
      let targetFileUpdated: RegistryFile | null = null;
      const updatedFiles = files.map(f => {
        if (f.id === corumWithFirm.fileId || f.internalFileNumber === corumWithFirm.fileNumber) {
          const mod = {
            ...f,
            nextCourtDate: nextCourtDate || f.nextCourtDate,
            currentStatus: updatedCaseStatus || f.currentStatus
          };
          targetFileUpdated = mod;
          return mod;
        }
        return f;
      });
      setFilesState(updatedFiles);
      saveFiles(updatedFiles);
      if (targetFileUpdated) {
        saveDocumentToFirebase('files', targetFileUpdated);
      }
    }

    showToast(
      'success',
      'CORUM Record Updated',
      `Updated CORUM proceedings for ${corumWithFirm.fileNumber}. Edit has been recorded and finalized.`
    );

    if (currentUser) {
      addAuditLog(
        currentUser.fullName,
        currentUser.role,
        'Updated CORUM Court Record',
        'Court',
        `Edited CORUM record for ${corumWithFirm.fileNumber} (Coram: ${corumWithFirm.coram}, Def: ${corumWithFirm.defendantAdvocate})`
      );
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleToggleBringUpRetrieved = (id: string) => {
    let targetItemUpdated: BringUpItem | null = null;
    const updated = bringUpItems.map(item => {
      if (item.id === id) {
        const mod: BringUpItem = {
          ...item,
          retrieved: !item.retrieved,
          retrievedBy: !item.retrieved ? (currentUser?.fullName || 'Registry Clerk') : undefined,
          retrievedAt: !item.retrieved ? new Date().toISOString() : undefined
        };
        targetItemUpdated = mod;
        return mod;
      }
      return item;
    });

    setBringUpItemsState(updated);
    saveBringUpItems(updated);
    if (targetItemUpdated) {
      saveDocumentToFirebase('bring_up_items', targetItemUpdated);
      showToast(
        'info',
        (targetItemUpdated as BringUpItem).retrieved ? 'File Marked as Retrieved' : 'Bring-Up Scheduled',
        `File ${(targetItemUpdated as BringUpItem).fileNumber} (${(targetItemUpdated as BringUpItem).clientName}) bring-up status updated.`
      );
    }
  };

  const handleUpdateInsuranceClaim = (claim: InsuranceClaim) => {
    const updated = claims.map(c => c.id === claim.id ? claim : c);
    setClaimsState(updated);
    saveInsuranceClaims(updated);
    saveDocumentToFirebase('claims', claim);

    showToast(
      'info',
      'Insurance Claim Updated',
      `Claim ${claim.claimRef} (${claim.insuranceCompany}) updated.`
    );
  };

  const handleAddInsuranceClaim = (claim: InsuranceClaim) => {
    const claimWithFirm = { ...claim, firmCode: claim.firmCode || currentFirmCode };
    const updated = [claimWithFirm, ...claims];
    setClaimsState(updated);
    saveInsuranceClaims(updated);
    saveDocumentToFirebase('claims', claimWithFirm);

    showToast(
      'success',
      'Insurance Claim Saved',
      `Claim ${claim.claimRef} for ${claim.clientName} registered with ${claim.insuranceCompany}.`
    );
  };

  const handleUpdatePendingCheque = (cheque: PendingCheque) => {
    const updated = cheques.map(c => c.id === cheque.id ? cheque : c);
    setChequesState(updated);
    savePendingCheques(updated);
    saveDocumentToFirebase('cheques', cheque);

    showToast(
      'info',
      'Cheque Status Updated',
      `Cheque #${cheque.chequeNumber} status changed to ${cheque.status}.`
    );
  };

  const handleAddPendingCheque = (cheque: PendingCheque) => {
    const chequeWithFirm = { ...cheque, firmCode: cheque.firmCode || currentFirmCode };
    const updated = [chequeWithFirm, ...cheques];
    setChequesState(updated);
    savePendingCheques(updated);
    saveDocumentToFirebase('cheques', chequeWithFirm);

    showToast(
      'success',
      'Pending Cheque Logged',
      `Cheque #${cheque.chequeNumber} (KSh ${cheque.amount.toLocaleString()}) logged for ${cheque.clientName}.`
    );
  };

  const handleCommissionPayout = (commissionId: string, payoutAmount: number) => {
    let targetPayoutCommission: CommissionRecord | null = null;
    const updated = commissions.map(c => {
      if (c.id === commissionId) {
        const newPaid = c.amountPaid + payoutAmount;
        const newBalance = Math.max(0, c.commissionDue - newPaid);
        const mod = {
          ...c,
          amountPaid: newPaid,
          outstandingBalance: newBalance,
          lastPaymentDate: new Date().toISOString().split('T')[0]
        };
        targetPayoutCommission = mod;
        return mod;
      }
      return c;
    });

    setCommissionsState(updated);
    saveCommissions(updated);
    if (targetPayoutCommission) {
      saveDocumentToFirebase('commissions', targetPayoutCommission);
      showToast(
        'success',
        'Commission Payout Recorded',
        `Disbursed KSh ${payoutAmount.toLocaleString()} to ${(targetPayoutCommission as CommissionRecord).caseChaserName}. Remaining: KSh ${(targetPayoutCommission as CommissionRecord).outstandingBalance.toLocaleString()}`
      );
    }

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Disbursed Commission', 'Commission', `Paid KSh ${payoutAmount.toLocaleString()} towards commission ID ${commissionId}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleAddCommission = (record: CommissionRecord) => {
    const recordWithFirm = { ...record, firmCode: record.firmCode || currentFirmCode };
    const updated = [recordWithFirm, ...commissions];
    setCommissionsState(updated);
    saveCommissions(updated);
    saveDocumentToFirebase('commissions', recordWithFirm);

    showToast(
      'success',
      'Commission Record Created',
      `Commission of KSh ${record.commissionDue.toLocaleString()} calculated for ${record.caseChaserName}.`
    );
  };

  const handleAddUser = (user: User) => {
    const userWithFirm: User = { 
      ...user, 
      firmCode: user.firmCode || currentUser?.firmCode || settings.firmCode, 
      firmId: user.firmId || currentUser?.firmId || `firm-${currentUser?.firmCode || settings.firmCode}`,
      firmName: user.firmName || currentUser?.firmName || settings.firmName
    };
    const updated = [...users, userWithFirm];
    setUsersState(updated);
    saveUsers(updated);
    saveUserToFirebase(userWithFirm);

    showToast(
      'success',
      'User Account Created',
      `Account for ${user.fullName} (${user.role}) was created and credentials persisted.`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Created User Account', 'User', `Created ${user.role} account for ${user.fullName} (${user.username})`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateUser = (user: User) => {
    const updated = users.map(u => u.id === user.id ? user : u);
    setUsersState(updated);
    saveUsers(updated);
    saveUserToFirebase(user);

    showToast(
      'info',
      'User Account Updated',
      `Updated profile and settings for ${user.fullName}.`
    );

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Updated User Account', 'User', `Modified account status for ${user.fullName} to ${user.status}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);

    showToast(
      'success',
      'System Settings Saved',
      'Firm configuration and registry defaults updated and synchronized.'
    );

    // Update matching firm profile in firms state and sync immediately to Firebase
    const targetFirm = firms.find(f => f.firmCode === newSettings.firmCode || f.id === newSettings.firmCode || f.firmCode === currentUser?.firmCode);
    if (targetFirm) {
      const updatedFirm: LawFirmProfile = {
        ...targetFirm,
        firmName: newSettings.firmName || targetFirm.firmName,
        firmInitials: newSettings.firmInitials || newSettings.fileNumberPrefix || targetFirm.firmInitials,
        fileNumberPrefix: newSettings.fileNumberPrefix || newSettings.firmInitials || targetFirm.fileNumberPrefix,
        fileNumberFormatPattern: newSettings.fileNumberFormatPattern || targetFirm.fileNumberFormatPattern,
        fileNumberPadding: newSettings.fileNumberPadding !== undefined ? newSettings.fileNumberPadding : targetFirm.fileNumberPadding,
        fileNumberDelimiter: newSettings.fileNumberDelimiter || targetFirm.fileNumberDelimiter,
        includeCaseTypeInFileNumber: newSettings.includeCaseTypeInFileNumber !== undefined ? newSettings.includeCaseTypeInFileNumber : targetFirm.includeCaseTypeInFileNumber,
        preliminaryStartingNumber: newSettings.preliminaryStartingNumber !== undefined ? newSettings.preliminaryStartingNumber : targetFirm.preliminaryStartingNumber,
        preliminaryNextNumber: newSettings.preliminaryNextNumber !== undefined ? newSettings.preliminaryNextNumber : targetFirm.preliminaryNextNumber,
        preliminaryYear: newSettings.preliminaryYear !== undefined ? newSettings.preliminaryYear : targetFirm.preliminaryYear,
        annualSequenceReset: newSettings.annualSequenceReset !== undefined ? newSettings.annualSequenceReset : targetFirm.annualSequenceReset,
        registrationNumber: newSettings.firmRegistrationNumber || targetFirm.registrationNumber,
        cityOrBranch: newSettings.cityOrBranch || targetFirm.cityOrBranch
      };
      const updatedFirms = firms.map(f => f.id === updatedFirm.id ? updatedFirm : f);
      setFirmsState(updatedFirms);
      saveFirms(updatedFirms);
      saveFirmToFirebase(updatedFirm);
    }

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Updated System Settings', 'Settings', 'Modified firm numbering scheme, court directory, or system preferences');
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleResetData = () => {
    resetToDefaults();
    setSettingsState(getStoredSettings());
    setUsersState(getStoredUsers());
    setFilesState(getStoredFiles());
    setMovementsState(getStoredMovements());
    setCourtSessionsState(getStoredCourtSessions());
    setCourtOutcomesState(getStoredCourtOutcomes());
    setBringUpItemsState(getStoredBringUpItems());
    setClaimsState(getStoredInsuranceClaims());
    setChequesState(getStoredPendingCheques());
    setCommissionsState(getStoredCommissions());
    setAuditLogsState(getStoredAuditLogs());
  };

  // Render Public Landing Page
  if (viewState === 'landing') {
    return (
      <>
        <LandingPage 
          onGoToLogin={() => setViewState('login')} 
          onOpenRegisterFirm={() => setIsRegisterModalOpen(true)}
          onGoToSuperAdmin={() => {
            const superAdminUser = users.find(u => u.role === 'Super Admin') || {
              id: 'usr-superadmin',
              firmId: 'platform-owner',
              firmName: 'Law Firm Registry Platform',
              username: 'superadmin',
              fullName: 'Platform Super Admin',
              role: 'Super Admin',
              email: 'superadmin@lawfirmregistry.com',
              phone: '+254 700 000000',
              status: 'Active',
              lastLogin: 'Just now',
              permissions: ['all']
            };
            handleLoginSuccess(superAdminUser);
            setActiveTab('super-admin');
          }}
        />

        <RegisterFirmModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={handleRegisterFirmSuccess}
        />

        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Render Login Page
  if (viewState === 'login') {
    return (
      <>
        <LoginPage 
          users={users}
          initialRoleTab={pendingLoginRoleTab}
          onLoginSuccess={handleLoginSuccess}
          onUpdateUser={handleUpdateUser}
          onBackToLanding={() => setViewState('landing')}
          onOpenRegisterFirm={() => setIsRegisterModalOpen(true)}
        />

        <RegisterFirmModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={handleRegisterFirmSuccess}
        />

        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Main Authenticated Enterprise Application Layout
  return (
    <div className="min-h-screen bg-[#071526] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        allUsers={users}
        firmName={settings.firmName}
        firmCode={settings.firmCode}
        onSwitchUser={handleSwitchUser}
        onLogout={() => handleLogout()}
        onNavigateTab={tab => setActiveTab(tab)}
        onGoToSuperAdmin={currentUser?.role === 'Super Admin' ? () => setActiveTab('super-admin') : undefined}
        onManualCloudSync={performFirebaseSnapshotSync}
        lastSyncTime={lastSnapshotSyncTime}
        sessionsTodayCount={courtSessions.filter(s => s.hearingDate === new Date().toISOString().split('T')[0]).length}
        filesOutCount={files.filter(f => f.currentStatus.startsWith('Out')).length}
        pendingChequesCount={cheques.filter(c => c.status !== 'Cleared').length}
        onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* URGENT SAME-DAY COURT HEARING BROADCAST BANNER FOR CLERK, PROPRIETOR & SECRETARY */}
      {urgentAlerts.length > 0 && ['Clerk', 'Proprietor', 'Secretary', 'Admin', 'Super Admin'].includes(currentUser?.role || '') && (
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b-2 border-[#C9A227] px-4 py-2.5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xl z-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold shrink-0 animate-pulse shadow-lg">
              🚨
            </div>
            <div className="truncate">
              <div className="font-extrabold text-amber-200 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>SAME-DAY COURT HEARING ALERT ({urgentAlerts.length})</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                  ACTION REQUIRED FOR CLERK / PROPRIETOR / SECRETARY
                </span>
              </div>
              <div className="text-slate-100 truncate mt-0.5 font-mono">
                File: <strong className="text-amber-300 font-extrabold">{urgentAlerts[0].fileNumber}</strong> @ <strong className="text-emerald-400 font-extrabold">{urgentAlerts[0].time} TODAY ({urgentAlerts[0].date})</strong> — <span className="text-slate-200">{urgentAlerts[0].purpose}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => setActiveTab('court-diary')}
              className="px-3 py-1.5 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[11px] shadow transition flex items-center gap-1"
            >
              View Court Diary
            </button>
            <button
              onClick={() => handleAcknowledgeAlert(urgentAlerts[0].id)}
              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-extrabold rounded-lg text-[11px] border border-emerald-700 shadow transition flex items-center gap-1"
              title="Acknowledge"
            >
              Acknowledge ✓
            </button>
            {urgentAlerts.length > 1 && (
              <button
                onClick={() => saveAlerts([])}
                className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-[10px] border border-slate-700"
                title="Dismiss all"
              >
                Clear All ({urgentAlerts.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body Area with Fixed Left Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar (For Firm Workspaces) */}
        {activeTab !== 'super-admin' && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={tab => setActiveTab(tab)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            currentUser={currentUser}
            counts={{
              sessionsToday: activeFirmCourtSessions.filter(s => s.hearingDate === new Date().toISOString().split('T')[0]).length,
              filesOut: activeFirmFiles.filter(f => f.currentStatus.startsWith('Out')).length,
              pendingCheques: activeFirmCheques.filter(c => c.status !== 'Cleared').length,
              commissions: activeFirmCommissions.filter(c => c.outstandingBalance > 0).length,
              pendingReviewIntakes: activeFirmUnprocessedRecords.filter(r => r.status === 'Pending Review').length,
              pendingTasks: activeFirmTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue').length
            }}
          />
        )}

        {/* Main Content Workspace */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'super-admin' ? 'p-0 max-w-full pb-20 md:pb-6' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8'} w-full`}>
          
          {activeTab === 'super-admin' && (
            currentUser?.role === 'Super Admin' ? (
              <SuperAdminModule
                firms={firms}
                files={files}
                users={users}
                auditLogs={auditLogs}
                currentUser={currentUser}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onAccessWorkspace={handleAccessWorkspace}
                onDeleteFirm={handleDeleteFirm}
                onWipeAllFirms={handleWipeAllFirms}
                onUpdatePassword={handleUpdatePassword}
                onDeleteUser={handleDeleteUser}
                onUpdateUser={handleUpdateUser}
                onAddLawFirm={handleRegisterFirmSuccess}
                onUpdateFirm={handleUpdateFirm}
                onLogout={() => {
                  setCurrentUser(null);
                  setViewState('login');
                }}
              />
            ) : (
              <div className="p-8 text-center bg-red-950/40 border border-red-700/60 rounded-2xl max-w-lg mx-auto my-12 text-slate-100 shadow-2xl">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-300">Platform Admin Access Restricted</h3>
                <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
                  The Platform Admin control center cannot be accessed through client or firm staff user accounts.
                </p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-[#C9A227] text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition cursor-pointer"
                >
                  Return to Workspace Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'tasks' && (
            <TaskManagementModule
              currentUser={currentUser}
              users={activeFirmUsers}
              files={activeFirmFiles}
              tasks={activeFirmTasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onNavigateToFile={fileNum => {
                setActiveTab('registry');
              }}
            />
          )}

          {activeTab === 'dashboard' && (
            currentUser?.role === 'Case Chaser' ? (
              <CaseChaserModule
                files={activeFirmFiles}
                users={activeFirmUsers}
                currentUser={currentUser}
                chasers={chasers}
                followUpLogs={followUpLogs}
                responsibilities={responsibilities}
                tasks={activeFirmTasks}
                unprocessedRecords={activeFirmUnprocessedRecords}
                onAddUnprocessedRecord={handleAddUnprocessedRecord}
                onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
                onAddFile={handleAddFile}
                onAddFollowUpLog={handleAddFollowUpLog}
                onUpdateResponsibility={handleUpdateResponsibility}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onUpdateChaserProfile={handleUpdateChaserProfile}
              />
            ) : (
              <DashboardView
                currentUser={currentUser}
                files={activeFirmFiles}
                courtSessions={activeFirmCourtSessions}
                fileMovements={activeFirmMovements}
                claims={activeFirmClaims}
                cheques={activeFirmCheques}
                commissions={activeFirmCommissions}
                onNavigateTab={tab => setActiveTab(tab)}
                onLogoutWithRole={roleTab => handleLogout(roleTab)}
                onOpenNewFileModal={() => {
                  setActiveTab('registry');
                  setOpenNewFileModalOnRegistry(true);
                }}
                onOpenMoveFileModal={() => {
                  setActiveTab('file-tracker');
                }}
              />
            )
          )}

          {activeTab === 'registry' && (
            <RegistryModule
              files={activeFirmFiles}
              movements={activeFirmMovements}
              corumEntries={activeFirmCorumEntries}
              courtOutcomes={activeFirmCourtOutcomes}
              currentUser={currentUser}
              onAddCorumEntry={handleAddCorumEntry}
              onUpdateCorumEntry={handleUpdateCorumEntry}
              onAddCourtOutcome={handleAddCourtOutcome}
              onAddFile={handleAddFile}
              onUpdateFile={handleUpdateFile}
              onOpenMoveModal={file => {
                setSelectedFileToMove(file);
                setActiveTab('file-tracker');
              }}
              courtStations={settings.courtStations}
              cabinets={settings.cabinets}
              openNewModalInitially={openNewFileModalOnRegistry}
              unprocessedRecords={activeFirmUnprocessedRecords}
              onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
              fileNumberPrefix={settings.fileNumberPrefix}
              users={activeFirmUsers}
              currentFirm={activeFirmProfile}
              onUpdateFirm={handleUpdateFirm}
            />
          )}

          {activeTab === 'file-tracker' && (
            <FileTrackerModule
              files={activeFirmFiles}
              movements={activeFirmMovements}
              currentUser={currentUser}
              users={activeFirmUsers}
              onRecordMovement={handleRecordMovement}
              selectedFileToMove={selectedFileToMove}
              onClearSelectedFileToMove={() => setSelectedFileToMove(null)}
            />
          )}

          {activeTab === 'court-diary' && (
            <CourtDiaryModule
              sessions={activeFirmCourtSessions}
              files={activeFirmFiles}
              onAddSession={handleAddCourtSession}
              onNavigateToOutcome={session => {
                setPreselectedSessionForOutcome(session);
                setActiveTab('court-outcomes');
              }}
              courtStations={settings.courtStations}
              users={activeFirmUsers}
            />
          )}

          {activeTab === 'court-outcomes' && (
            <CourtOutcomeModule
              outcomes={courtOutcomes}
              files={activeFirmFiles}
              onAddOutcome={handleAddCourtOutcome}
              preselectedSession={preselectedSessionForOutcome}
              users={activeFirmUsers}
            />
          )}

          {activeTab === 'bring-up' && (
            <BringUpModule
              bringUpItems={activeFirmBringUpItems}
              onToggleRetrieved={handleToggleBringUpRetrieved}
            />
          )}

          {activeTab === 'advocates' && (
            <StaffModules files={activeFirmFiles} users={activeFirmUsers} roleFilter="Advocate" currentUser={currentUser} onAddUser={handleAddUser} />
          )}

          {activeTab === 'secretaries' && (
            <StaffModules files={activeFirmFiles} users={activeFirmUsers} roleFilter="Secretary" currentUser={currentUser} onAddUser={handleAddUser} />
          )}

          {activeTab === 'clerks' && (
            <StaffModules files={activeFirmFiles} users={activeFirmUsers} roleFilter="Clerk" currentUser={currentUser} onAddUser={handleAddUser} />
          )}

          {activeTab === 'case-chasers' && (
            <CaseChaserModule
              files={activeFirmFiles}
              users={activeFirmUsers}
              currentUser={currentUser}
              chasers={chasers}
              followUpLogs={followUpLogs}
              responsibilities={responsibilities}
              tasks={activeFirmTasks}
              unprocessedRecords={activeFirmUnprocessedRecords}
              onAddUnprocessedRecord={handleAddUnprocessedRecord}
              onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
              onAddFile={handleAddFile}
              onAddFollowUpLog={handleAddFollowUpLog}
              onUpdateResponsibility={handleUpdateResponsibility}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onUpdateChaserProfile={handleUpdateChaserProfile}
              currentFirm={activeFirmProfile}
            />
          )}

          {activeTab === 'unprocessed-bucket' && (
            <UnprocessedSourcingModule
              unprocessedRecords={activeFirmUnprocessedRecords}
              onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
              onAddFile={handleAddFile}
              files={activeFirmFiles}
              courtStations={settings.courtStations}
              cabinets={settings.cabinets}
              fileNumberPrefix={settings.fileNumberPrefix}
              users={activeFirmUsers}
              currentUser={currentUser}
              currentFirm={activeFirmProfile}
              onUpdateFirm={handleUpdateFirm}
            />
          )}



          {activeTab === 'insurance' && (
            <InsuranceModule
              claims={activeFirmClaims}
              files={activeFirmFiles}
              onUpdateClaim={handleUpdateInsuranceClaim}
              onAddClaim={handleAddInsuranceClaim}
            />
          )}

          {activeTab === 'pending-cheques' && (
            <ChequesModule
              cheques={activeFirmCheques}
              files={activeFirmFiles}
              onUpdateCheque={handleUpdatePendingCheque}
              onAddCheque={handleAddPendingCheque}
            />
          )}

          {activeTab === 'commission-tracker' && (
            <CommissionModule
              commissions={activeFirmCommissions}
              files={activeFirmFiles}
              onPayout={handleCommissionPayout}
              onAddCommission={(newRec) => {
                const fullRecord: CommissionRecord = {
                  ...newRec,
                  id: `comm-${Date.now()}`
                };
                handleAddCommission(fullRecord);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              files={activeFirmFiles}
              courtSessions={activeFirmCourtSessions}
              bringUpItems={activeFirmBringUpItems}
              claims={activeFirmClaims}
              cheques={activeFirmCheques}
              commissions={activeFirmCommissions}
              movements={activeFirmMovements}
            />
          )}

          {activeTab === 'user-management' && (
            <UserManagementModule
              users={activeFirmUsers}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              settings={settings}
              currentFirm={activeFirmProfile}
              currentUser={currentUser}
              onSaveSettings={handleSaveSettings}
              onUpdateFirm={handleUpdateFirm}
              onResetData={handleResetData}
              onClearDataForProduction={handleClearDataForProduction}
              onUpdatePassword={handleUpdatePassword}
            />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogModule logs={auditLogs} />
          )}

        </main>
      </div>

      {/* Mobile-optimized quick navigation bar */}
      {activeTab !== 'super-admin' && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={tab => setActiveTab(tab)}
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
          pendingTasksCount={activeFirmTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue').length}
          courtSessionsTodayCount={activeFirmCourtSessions.filter(s => s.hearingDate === new Date().toISOString().split('T')[0]).length}
        />
      )}

      {/* Laptop & Phone Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onNavigateTab={tab => setActiveTab(tab)}
      />

      <RegisterFirmModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterFirmSuccess}
      />

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
