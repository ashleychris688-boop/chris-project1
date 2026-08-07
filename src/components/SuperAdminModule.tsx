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
  Building
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
}

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({
  firms,
  files,
  users,
  auditLogs,
  currentUser,
  onOpenRegisterModal,
  onAccessWorkspace
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending Verification' | 'Trial'>('All');
  const [selectedFirm, setSelectedFirm] = useState<LawFirmProfile | null>(null);

  // Workspace Access Confirmation Modal State
  const [showSupportAccessModal, setShowSupportAccessModal] = useState(false);
  const [supportReason, setSupportReason] = useState('Platform Owner Workspace Login');
  const [accessSuccess, setAccessSuccess] = useState(false);

  // Computed Platform High-Level Counts
  const totalFirmsCount = firms.length;
  const activeFirmsCount = firms.filter(f => f.status === 'Active' || !f.status).length;
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

  const handleConfirmWorkspaceAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirm) return;

    // Log access event to audit log
    const accessLog: AuditLogEntry = {
      id: `log-supp-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser ? currentUser.fullName : 'Platform Super Admin',
      role: 'Super Admin',
      action: 'Platform Owner Login to Firm Workspace',
      category: 'Auth',
      details: `Platform Owner logged into firm workspace: ${selectedFirm.firmName} (${selectedFirm.firmCode}). Reason: "${supportReason.trim()}"`,
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

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      
      {/* SaaS Platform Owner Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#081729] to-[#0B1F3A] p-6 rounded-3xl border-2 border-[#C9A227]/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/60 text-[#C9A227] text-xs font-mono font-bold uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4 text-[#C9A227]" />
            PLATFORM OWNER CONTROL CENTER
          </div>
          <h1 className="font-serif font-extrabold text-3xl text-white tracking-wide">
            Registered Law Firms Overview
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Registered law firms registry. Click <strong>"Login to Workspace"</strong> on any law firm to access its workspace, court registry, files, and operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={onOpenRegisterModal}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-xl flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Onboard New Law Firm</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/40 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">REGISTERED LAW FIRMS</span>
            <Building2 className="w-5 h-5 text-[#C9A227]" />
          </div>
          <div className="font-serif font-extrabold text-3xl text-white">
            {totalFirmsCount}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{activeFirmsCount} Active Firm Subscriptions</span>
          </div>
        </div>

        <div className="bg-[#081729] p-5 rounded-2xl border border-sky-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">REGISTERED SYSTEM USERS</span>
            <Users className="w-5 h-5 text-sky-400" />
          </div>
          <div className="font-serif font-extrabold text-3xl text-white">
            {totalUsersCount}
          </div>
          <div className="text-[11px] text-sky-300 font-mono">
            Proprietors, Advocates, Clerks, Secretaries & Chasers
          </div>
        </div>

        <div className="bg-[#081729] p-5 rounded-2xl border border-emerald-500/30 shadow-xl space-y-2 bg-gradient-to-br from-[#081729] to-[#0B1F3A]">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-bold uppercase tracking-wider text-[11px]">PLATFORM STATUS</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="font-serif font-extrabold text-2xl text-emerald-300">
            All Systems Operational
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            Cloud Firestore DB & Real-Time Sync Active
          </div>
        </div>

      </div>

      {/* Law Firms Directory Table Section */}
      <div className="bg-[#081729] rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-serif font-extrabold text-xl text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#C9A227]" />
              Registered Law Firms
            </h3>
            <p className="text-xs text-slate-400">
              Select any registered firm to log directly into its dedicated workspace.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search firm name, code, county, proprietor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A227]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Subscription</option>
              <option value="Trial">Trial Period</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-[#C9A227] border-b border-slate-800 font-mono uppercase text-[10px] tracking-wider">
                <th className="p-3">Firm Code & ID</th>
                <th className="p-3">Law Firm Name</th>
                <th className="p-3">Proprietor / Admin Contact</th>
                <th className="p-3">County / Branch</th>
                <th className="p-3">Subscription Plan</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredFirms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    No law firms match your search or filter terms.
                  </td>
                </tr>
              ) : (
                filteredFirms.map(firm => (
                  <tr 
                    key={firm.id}
                    className="hover:bg-slate-900/60 transition group"
                  >
                    <td className="p-3 font-mono font-bold text-[#C9A227]">
                      <div>{firm.firmCode || 'OM-ADV-001'}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{firm.id}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-white text-sm group-hover:text-[#C9A227] transition">
                        {firm.firmName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Reg: {firm.registrationNumber || 'LR/2026/001'} • Onboarded: {firm.createdAt || '2026-01-15'}
                      </div>
                    </td>

                    <td className="p-3 text-slate-200 font-semibold">
                      {firm.proprietorName || firm.adminUsername || 'Advocate Proprietor'}
                      <div className="text-[10px] text-slate-400 font-mono">{firm.email} • {firm.phone}</div>
                    </td>

                    <td className="p-3 text-slate-300">
                      <span className="font-semibold text-slate-200">{firm.county || 'Nairobi'}</span>
                      <div className="text-[10px] text-slate-400">{firm.cityOrBranch || 'Main Branch'}</div>
                    </td>

                    <td className="p-3 font-semibold">
                      <span className="px-2.5 py-1 rounded text-[10px] font-mono border bg-amber-950/80 text-amber-300 border-amber-600/80">
                        {firm.subscriptionTier || 'Professional'} (KSh {(firm.monthlyFeeKsh || 25000).toLocaleString()}/mo)
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        {firm.status || 'Active'}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedFirm(firm);
                          setShowSupportAccessModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-slate-950" />
                        <span>Login into Workspace</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* WORKSPACE LOGIN CONFIRMATION MODAL */}
      {showSupportAccessModal && selectedFirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227] shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-[#C9A227] font-serif font-bold text-lg">
                <Building className="w-5 h-5 text-[#C9A227]" />
                <span>Login into Law Firm Workspace</span>
              </div>
              <button
                onClick={() => setShowSupportAccessModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {accessSuccess ? (
              <div className="p-4 bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs rounded-xl font-bold text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div>Logging into workspace...</div>
              </div>
            ) : (
              <form onSubmit={handleConfirmWorkspaceAccess} className="space-y-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Target Law Firm Workspace</div>
                  <div className="font-serif font-bold text-base text-white">{selectedFirm.firmName}</div>
                  <div className="text-[11px] text-[#C9A227] font-mono font-bold">
                    Code: {selectedFirm.firmCode || 'OM-ADV-001'} • Proprietor: {selectedFirm.proprietorName || 'Adv. Proprietor'}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-amber-400 mb-1">
                    Login / Session Note
                  </label>
                  <input
                    type="text"
                    required
                    value={supportReason}
                    onChange={e => setSupportReason(e.target.value)}
                    placeholder="Reason for accessing workspace..."
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
                    <span>Enter Workspace</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

