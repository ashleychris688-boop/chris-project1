import React, { useState } from 'react';
import { 
  UnprocessedClientRecord, 
  RegistryFile, 
  User, 
  ClientType, 
  PartyCapacity,
  LawFirmProfile
} from '../types';
import { generateSystemInternalFileNumber } from '../utils/fileNumberGenerator';
import { 
  generatePreliminaryFileNumber, 
  getCaseTypeAbbreviation, 
  getNextPreliminarySequence 
} from '../utils/fileNumberUtils';
import { DEFAULT_CASE_CATEGORIES } from '../data/caseCategories';
import { CourtStationPicker } from './CourtStationPicker';
import { 
  Inbox, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FileCheck, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  FileText, 
  AlertCircle, 
  X, 
  Check, 
  Sparkles,
  ArrowRight,
  Filter,
  Building,
  Gavel,
  Landmark,
  Layers,
  FilePlus,
  Info,
  ClipboardList,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';

const STANDARD_CHECKLIST_ITEMS = [
  'National ID Copy',
  'Police Abstract',
  'Medical Report / P3',
  'Treatment Notes',
  'Retainer Agreement',
  'Fee Agreement',
  'KRA PIN Certificate',
  'Witness Statements',
  'Accident Scene Photos',
  'Insurance Claim Form'
];

interface UnprocessedSourcingModuleProps {
  unprocessedRecords: UnprocessedClientRecord[];
  onUpdateUnprocessedRecord: (record: UnprocessedClientRecord) => void;
  onAddFile: (file: RegistryFile) => void;
  files: RegistryFile[];
  courtStations: string[];
  cabinets: string[];
  fileNumberPrefix?: string;
  users: User[];
  currentUser: User | null;
  isModal?: boolean;
  onCloseModal?: () => void;
  currentFirm?: LawFirmProfile | null;
  onUpdateFirm?: (firm: LawFirmProfile) => void;
}

export const UnprocessedSourcingModule: React.FC<UnprocessedSourcingModuleProps> = ({
  unprocessedRecords = [],
  onUpdateUnprocessedRecord,
  onAddFile,
  files = [],
  courtStations = [],
  cabinets = [],
  fileNumberPrefix = 'NGA',
  users = [],
  currentUser,
  isModal = false,
  onCloseModal,
  currentFirm = null,
  onUpdateFirm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review & Action Modal State
  const [selectedRecord, setSelectedRecord] = useState<UnprocessedClientRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve_convert' | 'mark_approved' | 'reject'>('approve_convert');
  const [rejectionReason, setRejectionReason] = useState('');

  // Preliminary File Number Helpers
  const getFirmInitials = () => {
    return (currentFirm?.firmInitials || currentFirm?.firmCode?.split('-')[0] || fileNumberPrefix || 'NTA').trim().toUpperCase();
  };

  const computePreliminaryNumber = (caseTypeOrCategory: string) => {
    const { number: seqNum, year: curYear, firmInitials } = getNextPreliminarySequence(currentFirm);
    const initials = currentFirm?.firmInitials || firmInitials || getFirmInitials();
    return generatePreliminaryFileNumber(initials, caseTypeOrCategory, seqNum, curYear);
  };

  // Conversion Form Fields
  const [conversionData, setConversionData] = useState({
    internalFileNumber: '',
    courtCaseNumber: '',
    clientType: 'Individual' as ClientType,
    partyCapacity: 'Plaintiff' as PartyCapacity,
    opposingParty: '',
    courtStation: '',
    courtNumber: 'Court 1',
    magistrate: '',
    advocateName: '',
    clerkName: '',
    secretaryName: '',
    caseChaserName: '',
    insuranceCompanyName: 'None',
    caseCategory: 'Civil Litigation',
    caseType: 'General Civil Suit',
    subCaseType: 'General Civil Suit',
    room: 'Central Registry',
    cabinet: '',
    shelf: 'Shelf 1'
  });

  // Filtered records
  const filteredRecords = unprocessedRecords.filter(r => {
    const matchesSearch = 
      r.clientFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.caseChaserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.caseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.countyTown.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.nationalIdNumber && r.nationalIdNumber.includes(searchTerm));

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.status === statusFilter;
  });

  // Stats
  const pendingCount = unprocessedRecords.filter(r => r.status === 'Pending Review').length;
  const approvedCount = unprocessedRecords.filter(r => r.status === 'Approved').length;
  const convertedCount = unprocessedRecords.filter(r => r.status === 'Converted to Registry').length;
  const rejectedCount = unprocessedRecords.filter(r => r.status === 'Rejected').length;

  // Open Review Dialog
  const handleOpenReview = (record: UnprocessedClientRecord) => {
    setSelectedRecord(record);
    setReviewAction('approve_convert');
    setRejectionReason('');

    const preliminaryNum = record.preliminaryRefNumber || computePreliminaryNumber(record.caseType || 'General Civil Suit');
    const defaultAdvocate = users.find(u => u.role === 'Advocate' || u.role === 'Proprietor')?.fullName || '';
    const defaultClerk = currentUser?.role === 'Clerk' ? currentUser.fullName : (users.find(u => u.role === 'Clerk')?.fullName || '');
    const defaultSecretary = users.find(u => u.role === 'Secretary')?.fullName || '';

    setConversionData({
      internalFileNumber: preliminaryNum,
      courtCaseNumber: record.accidentDate ? `Accident Claim dtd ${record.accidentDate}` : '',
      clientType: 'Individual',
      partyCapacity: 'Plaintiff',
      opposingParty: record.insuranceCompany ? `Insured / ${record.insuranceCompany}` : 'To Be Identified',
      courtStation: record.courtStation || courtStations[0] || 'Milimani Law Courts',
      courtNumber: 'Court 1',
      magistrate: '',
      advocateName: defaultAdvocate,
      clerkName: defaultClerk,
      secretaryName: defaultSecretary,
      caseChaserName: record.caseChaserName,
      insuranceCompanyName: record.insuranceCompany || 'None',
      caseCategory: 'Civil Litigation',
      caseType: record.caseType || 'General Civil Suit',
      subCaseType: record.caseType || 'General Civil Suit',
      room: 'Central Registry',
      cabinet: cabinets[0] || 'Cabinet A - High Court Commercial',
      shelf: 'Shelf 1'
    });
  };

  // Submit Review Action
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const nowStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reviewerName = `${currentUser?.fullName || 'Reviewer'} (${currentUser?.role || 'Staff'})`;

    if (reviewAction === 'approve_convert') {
      if (!conversionData.internalFileNumber.trim()) {
        alert('System File Number is required.');
        return;
      }

      // Increment firm preliminary sequence
      if (currentFirm && onUpdateFirm) {
        const { number: seqNum, year: curYear } = getNextPreliminarySequence(currentFirm);
        onUpdateFirm({
          ...currentFirm,
          preliminaryNextNumber: seqNum + 1,
          preliminaryYear: curYear
        });
      }

      // Create new Registry File
      const newFile: RegistryFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        internalFileNumber: conversionData.internalFileNumber.trim(),
        courtCaseNumber: conversionData.courtCaseNumber.trim() || 'Pending Court Number',
        clientName: selectedRecord.clientFullName,
        clientType: conversionData.clientType,
        partyCapacity: conversionData.partyCapacity,
        opposingParty: conversionData.opposingParty.trim() || 'N/A',
        courtStation: conversionData.courtStation || courtStations[0] || 'Milimani Law Courts',
        courtNumber: conversionData.courtNumber || 'Court 1',
        magistrate: conversionData.magistrate || 'Unassigned',
        advocateName: conversionData.advocateName,
        clerkName: conversionData.clerkName,
        secretaryName: conversionData.secretaryName,
        caseChaserName: selectedRecord.caseChaserName,
        insuranceCompanyName: conversionData.insuranceCompanyName,
        currentStatus: 'Active',
        physicalLocation: {
          room: conversionData.room,
          cabinet: conversionData.cabinet || cabinets[0] || 'Cabinet A',
          shelf: conversionData.shelf
        },
        dateOpened: nowStr,
        caseCategory: conversionData.caseCategory,
        caseType: conversionData.caseType,
        subCaseType: conversionData.subCaseType,
        additionalParties: selectedRecord.additionalParties || [],
        notes: `[Converted from Case Chaser Preliminary Intake - ${selectedRecord.caseChaserName}]\nCaptured: ${selectedRecord.dateCaptured}\nDescription: ${selectedRecord.briefDescription}`
      };

      onAddFile(newFile);

      // Update Unprocessed Record
      onUpdateUnprocessedRecord({
        ...selectedRecord,
        status: 'Converted to Registry',
        reviewedBy: reviewerName,
        reviewedAt: `${nowStr} ${timeStr}`,
        createdFileNumber: newFile.internalFileNumber
      });

      alert(`Intake converted successfully! Official Registry File Created: ${newFile.internalFileNumber}`);

    } else if (reviewAction === 'mark_approved') {
      onUpdateUnprocessedRecord({
        ...selectedRecord,
        status: 'Approved',
        reviewedBy: reviewerName,
        reviewedAt: `${nowStr} ${timeStr}`
      });
      alert(`Intake marked as Approved! Case Chaser ${selectedRecord.caseChaserName} notified.`);

    } else {
      if (!rejectionReason.trim()) {
        alert('Please provide a reason for rejecting this intake.');
        return;
      }
      onUpdateUnprocessedRecord({
        ...selectedRecord,
        status: 'Rejected',
        reviewedBy: reviewerName,
        reviewedAt: `${nowStr} ${timeStr}`,
        rejectionReason: rejectionReason.trim()
      });
      alert(`Intake rejected. Case Chaser ${selectedRecord.caseChaserName} notified.`);
    }

    setSelectedRecord(null);
  };

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0A1D33] to-slate-900 p-6 rounded-2xl border border-amber-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black shadow-lg">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-2xl text-white tracking-wide">
                Unprocessed Sourcing Bucket
              </h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-extrabold rounded-full border border-amber-500/40 uppercase">
                Clerk & Admin Review
              </span>
            </div>
          </div>
        </div>

        {isModal && onCloseModal && (
          <button
            onClick={onCloseModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('Pending Review')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'Pending Review' 
              ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/40' 
              : 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-mono font-black text-white mt-2">{pendingCount}</div>
          <p className="text-[10px] text-amber-200/70 mt-1">Awaiting Clerk Action</p>
        </div>

        <div 
          onClick={() => setStatusFilter('Approved')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'Approved' 
              ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40' 
              : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-black text-white mt-2">{approvedCount}</div>
          <p className="text-[10px] text-emerald-200/70 mt-1">Ready for Registry Conversion</p>
        </div>

        <div 
          onClick={() => setStatusFilter('Converted to Registry')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'Converted to Registry' 
              ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/40' 
              : 'bg-slate-900 border-slate-800 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Converted to File</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-mono font-black text-white mt-2">{convertedCount}</div>
          <p className="text-[10px] text-blue-200/70 mt-1">Official Registry Files</p>
        </div>

        <div 
          onClick={() => setStatusFilter('Rejected')}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === 'Rejected' 
              ? 'bg-red-950/80 border-red-400 ring-2 ring-red-500/40' 
              : 'bg-slate-900 border-slate-800 hover:border-red-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-mono font-black text-white mt-2">{rejectedCount}</div>
          <p className="text-[10px] text-red-200/70 mt-1">Intakes Declined</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, chaser, case type, county..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'Pending Review', 'Approved', 'Converted to Registry', 'Rejected'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Unprocessed Intakes */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-[11px] font-mono text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3">Captured Date</th>
                <th className="p-3">Client Information</th>
                <th className="p-3">Case Type & Details</th>
                <th className="p-3">Case Chaser</th>
                <th className="p-3">Documents</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">No preliminary client intakes match current filter.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => {
                  const docsMap = r.documentsChecklist || {};
                  const docKeys = Array.from(new Set([...STANDARD_CHECKLIST_ITEMS, ...Object.keys(docsMap)]));
                  const checkedDocs = docKeys.filter(k => !!docsMap[k]);
                  const missingDocs = docKeys.filter(k => !docsMap[k]);

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                        <div>{r.dateCaptured}</div>
                        <div className="text-[10px] text-slate-500">{r.timeCaptured}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{r.clientFullName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-slate-500" /> {r.phoneNumber}</span>
                          {r.countyTown && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-500" /> {r.countyTown}</span>}
                        </div>
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-amber-300 text-xs">{r.caseType}</div>
                        <div className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{r.briefDescription}</div>
                        {r.insuranceCompany && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Insurance: {r.insuranceCompany}</div>
                        )}
                      </td>

                      <td className="p-3 font-medium text-slate-200">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{r.caseChaserName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.chaserId}</div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold border inline-flex items-center gap-1 w-fit ${
                            checkedDocs.length >= 7 
                              ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                              : checkedDocs.length >= 4 
                              ? 'bg-amber-950/80 border-amber-700/80 text-amber-300'
                              : 'bg-red-950/80 border-red-700/80 text-red-300'
                          }`}>
                            <ClipboardList className="w-3 h-3 shrink-0" />
                            {checkedDocs.length} / {docKeys.length} Checked
                          </span>
                          {missingDocs.length > 0 ? (
                            <span className="text-[10px] text-red-400/90 font-mono">
                              {missingDocs.length} missing doc(s)
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400/90 font-mono">
                              100% Complete
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {r.status === 'Pending Review' && (
                          <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-600/60 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 animate-pulse" /> Pending Review
                          </span>
                        )}
                        {r.status === 'Approved' && (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {r.status === 'Converted to Registry' && (
                          <span className="px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-600/60 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                            <FileCheck className="w-3 h-3" /> {r.createdFileNumber || 'Converted File'}
                          </span>
                        )}
                        {r.status === 'Rejected' && (
                          <span className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-600/60 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {(r.status === 'Pending Review' || r.status === 'Approved') ? (
                          <button
                            onClick={() => handleOpenReview(r)}
                            className="px-3 py-1.5 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review & Action</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenReview(r)}
                            className="px-3 py-1.5 bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold text-xs rounded-lg transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Details</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW & ACTION DIALOG MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0A1A2F] border-2 border-[#C9A227] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header (Fixed Top) */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#081729] shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold rounded border border-amber-500/40 uppercase">
                    Clerk & Admin Intake Review
                  </span>
                  {selectedRecord.status === 'Pending Review' && (
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700/80 text-[10px] font-bold rounded-full font-mono">
                      🟡 Pending Review
                    </span>
                  )}
                  {selectedRecord.status === 'Approved' && (
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/80 text-[10px] font-bold rounded-full font-mono">
                      🟢 Approved
                    </span>
                  )}
                  {selectedRecord.status === 'Converted to Registry' && (
                    <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-700/80 text-[10px] font-bold rounded-full font-mono">
                      🔵 Converted ({selectedRecord.createdFileNumber})
                    </span>
                  )}
                  {selectedRecord.status === 'Rejected' && (
                    <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-700/80 text-[10px] font-bold rounded-full font-mono">
                      🔴 Rejected
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                  <span>{selectedRecord.clientFullName}</span>
                  <span className="text-xs text-amber-300 font-mono font-normal">({selectedRecord.caseType})</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Captured by <strong className="text-slate-200">{selectedRecord.caseChaserName}</strong> ({selectedRecord.chaserId}) on {selectedRecord.dateCaptured} at {selectedRecord.timeCaptured}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#0A1A2F]">
              
              {/* SECTION 1: FULL FILE & INTAKE STATUS */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-[#C9A227]" />
                    Preliminary Client Intake Parameters
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID / Passport: <strong className="text-slate-200">{selectedRecord.nationalIdNumber || 'N/A'}</strong></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Phone Contact</span>
                    <span className="font-bold text-slate-100 font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#C9A227]" />
                      {selectedRecord.phoneNumber}
                    </span>
                    {selectedRecord.altPhoneNumber && (
                      <span className="text-[10px] text-slate-400 font-mono block">Alt: {selectedRecord.altPhoneNumber}</span>
                    )}
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">County / Location</span>
                    <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#C9A227]" />
                      {selectedRecord.countyTown || 'Not Specified'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Referral Source</span>
                    <span className="font-bold text-slate-200 block mt-0.5">
                      {selectedRecord.referralSource || 'Walk-in Direct'}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Insurance Company</span>
                    <span className="font-bold text-amber-300 block mt-0.5">
                      {selectedRecord.insuranceCompany || 'None / Self'}
                    </span>
                  </div>
                </div>

                {/* Brief Matter Description */}
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Brief Matter Description</span>
                  <div className="text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs leading-relaxed italic">
                    "{selectedRecord.briefDescription}"
                  </div>
                </div>

                {selectedRecord.notes && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Additional Notes / Remarks</span>
                    <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-xs">
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}

                {selectedRecord.reviewedBy && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Reviewed By: <strong className="text-amber-300">{selectedRecord.reviewedBy}</strong></span>
                    <span>Reviewed At: {selectedRecord.reviewedAt}</span>
                  </div>
                )}
              </div>

              {/* SECTION 2: FILE REQUIREMENTS & DOCUMENTS CHECKLIST */}
              {(() => {
                const docsMap = selectedRecord.documentsChecklist || {};
                const docKeys = Array.from(new Set([...STANDARD_CHECKLIST_ITEMS, ...Object.keys(docsMap)]));
                const checkedDocs = docKeys.filter(k => !!docsMap[k]);
                const missingDocs = docKeys.filter(k => !docsMap[k]);

                return (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#C9A227]" />
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                          File Document Checklist & Verification Status
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/80 rounded-full font-bold">
                          ✓ {checkedDocs.length} Checked
                        </span>
                        <span className="px-2.5 py-0.5 bg-red-950 text-red-300 border border-red-700/80 rounded-full font-bold">
                          ✕ {missingDocs.length} Missing
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Verify all required physical and digital documents captured during intake before converting to an official firm registry file.
                    </p>

                    {/* Document Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {docKeys.map(docName => {
                        const isPresent = !!docsMap[docName];
                        return (
                          <div
                            key={docName}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                              isPresent
                                ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-200'
                                : 'bg-red-950/20 border-red-900/40 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isPresent ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-red-400/70 shrink-0" />
                              )}
                              <span className={`truncate text-xs ${isPresent ? 'font-bold text-emerald-200' : 'text-slate-400'}`}>
                                {docName}
                              </span>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              isPresent 
                                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600/60'
                                : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}>
                              {isPresent ? 'Checked / Present' : 'Missing'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {missingDocs.length > 0 && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-300 flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Note for Approving Admin/Clerk:</strong>
                          <span>
                            This intake is missing <strong>{missingDocs.length} required document(s)</strong> ({missingDocs.slice(0, 3).join(', ')}{missingDocs.length > 3 ? '...' : ''}). You may still approve or convert, or mark missing documents for Case Chaser follow-up.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SECTION 3: DECISION FORM & CONVERSION PARAMETERS */}
              <form id="review-action-form" onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-200 text-xs mb-2 uppercase tracking-wider">
                    Select Review Action Decision
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction('approve_convert')}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition ${
                        reviewAction === 'approve_convert'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FilePlus className="w-4 h-4 text-emerald-400" />
                      <span>Approve & Convert to Registry File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction('mark_approved')}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition ${
                        reviewAction === 'mark_approved'
                          ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Mark Approved Only</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction('reject')}
                      className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition ${
                        reviewAction === 'reject'
                          ? 'bg-red-950 border-red-500 text-red-300 shadow-md ring-2 ring-red-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Reject Intake</span>
                    </button>
                  </div>
                </div>

                {/* Conversion Form Fields when 'approve_convert' */}
                {reviewAction === 'approve_convert' && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/60 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold border-b border-emerald-900/50 pb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Registry File Conversion Parameters</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">System Generated File Number *</label>
                        <input
                          type="text"
                          value={conversionData.internalFileNumber}
                          onChange={e => setConversionData({ ...conversionData, internalFileNumber: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Court Case Number</label>
                        <input
                          type="text"
                          placeholder="e.g. Milimani HCCC No. 428 of 2026"
                          value={conversionData.courtCaseNumber}
                          onChange={e => setConversionData({ ...conversionData, courtCaseNumber: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Opposing Party / Defendant</label>
                        <input
                          type="text"
                          value={conversionData.opposingParty}
                          onChange={e => setConversionData({ ...conversionData, opposingParty: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Court Station</label>
                        <CourtStationPicker
                          value={conversionData.courtStation}
                          onChange={val => setConversionData({ ...conversionData, courtStation: val })}
                          availableStations={courtStations}
                          placeholder="Select court station..."
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Assigned Advocate</label>
                        <select
                          value={conversionData.advocateName}
                          onChange={e => setConversionData({ ...conversionData, advocateName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                        >
                          {users.filter(u => u.role === 'Advocate' || u.role === 'Proprietor').map(u => (
                            <option key={u.id} value={u.fullName}>{u.fullName} ({u.role})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Storage Cabinet Location</label>
                        <select
                          value={conversionData.cabinet}
                          onChange={e => setConversionData({ ...conversionData, cabinet: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                        >
                          {cabinets.map(cab => (
                            <option key={cab} value={cab}>{cab}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Reason when 'reject' */}
                {reviewAction === 'reject' && (
                  <div>
                    <label className="block text-xs font-bold text-red-300 mb-1">Reason for Rejection *</label>
                    <textarea
                      rows={3}
                      placeholder="Provide clear reasons so Case Chaser can rectify..."
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-950 border border-red-900/80 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer (Fixed Bottom) */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-[#081729] shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="review-action-form"
                className={`px-5 py-2 font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer ${
                  reviewAction === 'approve_convert'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                    : reviewAction === 'mark_approved'
                    ? 'bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-black'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {reviewAction === 'approve_convert' && 'Convert Intake & Create Registry File'}
                  {reviewAction === 'mark_approved' && 'Mark as Approved'}
                  {reviewAction === 'reject' && 'Confirm Rejection'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#071526] border-2 border-amber-500/50 rounded-2xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
