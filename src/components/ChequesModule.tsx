import React, { useState } from 'react';
import { PendingCheque, RegistryFile } from '../types';
import { 
  Receipt, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2,
  DollarSign,
  X
} from 'lucide-react';

interface ChequesModuleProps {
  cheques: PendingCheque[];
  files: RegistryFile[];
  onUpdateCheque: (cheque: PendingCheque) => void;
  onAddCheque: (cheque: PendingCheque) => void;
}

export const ChequesModule: React.FC<ChequesModuleProps> = ({
  cheques,
  files,
  onUpdateCheque,
  onAddCheque
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Cheque State
  const [formData, setFormData] = useState<Partial<PendingCheque>>({
    fileId: files[0]?.id || '',
    fileNumber: files[0]?.internalFileNumber || 'LFR/2026/0142',
    clientName: files[0]?.clientName || '',
    drawerName: 'Heritage Insurance Co.',
    bankName: 'KCB Bank Kenya',
    chequeNumber: `CHQ-00${Math.floor(1000 + Math.random() * 9000)}`,
    amount: 3200000,
    expectedReleaseDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    status: 'Ready for Pickup',
    remarks: 'Cheque issued by insurance claims directorate'
  });

  const getStatusBadge = (status: PendingCheque['status']) => {
    switch (status) {
      case 'Ready for Pickup':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]">Ready for Pickup</span>;
      case 'Cleared':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">Cleared</span>;
      case 'Processing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">Processing</span>;
      case 'Bounced':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-800">Bounced</span>;
    }
  };

  const handleStatusChange = (cheque: PendingCheque, newStatus: PendingCheque['status']) => {
    onUpdateCheque({
      ...cheque,
      status: newStatus
    });
  };

  const handleSaveCheque = (e: React.FormEvent) => {
    e.preventDefault();
    const newCheque: PendingCheque = {
      id: `chq-${Date.now()}`,
      fileId: formData.fileId || `f-${Date.now()}`,
      fileNumber: formData.fileNumber || 'LFR/2026/0199',
      clientName: formData.clientName || 'Client',
      drawerName: formData.drawerName || 'Drawer',
      bankName: formData.bankName || 'Bank',
      chequeNumber: formData.chequeNumber || '000000',
      amount: Number(formData.amount) || 1000000,
      expectedReleaseDate: formData.expectedReleaseDate || new Date().toISOString().split('T')[0],
      status: (formData.status as PendingCheque['status']) || 'Processing',
      remarks: formData.remarks
    };

    onAddCheque(newCheque);
    setShowAddModal(false);
  };

  const filteredCheques = cheques.filter(c => 
    c.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.drawerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.chequeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.bankName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">Pending Cheques & Disbursement Register</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Track incoming insurance settlement cheques, bank clearance, expected release dates & client payout readiness.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Register Pending Cheque
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cheque #, client, drawer insurance, bank..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-[#C9A227]"
          />
        </div>
      </div>

      {/* Cheques Register Table */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-[#C9A227] font-serif uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3 pl-4">File Number</th>
                <th className="p-3">Client / Payee</th>
                <th className="p-3">Drawer & Bank</th>
                <th className="p-3">Cheque Number</th>
                <th className="p-3">Expected Release</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Cheque Amount</th>
                <th className="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCheques.map(cheque => (
                <tr key={cheque.id} className="hover:bg-slate-900/60 transition">
                  
                  <td className="p-3 pl-4 font-mono font-extrabold text-[#C9A227]">
                    {cheque.fileNumber}
                  </td>

                  <td className="p-3 font-bold text-white">
                    {cheque.clientName}
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{cheque.drawerName}</div>
                    <div className="text-[10px] text-slate-400">{cheque.bankName}</div>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-300">
                    {cheque.chequeNumber}
                  </td>

                  <td className="p-3 font-mono text-slate-400">
                    {cheque.expectedReleaseDate}
                  </td>

                  <td className="p-3">
                    {getStatusBadge(cheque.status)}
                  </td>

                  <td className="p-3 text-right font-serif font-extrabold text-[#C9A227] text-sm">
                    KSh {cheque.amount.toLocaleString()}
                  </td>

                  <td className="p-3 pr-4 text-center">
                    <select
                      value={cheque.status}
                      onChange={e => handleStatusChange(cheque, e.target.value as PendingCheque['status'])}
                      className="p-1 border border-slate-700 rounded bg-slate-950 text-[10px] font-bold text-slate-200 focus:border-[#C9A227]"
                    >
                      <option value="Processing" className="bg-slate-900">Processing</option>
                      <option value="Ready for Pickup" className="bg-slate-900">Ready for Pickup</option>
                      <option value="Cleared" className="bg-slate-900">Cleared</option>
                      <option value="Bounced" className="bg-slate-900">Bounced</option>
                    </select>
                  </td>

                </tr>
              ))}

              {filteredCheques.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No pending cheques found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-base text-white">Register Pending Cheque</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheque} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">Physical File</label>
                <select
                  value={formData.fileId}
                  onChange={e => {
                    const f = files.find(file => file.id === e.target.value);
                    if (f) {
                      setFormData({
                        ...formData,
                        fileId: f.id,
                        fileNumber: f.internalFileNumber,
                        clientName: f.clientName,
                        drawerName: f.insuranceCompanyName !== 'N/A' ? f.insuranceCompanyName : 'Insurance Co.'
                      });
                    }
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono font-bold focus:border-[#C9A227]"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-900">{f.internalFileNumber} — {f.clientName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Drawer (Insurance / Defendant)</label>
                <input
                  type="text"
                  required
                  value={formData.drawerName}
                  onChange={e => setFormData({ ...formData, drawerName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Cheque Number</label>
                  <input
                    type="text"
                    required
                    value={formData.chequeNumber}
                    onChange={e => setFormData({ ...formData, chequeNumber: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Amount (KSh)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold font-mono focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Expected Release Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expectedReleaseDate}
                    onChange={e => setFormData({ ...formData, expectedReleaseDate: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as PendingCheque['status'] })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold focus:border-[#C9A227]"
                >
                  <option value="Processing" className="bg-slate-900">Processing</option>
                  <option value="Ready for Pickup" className="bg-slate-900">Ready for Pickup</option>
                  <option value="Cleared" className="bg-slate-900">Cleared</option>
                  <option value="Bounced" className="bg-slate-900">Bounced</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-slate-700 rounded text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded"
                >
                  Save Cheque Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
