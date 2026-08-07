import React, { useState } from 'react';
import { LawFirmProfile, User, RegistryFile, AuditLogEntry } from '../types';
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
  UserCheck,
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
  KeyRound
} from 'lucide-react';
import { saveDocumentToFirebase } from '../lib/firebase';

interface SuperAdminModuleProps {
  firms: LawFirmProfile[];
  files: RegistryFile[];
  users: User[];
  auditLogs: AuditLogEntry[];
  currentUser: User | null;
  onOpenRegisterModal: () => void;
  onAccessWorkspace: (firm: LawFirmProfile) => void;
  onLogout?: () => void;
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
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'firms' | 'registrations' | 'users' | 'activity' | 'subscriptions' | 'settings' | 'audit-logs'
  >('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending Verification' | 'Trial' | 'Suspended'>('All');
  
  // Selected firm for Platform Account Overview modal
  const [selectedFirm, setSelectedFirm] = useState<LawFirmProfile | null>(null);

  // Workspace Access Confirmation Modal State
  const [showSupportAccessModal, setShowSupportAccessModal] = useState(false);
  const [supportReason, setSupportReason] = useState('Platform Owner Workspace Support');
  const [accessSuccess, setAccessSuccess] = useState(false);

  // Platform Account Settings Modal State
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);

  // Registration Requests State
  const [requests, setRequests] = useState<RegistrationRequest[]>([
    {
      id: 'req-101',
      firmName: 'Kiplagat & Cheruiyot Advocates',
      registrationDate: '2026-08-05',
      contactPerson: 'Adv. Felix Kiplagat',
      email: 'felix@kcadvocates.co.ke',
      phone: '+254 722 998877',
      county: 'Uasin Gishu',
      cityOrBranch: 'Eldoret Main',
      lskNumber: 'P.105/18420/24',
      status: 'Pending Verification',
      requestedPlan: 'Professional',
      documentsSubmitted: [
        { name: 'LSK_Practicing_Certificate_2026.pdf', fileType: 'PDF Document', date: '2026-08-05' },
        { name: 'Business_Registration_Certificate.pdf', fileType: 'PDF Document', date: '2026-08-05' },
        { name: 'KRA_PIN_Certificate.pdf', fileType: 'PDF Document', date: '2026-08-05' }
      ]
    },
    {
      id: 'req-102',
      firmName: 'Mutua & Partners Law Chambers',
      registrationDate: '2026-08-04',
      contactPerson: 'Adv. Beatrice Mutua',
      email: 'info@mutualaw.co.ke',
      phone: '+254 711 445566',
      county: 'Machakos',
      cityOrBranch: 'Machakos Town',
      lskNumber: 'P.105/16110/22',
      status: 'Pending Verification',
      requestedPlan: 'Standard',
      documentsSubmitted: [
        { name: 'Practicing_License_2026.pdf', fileType: 'PDF Document', date: '2026-08-04' },
        { name: 'Firm_Partnership_Deed.pdf', fileType: 'PDF Document', date: '2026-08-04' }
      ]
    },
    {
      id: 'req-103',
      firmName: 'Coast Legal & Maritime LLP',
      registrationDate: '2026-08-02',
      contactPerson: 'Adv. Hassan Omar',
      email: 'hassan@coastlegal.co.ke',
      phone: '+254 733 112233',
      county: 'Mombasa',
      cityOrBranch: 'Mombasa CBD',
      lskNumber: 'P.105/12800/19',
      status: 'Pending Verification',
      requestedPlan: 'Enterprise',
      documentsSubmitted: [
        { name: 'LSK_Certificate_2026.pdf', fileType: 'PDF Document', date: '2026-08-02' },
        { name: 'Mombasa_Branch_Lease_Agreement.pdf', fileType: 'PDF Document', date: '2026-08-02' }
      ]
    }
  ]);

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
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Approved' } : r));
    
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

  // Sample Platform Activity Events (strictly high-level events without confidential case data)
  const platformActivityEvents = [
    { id: 'act-1', timestamp: 'Today at 02:45 PM', firm: 'Omollo & Associates Advocates', event: 'Added 2 new staff user accounts (Clerk & Advocate)', icon: Users, type: 'user' },
    { id: 'act-2', timestamp: 'Today at 01:15 PM', firm: 'ABC Advocates', event: 'Upgraded subscription tier to Professional Package', icon: CreditCard, type: 'billing' },
    { id: 'act-3', timestamp: 'Today at 10:30 AM', firm: 'Kiplagat & Cheruiyot Advocates', event: 'Submitted new law firm onboarding verification request', icon: FileCheck, type: 'registration' },
    { id: 'act-4', timestamp: 'Yesterday at 04:20 PM', firm: 'XYZ Law LLP', event: 'Completed monthly subscription renewal payment', icon: CircleDollarSign, type: 'billing' },
    { id: 'act-5', timestamp: 'Yesterday at 11:00 AM', firm: 'Law Firm Registry Platform', event: 'Automated database encrypted snapshot completed successfully', icon: HardDrive, type: 'system' }
  ];

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
                            {firm.firmCode || 'OM-ADV-001'}
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
                            <button
                              onClick={() => setSelectedFirm(firm)}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-[#C9A227] border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Inspect Account
                            </button>
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
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-[#C9A227]" />
                  <span>Registered Law Firms</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Platform-level directory of registered law firms. Click "Inspect / Account Overview" to manage firm details.
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
                              Code: <strong className="text-[#C9A227]">{firm.firmCode || 'OM-ADV-001'}</strong> • Proprietor: {firm.proprietorName || 'Adv. Proprietor'}
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
                            <button
                              onClick={() => setSelectedFirm(firm)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#C9A227] border border-slate-700 hover:border-[#C9A227] rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Account Overview</span>
                            </button>
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
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-amber-400" />
                <span>Law Firm Registration Requests</span>
              </h1>
              <p className="text-xs text-slate-400">
                Review and verify new law firm onboarding applications and submitted professional credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {requests.map(req => (
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

                  {req.status === 'Pending Verification' && (
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ==================== TAB 4: USER ACCOUNTS ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            <div className="border-b border-slate-800 pb-4">
              <h1 className="font-serif font-extrabold text-2xl text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-sky-400" />
                <span>Platform System User Accounts</span>
              </h1>
              <p className="text-xs text-slate-400">
                High-level administration of registered user accounts across law firm tenants.
              </p>
            </div>

            <div className="bg-[#081729] rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[#C9A227] border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
                      <th className="p-3">User Name & Role</th>
                      <th className="p-3">Assigned Law Firm</th>
                      <th className="p-3">Email & Phone</th>
                      <th className="p-3">Last Login</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/50">
                        <td className="p-3">
                          <div className="font-bold text-white">{u.fullName}</div>
                          <div className="text-[10px] text-[#C9A227] font-mono">Role: {u.role}</div>
                        </td>
                        <td className="p-3 text-slate-300 font-semibold">
                          {u.firmName || 'Omollo & Associates Advocates'}
                          <div className="text-[10px] text-slate-500 font-mono">{u.firmCode || 'OM-ADV-001'}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          <div>{u.email}</div>
                          <div className="text-[10px] text-slate-500">{u.phone}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {u.lastLogin || 'Today at 09:00 AM'}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                            {u.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

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
                    <span className="font-mono text-xs text-[#C9A227] font-bold">{selectedFirm.firmCode || 'OM-ADV-001'}</span>
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

    </div>
  );
};
