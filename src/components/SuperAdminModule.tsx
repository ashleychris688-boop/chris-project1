import React, { useState } from 'react';
import { LawFirmProfile, User, RegistryFile, AuditLogEntry } from '../types';
import { 
  Building2, 
  Users, 
  FolderCheck, 
  Scale, 
  CircleDollarSign, 
  Activity, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  ShieldAlert, 
  Lock, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  X, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  Landmark
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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending Verification' | 'Trial' | 'Past Due'>('All');
  const [selectedFirm, setSelectedFirm] = useState<LawFirmProfile | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'details' | 'users' | 'files' | 'storage' | 'subscription' | 'logs'>('details');

  // Support Access Modal State
  const [showSupportAccessModal, setShowSupportAccessModal] = useState(false);
  const [supportReason, setSupportReason] = useState('');
  const [supportAccessSuccess, setSupportAccessSuccess] = useState(false);

  // Computed Platform Overall SaaS Metrics
  const totalFirmsCount = 248 + (firms.length - 4 > 0 ? firms.length - 4 : 0);
  const totalActiveUsersCount = 1562 + (users.length - 7 > 0 ? users.length - 7 : 0);
  const totalActiveCasesCount = 18420 + (files.length - 6 > 0 ? files.length - 6 : 0);
  const totalFilesCount = 52201;
  const onlineUsersCount = 86;
  const monthlyRevenueKsh = 3720000;

  // Filter Firms
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

  const handleGrantSupportAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirm || !supportReason.trim()) return;

    // Log the support access event
    const accessLog: AuditLogEntry = {
      id: `log-supp-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: currentUser ? currentUser.fullName : 'Platform Super Admin',
      role: 'Super Admin',
      action: 'Super-Admin Support Access Workspace',
      category: 'Auth',
      details: `Platform Owner granted temporary support access into firm workspace: ${selectedFirm.firmName} (${selectedFirm.id}). Reason: "${supportReason.trim()}"`,
      ipAddress: '102.222.140.12'
    };

    saveDocumentToFirebase('audit_logs', accessLog);
    setSupportAccessSuccess(true);

    setTimeout(() => {
      setShowSupportAccessModal(false);
      setSupportAccessSuccess(false);
      setSupportReason('');
      onAccessWorkspace(selectedFirm);
    }, 800);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      
      {/* SaaS Platform Owner Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#081729] to-[#0B1F3A] p-6 rounded-3xl border-2 border-[#C9A227]/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/60 text-[#C9A227] text-xs font-mono font-bold uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4 text-[#C9A227]" />
            SUPER ADMIN PLATFORM CONTROL CENTER
          </div>
          <h1 className="font-serif font-extrabold text-3xl text-white tracking-wide">
            Law Firm Registry SaaS Platform
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Global multi-tenant governance overview across registered law firms, active subscribers, system health, and secure tenant workspace support.
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

      {/* Global Metric Cards (User Spec) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Metric 1: Law Firms */}
        <div className="bg-[#081729] p-4 rounded-2xl border border-[#C9A227]/40 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">LAW FIRMS</span>
            <Building2 className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-serif font-extrabold text-2xl text-white">
            {totalFirmsCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+12 this month</span>
          </div>
        </div>

        {/* Metric 2: Active Users */}
        <div className="bg-[#081729] p-4 rounded-2xl border border-sky-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">ACTIVE USERS</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-serif font-extrabold text-2xl text-white">
            {totalActiveUsersCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-sky-300 font-mono">
            Across 5 user roles
          </div>
        </div>

        {/* Metric 3: Active Cases */}
        <div className="bg-[#081729] p-4 rounded-2xl border border-indigo-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">ACTIVE CASES</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-serif font-extrabold text-2xl text-white">
            {totalActiveCasesCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-indigo-300 font-mono">
            High Court & Magistrates
          </div>
        </div>

        {/* Metric 4: Total Files */}
        <div className="bg-[#081729] p-4 rounded-2xl border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">TOTAL FILES</span>
            <FolderCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif font-extrabold text-2xl text-white">
            {totalFilesCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-300 font-mono">
            Physical & Barcode Synced
          </div>
        </div>

        {/* Metric 5: Online Users */}
        <div className="bg-[#081729] p-4 rounded-2xl border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px]">ONLINE USERS</span>
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="font-serif font-extrabold text-2xl text-amber-300">
            {onlineUsersCount}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Active session state
          </div>
        </div>

        {/* Metric 6: Monthly Revenue */}
        <div className="bg-[#081729] p-4 rounded-2xl border border-[#C9A227]/50 shadow-xl space-y-2 bg-gradient-to-br from-[#081729] to-[#0B1F3A]">
          <div className="flex items-center justify-between text-xs text-[#C9A227]">
            <span className="font-bold uppercase tracking-wider text-[10px]">MONTHLY REVENUE</span>
            <CircleDollarSign className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-serif font-extrabold text-xl text-[#C9A227]">
            KSh {(monthlyRevenueKsh / 1000000).toFixed(2)}M
          </div>
          <div className="text-[10px] text-slate-300 font-mono">
            KSh 3,720,000 MRR
          </div>
        </div>

      </div>

      {/* Law Firms Directory Table Section */}
      <div className="bg-[#081729] rounded-3xl border border-slate-800 shadow-2xl p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-serif font-extrabold text-xl text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#C9A227]" />
              Registered Law Firm Directory
            </h3>
            <p className="text-xs text-slate-400">
              Multi-tenant organization registry, subscription tiers, and workspace inspection
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
                placeholder="Search firm, code, county, proprietor..."
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
                <th className="p-3">Firm ID & Code</th>
                <th className="p-3">Law Firm Name</th>
                <th className="p-3">Proprietor / Admin</th>
                <th className="p-3">County / Branch</th>
                <th className="p-3 text-center">Users</th>
                <th className="p-3 text-center">Active Cases</th>
                <th className="p-3 text-center">Files</th>
                <th className="p-3">Subscription Tier</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredFirms.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    No law firms match your search or filter terms.
                  </td>
                </tr>
              ) : (
                filteredFirms.map(firm => (
                  <tr 
                    key={firm.id}
                    className="hover:bg-slate-900/60 transition group cursor-pointer"
                    onClick={() => {
                      setSelectedFirm(firm);
                      setInspectorTab('details');
                    }}
                  >
                    <td className="p-3 font-mono font-bold text-[#C9A227]">
                      <div>{firm.id}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{firm.firmCode}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-white text-sm group-hover:text-[#C9A227] transition">
                        {firm.firmName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Reg: {firm.registrationNumber || 'N/A'}
                      </div>
                    </td>

                    <td className="p-3 text-slate-200 font-semibold">
                      {firm.proprietorName || firm.adminUsername || 'Proprietor'}
                      <div className="text-[10px] text-slate-400 font-mono">{firm.email}</div>
                    </td>

                    <td className="p-3 text-slate-300">
                      <span className="font-semibold text-slate-200">{firm.county || 'Nairobi'}</span>
                      <div className="text-[10px] text-slate-400">{firm.cityOrBranch || 'HQ'}</div>
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-sky-400">
                      {firm.activeUsersCount || 8}
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-indigo-400">
                      {firm.activeCasesCount || 92}
                    </td>

                    <td className="p-3 text-center font-mono font-bold text-emerald-400">
                      {firm.totalFilesCount || 280}
                    </td>

                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        firm.subscriptionTier === 'Enterprise'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                          : 'bg-slate-900 text-slate-200 border-slate-700'
                      }`}>
                        {firm.subscriptionTier || 'Professional'} (KSh {(firm.monthlyFeeKsh || 25000).toLocaleString()}/mo)
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        {firm.status}
                      </span>
                    </td>

                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedFirm(firm);
                          setInspectorTab('details');
                        }}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-[#C9A227] border border-slate-700 hover:border-[#C9A227] rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* LAW FIRM INSPECTOR DRAWER / MODAL */}
      {selectedFirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227] shadow-2xl max-w-4xl w-full p-6 text-slate-100 my-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 shadow-xl flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#081729] rounded-[14px] flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#C9A227]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#C9A227] font-bold">{selectedFirm.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      {selectedFirm.firmCode}
                    </span>
                  </div>
                  <h2 className="font-serif font-extrabold text-2xl text-white">
                    {selectedFirm.firmName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Proprietor: <strong className="text-amber-300">{selectedFirm.proprietorName || selectedFirm.adminUsername}</strong> • {selectedFirm.county}, {selectedFirm.cityOrBranch}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSupportAccessModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Access Workspace</span>
                </button>

                <button
                  onClick={() => setSelectedFirm(null)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
              {[
                { id: 'details', label: 'Firm Details' },
                { id: 'users', label: 'Users & Roles' },
                { id: 'files', label: 'Files & Cases' },
                { id: 'storage', label: 'Storage & Usage' },
                { id: 'subscription', label: 'Subscription' },
                { id: 'logs', label: 'Activity Audit Log' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setInspectorTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    inspectorTab === t.id
                      ? 'bg-[#C9A227] text-slate-950 shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: DETAILS */}
            {inspectorTab === 'details' && (
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">Registration Information</span>
                  <div className="space-y-1">
                    <p className="text-slate-400">Firm Official Name: <strong className="text-white">{selectedFirm.firmName}</strong></p>
                    <p className="text-slate-400">LSK Reg Number: <strong className="text-white">{selectedFirm.registrationNumber || 'N/A'}</strong></p>
                    <p className="text-slate-400">Date Onboarded: <strong className="text-white">{selectedFirm.createdAt}</strong></p>
                    <p className="text-slate-400">Firm Status: <strong className="text-emerald-400">{selectedFirm.status}</strong></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">Contact & Location</span>
                  <div className="space-y-1">
                    <p className="text-slate-400">Official Email: <strong className="text-slate-200 font-mono">{selectedFirm.email}</strong></p>
                    <p className="text-slate-400">Telephone: <strong className="text-slate-200">{selectedFirm.phone}</strong></p>
                    <p className="text-slate-400">Physical Address: <strong className="text-slate-200">{selectedFirm.physicalAddress || 'Legal Chambers'}</strong></p>
                    <p className="text-slate-400">County / Country: <strong className="text-slate-200">{selectedFirm.county || 'Nairobi'}, {selectedFirm.country || 'Kenya'}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: USERS */}
            {inspectorTab === 'users' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-300">Registered Users for {selectedFirm.firmName}:</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedFirm.activeUsersCount || 8} Total Active Accounts</span>
                </div>
                
                <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{u.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email} • Role: <strong className="text-[#C9A227]">{u.role}</strong></div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-mono border border-emerald-800">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: FILES & CASES */}
            {inspectorTab === 'files' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Files</span>
                    <p className="text-lg font-mono font-bold text-emerald-400">{selectedFirm.totalFilesCount || 280}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Litigation Cases</span>
                    <p className="text-lg font-mono font-bold text-indigo-400">{selectedFirm.activeCasesCount || 92}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Insurance Claims</span>
                    <p className="text-lg font-mono font-bold text-[#C9A227]">44</p>
                  </div>
                </div>

                <p className="text-slate-400 text-xs">
                  Physical files are stored across Registry Cabinets A–E and court stations in {selectedFirm.county || 'Nairobi'}.
                </p>
              </div>
            )}

            {/* TAB CONTENT 4: STORAGE */}
            {inspectorTab === 'storage' && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-[#C9A227]" />
                    Cloud File & Database Storage Allocated
                  </span>
                  <span className="font-mono text-[#C9A227] font-bold">14.2 GB / 100 GB</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-[#C9A227] to-[#B08D1E] h-full rounded-full" style={{ width: '14.2%' }}></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
                  <div>Firestore Record Documents: <strong className="text-slate-200">2,410</strong></div>
                  <div>Audit Trail History: <strong className="text-slate-200">18,200 entries</strong></div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: SUBSCRIPTION */}
            {inspectorTab === 'subscription' && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#C9A227] font-bold uppercase">Current Billing Plan</span>
                    <h4 className="font-serif font-bold text-lg text-white">{selectedFirm.subscriptionTier || 'Professional'} Package</h4>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-extrabold text-xl text-[#C9A227]">
                      KSh {(selectedFirm.monthlyFeeKsh || 25000).toLocaleString()} / mo
                    </span>
                    <div className="text-[10px] text-emerald-400 font-bold">Paid via M-Pesa / Invoice</div>
                  </div>
                </div>

                <p className="text-slate-400">
                  Includes multi-user access, court diary sync, physical cabinet mapping, and Friday bring-up auto-generation.
                </p>
              </div>
            )}

            {/* TAB CONTENT 6: LOGS */}
            {inspectorTab === 'logs' && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-300">Tenant Audit Trail Excerpt:</span>
                <div className="divide-y divide-slate-800/80 max-h-52 overflow-y-auto font-mono text-[11px]">
                  {auditLogs.slice(0, 4).map(l => (
                    <div key={l.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="text-[#C9A227] font-bold">[{l.timestamp}]</span> <span className="text-slate-200">{l.user}:</span> {l.details}
                      </div>
                      <span className="text-slate-400">{l.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUPPORT ACCESS AUDIT CONFIRMATION MODAL */}
      {showSupportAccessModal && selectedFirm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl border-2 border-amber-500 shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-amber-400 font-serif font-bold text-lg">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Workspace Support Access Confirmation</span>
            </div>

            {supportAccessSuccess ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs rounded-xl font-bold text-center">
                Access Audit Logged! Switch to workspace initializing...
              </div>
            ) : (
              <form onSubmit={handleGrantSupportAccess} className="space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  You are accessing <strong className="text-white">{selectedFirm.firmName}</strong> workspace in <strong>Platform Owner Support Mode</strong>.
                </p>
                <p className="text-slate-400 text-[11px]">
                  To protect client confidentiality and trust, this support session will be logged in the permanent audit ledger.
                </p>

                <div>
                  <label className="block font-bold text-amber-400 mb-1">
                    Reason for Workspace Access *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Requested technical support / Database sync audit"
                    value={supportReason}
                    onChange={e => setSupportReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSupportAccessModal(false)}
                    className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg cursor-pointer"
                  >
                    Log Reason & Enter Workspace
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
