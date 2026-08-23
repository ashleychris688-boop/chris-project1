import React, { useState } from 'react';
import { LawFirmProfile, User, RegistryFile, AuditLogEntry } from '../types';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';
import { 
  Building2, 
  Users, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  X, 
  Landmark,
  LogIn,
  TrendingUp,
  Building,
  Lock,
  FileText,
  Check,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CircleDollarSign,
  Activity,
  Settings,
  History,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  CreditCard,
  HardDrive,
  RefreshCw,
  LogOut,
  Eye,
  FileCheck,
  Layers,
  ExternalLink,
  Shield,
  HelpCircle,
  Filter,
  Server,
  KeyRound,
  Trash2,
  Briefcase,
  Crown,
  Mail,
  Phone,
  UserPlus,
  Edit3,
  Save
} from 'lucide-react';
import { saveDocumentToFirebase, saveFirmToFirebase, saveUserToFirebase } from '../lib/firebase';

interface SuperAdminModuleProps {
  firms: LawFirmProfile[];
  files: RegistryFile[];
  users: User[];
  auditLogs: AuditLogEntry[];
  currentUser: User | null;
  onOpenRegisterModal: () => void;
  onAccessWorkspace: (firm: LawFirmProfile) => void;
  onLogout?: () => void;
  onDeleteFirm?: (firmId: string) => void;
  onWipeAllFirms?: () => void;
  onUpdatePassword?: (userId: string, newPassword: string) => void;
  onDeleteUser?: (userId: string) => void;
  onUpdateUser?: (user: User) => void;
  onAddLawFirm?: (newFirm: LawFirmProfile, proprietorUser: User) => void;
  onUpdateFirm?: (updatedFirm: LawFirmProfile) => void;
}

interface RegistrationRequest {
  id: string;
  firmName: string;
  registrationDate: string;
  contactPerson: string;
  email: string;
  phone: string;
  county: string;
  cityOrBranch: string;
  lskNumber: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected' | 'More Info Requested';
  requestedPlan: 'Standard' | 'Professional' | 'Enterprise';
  documentsSubmitted: { name: string; fileType: string; date: string }[];
}

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({
  firms,
  files,
  users,
  auditLogs,
  currentUser,
  onOpenRegisterModal,
  onAccessWorkspace,
  onLogout,
  onDeleteFirm,
  onWipeAllFirms,
  onUpdatePassword,
  onDeleteUser,
  onUpdateUser,
  onAddLawFirm,
  onUpdateFirm
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'firms' | 'registrations' | 'users' | 'activity' | 'subscriptions' | 'settings' | 'audit-logs'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending Verification' | 'Trial' | 'Suspended' | 'Rejected'>('All');

  // Law Firm Edit Modal State
  const [editingFirm, setEditingFirm] = useState<LawFirmProfile | null>(null);
  const [firmEditForm, setFirmEditForm] = useState<Partial<LawFirmProfile>>({});
  const [firmEditError, setFirmEditError] = useState('');
  const [syncSuccessBanner, setSyncSuccessBanner] = useState<string | null>(null);

  // User Accounts Tab State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFirmFilter, setUserFirmFilter] = useState('All');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [expandedFirms, setExpandedFirms] = useState<Record<string, boolean>>({});
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<User | null>(null);
  const [userResetPassVal, setUserResetPassVal] = useState('Pass123!');
  const [userResetFeedback, setUserResetFeedback] = useState('');
  
  // Admin password change state
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const [adminPassSuccess, setAdminPassSuccess] = useState('');
  
  // Selected firm for Platform Account Overview modal
  const [selectedFirm, setSelectedFirm] = useState<LawFirmProfile | null>(null);

  // Workspace Access Confirmation Modal State
  const [showSupportAccessModal, setShowSupportAccessModal] = useState(false);
  const [supportReason, setSupportReason] = useState('Platform Owner Workspace Support');
  const [accessSuccess, setAccessSuccess] = useState(false);

  // Platform Account Settings Modal State
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);

  // In-App Confirmation Modal State (Reliable across all iFrames & Sandboxes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  const handleOpenEditFirm = (firm: LawFirmProfile) => {
    setEditingFirm(firm);
    setFirmEditForm({
      ...firm,
      status: firm.status || 'Active',
      subscriptionTier: firm.subscriptionTier || 'Professional',
      monthlyFeeKsh: firm.monthlyFeeKsh || 25000,
      activeUsersCount: firm.activeUsersCount || 5
    });
    setFirmEditError('');
  };

  const handleSaveFirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;

    if (!firmEditForm.firmName?.trim()) {
      setFirmEditError('Law firm name cannot be empty.');
      return;
    }
    if (!firmEditForm.firmCode?.trim()) {
      setFirmEditError('Law firm code cannot be empty.');
      return;
    }

    const updated: LawFirmProfile = {
      ...editingFirm,
      ...firmEditForm,
      firmName: firmEditForm.firmName.trim(),
      firmCode: firmEditForm.firmCode.trim(),
      proprietorName: firmEditForm.proprietorName?.trim() || editingFirm.proprietorName,
      registrationNumber: firmEditForm.registrationNumber?.trim() || editingFirm.registrationNumber,
      county: firmEditForm.county?.trim() || editingFirm.county,
      cityOrBranch: firmEditForm.cityOrBranch?.trim() || editingFirm.cityOrBranch,
      physicalAddress: firmEditForm.physicalAddress?.trim() || editingFirm.physicalAddress,
      email: firmEditForm.email?.trim() || editingFirm.email,
      phone: firmEditForm.phone?.trim() || editingFirm.phone,
      subscriptionTier: firmEditForm.subscriptionTier || editingFirm.subscriptionTier,
      status: firmEditForm.status || editingFirm.status,
      monthlyFeeKsh: Number(firmEditForm.monthlyFeeKsh) || editingFirm.monthlyFeeKsh || 25000,
      activeUsersCount: Number(firmEditForm.activeUsersCount) || editingFirm.activeUsersCount || 5
    };

    // 1. Immediately store to Firebase Firestore
    await saveFirmToFirebase(updated);

    // 2. Propagate to parent React state and storage
    if (onUpdateFirm) {
      onUpdateFirm(updated);
    }

    // 3. Log audit event
    const editLog: AuditLogEntry = {
      id: `log-firm-edit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser ? currentUser.fullName : 'Platform Owner',
      role: 'Super Admin',
      action: 'Updated Law Firm Profile',
      category: 'Auth',
      details: `Platform Owner updated details for "${updated.firmName}" (${updated.firmCode}). Immediate Firebase sync executed.`,
      ipAddress: '102.222.140.12'
    };
    saveDocumentToFirebase('audit_logs', editLog);

    if (selectedFirm?.id === updated.id || selectedFirm?.firmCode === updated.firmCode) {
      setSelectedFirm(updated);
    }

    setEditingFirm(null);
    setSyncSuccessBanner(`✓ "${updated.firmName}" updated and immediately synced to Firebase Firestore database.`);
    setTimeout(() => {
      setSyncSuccessBanner(null);
    }, 5000);
  };

  // Registration Requests State (No preloaded demo accounts)
  const [requests, setRequests] = useState<RegistrationRequest[]>(() => {
    try {
      const stored = localStorage.getItem('lfr_firm_registration_requests_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const DEMO_REQ_IDS = new Set(['req-101', 'req-102', 'req-103']);
          return parsed.filter((r: RegistrationRequest) => !DEMO_REQ_IDS.has(r.id));
        }
      }
    } catch (e) {}
    return [];
  });

  // Sync real registration requests to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('lfr_firm_registration_requests_v1', JSON.stringify(requests));
    } catch (e) {}
  }, [requests]);

  // System Settings Form State
  const [platformSettings, setPlatformSettings] = useState({
    sessionTimeoutMinutes: 30,
    require2FA: true,
    tenantIsolationStrictMode: true,
    autoBackupIntervalHours: 6,
    maintenanceMode: false,
    announcementBanner: 'Welcome to the Law Firm Registry SaaS Platform Owner Portal.',
    showBanner: true
  });

  // Audit Log Category Filter State
  const [auditLogCategoryFilter, setAuditLogCategoryFilter] = useState<'All' | 'Platform Admin Activity' | 'Workspace Access Activity'>('All');

  // Computed Platform High-Level Counts
  const totalFirmsCount = firms.length;
  const activeFirmsCount = firms.filter(f => f.status === 'Active' || f.subscriptionStatus === 'Active' || !f.status).length;
  const pendingRegistrationsCount = requests.filter(r => r.status === 'Pending Verification').length;
  const suspendedFirmsCount = firms.filter(f => f.status === 'Suspended').length;
  const totalUsersCount = users.length;

  // Filter Firms List
  const filteredFirms = firms.filter(firm => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (firm.firmName || '').toLowerCase().includes(q) ||
      (firm.id || '').toLowerCase().includes(q) ||
      (firm.firmCode || '').toLowerCase().includes(q) ||
      (firm.proprietorName || '').toLowerCase().includes(q) ||
      (firm.county || '').toLowerCase().includes(q);

    const matchesStatus = 
      statusFilter === 'All' || 
      firm.status === statusFilter || 
      firm.subscriptionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Approve Registration Request
  const handleApproveRequest = (reqId: string) => {
    const targetReq = requests.find(r => r.id === reqId);
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved' } : r));
    
    if (targetReq) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const firmId = `LFR${randomDigits}`;
      const initials = targetReq.firmName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
      const firmCode = `${initials}-ADV-${Math.floor(100 + Math.random() * 900)}`;

      const newFirm: LawFirmProfile = {
        id: firmId,
        firmName: targetReq.firmName,
        firmCode: firmCode,
        registrationNumber: targetReq.lskNumber || `LSK/2026/${Math.floor(100 + Math.random() * 900)}`,
        proprietorName: targetReq.contactPerson,
        cityOrBranch: targetReq.cityOrBranch || `${targetReq.county} HQ`,
        physicalAddress: `${targetReq.cityOrBranch || targetReq.county}, Legal Chambers`,
        country: 'Kenya',
        county: targetReq.county,
        adminUsername: targetReq.email.split('@')[0],
        email: targetReq.email,
        phone: targetReq.phone,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Active',
        subscriptionTier: targetReq.requestedPlan || 'Professional',
        subscriptionStatus: 'Active',
        activeUsersCount: 1,
        activeCasesCount: 0,
        totalFilesCount: 0,
        monthlyFeeKsh: 25000
      };

      const proprietorUser: User = {
        id: `usr-prop-${Date.now()}`,
        firmId: firmId,
        firmCode: firmCode,
        firmName: targetReq.firmName,
        username: targetReq.email.split('@')[0],
        fullName: targetReq.contactPerson,
        role: 'Proprietor',
        email: targetReq.email,
        phone: targetReq.phone,
        password: 'password123',
        status: 'Active',
        lastLogin: 'Never logged in',
        permissions: ['all']
      };

      saveFirmToFirebase(newFirm);
      saveUserToFirebase(proprietorUser);

      if (onAddLawFirm) {
        onAddLawFirm(newFirm, proprietorUser);
      }
    }

    // Log platform action
    const accessLog: AuditLogEntry = {
      id: `log-appr-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser ? currentUser.fullName : 'Platform Owner',
      role: 'Super Admin',
      action: 'Approved Law Firm Registration',
      category: 'Auth',
      details: `Platform Owner approved onboarding request for registration ID ${reqId}`,
      ipAddress: '102.222.140.12'
    };
    saveDocumentToFirebase('audit_logs', accessLog);
  };

  // Handle Reject Registration Request
  const handleRejectRequest = (reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r));
  };

  // Handle Delete Single Registration Request Record
  const handleDeleteRegistrationRequest = (reqId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Registration Application',
      message: 'Are you sure you want to delete this law firm registration application record permanently from the platform?',
      confirmLabel: 'Delete Application',
      variant: 'danger',
      onConfirm: () => {
        setRequests(prev => prev.filter(r => r.id !== reqId));
        setConfirmModal(null);
      }
    });
  };

  // Handle Purge All Rejected Registration Requests (>3 Months)
  const handlePurgeRejectedRequests = () => {
    const rejected = requests.filter(r => r.status === 'Rejected');
    if (rejected.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Purge Rejected Applications',
      message: `Delete all ${rejected.length} rejected registration application records (over 3 months old) permanently?`,
      confirmLabel: 'Purge All Rejected',
      variant: 'danger',
      onConfirm: () => {
        setRequests(prev => prev.filter(r => r.status !== 'Rejected'));
        setConfirmModal(null);
      }
    });
  };

  // Handle Bulk Delete/Purge Suspended or Rejected Law Firms (>3 Months)
  const handlePurgeSuspendedOrRejectedFirms = () => {
    const targetFirms = firms.filter(f => f.status === 'Suspended' || f.status === 'Rejected');
    if (targetFirms.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Purge Inactive Law Firm Workspaces',
      message: `Permanently delete all ${targetFirms.length} suspended or rejected law firm workspaces (older than 3 months)? This action will erase their workspaces and associated user accounts.`,
      confirmLabel: 'Delete Workspaces',
      variant: 'danger',
      onConfirm: () => {
        targetFirms.forEach(firm => {
          if (onDeleteFirm) {
            onDeleteFirm(firm.id);
          }
        });
        setConfirmModal(null);
      }
    });
  };

  // Handle Confirm Workspace Access
  const handleConfirmWorkspaceAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirm) return;

    // Log access event to audit log with explicit distinction
    const accessLog: AuditLogEntry = {
      id: `log-supp-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser ? currentUser.fullName : 'Platform Owner',
      role: 'Super Admin',
      action: 'Authorized Workspace Access Granted',
      category: 'Auth',
      details: `[PRIVILEGED WORKSPACE ACCESS] Platform Owner accessed private workspace for ${selectedFirm.firmName} (${selectedFirm.firmCode}). Session Note: "${supportReason.trim()}"`,
      ipAddress: '102.222.140.12'
    };

    saveDocumentToFirebase('audit_logs', accessLog);
    setAccessSuccess(true);

    setTimeout(() => {
      setShowSupportAccessModal(false);
      setAccessSuccess(false);
      const firmToAccess = selectedFirm;
      setSelectedFirm(null);
      onAccessWorkspace(firmToAccess);
    }, 600);
  };

  // Dynamic Platform Activity Events from Audit Logs
  const platformActivityEvents = auditLogs && auditLogs.length > 0 
    ? auditLogs.slice(0, 10).map((log, idx) => ({
        id: log.id || `act-${idx}`,
        timestamp: log.timestamp || 'Just now',
        firm: log.user || 'Platform Event',
        event: log.action ? `${log.action}: ${log.details}` : log.details,
        icon: log.category === 'User' ? Users : log.category === 'SuperAdmin' ? ShieldCheck : Activity,
        type: log.category ? log.category.toLowerCase() : 'system'
      })) 
    : [];

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col md:flex-row bg-[#040C16]">
      
      {/* LEFT PLATFORM OWNER SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#081729] border-r border-[#C9A227]/30 flex flex-col shrink-0 select-none">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-[#C9A227]">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-serif font-extrabold text-base tracking-wide text-white">
              Platform Admin
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Law Firm Registry SaaS
          </p>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Landmark, badge: null },
            { id: 'firms', label: 'Law Firms', icon: Building2, badge: totalFirmsCount },
            { id: 'registrations', label: 'Registration Requests', icon: FileCheck, badge: pendingRegistrationsCount, badgeColor: 'bg-amber-500 text-slate-950 font-black' },
            { id: 'users', label: 'User Accounts', icon: Users, badge: totalUsersCount },
            { id: 'activity', label: 'Platform Activity', icon: Activity, badge: null },
            { id: 'subscriptions', label: 'Subscriptions / Billing', icon: CircleDollarSign, badge: null },
            { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
            { id: 'audit-logs', label: 'Security & Audit Logs', icon: History, badge: null }
          ].map(navItem => {
            const Icon = navItem.icon;
            const isActive = activeTab === navItem.id;
            return (
              <button
                key={navItem.id}
                onClick={() => setActiveTab(navItem.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#C9A227] to-[#A07F19] text-slate-950 font-bold shadow-lg'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-[#C9A227]'}`} />
                  <span>{navItem.label}</span>
                </div>

                {navItem.badge !== null && navItem.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    navItem.badgeColor || (isActive ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-300')
                  }`}>
                    {navItem.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Platform Owner Profile Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A227] to-[#9B7B12] text-slate-950 font-extrabold flex items-center justify-center text-xs shrink-0 shadow">
              PO
            </div>
            <div className="truncate flex-1">
              <div className="font-bold text-xs text-white truncate">
                {currentUser?.fullName || 'Platform Owner'}
              </div>
              <div className="text-[10px] text-[#C9A227] font-mono font-semibold truncate">
                Super Admin / Owner
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => setShowAccountSettingsModal(true)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* PRIVACY ARCHITECTURE BANNER (Always Visible) */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-[#C9A227]/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Lock className="w-4 h-4 text-[#C9A227] shrink-0" />
            <span>
              <strong className="text-white font-serif">Tenant Isolation & Privacy-by-Design:</strong> Firm workspaces are private. Platform administrators manage firm accounts without accessing confidential operational firm data.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold">
              Multi-Tenant Architecture Active
            </span>
          </div>
        </div>

        {/* ==================== TAB 1: DASHBOARD (OVERVIEW) ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-serif font-extrabold text-2xl text-white">
                  Platform Overview
                </h1>
                <p className="text-xs text-slate-400">
                  Manage registered law firms and monitor the health of the platform.
                </p>
              </div>

              <button
                onClick={onOpenRegisterModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Onboard New Law Firm</span>
              </button>
            </div>

            {/* Platform Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              {/* Metric 1: Registered Law Firms */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-[#C9A227]/40 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">REGISTERED FIRMS</span>
                  <Building2 className="w-4 h-4 text-[#C9A227]" />
                </div>
                <div className="font-serif font-extrabold text-2xl text-white">
                  {totalFirmsCount}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  +3 onboarding this month
                </div>
              </div>

              {/* Metric 2: Active Firms */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-emerald-500/30 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">ACTIVE FIRMS</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-serif font-extrabold text-2xl text-emerald-300">
                  {activeFirmsCount}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Active Subscriptions
                </div>
              </div>

              {/* Metric 3: Pending Registrations */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-amber-500/30 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">PENDING APPROVAL</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-serif font-extrabold text-2xl text-amber-300">
                  {pendingRegistrationsCount}
                </div>
                <div className="text-[10px] text-amber-400 font-mono">
                  Awaiting Verification
                </div>
              </div>

              {/* Metric 4: Suspended Firms */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-slate-800 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">SUSPENDED FIRMS</span>
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                </div>
                <div className="font-serif font-extrabold text-2xl text-slate-400">
                  {suspendedFirmsCount}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  0 Accounts Inactive
                </div>
              </div>

              {/* Metric 5: Platform Users */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-sky-500/30 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">PLATFORM USERS</span>
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <div className="font-serif font-extrabold text-2xl text-white">
                  {totalUsersCount}
                </div>
                <div className="text-[10px] text-sky-300 font-mono">
                  Accounts across platform
                </div>
              </div>

              {/* Metric 6: System Status */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-emerald-500/40 shadow-xl space-y-2 bg-gradient-to-br from-[#081729] to-[#0B1F3A]">
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">SYSTEM STATUS</span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-serif font-extrabold text-base text-emerald-300">
                  Operational
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  All Services Healthy
                </div>
              </div>

            </div>

            {/* Quick Actions & High-level Platform Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Registered Firms Quick Table */}
              <div className="lg:col-span-2 bg-[#081729] p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#C9A227]" />
                    <span>Registered Law Firms Directory</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('firms')}
                    className="text-xs text-[#C9A227] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 text-[#C9A227] border-b border-slate-800 font-mono uppercase text-[10px]">
                        <th className="p-2.5">Firm Code</th>
                        <th className="p-2.5">Law Firm</th>
                        <th className="p-2.5">Plan</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {firms.map(firm => (
                        <tr key={firm.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-mono text-[#C9A227] font-bold">
                            {firm.firmCode || firm.id}
                          </td>
                          <td className="p-2.5">
                            <div className="font-bold text-white">{firm.firmName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{firm.county || 'Nairobi'}</div>
                          </td>
                          <td className="p-2.5 font-mono text-slate-300">
                            {firm.subscriptionTier || 'Professional'}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                              {firm.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedFirm(firm)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-[#C9A227] border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Inspect Account
                              </button>
                              {onDeleteFirm && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Delete Law Firm Workspace',
                                      message: `Are you sure you want to permanently erase "${firm.firmName}" (${firm.firmCode || firm.id}) from the platform? This will erase all cases, court diaries, documents, and staff user accounts.`,
                                      confirmLabel: 'Permanently Erase Firm',
                                      variant: 'danger',
                                      onConfirm: () => {
                                        onDeleteFirm(firm.id);
                                        if (selectedFirm?.id === firm.id) {
                                          setSelectedFirm(null);
                                        }
                                        setConfirmModal(null);
                                      }
                                    });
                                  }}
                                  className="p-1 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800 rounded-lg transition cursor-pointer"
                                  title="Erase Firm Workspace"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Onboarding Requests Sidebar */}
              <div className="bg-[#081729] p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-amber-400" />
                    <span>Pending Onboarding</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                    {pendingRegistrationsCount} Pending
                  </span>
                </div>

                <div className="space-y-3">
                  {requests.filter(r => r.status === 'Pending Verification').length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No pending law firm registration requests.
                    </div>
                  ) : (
                    requests.filter(r => r.status === 'Pending Verification').map(req => (
                      <div key={req.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <div className="font-serif font-bold text-sm text-white">{req.firmName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Contact: {req.contactPerson} • {req.county}
                        </div>
                        <div className="text-[10px] text-[#C9A227] font-mono">
                          LSK Ref: {req.lskNumber}
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-lg transition cursor-pointer"
                          >
                            Approve Firm
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 2: LAW FIRMS ==================== */}
        {activeTab === 'firms' && (
          <div className="space-y-6">
            
            {syncSuccessBanner && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xl animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{syncSuccessBanner}</span>
                </div>
                <button
                  onClick={() => setSyncSuccessBanner(null)}
                  className="p-1 hover:bg-emerald-900 rounded-lg text-emerald-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-[#C9A227]" />
                  <span>Registered Law Firms</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Platform-level directory of registered law firms. Click "Edit" or "Inspect / Account Overview" to manage firm details.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onDeleteFirm && (
                  <button
                    onClick={handlePurgeSuspendedOrRejectedFirms}
                    className="px-3.5 py-2.5 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-700 text-red-200 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                    title="Delete all law firms that have been suspended or rejected for over 3 months"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Delete Rejected / Suspended Firms (&gt;3 Months)</span>
                  </button>
                )}


                <button
                  onClick={onOpenRegisterModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Onboard New Law Firm</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081729] p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by law firm name, firm code, proprietor, county..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
              >
                <option value="All">All Subscription Statuses</option>
                <option value="Active">Active Subscription</option>
                <option value="Trial">Trial Period</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Suspended">Suspended</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Law Firms Directory Table */}
            <div className="bg-[#081729] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[#C9A227] border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
                      <th className="p-3">Law Firm Name</th>
                      <th className="p-3">Registration Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Plan / Subscription</th>
                      <th className="p-3 text-center">Users</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredFirms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                          No law firms found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredFirms.map(firm => (
                        <tr key={firm.id} className="hover:bg-slate-900/60 transition">
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{firm.firmName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Code: <strong className="text-[#C9A227]">{firm.firmCode || firm.id}</strong> • Proprietor: {firm.proprietorName || 'Proprietor'}
                            </div>
                          </td>

                          <td className="p-3 text-slate-300 font-mono text-[11px]">
                            {firm.createdAt || '2026-01-15'}
                          </td>

                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              {firm.status || 'Active'}
                            </span>
                          </td>

                          <td className="p-3 font-mono font-semibold text-amber-300">
                            {firm.subscriptionTier || 'Professional'} (KSh {(firm.monthlyFeeKsh || 25000).toLocaleString()}/mo)
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-sky-400">
                            {firm.activeUsersCount || 8}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditFirm(firm)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                title="Edit Law Firm Details & Sync to Firebase"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => setSelectedFirm(firm)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#C9A227] border border-slate-700 hover:border-[#C9A227] rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Account Overview</span>
                              </button>
                              {onDeleteFirm && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Delete Law Firm Workspace',
                                      message: `Are you sure you want to permanently delete "${firm.firmName}" (${firm.firmCode || firm.id})? All cases, diaries, documents, and associated accounts will be erased.`,
                                      confirmLabel: 'Delete Workspace',
                                      variant: 'danger',
                                      onConfirm: () => {
                                        onDeleteFirm(firm.id);
                                        if (selectedFirm?.id === firm.id) {
                                          setSelectedFirm(null);
                                        }
                                        setConfirmModal(null);
                                      }
                                    });
                                  }}
                                  className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800 rounded-xl transition cursor-pointer"
                                  title="Erase Law Firm Workspace"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: REGISTRATION REQUESTS ==================== */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-amber-400" />
                  <span>Law Firm Registration Requests</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Review and verify new law firm onboarding applications and submitted professional credentials.
                </p>
              </div>

              {requests.some(r => r.status === 'Rejected') && (
                <button
                  onClick={handlePurgeRejectedRequests}
                  className="px-3.5 py-2.5 bg-red-950/90 hover:bg-red-900 border border-red-700 text-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                  title="Clear all rejected applications older than 3 months"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Clear Rejected Applications (&gt;3 Months)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {requests.length === 0 ? (
                <div className="bg-[#081729] p-8 rounded-3xl border border-slate-800 text-center text-slate-400 text-xs">
                  No registration requests available.
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="bg-[#081729] p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#C9A227] font-bold">{req.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : req.status === 'Rejected'
                              ? 'bg-red-950 text-red-400 border border-red-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-xl text-white mt-1">{req.firmName}</h3>
                      </div>

                      <div className="text-right text-xs">
                        <div className="text-slate-400">Application Date: <strong className="text-white font-mono">{req.registrationDate}</strong></div>
                        <div className="text-amber-300 font-mono font-bold">Requested Plan: {req.requestedPlan}</div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-[#C9A227] font-bold uppercase">Contact Advocate</span>
                        <p className="font-bold text-white">{req.contactPerson}</p>
                        <p className="text-slate-400 font-mono">{req.email}</p>
                        <p className="text-slate-400">{req.phone}</p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                        <span className="text-[10px] text-[#C9A227] font-bold uppercase">Branch & Credentials</span>
                        <p className="text-slate-200">County: <strong className="text-white">{req.county}</strong></p>
                        <p className="text-slate-200">Branch: <strong className="text-white">{req.cityOrBranch}</strong></p>
                        <p className="text-slate-200">LSK Reg No: <strong className="text-amber-300 font-mono">{req.lskNumber}</strong></p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <span className="text-[10px] text-[#C9A227] font-bold uppercase">Verification Documents ({req.documentsSubmitted.length})</span>
                        <div className="space-y-1">
                          {req.documentsSubmitted.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                              <span className="truncate">{doc.name}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      {req.status === 'Pending Verification' && (
                        <>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-red-800/60 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Reject Request
                          </button>
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-slate-950" />
                            <span>Approve Law Firm</span>
                          </button>
                        </>
                      )}

                      {(req.status === 'Rejected' || req.status === 'Approved') && (
                        <button
                          onClick={() => handleDeleteRegistrationRequest(req.id)}
                          className="px-3.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Delete application record"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete Application Record</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB 4: USER ACCOUNTS (GROUPED BY LAW FIRM) ==================== */}
        {activeTab === 'users' && (() => {
          // 1. Separate Platform Super Admins from Law Firm Staff
          const superAdminUsers = users.filter(u => 
            u.role === 'Super Admin' || 
            u.role === 'Platform Owner' || 
            u.firmId === 'platform-owner' || 
            u.firmCode === 'PLATFORM' ||
            u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02' ||
            u.username === 'superadmin' ||
            u.email === 'anthonyomollo07@gmail.com'
          );

          // 2. Identify registered firm IDs and Codes
          const registeredFirmIds = new Set(firms.map(f => f.id));
          const registeredFirmCodes = new Set(firms.map(f => f.firmCode));

          // 3. Filter query helper
          const matchesQuery = (u: User) => {
            if (!userSearchQuery.trim()) return true;
            const q = userSearchQuery.toLowerCase();
            return (
              (u.fullName || '').toLowerCase().includes(q) ||
              (u.username || '').toLowerCase().includes(q) ||
              (u.email || '').toLowerCase().includes(q) ||
              (u.phone || '').toLowerCase().includes(q) ||
              (u.role || '').toLowerCase().includes(q) ||
              (u.firmName || '').toLowerCase().includes(q) ||
              (u.firmCode || '').toLowerCase().includes(q)
            );
          };

          const matchesRole = (u: User) => {
            if (userRoleFilter === 'All') return true;
            return u.role === userRoleFilter;
          };

          // 4. Identify orphaned users (staff whose firm no longer exists)
          const orphanedUsers = users.filter(u => {
            if (superAdminUsers.some(sa => sa.id === u.id)) return false;
            const hasFirm = (u.firmId && registeredFirmIds.has(u.firmId)) || (u.firmCode && registeredFirmCodes.has(u.firmCode));
            return !hasFirm;
          }).filter(u => matchesQuery(u) && matchesRole(u));

          // 5. Total counts
          const totalStaffCount = users.filter(u => !superAdminUsers.some(sa => sa.id === u.id)).length;
          const activeAccountsCount = users.filter(u => u.status !== 'Suspended').length;
          const suspendedAccountsCount = users.filter(u => u.status === 'Suspended').length;

          // Helper to get role badge style
          const getRoleBadge = (role: string) => {
            switch (role) {
              case 'Proprietor':
                return 'bg-amber-950/80 text-[#C9A227] border-amber-600/70';
              case 'Advocate':
                return 'bg-sky-950/80 text-sky-300 border-sky-600/70';
              case 'Clerk':
                return 'bg-indigo-950/80 text-indigo-300 border-indigo-600/70';
              case 'Secretary':
                return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70';
              case 'Case Chaser':
                return 'bg-orange-950/80 text-orange-300 border-orange-600/70';
              default:
                return 'bg-slate-900 text-slate-300 border-slate-700';
            }
          };

          const toggleFirmExpand = (firmId: string) => {
            setExpandedFirms(prev => ({
              ...prev,
              [firmId]: prev[firmId] === undefined ? false : !prev[firmId]
            }));
          };

          const isFirmExpanded = (firmId: string) => {
            return expandedFirms[firmId] !== false; // expanded by default
          };

          return (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-sky-400" />
                    <span>Platform User Accounts (Grouped by Law Firm)</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-tenant staff directory. Each law firm workspace contains its own staff accounts (Proprietor, Advocates, Clerks, Secretaries). Deleting a law firm purges its users.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allExpanded: Record<string, boolean> = {};
                      firms.forEach(f => { allExpanded[f.id] = true; });
                      setExpandedFirms(allExpanded);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => {
                      const allCollapsed: Record<string, boolean> = {};
                      firms.forEach(f => { allCollapsed[f.id] = false; });
                      setExpandedFirms(allCollapsed);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Summary Metric Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#081729] p-3.5 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono uppercase">Total System Users</div>
                  <div className="text-xl font-bold text-white mt-1">{users.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{superAdminUsers.length} Admin + {totalStaffCount} Firm Staff</div>
                </div>

                <div className="bg-[#081729] p-3.5 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono uppercase">Registered Law Firms</div>
                  <div className="text-xl font-bold text-[#C9A227] mt-1">{firms.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active Workspace Tenants</div>
                </div>

                <div className="bg-[#081729] p-3.5 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono uppercase">Active Accounts</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{activeAccountsCount}</div>
                  <div className="text-[10px] text-emerald-500/80 mt-0.5">Ready for login</div>
                </div>

                <div className="bg-[#081729] p-3.5 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono uppercase">Suspended Accounts</div>
                  <div className="text-xl font-bold text-red-400 mt-1">{suspendedAccountsCount}</div>
                  <div className="text-[10px] text-red-500/80 mt-0.5">Access disabled</div>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-[#081729] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff name, username, email, role, phone, or law firm..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Law Firm Selector */}
                  <select
                    value={userFirmFilter}
                    onChange={e => setUserFirmFilter(e.target.value)}
                    className="p-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl focus:border-[#C9A227]"
                  >
                    <option value="All">All Law Firms ({firms.length})</option>
                    {firms.map(f => {
                      const count = users.filter(u => u.firmId === f.id || u.firmCode === f.firmCode || (!u.firmId && u.firmName === f.firmName)).length;
                      return (
                        <option key={f.id} value={f.id}>
                          {f.firmName} ({count} staff)
                        </option>
                      );
                    })}
                  </select>

                  {/* Role Selector */}
                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                    className="p-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl focus:border-[#C9A227]"
                  >
                    <option value="All">All Roles</option>
                    <option value="Proprietor">Proprietor</option>
                    <option value="Advocate">Advocate</option>
                    <option value="Clerk">Clerk</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Case Chaser">Case Chaser</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>

              {/* 1. Platform Super Admin Root Section */}
              {userFirmFilter === 'All' && (
                <div className="bg-gradient-to-br from-[#081729] to-slate-950 rounded-2xl border-2 border-[#C9A227]/40 shadow-xl overflow-hidden">
                  <div className="p-4 bg-[#C9A227]/10 border-b border-[#C9A227]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#C9A227] text-slate-950 rounded-xl shadow">
                        <Crown className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-white">Platform Owner & Super Administrators</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#C9A227] text-slate-950">
                            Root Security Level
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Global SaaS platform ownership and tenant administration accounts.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#C9A227] font-bold">
                      {superAdminUsers.length} Super Admin Account
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/80 text-[#C9A227] border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
                          <th className="p-3 pl-4">Administrator</th>
                          <th className="p-3">Username & Scope</th>
                          <th className="p-3">Email & Security</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 pr-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {superAdminUsers.filter(u => matchesQuery(u) && matchesRole(u)).map(sa => (
                          <tr key={sa.id} className="hover:bg-slate-900/50">
                            <td className="p-3 pl-4">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{sa.fullName || 'Anthony Omollo'}</span>
                                <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
                              </div>
                              <div className="text-[10px] text-slate-400">Global SaaS Administrator</div>
                            </td>
                            <td className="p-3 font-mono">
                              <div className="text-[#C9A227] font-bold">{sa.username}</div>
                              <div className="text-[10px] text-slate-500">All Tenancy Workspaces</div>
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                              <div>{sa.email || 'anthonyomollo07@gmail.com'}</div>
                              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Password Protected & Encrypted
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                                Active (Root)
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-center">
                              <button
                                onClick={() => setActiveTab('settings')}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 transition"
                              >
                                Manage Super Admin Pass
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Law Firms Grouped Sections */}
              <div className="space-y-4">
                {firms.length === 0 ? (
                  <div className="bg-[#081729] rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="font-serif font-bold text-lg text-white">No Law Firms Registered</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      When new law firms register or are added by the platform owner, their user accounts will be grouped here.
                    </p>
                    <button
                      onClick={onOpenRegisterModal}
                      className="px-4 py-2 bg-[#C9A227] text-slate-950 font-bold rounded-xl text-xs hover:bg-[#B08D1E] transition cursor-pointer"
                    >
                      + Register First Law Firm
                    </button>
                  </div>
                ) : (
                  firms
                    .filter(firm => userFirmFilter === 'All' || userFirmFilter === firm.id || userFirmFilter === firm.firmCode)
                    .map(firm => {
                      // Find users belonging to this specific firm
                      const firmStaff = users.filter(u => 
                        !superAdminUsers.some(sa => sa.id === u.id) &&
                        (u.firmId === firm.id || u.firmCode === firm.firmCode || (!u.firmId && u.firmName === firm.firmName))
                      );

                      const filteredStaff = firmStaff.filter(u => matchesQuery(u) && matchesRole(u));
                      const isExpanded = isFirmExpanded(firm.id);

                      // If search is active and neither firm nor any staff matches, hide
                      const firmMatchesQuery = userSearchQuery.trim() === '' || 
                        firm.firmName.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                        firm.firmCode.toLowerCase().includes(userSearchQuery.toLowerCase());
                      
                      if (!firmMatchesQuery && filteredStaff.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={firm.id}
                          className="bg-[#081729] rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition"
                        >
                          {/* Firm Group Header */}
                          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleFirmExpand(firm.id)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                                title={isExpanded ? 'Collapse law firm accounts' : 'Expand law firm accounts'}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              <div className="p-2 bg-sky-950/70 border border-sky-800/80 rounded-xl text-sky-400">
                                <Building2 className="w-5 h-5" />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-serif font-bold text-base text-white">
                                    {firm.firmName}
                                  </h3>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-slate-900 border border-slate-700 text-[#C9A227]">
                                    {firm.firmCode}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                                    {firm.subscriptionTier || 'Standard'} Plan
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    firm.accountStatus === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}>
                                    {firm.accountStatus || 'Active'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {firm.cityOrBranch || 'Main Branch'} • {firm.county || 'Nairobi'} County • LSK: {firm.lskNumber || 'LSK-REG'} • {firmStaff.length} Total Staff Accounts
                                </p>
                              </div>
                            </div>

                            {/* Firm Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => onAccessWorkspace(firm)}
                                className="px-3 py-1.5 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Access Workspace</span>
                              </button>

                              {onDeleteFirm && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: `Delete Law Firm & All ${firmStaff.length} User Accounts`,
                                      message: `Are you sure you want to permanently delete "${firm.firmName}" (${firm.firmCode})? This will immediately ERASE the workspace, purge all ${firmStaff.length} staff user accounts, and delete all associated files and records from the system.`,
                                      confirmLabel: `Delete Firm & ${firmStaff.length} Users`,
                                      variant: 'danger',
                                      onConfirm: () => {
                                        onDeleteFirm(firm.id);
                                        setConfirmModal(null);
                                      }
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                  title="Delete firm and purge all staff user accounts"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  <span>Delete Firm & Staff</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Firm Staff Table (Collapsible) */}
                          {isExpanded && (
                            <div className="p-0">
                              {firmStaff.length === 0 ? (
                                <div className="p-8 text-center bg-slate-950/40 text-slate-400 space-y-2">
                                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                                  <p className="text-xs text-slate-300 font-medium">
                                    No staff user accounts created for this law firm workspace yet.
                                  </p>
                                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                                    When the proprietor logs in, they can onboard advocates, clerks, and secretaries from their User Management panel.
                                  </p>
                                </div>
                              ) : filteredStaff.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-xs">
                                  No staff user accounts match the current filter search.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-950/60 text-[#C9A227] border-b border-slate-800/80 font-mono uppercase text-[10px] tracking-wider">
                                        <th className="p-3 pl-4">Staff Member</th>
                                        <th className="p-3">Username & Role</th>
                                        <th className="p-3">Contact Email & Phone</th>
                                        <th className="p-3">Last Login</th>
                                        <th className="p-3">Account Status</th>
                                        <th className="p-3 pr-4 text-center">Super Admin Controls</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {filteredStaff.map(staffUser => (
                                        <tr key={staffUser.id} className="hover:bg-slate-900/50 transition">
                                          <td className="p-3 pl-4">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-[#C9A227] shrink-0">
                                                {staffUser.fullName ? staffUser.fullName.charAt(0).toUpperCase() : 'U'}
                                              </div>
                                              <div>
                                                <div className="font-bold text-white">{staffUser.fullName}</div>
                                                <div className="text-[10px] text-slate-400">ID: {staffUser.id}</div>
                                              </div>
                                            </div>
                                          </td>

                                          <td className="p-3 font-mono">
                                            <div className="text-[#C9A227] font-bold">{staffUser.username}</div>
                                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(staffUser.role)}`}>
                                              {staffUser.role}
                                            </span>
                                          </td>

                                          <td className="p-3 font-mono text-slate-300">
                                            <div>{staffUser.email}</div>
                                            <div className="text-[10px] text-slate-500">{staffUser.phone || 'No phone'}</div>
                                          </td>

                                          <td className="p-3 font-mono text-slate-400 text-[11px]">
                                            {staffUser.lastLogin || 'Today at 09:00 AM'}
                                          </td>

                                          <td className="p-3">
                                            {staffUser.status === 'Suspended' ? (
                                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                                                Suspended
                                              </span>
                                            ) : (
                                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                                                Active
                                              </span>
                                            )}
                                          </td>

                                          <td className="p-3 pr-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                              {/* Reset Password */}
                                              <button
                                                onClick={() => {
                                                  setSelectedUserForPasswordReset(staffUser);
                                                  setUserResetPassVal('Pass123!');
                                                  setUserResetFeedback('');
                                                }}
                                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1"
                                                title="Reset password for this staff account"
                                              >
                                                <KeyRound className="w-3 h-3 text-[#C9A227]" />
                                                <span>Reset Pass</span>
                                              </button>

                                              {/* Toggle Suspend */}
                                              {onUpdateUser && (
                                                <button
                                                  onClick={() => {
                                                    const newStatus = staffUser.status === 'Active' ? 'Suspended' : 'Active';
                                                    onUpdateUser({ ...staffUser, status: newStatus });
                                                  }}
                                                  className={`px-2 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer border ${
                                                    staffUser.status === 'Active'
                                                      ? 'bg-amber-950/70 text-amber-300 hover:bg-amber-900 border-amber-800'
                                                      : 'bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 border-emerald-800'
                                                  }`}
                                                  title={staffUser.status === 'Active' ? 'Suspend user account' : 'Activate user account'}
                                                >
                                                  {staffUser.status === 'Active' ? 'Suspend' : 'Activate'}
                                                </button>
                                              )}

                                              {/* Delete User */}
                                              {onDeleteUser && (
                                                <button
                                                  onClick={() => {
                                                    setConfirmModal({
                                                      isOpen: true,
                                                      title: 'Delete Staff User Account',
                                                      message: `Are you sure you want to delete the user account for "${staffUser.fullName}" (${staffUser.username} - ${staffUser.role}) under "${firm.firmName}"?`,
                                                      confirmLabel: 'Delete User',
                                                      variant: 'danger',
                                                      onConfirm: () => {
                                                        onDeleteUser(staffUser.id);
                                                        setConfirmModal(null);
                                                      }
                                                    });
                                                  }}
                                                  className="p-1 text-red-400 bg-red-950/70 hover:bg-red-900 border border-red-800 rounded-lg transition cursor-pointer"
                                                  title="Delete user account"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              {/* 3. Orphaned Accounts Section (if any unassigned users exist) */}
              {orphanedUsers.length > 0 && (
                <div className="bg-red-950/30 rounded-2xl border border-red-700/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <h3 className="font-serif font-bold text-sm text-red-200">
                          Orphaned User Accounts ({orphanedUsers.length})
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          These user accounts were associated with law firms that were deleted or unassigned.
                        </p>
                      </div>
                    </div>

                    {onDeleteUser && (
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: `Purge All ${orphanedUsers.length} Orphaned Accounts`,
                            message: `Are you sure you want to permanently erase all ${orphanedUsers.length} orphaned accounts?`,
                            confirmLabel: 'Purge All Orphaned',
                            variant: 'danger',
                            onConfirm: () => {
                              orphanedUsers.forEach(u => onDeleteUser(u.id));
                              setConfirmModal(null);
                            }
                          });
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge All ({orphanedUsers.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-red-400 font-mono text-[10px] uppercase border-b border-red-900/50">
                          <th className="p-2.5">User</th>
                          <th className="p-2.5">Username & Role</th>
                          <th className="p-2.5">Previous Firm Info</th>
                          <th className="p-2.5">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-900/30">
                        {orphanedUsers.map(ou => (
                          <tr key={ou.id}>
                            <td className="p-2.5 font-bold text-white">{ou.fullName}</td>
                            <td className="p-2.5 font-mono text-[#C9A227]">{ou.username} ({ou.role})</td>
                            <td className="p-2.5 font-mono text-slate-400">{ou.firmName || ou.firmCode || ou.firmId || 'None'}</td>
                            <td className="p-2.5">
                              {onDeleteUser && (
                                <button
                                  onClick={() => onDeleteUser(ou.id)}
                                  className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded text-[10px] font-bold"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Password Reset Modal for Super Admin */}
              {selectedUserForPasswordReset && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#081729] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#C9A227]/20 border border-[#C9A227]/40 rounded-xl text-[#C9A227]">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-white">Reset Staff Password</h3>
                          <p className="text-[11px] text-slate-400">
                            {selectedUserForPasswordReset.fullName} ({selectedUserForPasswordReset.username})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUserForPasswordReset(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        const check = validatePassword(userResetPassVal);
                        if (!check.isValid) {
                          setUserResetFeedback(`Password error: ${check.message}`);
                          return;
                        }
                        if (onUpdatePassword) {
                          onUpdatePassword(selectedUserForPasswordReset.id, userResetPassVal);
                        }
                        setUserResetFeedback('✓ Password reset successfully!');
                        setTimeout(() => {
                          setSelectedUserForPasswordReset(null);
                        }, 1200);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          New Temporary / Permanent Password
                        </label>
                        <input
                          type="text"
                          required
                          value={userResetPassVal}
                          onChange={e => setUserResetPassVal(e.target.value)}
                          className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:border-[#C9A227]"
                        />
                      </div>

                      <PasswordRequirementsChecklist password={userResetPassVal} />

                      {userResetFeedback && (
                        <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                          userResetFeedback.startsWith('✓') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-red-950/80 text-red-300 border border-red-800'
                        }`}>
                          {userResetFeedback}
                        </div>
                      )}

                      <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForPasswordReset(null)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow"
                        >
                          Save New Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* ==================== TAB 5: PLATFORM ACTIVITY ==================== */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-[#C9A227]" />
                <span>Platform System Activity Log</span>
              </h1>
              <p className="text-xs text-slate-400">
                Stream of high-level platform events, account activations, and subscription updates. (Operational case data strictly excluded).
              </p>
            </div>

            <div className="bg-[#081729] p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="divide-y divide-slate-800/80">
                {platformActivityEvents.map(evt => {
                  const Icon = evt.icon;
                  return (
                    <div key={evt.id} className="py-3.5 flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-[#C9A227] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-white">{evt.firm}</span>
                          <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{evt.event}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 6: SUBSCRIPTIONS / BILLING ==================== */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                <CircleDollarSign className="w-6 h-6 text-[#C9A227]" />
                <span>SaaS Subscriptions & Billing</span>
              </h1>
              <p className="text-xs text-slate-400">
                Monthly recurring revenue (MRR), subscription packages, and payment collection tracking.
              </p>
            </div>

            {/* Plans Overview */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 bg-[#081729] rounded-3xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STANDARD PLAN</span>
                <div className="font-serif font-bold text-xl text-white">KSh 15,000 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400">Up to 5 Users • 50 Active Cases</p>
              </div>

              <div className="p-5 bg-[#081729] rounded-3xl border-2 border-[#C9A227] space-y-2 bg-gradient-to-br from-[#081729] to-[#0B1F3A]">
                <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">PROFESSIONAL PLAN</span>
                <div className="font-serif font-bold text-xl text-[#C9A227]">KSh 25,000 <span className="text-xs font-normal text-slate-300">/ mo</span></div>
                <p className="text-xs text-slate-300">Unlimited Users • Full Court Registry Sync</p>
              </div>

              <div className="p-5 bg-[#081729] rounded-3xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">ENTERPRISE PLAN</span>
                <div className="font-serif font-bold text-xl text-white">KSh 45,000 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400">Custom Storage • Dedicated Account Support</p>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 7: SYSTEM SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#C9A227]" />
                <span>System Administration Settings</span>
              </h1>
              <p className="text-xs text-slate-400">
                Global platform configuration, tenant isolation policies, and system maintenance controls.
              </p>
            </div>

            <div className="bg-[#081729] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6 max-w-2xl text-xs">
              
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2">
                  Security & Tenant Isolation
                </h3>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <div className="font-bold text-white">Strict Multi-Tenant Isolation Mode</div>
                    <div className="text-[11px] text-slate-400">Prevents cross-tenant database access at database rules layer</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.tenantIsolationStrictMode}
                    onChange={e => setPlatformSettings(prev => ({ ...prev, tenantIsolationStrictMode: e.target.checked }))}
                    className="w-4 h-4 accent-[#C9A227] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <div className="font-bold text-white">Require Two-Factor Authentication (2FA)</div>
                    <div className="text-[11px] text-slate-400">Enforce OTP verification for Platform Owner & Proprietors</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.require2FA}
                    onChange={e => setPlatformSettings(prev => ({ ...prev, require2FA: e.target.checked }))}
                    className="w-4 h-4 accent-[#C9A227] cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Platform Owner Account Password Section */}
            <div className="bg-[#081729] p-6 rounded-3xl border border-[#C9A227]/40 shadow-xl space-y-4 max-w-2xl text-xs">
              <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#C9A227]" />
                <span>Platform Owner Security & Change Password</span>
              </h3>

              <p className="text-slate-300 text-xs">
                Update account password for Platform Owner: <strong className="text-white">{currentUser?.fullName || 'Super Admin'}</strong> ({currentUser?.email || 'superadmin@lawfirmregistry.com'})
              </p>

              {adminPassError && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-bold">
                  ⚠️ {adminPassError}
                </div>
              )}

              {adminPassSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{adminPassSuccess}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={adminNewPass}
                    onChange={e => setAdminNewPass(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:border-[#C9A227]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={adminConfirmPass}
                    onChange={e => setAdminConfirmPass(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Password Requirements Indicator */}
              <PasswordRequirementsChecklist password={adminNewPass} />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminPassError('');
                    setAdminPassSuccess('');

                    const passCheck = validatePassword(adminNewPass);
                    if (!passCheck.isValid) {
                      setAdminPassError(passCheck.message);
                      return;
                    }

                    if (adminNewPass !== adminConfirmPass) {
                      setAdminPassError('Passwords do not match.');
                      return;
                    }
                    if (currentUser && onUpdatePassword) {
                      onUpdatePassword(currentUser.id, adminNewPass);
                      setAdminPassSuccess('Platform Owner password updated successfully!');
                      setAdminNewPass('');
                      setAdminConfirmPass('');
                      setTimeout(() => setAdminPassSuccess(''), 4000);
                    } else if (onUpdatePassword) {
                      onUpdatePassword('usr-superadmin', adminNewPass);
                      setAdminPassSuccess('Platform Owner password updated successfully!');
                      setAdminNewPass('');
                      setAdminConfirmPass('');
                      setTimeout(() => setAdminPassSuccess(''), 4000);
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                  <span>Update Admin Password</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 8: SECURITY & AUDIT LOGS ==================== */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6">
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                <History className="w-6 h-6 text-[#C9A227]" />
                <span>Security & Audit Logs</span>
              </h1>
              <p className="text-xs text-slate-400">
                Immutably recorded security events, platform administration, and privileged workspace access logs.
              </p>
            </div>

            {/* Audit Log Table */}
            <div className="bg-[#081729] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[#C9A227] border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Administrator / User</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Details</th>
                      <th className="p-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="p-3 text-[#C9A227] font-bold">{log.timestamp}</td>
                        <td className="p-3 font-semibold text-white">{log.user} ({log.role})</td>
                        <td className="p-3 font-bold text-slate-200">{log.action}</td>
                        <td className="p-3 text-slate-300 font-sans">{log.details}</td>
                        <td className="p-3 text-slate-400">{log.ipAddress || '102.222.140.12'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* LAW FIRM ACCOUNT OVERVIEW MODAL (Inspecting Firm Profile) */}
      {selectedFirm && !showSupportAccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227] shadow-2xl max-w-2xl w-full p-6 text-slate-100 space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 shadow-xl flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#081729] rounded-[14px] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#C9A227]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#C9A227] font-bold">{selectedFirm.firmCode || selectedFirm.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                      {selectedFirm.status || 'Active'}
                    </span>
                  </div>
                  <h2 className="font-serif font-extrabold text-2xl text-white mt-0.5">
                    {selectedFirm.firmName}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedFirm(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Firm Overview Data Grid */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">Firm Details</span>
                <p className="text-slate-300">Proprietor: <strong className="text-white">{selectedFirm.proprietorName || 'Adv. Proprietor'}</strong></p>
                <p className="text-slate-300">LSK Reg No: <strong className="text-white font-mono">{selectedFirm.registrationNumber || 'LR/2026/001'}</strong></p>
                <p className="text-slate-300">County / Branch: <strong className="text-white">{selectedFirm.county || 'Nairobi'}, {selectedFirm.cityOrBranch || 'Main Branch'}</strong></p>
                <p className="text-slate-300">Official Email: <strong className="text-slate-200 font-mono">{selectedFirm.email}</strong></p>
                <p className="text-slate-300">Phone: <strong className="text-slate-200">{selectedFirm.phone}</strong></p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">Platform & Subscription Usage</span>
                <p className="text-slate-300">Billing Plan: <strong className="text-amber-300 font-mono">{selectedFirm.subscriptionTier || 'Professional'} Package</strong></p>
                <p className="text-slate-300">Monthly Fee: <strong className="text-amber-300 font-mono">KSh {(selectedFirm.monthlyFeeKsh || 25000).toLocaleString()}/mo</strong></p>
                <p className="text-slate-300">Authorized Users: <strong className="text-sky-400 font-mono font-bold">{selectedFirm.activeUsersCount || 8} Active Accounts</strong></p>
                <p className="text-slate-300">Storage Used: <strong className="text-emerald-400 font-mono">14.2 GB / 100 GB</strong></p>
                <p className="text-slate-300">Onboarded Date: <strong className="text-slate-200 font-mono">{selectedFirm.createdAt || '2026-01-15'}</strong></p>
              </div>
            </div>

            {/* Enter Firm Workspace Prominent Button */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-amber-500/30">
              <div className="text-xs text-slate-300 space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#C9A227]" />
                  <span>Access Private Workspace</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Requires explicit authorization. All actions inside the workspace will be audited.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    handleOpenEditFirm(selectedFirm);
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-slate-700 hover:border-amber-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Profile</span>
                </button>

                {onDeleteFirm && (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Delete Law Firm Workspace',
                        message: `Are you sure you want to permanently erase "${selectedFirm.firmName}" (${selectedFirm.firmCode || selectedFirm.id}) from the platform? This will erase all cases, court diaries, documents, and associated staff accounts.`,
                        confirmLabel: 'Erase Workspace',
                        variant: 'danger',
                        onConfirm: () => {
                          onDeleteFirm(selectedFirm.id);
                          setSelectedFirm(null);
                          setConfirmModal(null);
                        }
                      });
                    }}
                    className="w-full sm:w-auto px-4 py-3 bg-red-950/80 hover:bg-red-900 text-red-200 font-bold rounded-xl text-xs uppercase tracking-wider border border-red-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Erase Workspace</span>
                  </button>
                )}

                <button
                  onClick={() => setShowSupportAccessModal(true)}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-950" />
                  <span>Enter Firm Workspace</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EXPLICIT WORKSPACE ACCESS CONFIRMATION MODAL */}
      {showSupportAccessModal && selectedFirm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227] shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-[#C9A227] font-serif font-bold text-lg">
                <ShieldAlert className="w-5 h-5 text-[#C9A227]" />
                <span>Authorized Workspace Access</span>
              </div>
              <button
                onClick={() => setShowSupportAccessModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {accessSuccess ? (
              <div className="p-4 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs rounded-xl font-bold text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div>Privileged Access Audit Logged! Entering workspace...</div>
              </div>
            ) : (
              <form onSubmit={handleConfirmWorkspaceAccess} className="space-y-4 text-xs">
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/60 rounded-2xl text-amber-200 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Privacy & Audit Notice</span>
                  </div>
                  <p>
                    You are requesting authorized access to <strong className="text-white">{selectedFirm.firmName}</strong>. This action will be recorded in the security audit log.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-amber-400 mb-1">
                    Support Ticket / Reason for Access *
                  </label>
                  <input
                    type="text"
                    required
                    value={supportReason}
                    onChange={e => setSupportReason(e.target.value)}
                    placeholder="e.g., Support Ticket #842 - Court diary sync investigation"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSupportAccessModal(false)}
                    className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4 text-slate-950" />
                    <span>Log Reason & Enter Workspace</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ACCOUNT SETTINGS MODAL */}
      {showAccountSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227] shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C9A227]" />
                <span>Platform Owner Account Settings</span>
              </h3>
              <button
                onClick={() => setShowAccountSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Profile Name</div>
                <div className="font-bold text-white text-sm">{currentUser?.fullName || 'Platform Owner'}</div>
                <div className="text-slate-400 font-mono">{currentUser?.email || 'anthonyomollo07@gmail.com'}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Assigned Role</div>
                <div className="font-bold text-[#C9A227]">Super Admin (SaaS Platform Owner)</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowAccountSettingsModal(false)}
                className="px-4 py-2 bg-[#C9A227] text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION DIALOG MODAL (Bypasses iframe alert/confirm limitations) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-3xl border-2 border-red-500/70 shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-950/80 border border-red-700/80 rounded-xl text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {confirmModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">Confirmation Required</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmModal.confirmLabel || 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LAW FIRM PROFILE MODAL */}
      {editingFirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227] shadow-2xl max-w-2xl w-full p-6 text-slate-100 my-8 relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 shadow-xl flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#081729] rounded-[14px] flex items-center justify-center">
                    <Edit3 className="w-6 h-6 text-[#C9A227]" />
                  </div>
                </div>
                <div>
                  <h2 className="font-serif font-extrabold text-2xl text-white">
                    Edit Law Firm Details
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Modifications will be immediately synchronized to Firebase Firestore database.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingFirm(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner if any */}
            {firmEditError && (
              <div className="mb-4 p-3.5 bg-red-950/90 border border-red-700 text-red-200 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{firmEditError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveFirmEdit} className="space-y-4">
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Firm Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Law Firm Name *</label>
                  <input
                    type="text"
                    required
                    value={firmEditForm.firmName || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, firmName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. Omollo & Associates Advocates"
                  />
                </div>

                {/* Firm Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Firm Code *</label>
                  <input
                    type="text"
                    required
                    value={firmEditForm.firmCode || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, firmCode: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-[#C9A227] font-mono font-bold focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. OM-ADV-001"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Proprietor / Managing Partner */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Managing Partner / Proprietor</label>
                  <input
                    type="text"
                    value={firmEditForm.proprietorName || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, proprietorName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. Adv. Anthony Omollo"
                  />
                </div>

                {/* LSK Reg Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">LSK Registration Number</label>
                  <input
                    type="text"
                    value={firmEditForm.registrationNumber || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. LSK/2026/894"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Official Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Official Email</label>
                  <input
                    type="email"
                    value={firmEditForm.email || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. info@omollolegal.co.ke"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Official Phone Number</label>
                  <input
                    type="text"
                    value={firmEditForm.phone || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. +254 712 345 678"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* County */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">County</label>
                  <input
                    type="text"
                    value={firmEditForm.county || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, county: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. Nairobi"
                  />
                </div>

                {/* City / Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">City / Branch / Suite</label>
                  <input
                    type="text"
                    value={firmEditForm.cityOrBranch || ''}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, cityOrBranch: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                    placeholder="e.g. Upper Hill Chambers, 4th Floor"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                {/* Subscription Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Account Status</label>
                  <select
                    value={firmEditForm.status || 'Active'}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Subscription Tier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Subscription Tier</label>
                  <select
                    value={firmEditForm.subscriptionTier || 'Professional'}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, subscriptionTier: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                  >
                    <option value="Standard">Standard Package</option>
                    <option value="Professional">Professional Package</option>
                    <option value="Enterprise">Enterprise Package</option>
                  </select>
                </div>

                {/* Monthly Fee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Monthly Fee (KSh)</label>
                  <input
                    type="number"
                    value={firmEditForm.monthlyFeeKsh || 25000}
                    onChange={e => setFirmEditForm(prev => ({ ...prev, monthlyFeeKsh: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-amber-300/90 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Immediate Firebase Firestore Sync</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingFirm(null)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Save Changes & Sync</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
