import React, { useState, useEffect } from 'react';
import { 
  RegistryFile, 
  CourtSession, 
  FileMovement, 
  User,
  InsuranceClaim,
  PendingCheque,
  CommissionRecord,
  BringUpItem
} from '../types';
import { 
  FolderCheck, 
  Scale, 
  Calendar, 
  PackageSearch, 
  AlertTriangle, 
  Building, 
  Receipt, 
  CircleDollarSign,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Shield,
  ShieldAlert,
  Lock,
  UserSquare2,
  Gavel,
  Handshake,
  FileSpreadsheet,
  FolderArchive,
  ListOrdered,
  FileCheck2,
  Users
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User | null;
  files: RegistryFile[];
  courtSessions: CourtSession[];
  fileMovements: FileMovement[];
  claims: InsuranceClaim[];
  cheques: PendingCheque[];
  commissions: CommissionRecord[];
  onNavigateTab: (tab: string) => void;
  onOpenNewFileModal: () => void;
  onOpenMoveFileModal: () => void;
  onLogoutWithRole?: (roleTab: 'ADMIN' | 'ADVOCATE' | 'CLERK' | 'SECRETARY' | 'CHASER') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  files,
  courtSessions,
  fileMovements,
  claims = [],
  cheques = [],
  commissions = [],
  onNavigateTab,
  onOpenNewFileModal,
  onOpenMoveFileModal,
  onLogoutWithRole
}) => {
  const isAdmin = currentUser?.role === 'Proprietor';

  // Determine initial role tab based on logged in user's role
  const getInitialRoleTab = (): 'admin' | 'secretary' | 'clerk' | 'advocates' | 'case_chasers' => {
    switch (currentUser?.role) {
      case 'Secretary': return 'secretary';
      case 'Clerk': return 'clerk';
      case 'Advocate': return 'advocates';
      case 'Case Chaser': return 'case_chasers';
      default: return 'admin';
    }
  };

  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'secretary' | 'clerk' | 'advocates' | 'case_chasers'>(getInitialRoleTab());
  const [switchRolePromptModal, setSwitchRolePromptModal] = useState<{
    targetTab: 'admin' | 'secretary' | 'clerk' | 'advocates' | 'case_chasers';
    mappedRole: 'ADMIN' | 'ADVOCATE' | 'CLERK' | 'SECRETARY' | 'CHASER';
    targetLabel: string;
  } | null>(null);

  useEffect(() => {
    setActiveRoleTab(getInitialRoleTab());
  }, [currentUser]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Actual dynamic metrics calculated from system database (aligned strictly across modules)
  const activeFilesCount = files.filter(f => 
    f.currentStatus === 'Active' || 
    f.currentStatus === 'Out in Court' || 
    f.currentStatus === 'Out with Advocate' || 
    f.currentStatus === 'Out with Insurance' || 
    f.currentStatus === 'Pending Court'
  ).length;

  const courtSessionsToday = courtSessions.filter(s => s.hearingDate === todayStr);
  const courtSessionsTodayCount = courtSessionsToday.length;
  const upcomingHearingsCount = courtSessions.filter(s => s.hearingDate >= todayStr && s.status === 'Upcoming').length;
  const filesOutCount = files.filter(f => f.currentStatus.startsWith('Out')).length;
  const pendingInsuranceCount = claims.filter(c => !c.paymentReceived).length;
  const pendingChequesCount = cheques.filter(c => c.status !== 'Cleared').length;
  const outstandingCommissionsCount = commissions.filter(c => c.outstandingBalance > 0).length;

  const summaryCards = [
    { label: 'Active Files', value: activeFilesCount, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', icon: FolderCheck, tab: 'registry' },
    { label: 'Court Sessions Today', value: courtSessionsTodayCount, color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', icon: Scale, tab: 'court-diary' },
    { label: 'Upcoming Hearings', value: upcomingHearingsCount, color: 'text-sky-400 bg-sky-950/40 border-sky-800/60', icon: Calendar, tab: 'court-diary' },
    { label: 'Files Out', value: filesOutCount, color: 'text-orange-400 bg-orange-950/40 border-orange-800/60', icon: PackageSearch, tab: 'file-tracker' },
    { label: 'Pending Insurance Payments', value: pendingInsuranceCount, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60', icon: Building, tab: 'insurance' },
    { label: 'Pending Cheques', value: pendingChequesCount, color: 'text-teal-400 bg-teal-950/40 border-teal-800/60', icon: Receipt, tab: 'pending-cheques' },
    ...(isAdmin ? [{ label: 'Outstanding Commissions', value: outstandingCommissionsCount, color: 'text-purple-400 bg-purple-950/40 border-purple-800/60', icon: CircleDollarSign, tab: 'commission-tracker' }] : [])
  ];

  // Helper to check if current user can access a tab
  const canAccessTab = (tab: 'admin' | 'secretary' | 'clerk' | 'advocates' | 'case_chasers') => {
    if (isAdmin) return true;
    if (tab === 'secretary' && currentUser?.role === 'Secretary') return true;
    if (tab === 'clerk' && currentUser?.role === 'Clerk') return true;
    if (tab === 'advocates' && currentUser?.role === 'Advocate') return true;
    if (tab === 'case_chasers' && (currentUser?.role === 'Case Chaser' || currentUser?.role === 'Clerk')) return true;
    return false;
  };

  const handleSelectRoleTab = (tab: 'admin' | 'secretary' | 'clerk' | 'advocates' | 'case_chasers') => {
    if (canAccessTab(tab)) {
      setActiveRoleTab(tab);
    } else {
      const map: Record<string, 'ADMIN' | 'ADVOCATE' | 'CLERK' | 'SECRETARY' | 'CHASER'> = {
        admin: 'ADMIN',
        secretary: 'SECRETARY',
        clerk: 'CLERK',
        advocates: 'ADVOCATE',
        case_chasers: 'CHASER'
      };
      const mappedRole = map[tab];
      setSwitchRolePromptModal({
        targetTab: tab,
        mappedRole,
        targetLabel: tab.toUpperCase().replace('_', ' ')
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      
      {/* Switch Role Account Password Requirement Modal */}
      {switchRolePromptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#081729] border border-[#C9A227]/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-[#C9A227] flex items-center justify-center text-[#C9A227] mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-serif font-bold text-lg text-white">
                Log Out & Sign In to {switchRolePromptModal.targetLabel}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your current account is <strong className="text-white">{currentUser?.fullName} ({currentUser?.role})</strong>. Only Proprietor / Admin accounts have cross-portal permissions without logging out.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-amber-300 font-medium">
                To access the <strong>{switchRolePromptModal.targetLabel}</strong> workspace, you must log out of your current account and enter the password for the <strong>{switchRolePromptModal.mappedRole}</strong> account.
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setSwitchRolePromptModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = switchRolePromptModal.mappedRole;
                  setSwitchRolePromptModal(null);
                  if (onLogoutWithRole) {
                    onLogoutWithRole(target);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#C9A227] to-[#B08D1E] hover:from-[#B08D1E] hover:to-[#967616] text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition"
              >
                Log Out & Enter Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Greeting */}
      <div className="bg-[#081729] text-white p-6 rounded-2xl border border-[#C9A227]/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-[#C9A227] font-semibold">
              LAW FIRM REGISTRY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227]">
              {currentUser?.role || 'Proprietor'} Portal
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">
            Good Morning, {currentUser?.fullName || 'Proprietor'}
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            {isAdmin 
              ? 'Firm Master Proprietor Dashboard • All 5 departmental workspaces accessible.' 
              : `Role Workspace: ${currentUser?.role} • Restricted to role stipulated permissions.`}
          </p>
        </div>
      </div>

      {/* 5 MANDATORY DASHBOARD ROLE TABS (Exact Prompt Specification) */}
      <div className="bg-[#081729] p-2 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider px-3 py-1.5 flex items-center justify-between border-b border-slate-800/80 mb-2">
          <span>DEPARTMENTAL WORKSPACE TABS</span>
          {!isAdmin && (
            <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
              <Lock className="w-3 h-3" /> Non-Admin accounts limited to assigned role tab
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          
          {/* 1. ADMIN TAB */}
          <button
            onClick={() => handleSelectRoleTab('admin')}
            className={`p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1.5 relative ${
              activeRoleTab === 'admin'
                ? 'bg-gradient-to-b from-[#C9A227] to-[#9B7B12] text-slate-950 border-[#C9A227] font-bold shadow-lg'
                : canAccessTab('admin')
                  ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-800'
                  : 'bg-slate-950/60 text-slate-500 border-slate-900 cursor-not-allowed opacity-75'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Shield className={`w-4 h-4 ${activeRoleTab === 'admin' ? 'text-slate-950' : 'text-[#C9A227]'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
            </div>
            <span className={`text-[10px] ${activeRoleTab === 'admin' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
              Full System Access
            </span>
            {!canAccessTab('admin') && (
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute top-2 right-2" />
            )}
          </button>

          {/* 2. SECRETARY TAB */}
          <button
            onClick={() => handleSelectRoleTab('secretary')}
            className={`p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1.5 relative ${
              activeRoleTab === 'secretary'
                ? 'bg-gradient-to-b from-[#C9A227] to-[#9B7B12] text-slate-950 border-[#C9A227] font-bold shadow-lg'
                : canAccessTab('secretary')
                  ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-800'
                  : 'bg-slate-950/60 text-slate-500 border-slate-900 cursor-not-allowed opacity-75'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserSquare2 className={`w-4 h-4 ${activeRoleTab === 'secretary' ? 'text-slate-950' : 'text-purple-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Secretary</span>
            </div>
            <span className={`text-[10px] ${activeRoleTab === 'secretary' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
              Registry & Cause List
            </span>
            {!canAccessTab('secretary') && (
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute top-2 right-2" />
            )}
          </button>

          {/* 3. CLERK TAB */}
          <button
            onClick={() => handleSelectRoleTab('clerk')}
            className={`p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1.5 relative ${
              activeRoleTab === 'clerk'
                ? 'bg-gradient-to-b from-[#C9A227] to-[#9B7B12] text-slate-950 border-[#C9A227] font-bold shadow-lg'
                : canAccessTab('clerk')
                  ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-800'
                  : 'bg-slate-950/60 text-slate-500 border-slate-900 cursor-not-allowed opacity-75'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className={`w-4 h-4 ${activeRoleTab === 'clerk' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Clerk</span>
            </div>
            <span className={`text-[10px] ${activeRoleTab === 'clerk' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
              File Tracker & Dispatches
            </span>
            {!canAccessTab('clerk') && (
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute top-2 right-2" />
            )}
          </button>

          {/* 4. ADVOCATES TAB */}
          <button
            onClick={() => handleSelectRoleTab('advocates')}
            className={`p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1.5 relative ${
              activeRoleTab === 'advocates'
                ? 'bg-gradient-to-b from-[#C9A227] to-[#9B7B12] text-slate-950 border-[#C9A227] font-bold shadow-lg'
                : canAccessTab('advocates')
                  ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-800'
                  : 'bg-slate-950/60 text-slate-500 border-slate-900 cursor-not-allowed opacity-75'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Gavel className={`w-4 h-4 ${activeRoleTab === 'advocates' ? 'text-slate-950' : 'text-sky-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">Advocates</span>
            </div>
            <span className={`text-[10px] ${activeRoleTab === 'advocates' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
              Court Diary & Cases
            </span>
            {!canAccessTab('advocates') && (
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute top-2 right-2" />
            )}
          </button>

          {/* 5. CASE CHASERS TAB */}
          <button
            onClick={() => handleSelectRoleTab('case_chasers')}
            className={`p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1.5 relative ${
              activeRoleTab === 'case_chasers'
                ? 'bg-gradient-to-b from-[#C9A227] to-[#9B7B12] text-slate-950 border-[#C9A227] font-bold shadow-lg'
                : canAccessTab('case_chasers')
                  ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-800'
                  : 'bg-slate-950/60 text-slate-500 border-slate-900 cursor-not-allowed opacity-75'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Handshake className={`w-4 h-4 ${activeRoleTab === 'case_chasers' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span className="text-xs font-bold uppercase tracking-wider truncate">Case Chasers</span>
            </div>
            <span className={`text-[10px] ${activeRoleTab === 'case_chasers' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
              Tasks & Commissions
            </span>
            {!canAccessTab('case_chasers') && (
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute top-2 right-2" />
            )}
          </button>

        </div>
      </div>

      {/* --- TAB CONTENT 1: ADMIN TAB VIEW --- */}
      {activeRoleTab === 'admin' && (
        <div className="space-y-6">
          {/* Grid Cards for Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  onClick={() => onNavigateTab(card.tab)}
                  className={`p-4 rounded-xl border ${card.color} shadow-lg hover:border-[#C9A227]/60 cursor-pointer transition flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{card.label}</span>
                    <Icon className="w-5 h-5 shrink-0 opacity-80" />
                  </div>
                  <div className="text-2xl font-extrabold font-serif">{card.value}</div>
                  <div className="text-[10px] opacity-75 mt-2 flex items-center gap-1 font-sans">
                    <span>View module</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Split: Court Sessions & File Movements */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Court Sessions Today */}
            <div className="bg-[#081729] rounded-2xl p-6 border border-[#C9A227]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#C9A227]" />
                  <h3 className="font-serif font-bold text-base text-white">
                    Court Sessions Today ({courtSessionsTodayCount} Hearing{courtSessionsTodayCount === 1 ? '' : 's'})
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('court-diary')}
                  className="text-xs text-[#C9A227] hover:text-amber-300 font-semibold underline flex items-center gap-1"
                >
                  Full Court Diary
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {courtSessionsToday.map(cs => (
                  <div 
                    key={cs.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-[#C9A227]/40 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#C9A227]">
                        {cs.fileNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                        {cs.hearingTime} • {cs.purpose}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {cs.clientName} v {cs.opposingParty}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C9A227]" />
                        {cs.courtStation} ({cs.courtNumber})
                      </span>
                      <span className="font-medium text-slate-200">
                        {cs.advocateName}
                      </span>
                    </div>
                  </div>
                ))}

                {courtSessionsToday.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800 font-medium">
                    No court hearings scheduled for today ({todayStr}).
                  </div>
                )}
              </div>
            </div>

            {/* Physical File Movements Log */}
            <div className="bg-[#081729] rounded-2xl p-6 border border-[#C9A227]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-[#C9A227]" />
                  <h3 className="font-serif font-bold text-base text-white">
                    Recent Physical File Movements
                  </h3>
                </div>
                <button
                  onClick={() => onNavigateTab('file-tracker')}
                  className="text-xs text-[#C9A227] hover:text-amber-300 font-semibold underline flex items-center gap-1"
                >
                  File Tracker
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {fileMovements.map(mov => (
                  <div 
                    key={mov.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-[#C9A227]/40 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#C9A227]">{mov.fileNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mov.date} {mov.time}
                      </span>
                    </div>

                    <div className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">{mov.fromLocation}</span>
                      <ArrowRight className="w-3 h-3 text-[#C9A227] shrink-0" />
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px] font-bold">{mov.toLocation}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Moved by: <strong className="text-slate-200">{mov.user}</strong></span>
                      <span className="italic truncate max-w-[180px]">"{mov.reason}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: SECRETARY TAB VIEW --- */}
      {activeRoleTab === 'secretary' && (
        <div className="space-y-6">
          <div className="bg-[#081729] rounded-2xl p-6 border border-purple-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserSquare2 className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Secretary Role Workspace</h3>
                  <p className="text-xs text-slate-300">Central Registry Management, Opening Files, Court Stations Directory & Cause List Entry</p>
                </div>
              </div>
              <button
                onClick={onOpenNewFileModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Open New Registry File
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div 
                onClick={() => onNavigateTab('registry')}
                className="p-4 rounded-xl bg-slate-900 border border-purple-900/60 hover:border-purple-400 cursor-pointer transition space-y-2"
              >
                <FolderArchive className="w-6 h-6 text-purple-400" />
                <h4 className="font-bold text-sm text-white">Central Registry</h4>
                <p className="text-xs text-slate-300">Manage {files.length} physical files, assign file numbers, monitor missing requirements.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('court-diary')}
                className="p-4 rounded-xl bg-slate-900 border border-purple-900/60 hover:border-purple-400 cursor-pointer transition space-y-2"
              >
                <Scale className="w-6 h-6 text-purple-400" />
                <h4 className="font-bold text-sm text-white">Daily Cause Lists</h4>
                <p className="text-xs text-slate-300">Log upcoming court sessions, set hearing times, assign magistrate & advocates.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('bring-up')}
                className="p-4 rounded-xl bg-slate-900 border border-purple-900/60 hover:border-purple-400 cursor-pointer transition space-y-2"
              >
                <ListOrdered className="w-6 h-6 text-purple-400" />
                <h4 className="font-bold text-sm text-white">Bring-Up Scheduling</h4>
                <p className="text-xs text-slate-300">Generate weekly file retrieval lists for upcoming court dates.</p>
              </div>
            </div>

            {/* Recent Registry Files Table snippet */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-slate-200 mb-3">Recently Opened Files (Secretary Desk)</h4>
              <div className="space-y-2">
                {files.slice(0, 4).map(f => (
                  <div key={f.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#C9A227]">{f.internalFileNumber}</span>
                      <span className="ml-2 font-semibold text-slate-200">{f.clientName} v {f.opposingParty}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">{f.courtStation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: CLERK TAB VIEW --- */}
      {activeRoleTab === 'clerk' && (
        <div className="space-y-6">
          <div className="bg-[#081729] rounded-2xl p-6 border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Clerk Role Workspace</h3>
                  <p className="text-xs text-slate-300">Physical File Tracker, Cabinet Location Mapping, Dispatches & Movement Register</p>
                </div>
              </div>
              <button
                onClick={onOpenMoveFileModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5"
              >
                <PackageSearch className="w-4 h-4" />
                Dispatch Physical File
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => onNavigateTab('file-tracker')}
                className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-emerald-400 cursor-pointer transition space-y-2"
              >
                <PackageSearch className="w-6 h-6 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Physical File Tracker</h4>
                <p className="text-xs text-slate-300">Track {filesOutCount} files currently out in court or advocate offices.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('bring-up')}
                className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-emerald-400 cursor-pointer transition space-y-2"
              >
                <ListOrdered className="w-6 h-6 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Retrieval & Bring-Up</h4>
                <p className="text-xs text-slate-300">Collect physical files from central shelves for tomorrow's court list.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('registry')}
                className="p-4 rounded-xl bg-slate-900 border border-emerald-900/60 hover:border-emerald-400 cursor-pointer transition space-y-2"
              >
                <MapPin className="w-6 h-6 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Cabinet Location Index</h4>
                <p className="text-xs text-slate-300">Cabinet A through E shelf index mapping across all litigation vaults.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('unprocessed-bucket')}
                className="p-4 rounded-xl bg-slate-900 border border-amber-500/50 hover:border-amber-400 cursor-pointer transition space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <Handshake className="w-6 h-6 text-amber-400" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700">
                    Review Intakes
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">Unprocessed Client Bucket</h4>
                <p className="text-xs text-slate-300">Approve, convert to registry, or reject preliminary client intakes captured by Case Chasers.</p>
              </div>
            </div>

            {/* Movement Logs snippet */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-slate-200 mb-3">Recent File Movement Log (Clerk Register)</h4>
              <div className="space-y-2">
                {fileMovements.slice(0, 4).map(m => (
                  <div key={m.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#C9A227]">{m.fileNumber}</span>
                      <span className="ml-2 text-slate-300">{m.fromLocation} → <strong className="text-emerald-400">{m.toLocation}</strong></span>
                    </div>
                    <span className="text-[11px] text-slate-400">{m.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 4: ADVOCATES TAB VIEW --- */}
      {activeRoleTab === 'advocates' && (
        <div className="space-y-6">
          <div className="bg-[#081729] rounded-2xl p-6 border border-sky-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Advocate Role Workspace</h3>
                  <p className="text-xs text-slate-300">Assigned Court Cases, Daily Cause List, Hearing Outcomes & Rulings</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('court-outcomes')}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                Log Court Outcome
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div 
                onClick={() => onNavigateTab('court-diary')}
                className="p-4 rounded-xl bg-slate-900 border border-sky-900/60 hover:border-sky-400 cursor-pointer transition space-y-2"
              >
                <Scale className="w-6 h-6 text-sky-400" />
                <h4 className="font-bold text-sm text-white">My Cause List</h4>
                <p className="text-xs text-slate-300">View upcoming hearings in Milimani High Court & Civil Magistrates.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('court-outcomes')}
                className="p-4 rounded-xl bg-slate-900 border border-sky-900/60 hover:border-sky-400 cursor-pointer transition space-y-2"
              >
                <FileCheck2 className="w-6 h-6 text-sky-400" />
                <h4 className="font-bold text-sm text-white">Court Outcomes</h4>
                <p className="text-xs text-slate-300">Record rulings, mention directions, interlocutory orders & judgments.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('registry')}
                className="p-4 rounded-xl bg-slate-900 border border-sky-900/60 hover:border-sky-400 cursor-pointer transition space-y-2"
              >
                <FolderArchive className="w-6 h-6 text-sky-400" />
                <h4 className="font-bold text-sm text-white">Assigned Files</h4>
                <p className="text-xs text-slate-300">Review client files assigned to Adv. Kamau & Adv. Otieno.</p>
              </div>
            </div>

            {/* Upcoming hearings list */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-slate-200 mb-3">Upcoming Advocate Hearings</h4>
              <div className="space-y-2">
                {courtSessions.slice(0, 3).map(cs => (
                  <div key={cs.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#C9A227]">{cs.fileNumber}</span>
                      <span className="ml-2 text-slate-200 font-semibold">{cs.clientName}</span>
                    </div>
                    <span className="text-[11px] font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">{cs.hearingTime} • {cs.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 5: CASE CHASERS TAB VIEW --- */}
      {activeRoleTab === 'case_chasers' && (
        <div className="space-y-6">
          <div className="bg-[#081729] rounded-2xl p-6 border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Handshake className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Case Chaser Role Workspace</h3>
                  <p className="text-xs text-slate-300">Assigned Files Follow-up, Requirement Checklists, Client Interaction Logs & Commission Payouts</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('case-chasers')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Handshake className="w-4 h-4" />
                Case Chasers Workspace
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div 
                onClick={() => onNavigateTab('case-chasers')}
                className="p-4 rounded-xl bg-slate-900 border border-amber-900/60 hover:border-amber-400 cursor-pointer transition space-y-2"
              >
                <FolderArchive className="w-6 h-6 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Assigned Files & Requirements</h4>
                <p className="text-xs text-slate-300">Track missing client documents, police abstracts & medical reports.</p>
              </div>

              <div 
                onClick={() => onNavigateTab('case-chasers')}
                className="p-4 rounded-xl bg-slate-900 border border-amber-900/60 hover:border-amber-400 cursor-pointer transition space-y-2"
              >
                <CheckCircle2 className="w-6 h-6 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Workflow Tasks & Logs</h4>
                <p className="text-xs text-slate-300">Log client contacts, field visits & complete assigned workflow tasks.</p>
              </div>
            </div>

            {/* Assigned files & active tasks summary snippet */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-slate-200 mb-3">Assigned Files Summary</h4>
              <div className="space-y-2">
                {files.filter(f => f.caseChaserName).slice(0, 3).map(f => (
                  <div key={f.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-[#C9A227]">{f.internalFileNumber}</span>
                      <span className="ml-2 font-semibold text-slate-200">{f.clientName}</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                      {f.currentStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
