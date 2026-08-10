import React, { useState, useEffect } from 'react';
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
} from './types';

import {
  getStoredFirms, saveFirms,
  getStoredSettings, saveSettings,
  getStoredUsers, saveUsers,
  getStoredFiles, saveFiles,
  getStoredMovements, saveMovements,
  getStoredCourtSessions, saveCourtSessions,
  getStoredCourtOutcomes, saveCourtOutcomes,
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
  resetToDefaults, clearAllDataForProduction
} from './data/store';

import { saveDocumentToFirebase, triggerLocalStorageFirebaseSnapshot } from './lib/firebase';
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


export default function App() {
  // Navigation & Authentication state
  const [viewState, setViewState] = useState<'landing' | 'login' | 'app'>('landing');
  const [isAuthenticated, setAuth] = useState<boolean>(false);
  const [currentUser, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Application Data States
  const [firms, setFirmsState] = useState<LawFirmProfile[]>(getStoredFirms());
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [settings, setSettingsState] = useState<SystemSettings>(getStoredSettings());
  const [users, setUsersState] = useState<User[]>(getStoredUsers());
  const [files, setFilesState] = useState<RegistryFile[]>(getStoredFiles());
  const [movements, setMovementsState] = useState<FileMovement[]>(getStoredMovements());
  const [courtSessions, setCourtSessionsState] = useState<CourtSession[]>(getStoredCourtSessions());
  const [courtOutcomes, setCourtOutcomesState] = useState<CourtOutcome[]>(getStoredCourtOutcomes());
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

  // SaaS Firm Registration Handler
  const handleRegisterFirmSuccess = (newFirm: LawFirmProfile, proprietorUser: User) => {
    const updatedFirms = [newFirm, ...firms];
    setFirmsState(updatedFirms);
    saveFirms(updatedFirms);

    const updatedUsers = [proprietorUser, ...users];
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    // Sync settings to match the new firm
    setSettingsState(prev => ({
      ...prev,
      firmName: newFirm.firmName,
      firmCode: newFirm.firmCode,
      firmRegistrationNumber: newFirm.registrationNumber,
      cityOrBranch: newFirm.cityOrBranch || newFirm.county || 'Nairobi',
      address: newFirm.physicalAddress || `${newFirm.county} Legal Chambers`,
      phone: newFirm.phone,
      email: newFirm.email
    }));

    setCurrentUser(proprietorUser);
    setUser(proprietorUser);
    setIsAuthenticated(true);
    setAuth(true);
    setViewState('app');
    setActiveTab('dashboard');
    setIsRegisterModalOpen(false);

    saveDocumentToFirebase('firms', newFirm);
    saveDocumentToFirebase('users', proprietorUser);

    addAuditLog(
      proprietorUser.fullName,
      proprietorUser.role,
      'Registered Law Firm SaaS',
      'Settings',
      `Onboarded law firm "${newFirm.firmName}" (${newFirm.firmCode})`
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
    const updated = [newRecord, ...unprocessedRecords];
    setUnprocessedRecordsState(updated);
    saveUnprocessedRecords(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Captured Client Intake Record', 'Registry', `Captured preliminary client info for ${newRecord.clientFullName} (${newRecord.caseType}) into Unprocessed Bucket`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateUnprocessedRecord = (updatedRecord: UnprocessedClientRecord) => {
    const updated = unprocessedRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    setUnprocessedRecordsState(updated);
    saveUnprocessedRecords(updated);
  };

  const handleAddFollowUpLog = (newLog: ChaserFollowUpLog) => {

    const updated = [newLog, ...followUpLogs];
    setFollowUpLogsState(updated);
    saveFollowUpLogs(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Logged Client Follow-Up', 'Registry', `Recorded interaction for file ${newLog.fileNumber}: "${newLog.outcome}"`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateResponsibility = (resp: ChaserFileResponsibility) => {
    const index = responsibilities.findIndex(r => r.fileId === resp.fileId || r.fileNumber === resp.fileNumber);
    let updated: ChaserFileResponsibility[];
    if (index >= 0) {
      updated = [...responsibilities];
      updated[index] = resp;
    } else {
      updated = [resp, ...responsibilities];
    }
    setResponsibilitiesState(updated);
    saveResponsibilities(updated);
  };

  const handleAddTask = (newTask: ChaserTask) => {
    const updated = [newTask, ...tasks];
    setTasksState(updated);
    saveTasks(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Assigned Case Chaser Task', 'Registry', `Assigned task "${newTask.taskTitle}" to ${newTask.assignedToChaserName} due ${newTask.dueDate}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateTask = (updatedTask: ChaserTask) => {
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasksState(updated);
    saveTasks(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Updated Task Status', 'Registry', `Updated task "${updatedTask.taskTitle}" status to ${updatedTask.status}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasksState(updated);
    saveTasks(updated);

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

  // Load user on startup and sync Firebase collections
  useEffect(() => {
    // Always start on the public Landing Page when opening the application link
    setUser(null);
    setAuth(false);
    setViewState('landing');

    const loadedFiles = getStoredFiles();
    if (loadedFiles.length > 0) {
      setFilesState(loadedFiles);
    }

    // Async sync with Firebase Firestore
    import('./lib/firebase').then(({ syncCollectionToFirebase }) => {
      const activeFiles = loadedFiles.length > 0 ? loadedFiles : getStoredFiles();
      syncCollectionToFirebase('files', activeFiles).then(remoteFiles => {
        if (remoteFiles && remoteFiles.length > 0) {
          setFilesState(remoteFiles);
        } else {
          saveFiles(activeFiles);
        }
      });
      syncCollectionToFirebase('court_sessions', getStoredCourtSessions()).then(remote => {
        if (remote && remote.length > 0) setCourtSessionsState(remote);
      });
      syncCollectionToFirebase('claims', getStoredInsuranceClaims()).then(remote => {
        if (remote && remote.length > 0) setClaimsState(remote);
      });
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
    const updatedFirms = firms.filter(f => f.id !== firmId);
    setFirmsState(updatedFirms);
    saveFirms(updatedFirms);

    const updatedUsers = users.filter(u => u.firmId !== firmId);
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    addAuditLog(
      currentUser?.fullName || 'Platform Owner',
      'Platform Owner',
      'Delete Law Firm Workspace',
      'SuperAdmin',
      `Erased law firm workspace ID ${firmId} from platform registry`
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
    const updatedUsers = users.map(u => u.id === userId ? { ...u, password: newPassword } : u);
    setUsersState(updatedUsers);
    saveUsers(updatedUsers);

    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, password: newPassword };
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
    setAuth(false);
    if (targetRoleTab) {
      setPendingLoginRoleTab(targetRoleTab);
      setViewState('login');
    } else {
      setPendingLoginRoleTab(undefined);
      setViewState('landing');
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
    const updated = [newFile, ...files];
    setFilesState(updated);
    saveFiles(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Registered Physical File', 'Registry', `Opened physical file ${newFile.internalFileNumber} (${newFile.clientName})`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleRecordMovement = (
    newMovement: FileMovement, 
    updatedLocation: { room: string; cabinet: string; shelf: string; detail?: string },
    newStatus?: RegistryFile['currentStatus']
  ) => {
    // Add movement
    const updatedMovements = [newMovement, ...movements];
    setMovementsState(updatedMovements);
    saveMovements(updatedMovements);

    // Update physical location of target file
    const updatedFiles = files.map(f => {
      if (f.id === newMovement.fileId || f.internalFileNumber === newMovement.fileNumber) {
        return {
          ...f,
          physicalLocation: updatedLocation,
          currentStatus: newStatus || f.currentStatus
        };
      }
      return f;
    });

    setFilesState(updatedFiles);
    saveFiles(updatedFiles);

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
    const updated = [newSession, ...courtSessions];
    setCourtSessionsState(updated);
    saveCourtSessions(updated);

    if (sameDayAlert) {
      const newAlert: UrgentAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileNumber: sameDayAlert.fileNumber,
        time: sameDayAlert.time,
        purpose: sameDayAlert.purpose,
        date: newSession.hearingDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      saveAlerts([newAlert, ...urgentAlerts]);
    }

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
    const updatedOutcomes = [newOutcome, ...courtOutcomes];
    setCourtOutcomesState(updatedOutcomes);
    saveCourtOutcomes(updatedOutcomes);

    if (sameDayAlert) {
      const newAlert: UrgentAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileNumber: sameDayAlert.fileNumber,
        time: sameDayAlert.time,
        purpose: sameDayAlert.purpose,
        date: nextCourtDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      saveAlerts([newAlert, ...urgentAlerts]);
    }

    // Update file's next court date and status
    if (nextCourtDate || updatedCaseStatus) {
      const updatedFiles = files.map(f => {
        if (f.id === newOutcome.fileId || f.internalFileNumber === newOutcome.fileNumber) {
          return {
            ...f,
            nextCourtDate: nextCourtDate || f.nextCourtDate,
            currentStatus: updatedCaseStatus || f.currentStatus
          };
        }
        return f;
      });
      setFilesState(updatedFiles);
      saveFiles(updatedFiles);
    }

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

  const handleToggleBringUpRetrieved = (id: string) => {
    const updated = bringUpItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          retrieved: !item.retrieved,
          retrievedBy: !item.retrieved ? (currentUser?.fullName || 'Registry Clerk') : undefined,
          retrievedAt: !item.retrieved ? new Date().toISOString() : undefined
        };
      }
      return item;
    });

    setBringUpItemsState(updated);
    saveBringUpItems(updated);
  };

  const handleUpdateInsuranceClaim = (claim: InsuranceClaim) => {
    const updated = claims.map(c => c.id === claim.id ? claim : c);
    setClaimsState(updated);
    saveInsuranceClaims(updated);
  };

  const handleAddInsuranceClaim = (claim: InsuranceClaim) => {
    const updated = [claim, ...claims];
    setClaimsState(updated);
    saveInsuranceClaims(updated);
  };

  const handleUpdatePendingCheque = (cheque: PendingCheque) => {
    const updated = cheques.map(c => c.id === cheque.id ? cheque : c);
    setChequesState(updated);
    savePendingCheques(updated);
  };

  const handleAddPendingCheque = (cheque: PendingCheque) => {
    const updated = [cheque, ...cheques];
    setChequesState(updated);
    savePendingCheques(updated);
  };

  const handleCommissionPayout = (commissionId: string, payoutAmount: number) => {
    const updated = commissions.map(c => {
      if (c.id === commissionId) {
        const newPaid = c.amountPaid + payoutAmount;
        const newBalance = Math.max(0, c.commissionDue - newPaid);
        return {
          ...c,
          amountPaid: newPaid,
          outstandingBalance: newBalance,
          lastPaymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    });

    setCommissionsState(updated);
    saveCommissions(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Disbursed Commission', 'Commission', `Paid KSh ${payoutAmount.toLocaleString()} towards commission ID ${commissionId}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleAddCommission = (record: CommissionRecord) => {
    const updated = [record, ...commissions];
    setCommissionsState(updated);
    saveCommissions(updated);
  };

  const handleAddUser = (user: User) => {
    const updated = [...users, user];
    setUsersState(updated);
    saveUsers(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Created User Account', 'User', `Created ${user.role} account for ${user.fullName} (${user.username})`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleUpdateUser = (user: User) => {
    const updated = users.map(u => u.id === user.id ? user : u);
    setUsersState(updated);
    saveUsers(updated);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Updated User Account', 'User', `Modified account status for ${user.fullName} to ${user.status}`);
      setAuditLogsState(getStoredAuditLogs());
    }
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);

    if (currentUser) {
      addAuditLog(currentUser.fullName, currentUser.role, 'Updated System Settings', 'Settings', 'Modified firm title or court directory configuration');
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
        />

        <RegisterFirmModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={handleRegisterFirmSuccess}
        />
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
              title="Acknowledge and clear this same-day court alert"
            >
              Acknowledge ✓
            </button>
            {urgentAlerts.length > 1 && (
              <button
                onClick={() => saveAlerts([])}
                className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-[10px] border border-slate-700"
                title="Dismiss all current alerts"
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
              sessionsToday: courtSessions.filter(s => s.hearingDate === new Date().toISOString().split('T')[0]).length,
              filesOut: files.filter(f => f.currentStatus.startsWith('Out')).length,
              pendingCheques: cheques.filter(c => c.status !== 'Cleared').length,
              commissions: commissions.filter(c => c.outstandingBalance > 0).length,
              pendingReviewIntakes: unprocessedRecords.filter(r => r.status === 'Pending Review').length,
              pendingTasks: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue').length
            }}
          />
        )}

        {/* Main Content Workspace */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'super-admin' ? 'p-0 max-w-full' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'} w-full`}>
          
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
                onAddLawFirm={handleRegisterFirmSuccess}
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
              users={users}
              files={files}
              tasks={tasks}
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
                files={files}
                users={users}
                currentUser={currentUser}
                chasers={chasers}
                followUpLogs={followUpLogs}
                responsibilities={responsibilities}
                tasks={tasks}
                unprocessedRecords={unprocessedRecords}
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
                files={files}
                courtSessions={courtSessions}
                fileMovements={movements}
                claims={claims}
                cheques={cheques}
                commissions={commissions}
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
              files={files}
              movements={movements}
              onAddFile={handleAddFile}
              onUpdateFile={file => {
                const updated = files.map(f => f.id === file.id ? file : f);
                setFilesState(updated);
                saveFiles(updated);
              }}
              onOpenMoveModal={file => {
                setSelectedFileToMove(file);
                setActiveTab('file-tracker');
              }}
              courtStations={settings.courtStations}
              cabinets={settings.cabinets}
              openNewModalInitially={openNewFileModalOnRegistry}
              unprocessedRecords={unprocessedRecords}
              onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
              fileNumberPrefix={settings.fileNumberPrefix}
              users={users}
            />
          )}

          {activeTab === 'file-tracker' && (
            <FileTrackerModule
              files={files}
              movements={movements}
              currentUser={currentUser}
              onRecordMovement={handleRecordMovement}
              selectedFileToMove={selectedFileToMove}
              onClearSelectedFileToMove={() => setSelectedFileToMove(null)}
            />
          )}

          {activeTab === 'court-diary' && (
            <CourtDiaryModule
              sessions={courtSessions}
              files={files}
              onAddSession={handleAddCourtSession}
              onNavigateToOutcome={session => {
                setPreselectedSessionForOutcome(session);
                setActiveTab('court-outcomes');
              }}
              courtStations={settings.courtStations}
            />
          )}

          {activeTab === 'court-outcomes' && (
            <CourtOutcomeModule
              outcomes={courtOutcomes}
              files={files}
              onAddOutcome={handleAddCourtOutcome}
              preselectedSession={preselectedSessionForOutcome}
            />
          )}

          {activeTab === 'bring-up' && (
            <BringUpModule
              bringUpItems={bringUpItems}
              onToggleRetrieved={handleToggleBringUpRetrieved}
            />
          )}

          {activeTab === 'advocates' && (
            <StaffModules files={files} users={users} roleFilter="Advocate" />
          )}

          {activeTab === 'secretaries' && (
            <StaffModules files={files} users={users} roleFilter="Secretary" />
          )}

          {activeTab === 'clerks' && (
            <StaffModules files={files} users={users} roleFilter="Clerk" />
          )}

          {activeTab === 'case-chasers' && (
            <CaseChaserModule
              files={files}
              users={users}
              currentUser={currentUser}
              chasers={chasers}
              followUpLogs={followUpLogs}
              responsibilities={responsibilities}
              tasks={tasks}
              unprocessedRecords={unprocessedRecords}
              onAddUnprocessedRecord={handleAddUnprocessedRecord}
              onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
              onAddFile={handleAddFile}
              onAddFollowUpLog={handleAddFollowUpLog}
              onUpdateResponsibility={handleUpdateResponsibility}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onUpdateChaserProfile={handleUpdateChaserProfile}
            />
          )}

          {activeTab === 'unprocessed-bucket' && (
            <UnprocessedSourcingModule
              unprocessedRecords={unprocessedRecords}
              onUpdateUnprocessedRecord={handleUpdateUnprocessedRecord}
              onAddFile={handleAddFile}
              files={files}
              courtStations={settings.courtStations}
              cabinets={settings.cabinets}
              fileNumberPrefix={settings.fileNumberPrefix}
              users={users}
              currentUser={currentUser}
            />
          )}



          {activeTab === 'insurance' && (
            <InsuranceModule
              claims={claims}
              files={files}
              onUpdateClaim={handleUpdateInsuranceClaim}
              onAddClaim={handleAddInsuranceClaim}
            />
          )}

          {activeTab === 'pending-cheques' && (
            <ChequesModule
              cheques={cheques}
              files={files}
              onUpdateCheque={handleUpdatePendingCheque}
              onAddCheque={handleAddPendingCheque}
            />
          )}

          {activeTab === 'commission-tracker' && (
            <CommissionModule
              commissions={commissions}
              files={files}
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
              files={files}
              courtSessions={courtSessions}
              bringUpItems={bringUpItems}
              claims={claims}
              cheques={cheques}
              commissions={commissions}
              movements={movements}
            />
          )}

          {activeTab === 'user-management' && (
            <UserManagementModule
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              settings={settings}
              currentUser={currentUser}
              onSaveSettings={handleSaveSettings}
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

      <RegisterFirmModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterFirmSuccess}
      />

    </div>
  );
}
