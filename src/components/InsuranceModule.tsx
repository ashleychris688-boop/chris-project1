import React, { useState } from 'react';
import { InsuranceClaim, RegistryFile } from '../types';
import { 
  Building, 
  Search, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck,
  Building2,
  X
} from 'lucide-react';

interface InsuranceModuleProps {
  claims: InsuranceClaim[];
  files: RegistryFile[];
  onUpdateClaim: (claim: InsuranceClaim) => void;
  onAddClaim: (claim: InsuranceClaim) => void;
}

export const InsuranceModule: React.FC<InsuranceModuleProps> = ({
  claims,
  files,
  onUpdateClaim,
  onAddClaim
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Claim State
  const [formData, setFormData] = useState<Partial<InsuranceClaim>>({
    fileId: files[0]?.id || '',
    fileNumber: files[0]?.internalFileNumber || 'LFR/2026/0142',
    clientName: files[0]?.clientName || '',
    insuranceCompany: 'Jubilee Insurance Co.',
    claimRef: `JUB/CLAIM/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    offerStatus: 'Under Negotiation',
    negotiationStatus: 'Counter Offer',
    consentSigned: false,
    chequeProcessingStatus: 'In Process',
    paymentReceived: false,
    settlementAmount: 2500000
  });

  const filteredClaims = claims.filter(c => 
    c.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.claimRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleConsent = (claim: InsuranceClaim) => {
    onUpdateClaim({
      ...claim,
      consentSigned: !claim.consentSigned
    });
  };

  const handleSaveClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: InsuranceClaim = {
      id: `ic-${Date.now()}`,
      fileId: formData.fileId || `f-${Date.now()}`,
      fileNumber: formData.fileNumber || 'LFR/2026/0199',
      clientName: formData.clientName || 'Client',
      insuranceCompany: formData.insuranceCompany || 'Insurance Co',
      claimRef: formData.claimRef || 'REF-123',
      offerStatus: (formData.offerStatus as InsuranceClaim['offerStatus']) || 'Under Negotiation',
      negotiationStatus: (formData.negotiationStatus as InsuranceClaim['negotiationStatus']) || 'Counter Offer',
      consentSigned: formData.consentSigned || false,
      chequeProcessingStatus: (formData.chequeProcessingStatus as InsuranceClaim['chequeProcessingStatus']) || 'In Process',
      paymentReceived: formData.paymentReceived || false,
      settlementAmount: Number(formData.settlementAmount) || 1000000
    };

    onAddClaim(newClaim);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">Insurance Claim & Settlement Tracker</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Track offer negotiations, signed consent forms, cheque processing statuses & pending insurance settlement disbursements.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Track Insurance Claim
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search insurance firm, claim ref #, client, file #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-[#C9A227]"
          />
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-[#C9A227] font-serif uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3 pl-4">File Number</th>
                <th className="p-3">Insurance Company</th>
                <th className="p-3">Claim Ref #</th>
                <th className="p-3">Offer Status</th>
                <th className="p-3">Negotiation Stage</th>
                <th className="p-3 text-center">Consent Signed</th>
                <th className="p-3">Cheque Status</th>
                <th className="p-3 pr-4 text-right">Settlement Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClaims.map(claim => (
                <tr key={claim.id} className="hover:bg-slate-900/60 transition">
                  
                  <td className="p-3 pl-4 font-mono font-extrabold text-[#C9A227]">
                    {claim.fileNumber}
                    <div className="text-[10px] text-slate-400 font-sans font-normal">{claim.clientName}</div>
                  </td>

                  <td className="p-3 font-bold text-white">
                    {claim.insuranceCompany}
                  </td>

                  <td className="p-3 font-mono text-slate-300">
                    {claim.claimRef}
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
                      {claim.offerStatus}
                    </span>
                  </td>

                  <td className="p-3 font-semibold text-slate-300">
                    {claim.negotiationStatus}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleConsent(claim)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                        claim.consentSigned
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/80'
                      }`}
                    >
                      {claim.consentSigned ? 'Signed ✓' : 'Pending Sign'}
                    </button>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-200">
                    {claim.chequeProcessingStatus}
                  </td>

                  <td className="p-3 pr-4 text-right font-serif font-extrabold text-[#C9A227] text-sm">
                    KSh {claim.settlementAmount.toLocaleString()}
                  </td>

                </tr>
              ))}

              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No insurance claim records found.
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
              <h3 className="font-serif font-bold text-base text-white">Track Insurance Claim</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClaim} className="space-y-3 text-xs">
              
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
                        insuranceCompany: f.insuranceCompanyName
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
                <label className="block font-bold text-slate-300 mb-1">Insurance Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.insuranceCompany}
                  onChange={e => setFormData({ ...formData, insuranceCompany: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Claim Reference Number</label>
                <input
                  type="text"
                  required
                  value={formData.claimRef}
                  onChange={e => setFormData({ ...formData, claimRef: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Offer Status</label>
                  <select
                    value={formData.offerStatus}
                    onChange={e => setFormData({ ...formData, offerStatus: e.target.value as InsuranceClaim['offerStatus'] })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  >
                    <option value="Pending Offer" className="bg-slate-900">Pending Offer</option>
                    <option value="Offer Received" className="bg-slate-900">Offer Received</option>
                    <option value="Under Negotiation" className="bg-slate-900">Under Negotiation</option>
                    <option value="Accepted" className="bg-slate-900">Accepted</option>
                    <option value="Rejected" className="bg-slate-900">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Negotiation Stage</label>
                  <select
                    value={formData.negotiationStatus}
                    onChange={e => setFormData({ ...formData, negotiationStatus: e.target.value as InsuranceClaim['negotiationStatus'] })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  >
                    <option value="Initial Demand" className="bg-slate-900">Initial Demand</option>
                    <option value="Counter Offer" className="bg-slate-900">Counter Offer</option>
                    <option value="Final Terms Agreed" className="bg-slate-900">Final Terms Agreed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Settlement Amount (KSh)</label>
                <input
                  type="number"
                  required
                  value={formData.settlementAmount}
                  onChange={e => setFormData({ ...formData, settlementAmount: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold font-mono focus:border-[#C9A227]"
                />
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
                  Save Claim Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
