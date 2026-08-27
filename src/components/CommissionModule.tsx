import React, { useState } from 'react';
import { CommissionRecord, RegistryFile } from '../types';
import { 
  CircleDollarSign, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  UserCheck, 
  ArrowUpRight,
  Receipt,
  FileText,
  X
} from 'lucide-react';

interface CommissionModuleProps {
  commissions: CommissionRecord[];
  files: RegistryFile[];
  onPayout: (commissionId: string, payoutAmount: number) => void;
  onAddCommission: (record: Omit<CommissionRecord, 'id'>) => void;
}

export const CommissionModule: React.FC<CommissionModuleProps> = ({
  commissions,
  files,
  onPayout,
  onAddCommission
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Outstanding' | 'Paid'>('All');
  
  // Payout Modal State
  const [selectedCommission, setSelectedCommission] = useState<CommissionRecord | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  
  // New Commission Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFileId, setNewFileId] = useState('');
  const [newChaserName, setNewChaserName] = useState('');
  const [newSettlementAmount, setNewSettlementAmount] = useState<number>(0);
  const [newRate, setNewRate] = useState<number>(10);

  // Filtered list
  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = 
      c.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseChaserName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'Outstanding') {
      return matchesSearch && c.outstandingBalance > 0;
    }
    if (filterStatus === 'Paid') {
      return matchesSearch && c.outstandingBalance === 0;
    }
    return matchesSearch;
  });

  // Calculate totals
  const totalDue = commissions.reduce((sum, c) => sum + c.commissionDue, 0);
  const totalPaid = commissions.reduce((sum, c) => sum + c.amountPaid, 0);
  const totalOutstanding = commissions.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const handleOpenPayout = (c: CommissionRecord) => {
    setSelectedCommission(c);
    setPayoutAmount(c.outstandingBalance);
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCommission && payoutAmount > 0) {
      onPayout(selectedCommission.id, payoutAmount);
      setSelectedCommission(null);
      setPayoutAmount(0);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setNewFileId(fileId);
    const selectedFile = files.find(f => f.id === fileId);
    if (selectedFile) {
      if (selectedFile.caseChaserName) {
        setNewChaserName(selectedFile.caseChaserName);
      }
    }
  };

  const handleCreateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileId || !newChaserName || newSettlementAmount <= 0) return;

    const selectedFile = files.find(f => f.id === newFileId);
    const fileNum = selectedFile ? selectedFile.internalFileNumber : 'LFR-NEW';
    const due = (newSettlementAmount * newRate) / 100;

    onAddCommission({
      fileId: newFileId,
      fileNumber: fileNum,
      caseChaserName: newChaserName,
      settlementAmount: newSettlementAmount,
      commissionRate: newRate,
      commissionDue: due,
      amountPaid: 0,
      outstandingBalance: due
    });

    setIsAddModalOpen(false);
    setNewFileId('');
    setNewChaserName('');
    setNewSettlementAmount(0);
    setNewRate(10);
  };

  return (
    <div className="space-y-6">
      {/* Header with Admin Privilege Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <CircleDollarSign className="w-6 h-6 text-[#C9A227]" />
          <h2 className="text-xl font-bold font-serif text-white">Commission Tracker & Ledger</h2>
          <span className="px-2.5 py-0.5 bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono font-bold rounded-full uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Admin Only
          </span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#C9A227] to-[#A07F19] hover:from-[#B08D1E] hover:to-[#8F7015] text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Record New Commission
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#081729] p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Commission Accrued</span>
            <DollarSign className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            KSh {totalDue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500">Gross 10% commission on settled cases</div>
        </div>

        <div className="bg-[#081729] p-4 rounded-xl border border-emerald-900/40 space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Total Commission Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            KSh {totalPaid.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Disbursed via bank / cheque</div>
        </div>

        <div className="bg-[#081729] p-4 rounded-xl border border-red-900/40 space-y-2">
          <div className="flex items-center justify-between text-red-400 text-xs font-semibold">
            <span>Outstanding Balance</span>
            <Clock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            KSh {totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Pending firm disbursement</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#081729] p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by File # or Case Chaser name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A227]"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {(['All', 'Outstanding', 'Paid'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === status
                  ? 'bg-[#C9A227] text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#081729] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-serif">
            <Receipt className="w-4 h-4 text-[#C9A227]" />
            Commission Ledger Records ({filteredCommissions.length})
          </h3>
          <span className="text-xs text-slate-400">Showing confidential financial records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">File Number</th>
                <th className="py-3.5 px-4">Case Chaser</th>
                <th className="py-3.5 px-4 text-right">Settlement (KSh)</th>
                <th className="py-3.5 px-4 text-center">Rate</th>
                <th className="py-3.5 px-4 text-right">Commission Due</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4">Last Payment</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    No commission records match your current criteria.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5 font-sans">
                      <FileText className="w-3.5 h-3.5 text-[#C9A227]" />
                      {c.fileNumber}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.caseChaserName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {c.settlementAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-800/40 rounded text-[10px]">
                        {c.commissionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {c.commissionDue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      {c.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {c.outstandingBalance > 0 ? (
                        <span className="text-red-400">{c.outstandingBalance.toLocaleString()}</span>
                      ) : (
                        <span className="text-emerald-400 font-normal text-[10px]">CLEAR (0)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                      {c.lastPaymentDate || 'None recorded'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.outstandingBalance > 0 ? (
                        <button
                          onClick={() => handleOpenPayout(c)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold font-sans transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          Payout <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-900 text-slate-500 rounded text-[10px] font-sans">
                          Paid in Full
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {selectedCommission && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081729] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 font-serif">
                <CircleDollarSign className="w-4 h-4 text-[#C9A227]" />
                Record Commission Payout
              </h3>
              <button
                onClick={() => setSelectedCommission(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400">File: <strong className="text-white">{selectedCommission.fileNumber}</strong></div>
                <div className="text-slate-400">Case Chaser: <strong className="text-white">{selectedCommission.caseChaserName}</strong></div>
                <div className="text-slate-400">Current Outstanding: <strong className="text-red-400 font-mono">KSh {selectedCommission.outstandingBalance.toLocaleString()}</strong></div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Payout Amount (KSh)</label>
                <input
                  type="number"
                  max={selectedCommission.outstandingBalance}
                  min={1}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#C9A227]"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCommission(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Commission Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#081729] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 font-serif">
                <Plus className="w-4 h-4 text-[#C9A227]" />
                Record New Settlement Commission
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCommission} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Select Registry File</label>
                <select
                  value={newFileId}
                  onChange={(e) => handleFileSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                  required
                >
                  <option value="">-- Choose Settled File --</option>
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.internalFileNumber} - {f.clientName} vs {f.opposingParty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Case Chaser Name</label>
                <input
                  type="text"
                  value={newChaserName}
                  onChange={(e) => setNewChaserName(e.target.value)}
                  placeholder="Enter Case Chaser's Full Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#C9A227]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Settlement Amount (KSh)</label>
                  <input
                    type="number"
                    min={1}
                    value={newSettlementAmount || ''}
                    onChange={(e) => setNewSettlementAmount(Number(e.target.value))}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-[#C9A227]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Commission Rate (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-[#C9A227]"
                    required
                  />
                </div>
              </div>

              {newSettlementAmount > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1">
                  <div className="text-slate-400">Calculated Commission Due:</div>
                  <div className="text-lg font-bold text-amber-300 font-mono">
                    KSh {((newSettlementAmount * newRate) / 100).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded-lg shadow"
                >
                  Save Commission Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
