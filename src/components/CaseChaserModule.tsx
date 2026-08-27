import React, { useState } from 'react';
import { 
  RegistryFile, 
  User, 
  CaseChaserProfile, 
  ChaserFollowUpLog, 
  ChaserFileResponsibility, 
  ChaserTask,
  TaskTitlePreset,
  UnprocessedClientRecord,
  UnprocessedStatus,
  LawFirmProfile
} from '../types';
import { 
  generatePreliminaryFileNumber, 
  getCaseTypeAbbreviation, 
  getNextPreliminarySequence 
} from '../utils/fileNumberUtils';
import { STANDARD_MISSING_REQUIREMENTS_CHECKLIST } from '../data/chaserData';
import { 
  Handshake, 
  Search, 
  Plus, 
  CheckSquare, 
  Square, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  ShieldCheck, 
  ShieldAlert, 
  DollarSign, 
  Award, 
  Lock, 
  Eye, 
  Key, 
  Send, 
  Filter, 
  User as UserIcon,
  Briefcase,
  Layers,
  ChevronRight,
  ClipboardList,
  History,
  Tag,
  Stethoscope,
  Scale,
  Inbox,
  UserPlus,
  FileCheck,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FolderArchive,
  Building,
  HelpCircle,
  MapPin,
  CheckCircle
} from 'lucide-react';

interface CaseChaserModuleProps {
  files: RegistryFile[];
  users: User[];
  currentUser: User | null;
  chasers: CaseChaserProfile[];
  followUpLogs: ChaserFollowUpLog[];
  responsibilities: ChaserFileResponsibility[];
  tasks: ChaserTask[];
  unprocessedRecords?: UnprocessedClientRecord[];
  onAddUnprocessedRecord?: (record: UnprocessedClientRecord) => void;
  onUpdateUnprocessedRecord?: (record: UnprocessedClientRecord) => void;
  onAddFile?: (file: RegistryFile) => void;
  onAddFollowUpLog: (log: ChaserFollowUpLog) => void;
  onUpdateResponsibility: (item: ChaserFileResponsibility) => void;
  onAddTask: (task: ChaserTask) => void;
  onUpdateTask: (task: ChaserTask) => void;
  onUpdateChaserProfile?: (chaser: CaseChaserProfile) => void;
  currentFirm?: LawFirmProfile | null;
}

export const CaseChaserModule: React.FC<CaseChaserModuleProps> = ({
  files,
  users,
  currentUser,
  chasers,
  followUpLogs,
  responsibilities,
  tasks,
  unprocessedRecords = [],
  onAddUnprocessedRecord,
  onUpdateUnprocessedRecord,
  onAddFile,
  onAddFollowUpLog,
  onUpdateResponsibility,
  onAddTask,
  onUpdateTask,
  onUpdateChaserProfile,
  currentFirm = null
}) => {
  const isChaserRole = currentUser?.role === 'Case Chaser';
  const isAdminOrProprietor = currentUser?.role === 'Proprietor' || currentUser?.role === 'Admin';
  const isClerkOrProprietor = currentUser?.role === 'Clerk' || currentUser?.role === 'Proprietor' || currentUser?.role === 'Admin';

  // Identify current selected or logged-in chaser
  const defaultChaser = chasers.find(c => c.fullName.toLowerCase().includes(currentUser?.fullName?.toLowerCase() || '')) || chasers[0];
  const [selectedChaserId, setSelectedChaserId] = useState<string>(defaultChaser?.chaserId || 'CC-001');

  const activeChaser = chasers.find(c => c.chaserId === selectedChaserId) || defaultChaser;

  // Active Tab inside Case Chaser module
  const [activeSubTab, setActiveSubTab] = useState<'unprocessed' | 'dashboard' | 'logs' | 'profiles'>(
    isClerkOrProprietor ? 'unprocessed' : 'dashboard'
  );

  // Filter states for Unprocessed Bucket
  const [unprocessedSearchTerm, setUnprocessedSearchTerm] = useState('');
  const [unprocessedStatusFilter, setUnprocessedStatusFilter] = useState<UnprocessedStatus | 'All'>('All');
  const [selectedRecordDetails, setSelectedRecordDetails] = useState<UnprocessedClientRecord | null>(null);

  // Helper to generate default preliminary document checklist
  const createDefaultIntakeChecklist = (): Record<string, boolean> => {
    const initialMap: Record<string, boolean> = {};
    STANDARD_MISSING_REQUIREMENTS_CHECKLIST.forEach(item => {
      initialMap[item] = false;
    });
    return initialMap;
  };

  // Preliminary Client Intake Modal state
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [newIntakeData, setNewIntakeData] = useState<{
    clientFullName: string;
    phoneNumber: string;
    altPhoneNumber: string;
    nationalIdNumber: string;
    countyTown: string;
    referralSource: string;
    caseType: string;
    briefDescription: string;
    dateMatterReceived: string;
    accidentDate: string;
    courtStation: string;
    insuranceCompany: string;
    notes: string;
    documentsChecklist: Record<string, boolean>;
  }>({
    clientFullName: '',
    phoneNumber: '',
    altPhoneNumber: '',
    nationalIdNumber: '',
    countyTown: '',
    referralSource: 'Walk-in / Client Referral',
    caseType: 'Motor Accident / Insurance',
    briefDescription: '',
    dateMatterReceived: new Date().toISOString().split('T')[0],
    accidentDate: '',
    courtStation: 'Milimani Law Courts',
    insuranceCompany: '',
    notes: '',
    documentsChecklist: createDefaultIntakeChecklist()
  });

  // Review Modal state (for Clerk & Proprietor)
  const [selectedRecordForReview, setSelectedRecordForReview] = useState<UnprocessedClientRecord | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{
    action: 'approve' | 'mark_approved' | 'reject';
    internalFileNumber: string;
    courtCaseNumber: string;
    advocateName: string;
    clerkName: string;
    secretaryName: string;
    magistrate: string;
    opposingParty: string;
    rejectionReason: string;
  }>({
    action: 'approve',
    internalFileNumber: '',
    courtCaseNumber: '',
    advocateName: '',
    clerkName: '',
    secretaryName: '',
    magistrate: '',
    opposingParty: '',
    rejectionReason: ''
  });

  // Filter state for assigned files
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [selectedFileForResponsibility, setSelectedFileForResponsibility] = useState<RegistryFile | null>(null);

  // New Follow Up Log state
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLogData, setNewLogData] = useState<{
    fileId: string;
    contactMethod: ChaserFollowUpLog['contactMethod'];
    outcome: string;
    nextAction: string;
  }>({
    fileId: '',
    contactMethod: 'Phone Call',
    outcome: '',
    nextAction: ''
  });

  // Custom missing item addition state
  const [customRequirementInput, setCustomRequirementInput] = useState('');

  // Unprocessed Bucket Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysAgoMs = Date.now() - 3 * 86400000;

  const pendingReviewList = unprocessedRecords.filter(r => r.status === 'Pending Review');
  const totalPendingReview = pendingReviewList.length;

  const approvedTodayCount = unprocessedRecords.filter(r =>
    (r.status === 'Approved' || r.status === 'Converted to Registry') &&
    ((r.reviewedAt && r.reviewedAt.includes(todayStr)) || r.dateCaptured === todayStr)
  ).length;

  const rejectedTodayCount = unprocessedRecords.filter(r =>
    r.status === 'Rejected' &&
    ((r.reviewedAt && r.reviewedAt.includes(todayStr)) || r.dateCaptured === todayStr)
  ).length;

  const pendingMoreThan3DaysCount = pendingReviewList.filter(r => {
    if (!r.dateCaptured) return false;
    const capturedMs = new Date(r.dateCaptured).getTime();
    return !isNaN(capturedMs) && capturedMs < threeDaysAgoMs;
  }).length;

  // Filter unprocessed records based on visibility & role
  const visibleUnprocessedRecords = unprocessedRecords.filter(r => {
    const matchesSearch = unprocessedSearchTerm === '' ||
      r.clientFullName.toLowerCase().includes(unprocessedSearchTerm.toLowerCase()) ||
      r.phoneNumber.toLowerCase().includes(unprocessedSearchTerm.toLowerCase()) ||
      r.caseType.toLowerCase().includes(unprocessedSearchTerm.toLowerCase()) ||
      r.caseChaserName.toLowerCase().includes(unprocessedSearchTerm.toLowerCase()) ||
      r.countyTown.toLowerCase().includes(unprocessedSearchTerm.toLowerCase());

    const matchesStatus = unprocessedStatusFilter === 'All' || r.status === unprocessedStatusFilter;

    if (isChaserRole) {
      const chaserFirstName = (activeChaser?.fullName || currentUser?.fullName || '').split(' ')[0].toLowerCase();
      const isMine = r.caseChaserName.toLowerCase().includes(chaserFirstName) || r.chaserId === activeChaser?.chaserId;
      return isMine && matchesSearch && matchesStatus;
    }

    return matchesSearch && matchesStatus;
  });

  // Save New Intake Submission (Case Chaser / Staff)
  const handleSaveIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntakeData.clientFullName || !newIntakeData.phoneNumber || !newIntakeData.briefDescription) {
      alert('Please fill in mandatory fields: Client Full Name, Phone Number, and Brief Description.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const { number: seqNum, year: curYear, firmInitials } = getNextPreliminarySequence(currentFirm);
    const initials = currentFirm?.firmInitials || firmInitials || 'NTA';
    const preliminaryRef = generatePreliminaryFileNumber(initials, newIntakeData.caseType || 'Motor Accident / Insurance', seqNum, curYear);

    const record: UnprocessedClientRecord = {
      id: `unproc-${Date.now()}`,
      preliminaryRefNumber: preliminaryRef,
      clientFullName: newIntakeData.clientFullName,
      phoneNumber: newIntakeData.phoneNumber,
      altPhoneNumber: newIntakeData.altPhoneNumber || undefined,
      nationalIdNumber: newIntakeData.nationalIdNumber || undefined,
      countyTown: newIntakeData.countyTown || 'Nairobi',
      referralSource: newIntakeData.referralSource || 'Walk-in / Client Referral',
      caseType: newIntakeData.caseType || 'Motor Accident / Insurance',
      briefDescription: newIntakeData.briefDescription,
      dateMatterReceived: newIntakeData.dateMatterReceived || dateStr,
      accidentDate: newIntakeData.accidentDate || undefined,
      courtStation: newIntakeData.courtStation || undefined,
      insuranceCompany: newIntakeData.insuranceCompany || undefined,
      chaserId: activeChaser?.chaserId || 'CC-001',
      caseChaserName: activeChaser?.fullName || currentUser?.fullName || 'Case Chaser',
      dateCaptured: dateStr,
      timeCaptured: timeStr,
      status: 'Pending Review',
      notes: newIntakeData.notes || undefined,
      documentsChecklist: newIntakeData.documentsChecklist
    };

    if (onAddUnprocessedRecord) {
      onAddUnprocessedRecord(record);
    }

    setShowIntakeModal(false);
    setNewIntakeData({
      clientFullName: '',
      phoneNumber: '',
      altPhoneNumber: '',
      nationalIdNumber: '',
      countyTown: '',
      referralSource: 'Walk-in / Client Referral',
      caseType: 'Motor Accident / Insurance',
      briefDescription: '',
      dateMatterReceived: dateStr,
      accidentDate: '',
      courtStation: 'Milimani Law Courts',
      insuranceCompany: '',
      notes: '',
      documentsChecklist: createDefaultIntakeChecklist()
    });
  };

  // Open Review Modal (Clerk / Proprietor)
  const handleOpenReviewModal = (record: UnprocessedClientRecord) => {
    const nextFileNum = `LFR/2026/01${(files.length + 42).toString().padStart(2, '0')}`;
    const defaultAdv = users.find(u => u.role === 'Advocate')?.fullName || 'Adv. Otieno';
    const defaultClerk = currentUser?.role === 'Clerk' ? currentUser.fullName : (users.find(u => u.role === 'Clerk')?.fullName || 'James Mwangi');
    const defaultSec = users.find(u => u.role === 'Secretary')?.fullName || 'Jane Wanjiku';

    setSelectedRecordForReview(record);
    setReviewModalData({
      action: 'approve',
      internalFileNumber: nextFileNum,
      courtCaseNumber: '',
      advocateName: defaultAdv,
      clerkName: defaultClerk,
      secretaryName: defaultSec,
      magistrate: 'Hon. Resident Magistrate',
      opposingParty: record.insuranceCompany ? `${record.insuranceCompany} / Insured` : 'Opposing Party',
      rejectionReason: ''
    });
  };

  // Process Review Submission (Clerk / Proprietor)
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForReview) return;

    const nowStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (reviewModalData.action === 'approve') {
      const newFileNum = reviewModalData.internalFileNumber || `LFR/2026/01${files.length + 42}`;

      const fileToCreate: RegistryFile = {
        id: `file-${Date.now()}`,
        internalFileNumber: newFileNum,
        courtCaseNumber: reviewModalData.courtCaseNumber || 'Unassigned / Pre-Filing',
        clientName: selectedRecordForReview.clientFullName,
        clientType: 'Individual',
        partyCapacity: 'Plaintiff',
        opposingParty: reviewModalData.opposingParty || selectedRecordForReview.insuranceCompany || 'Opposing Party',
        courtStation: selectedRecordForReview.courtStation || 'Milimani Law Courts',
        courtNumber: 'Court 1',
        magistrate: reviewModalData.magistrate || 'Hon. Resident Magistrate',
        advocateName: reviewModalData.advocateName,
        clerkName: reviewModalData.clerkName,
        secretaryName: reviewModalData.secretaryName,
        caseChaserName: selectedRecordForReview.caseChaserName,
        insuranceCompanyName: selectedRecordForReview.insuranceCompany || '',
        currentStatus: 'Active',
        physicalLocation: { room: 'Registry A', cabinet: 'Cab-1', shelf: 'Shelf-1' },
        dateOpened: nowStr,
        notes: `Converted from preliminary intake (Ref: ${selectedRecordForReview.id}). Sourced by: ${selectedRecordForReview.caseChaserName}. ${selectedRecordForReview.briefDescription}. ${selectedRecordForReview.notes || ''}`
      };

      if (onAddFile) {
        onAddFile(fileToCreate);
      }

      if (selectedRecordForReview.documentsChecklist) {
        onUpdateResponsibility({
          fileId: fileToCreate.id,
          fileNumber: newFileNum,
          clientContacted: true,
          lastContactDate: nowStr,
          missingChecklist: selectedRecordForReview.documentsChecklist,
          customMissingItems: [],
          clientResponsive: true,
          readyForAdvocateReview: false,
          readyForDoctorReview: false,
          updatedAt: `${nowStr} ${timeStr}`,
          updatedBy: currentUser?.fullName || 'Clerk'
        });
      }

      if (onUpdateUnprocessedRecord) {
        onUpdateUnprocessedRecord({
          ...selectedRecordForReview,
          status: 'Converted to Registry',
          reviewedBy: `${currentUser?.fullName || 'Reviewer'} (${currentUser?.role || 'Staff'})`,
          reviewedAt: `${nowStr} ${timeStr}`,
          createdFileNumber: newFileNum
        });
      }
    } else if (reviewModalData.action === 'mark_approved') {
      if (onUpdateUnprocessedRecord) {
        onUpdateUnprocessedRecord({
          ...selectedRecordForReview,
          status: 'Approved',
          reviewedBy: `${currentUser?.fullName || 'Reviewer'} (${currentUser?.role || 'Staff'})`,
          reviewedAt: `${nowStr} ${timeStr}`
        });
      }
    } else {
      if (!reviewModalData.rejectionReason) {
        alert('Please specify the reason for rejection.');
        return;
      }

      if (onUpdateUnprocessedRecord) {
        onUpdateUnprocessedRecord({
          ...selectedRecordForReview,
          status: 'Rejected',
          reviewedBy: `${currentUser?.fullName || 'Reviewer'} (${currentUser?.role || 'Staff'})`,
          reviewedAt: `${nowStr} ${timeStr}`,
          rejectionReason: reviewModalData.rejectionReason
        });
      }
    }

    setSelectedRecordForReview(null);
  };


  // Files assigned to current active chaser
  const assignedFiles = files.filter(f => {
    if (!activeChaser) return false;
    const chaserFirstName = activeChaser.fullName.split(' ')[0].toLowerCase();
    return f.caseChaserName && f.caseChaserName.toLowerCase().includes(chaserFirstName);
  });

  // Filtered files
  const filteredAssignedFiles = assignedFiles.filter(f => 
    f.internalFileNumber.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
    f.courtCaseNumber.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
    f.clientName.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
    f.opposingParty.toLowerCase().includes(fileSearchTerm.toLowerCase())
  );

  // Tasks for current active chaser
  const chaserTasks = tasks.filter(t => t.assignedToChaserId === activeChaser?.chaserId);

  // Helper to get or create responsibility record for a file
  const getFileResp = (fileId: string, fileNumber: string): ChaserFileResponsibility => {
    const existing = responsibilities.find(r => r.fileId === fileId || r.fileNumber === fileNumber);
    if (existing) return existing;

    const defaultChecklist: Record<string, boolean> = {};
    STANDARD_MISSING_REQUIREMENTS_CHECKLIST.forEach(item => {
      defaultChecklist[item] = false;
    });

    return {
      fileId,
      fileNumber,
      clientContacted: false,
      missingChecklist: defaultChecklist,
      customMissingItems: [],
      clientResponsive: true,
      readyForAdvocateReview: false,
      readyForDoctorReview: false,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: currentUser?.fullName || 'Case Chaser'
    };
  };

  const currentFileResp = selectedFileForResponsibility 
    ? getFileResp(selectedFileForResponsibility.id, selectedFileForResponsibility.internalFileNumber)
    : null;

  const handleToggleChecklistItem = (item: string) => {
    if (!selectedFileForResponsibility || !currentFileResp) return;
    const updatedChecklist = {
      ...currentFileResp.missingChecklist,
      [item]: !currentFileResp.missingChecklist[item]
    };
    const updatedResp: ChaserFileResponsibility = {
      ...currentFileResp,
      missingChecklist: updatedChecklist,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: currentUser?.fullName || 'Case Chaser'
    };
    onUpdateResponsibility(updatedResp);
  };

  const handleAddCustomRequirement = () => {
    if (!customRequirementInput.trim() || !selectedFileForResponsibility || !currentFileResp) return;
    const customList = currentFileResp.customMissingItems || [];
    if (customList.includes(customRequirementInput.trim())) return;

    const updatedCustom = [...customList, customRequirementInput.trim()];
    const updatedChecklist = {
      ...currentFileResp.missingChecklist,
      [customRequirementInput.trim()]: false
    };

    const updatedResp: ChaserFileResponsibility = {
      ...currentFileResp,
      customMissingItems: updatedCustom,
      missingChecklist: updatedChecklist,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: currentUser?.fullName || 'Case Chaser'
    };
    onUpdateResponsibility(updatedResp);
    setCustomRequirementInput('');
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogData.fileId || !newLogData.outcome) return;

    const targetFile = files.find(f => f.id === newLogData.fileId || f.internalFileNumber === newLogData.fileId);

    const newLog: ChaserFollowUpLog = {
      id: `log-${Date.now()}`,
      fileId: targetFile?.id || newLogData.fileId,
      fileNumber: targetFile?.internalFileNumber || newLogData.fileId,
      clientName: targetFile?.clientName,
      chaserId: activeChaser.chaserId,
      chaserName: activeChaser.fullName,
      date: new Date().toISOString().split('T')[0],
      contactMethod: newLogData.contactMethod,
      outcome: newLogData.outcome,
      nextAction: newLogData.nextAction || 'Follow up with client',
      recordedBy: currentUser?.fullName || activeChaser.fullName
    };

    onAddFollowUpLog(newLog);

    // Also update responsibility last contact date
    if (targetFile) {
      const resp = getFileResp(targetFile.id, targetFile.internalFileNumber);
      onUpdateResponsibility({
        ...resp,
        clientContacted: true,
        lastContactDate: newLog.date,
        followUpRemarks: newLog.outcome
      });
    }

    setNewLogData({ fileId: '', contactMethod: 'Phone Call', outcome: '', nextAction: '' });
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">

      {/* Module Header & Active Chaser Selector */}
      <div className="bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-[#C9A227] text-[#C9A227] flex items-center justify-center font-serif font-extrabold text-base shrink-0 shadow-md">
                {(activeChaser?.fullName || currentUser?.fullName || 'C').charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif font-bold text-2xl text-white tracking-wide">
                    {isClerkOrProprietor ? 'Unprocessed Sourcing Bucket & Intakes' : (activeChaser?.fullName || currentUser?.fullName || 'Case Chaser')}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-[#C9A227]/20 text-[#C9A227] text-[10px] font-mono font-bold rounded border border-[#C9A227]/40 uppercase">
                    {isClerkOrProprietor ? 'Clerk & Admin Review' : `${activeChaser?.chaserId || 'CC-001'} • Dashboard`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chaser Switcher for Admin/Proprietor/Advocate/Secretary/Clerk */}
          <div className="flex flex-wrap items-center gap-3">
            {!isChaserRole && (
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <UserIcon className="w-4 h-4 text-[#C9A227]" />
                <span className="text-xs font-bold text-slate-300">Active Chaser:</span>
                <select
                  value={selectedChaserId}
                  onChange={e => setSelectedChaserId(e.target.value)}
                  className="bg-slate-900 text-amber-300 font-bold text-xs p-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-[#C9A227]"
                >
                  {chasers.map(c => (
                    <option key={c.chaserId} value={c.chaserId}>
                      {c.chaserId} — {c.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowIntakeModal(true)}
              className="px-4 py-2 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Capture Preliminary Intake
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-800 pt-2 gap-2 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
            { id: 'unprocessed', label: 'Unprocessed Sourcing Bucket', icon: Inbox, badge: totalPendingReview },
            { id: 'logs', label: 'Follow-Up Logs', icon: History, badge: followUpLogs.filter(l => l.chaserId === activeChaser?.chaserId).length },
            { id: 'profiles', label: isChaserRole ? 'My Profile' : 'Chaser Directory', icon: UserCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition flex items-center gap-2 border-t border-x cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-900 border-[#C9A227]/50 text-[#C9A227] shadow'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                    isActive ? 'bg-[#C9A227] text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 0: UNPROCESSED SOURCING BUCKET */}
      {activeSubTab === 'unprocessed' && (
        <div className="space-y-6">

          {/* Quick Metrics Bar for Unprocessed Bucket */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#081729] p-4 rounded-xl border border-amber-500/40 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold flex items-center justify-between">
                <span>Total Pending Review</span>
                <span>🟡</span>
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">{totalPendingReview}</div>
              <div className="text-[10px] text-slate-400">Awaiting Clerk / Proprietor review</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-emerald-500/40 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold flex items-center justify-between">
                <span>Approved Today</span>
                <span>🟢</span>
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono">{approvedTodayCount}</div>
              <div className="text-[10px] text-slate-400">Converted or validated intakes</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-orange-500/40 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-orange-300 font-bold flex items-center justify-between">
                <span>Pending &gt; 3 Days</span>
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400 font-mono">{pendingMoreThan3DaysCount}</div>
              <div className="text-[10px] text-slate-400">Intakes requiring urgent review</div>
            </div>
          </div>

          {/* Unprocessed Intakes Table Card */}
          <div className="bg-[#081729] p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-[#C9A227]" />
                  Unprocessed Preliminary Client Bucket ({visibleUnprocessedRecords.length})
                </h3>
                <p className="text-xs text-slate-400">
                  {isChaserRole 
                    ? 'Preliminary client information captured by Case Chasers. Every entry remains Pending Review until reviewed by a Clerk or Proprietor.'
                    : 'Review preliminary client intakes submitted by Case Chasers. Verify information and process entries into official Registry Files.'
                  }
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={unprocessedStatusFilter}
                    onChange={e => setUnprocessedStatusFilter(e.target.value as any)}
                    className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-[#C9A227]"
                  >
                    <option value="All">All Statuses ({unprocessedRecords.length})</option>
                    <option value="Pending Review">🟡 Pending Review ({pendingReviewList.length})</option>
                    <option value="Approved">🟢 Approved</option>
                    <option value="Rejected">🔴 Rejected</option>
                    <option value="Converted to Registry">🔵 Converted to Registry</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search client, phone, chaser..."
                    value={unprocessedSearchTerm}
                    onChange={e => setUnprocessedSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 text-slate-100 text-xs border border-slate-800 rounded-xl focus:border-[#C9A227] focus:outline-none w-52"
                  />
                </div>

                <button
                  onClick={() => setShowIntakeModal(true)}
                  className="px-3.5 py-1.5 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Capture Intake
                </button>
              </div>
            </div>

            {visibleUnprocessedRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                <p>No preliminary client records found matching search or status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="p-3">Client Name & Contacts</th>
                      <th className="p-3">Matter Details & Case Type</th>
                      <th className="p-3">County / Referral</th>
                      <th className="p-3">Chaser & Captured Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Review / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {visibleUnprocessedRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-900/60 transition">
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{r.clientFullName}</div>
                          <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-[#C9A227]" />
                            {r.phoneNumber}
                            {r.nationalIdNumber && (
                              <span className="text-slate-400"> (ID: {r.nationalIdNumber})</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-amber-300 text-xs">{r.caseType}</div>
                          <div className="text-[11px] text-slate-300 line-clamp-1 max-w-xs">{r.briefDescription}</div>
                          {r.insuranceCompany && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Insurer: {r.insuranceCompany}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-slate-200 font-medium">{r.countyTown}</div>
                          <div className="text-[10px] text-slate-400">{r.referralSource || 'Walk-in'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{r.caseChaserName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.dateCaptured} at {r.timeCaptured}</div>
                        </td>
                        <td className="p-3">
                          {r.status === 'Pending Review' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-700/80 inline-flex items-center gap-1">
                              🟡 Pending Review
                            </span>
                          )}
                          {r.status === 'Approved' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 inline-flex items-center gap-1">
                              🟢 Approved
                            </span>
                          )}
                          {r.status === 'Rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/90 text-red-300 border border-red-700/80 inline-flex items-center gap-1">
                              🔴 Rejected
                            </span>
                          )}
                          {r.status === 'Converted to Registry' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-950/90 text-blue-300 border border-blue-700/80 inline-flex items-center gap-1 font-mono">
                              🔵 Converted ({r.createdFileNumber})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedRecordDetails(r)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C9A227]" />
                            View Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: DASHBOARD & MY FILES */}
      {activeSubTab === 'dashboard' && activeChaser && (
        <div className="space-y-6">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#081729] p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Assigned Files</div>
              <div className="text-2xl font-black text-white font-mono">{assignedFiles.length}</div>
              <div className="text-[10px] text-slate-400">Active in system</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-amber-500/30 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Pending Follow-ups</div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {activeChaser.pendingFollowUps || assignedFiles.filter(f => f.currentStatus === 'Incomplete').length}
              </div>
              <div className="text-[10px] text-amber-400/80">Requires client contact</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-indigo-500/30 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">Unprocessed Sourced</div>
              <div className="text-2xl font-black text-indigo-300 font-mono">
                {unprocessedRecords.filter(r => r.chaserId === activeChaser?.chaserId).length}
              </div>
              <div className="text-[10px] text-indigo-400/80">Pending review</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-emerald-500/30 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Cases Settled</div>
              <div className="text-2xl font-black text-emerald-300 font-mono">{activeChaser.casesSettled || 0}</div>
              <div className="text-[10px] text-emerald-400/80">Commission earned</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/40 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-[#C9A227] font-bold">Total Earned</div>
              <div className="text-lg font-black text-[#C9A227] font-mono">
                KSh {(activeChaser.totalCommissionEarned || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">{activeChaser.commissionType}</div>
            </div>

            <div className="bg-[#081729] p-4 rounded-xl border border-red-500/30 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-red-400 font-bold">Outstanding Comm.</div>
              <div className="text-lg font-black text-red-400 font-mono">
                KSh {(activeChaser.outstandingCommission || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Due for payout</div>
            </div>
          </div>

          {/* Main Grid: Assigned Files Table & Action Center */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Assigned Files Section (2 Cols) */}
            <div className="lg:col-span-2 bg-[#081729] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#C9A227]" />
                    My Assigned Files ({assignedFiles.length})
                  </h3>
                  <p className="text-xs text-slate-400">Files sourced or assigned to {activeChaser.fullName}</p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assigned files..."
                    value={fileSearchTerm}
                    onChange={e => setFileSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 text-slate-100 text-xs border border-slate-800 rounded-xl focus:border-[#C9A227] focus:outline-none w-48"
                  />
                </div>
              </div>

              {filteredAssignedFiles.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No assigned files found matching search query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                        <th className="p-2.5">File #</th>
                        <th className="p-2.5">Client Name</th>
                        <th className="p-2.5">Case # / Court</th>
                        <th className="p-2.5">Advocate</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAssignedFiles.map(f => {
                        return (
                          <tr key={f.id} className="hover:bg-slate-900/60 transition">
                            <td className="p-2.5 font-mono font-bold text-[#C9A227]">
                              {f.internalFileNumber}
                            </td>
                            <td className="p-2.5 font-bold text-slate-100">
                              {f.clientName}
                            </td>
                            <td className="p-2.5 text-slate-300 font-mono text-[11px]">
                              {f.courtCaseNumber}
                            </td>
                            <td className="p-2.5 text-slate-300">
                              {f.advocateName}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                f.currentStatus === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                f.currentStatus === 'Incomplete' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {f.currentStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => {
                                  setNewLogData({ ...newLogData, fileId: f.id });
                                  setShowLogModal(true);
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-[#C9A227] hover:text-slate-950 text-[#C9A227] font-bold text-[11px] rounded-lg border border-[#C9A227]/40 transition flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <span>Record Log</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Column: Pending Tasks & Quick Log Action */}
            <div className="space-y-6">

              {/* Recent Follow-Up Logs Card */}
              <div className="bg-[#081729] p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-[#C9A227]" />
                    Recent Follow-Up Logs
                  </h3>
                  <button
                    onClick={() => setActiveSubTab('logs')}
                    className="text-[10px] text-[#C9A227] hover:underline font-bold cursor-pointer"
                  >
                    View All Logs →
                  </button>
                </div>

                {followUpLogs.filter(l => l.chaserId === activeChaser?.chaserId).length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs italic">
                    No follow-up interaction logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {followUpLogs.filter(l => l.chaserId === activeChaser?.chaserId).slice(0, 4).map(log => (
                      <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{log.fileNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                        </div>
                        <div className="text-[11px] text-amber-300 font-semibold">{log.contactMethod}</div>
                        <p className="text-[11px] text-slate-300 line-clamp-1 italic">"{log.outcome}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Log Action Box */}
              <div className="bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/30 space-y-3">
                <div className="font-serif font-bold text-base text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#C9A227]" />
                  Record Client Follow-Up
                </div>
                <p className="text-xs text-slate-300">
                  Log phone calls, office visits, or field interaction outcomes to ensure complete file chaser accountability.
                </p>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#C9A227] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Follow-Up Interaction Log
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: FOLLOW-UP LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#081729] p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#C9A227]" />
                Client & Stakeholder Interaction Log History
              </h3>
              <p className="text-xs text-slate-400">
                Audit trial of phone calls, office visits, field visits & client interaction outcomes
              </p>
            </div>

            <button
              onClick={() => setShowLogModal(true)}
              className="px-4 py-2 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Interaction Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="p-3">Date</th>
                  <th className="p-3">File Number</th>
                  <th className="p-3">Client / Case</th>
                  <th className="p-3">Contact Method</th>
                  <th className="p-3">Interaction Outcome</th>
                  <th className="p-3">Next Required Action</th>
                  <th className="p-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {followUpLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="p-3 font-mono text-slate-300">{log.date}</td>
                    <td className="p-3 font-mono font-bold text-[#C9A227]">{log.fileNumber}</td>
                    <td className="p-3 font-bold text-slate-100">{log.clientName || 'N/A'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-950 rounded text-[11px] font-semibold text-slate-300 border border-slate-800">
                        {log.contactMethod}
                      </span>
                    </td>
                    <td className="p-3 max-w-[280px] text-slate-200">{log.outcome}</td>
                    <td className="p-3 font-medium text-amber-300">{log.nextAction}</td>
                    <td className="p-3 text-slate-400 font-mono">{log.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* SUB-TAB 5: CHASER PROFILES & SYSTEM ACCOUNTS */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-4">

          <div className="bg-[#081729] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#C9A227]" />
                {isChaserRole ? 'My Profile & System Account Details' : 'Case Chaser Directory & System Accounts'}
              </h3>
              <p className="text-xs text-slate-400">
                {isChaserRole 
                  ? 'Your personal profile details including ID, credentials, and performance metrics.'
                  : 'Profiles for firm Case Chasers with compact face cards, authentication details, and performance statistics.'
                }
              </p>
            </div>
          </div>

          {/* List Arrangement for Profiles with Compact Face Cards */}
          <div className="bg-[#081729] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#C9A227]" />
                Case Chaser List Directory ({(isChaserRole 
                  ? chasers.filter(c => c.chaserId === activeChaser?.chaserId || (currentUser?.fullName && c.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase())))
                  : chasers
                ).length})
              </h4>
            </div>

            <div className="divide-y divide-slate-800/80">
              {(isChaserRole 
                ? chasers.filter(c => c.chaserId === activeChaser?.chaserId || (currentUser?.fullName && c.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase())))
                : chasers
              ).map(chaser => {
                const chaserAssignedFiles = files.filter(f => f.caseChaserName && f.caseChaserName.toLowerCase().includes(chaser.fullName.split(' ')[0].toLowerCase()));

                return (
                  <div key={chaser.id} className="p-4 hover:bg-slate-900/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                    
                    {/* Left: Compact Face Card & Details */}
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Small Face Card Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-950 border border-[#C9A227] text-[#C9A227] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-0.5 sm:mt-0">
                        {chaser.fullName.charAt(0)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-white">{chaser.fullName}</span>
                          <span className="px-1.5 py-0.2 bg-[#C9A227]/15 text-[#C9A227] text-[10px] font-mono font-bold rounded border border-[#C9A227]/30">
                            {chaser.chaserId}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            chaser.employmentStatus === 'Active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-red-950 text-red-400'
                          }`}>
                            {chaser.employmentStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>National ID: <strong className="text-slate-200">{chaser.idPassportNumber}</strong></span>
                          <span>Mobile: <strong className="text-slate-200">{chaser.mobileNumber}</strong></span>
                          <span>Username: <strong className="text-amber-300">{chaser.username}</strong></span>
                          <span>Account: <strong className="text-emerald-400">{chaser.accountStatus}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Compact Performance Metrics Badges */}
                    <div className="flex items-center gap-2 font-mono shrink-0 bg-slate-950/80 p-2 rounded-xl border border-slate-800 self-start lg:self-auto">
                      <div className="text-center px-2.5 border-r border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Assigned</div>
                        <div className="font-bold text-white text-xs">{chaserAssignedFiles.length}</div>
                      </div>
                      <div className="text-center px-2.5 border-r border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Incomplete</div>
                        <div className="font-bold text-amber-300 text-xs">{chaserAssignedFiles.filter(f => f.currentStatus === 'Incomplete').length}</div>
                      </div>
                      <div className="text-center px-2.5 border-r border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase">Avg Completion</div>
                        <div className="font-bold text-indigo-300 text-xs">{chaser.avgCompletionDays || 18}d</div>
                      </div>
                      <div className="text-center px-2.5">
                        <div className="text-[9px] text-slate-400 uppercase">Earned Comm.</div>
                        <div className="font-bold text-[#C9A227] text-xs">KSh {(chaser.totalCommissionEarned || 0).toLocaleString()}</div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: NEW INTERACTION LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#081729] border border-[#C9A227]/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#C9A227]" />
                Record Interaction Log
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Target Assigned File</label>
                <select
                  required
                  value={newLogData.fileId}
                  onChange={e => setNewLogData({ ...newLogData, fileId: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-[#C9A227] focus:outline-none"
                >
                  <option value="">-- Choose Assigned File --</option>
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.internalFileNumber} — {f.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Contact Method</label>
                <select
                  value={newLogData.contactMethod}
                  onChange={e => setNewLogData({ ...newLogData, contactMethod: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="Office Visit">Office Visit</option>
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="SMS">SMS Notification</option>
                  <option value="Email">Email Communication</option>
                  <option value="Field Visit">Field Visit / Site Check</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Interaction Outcome / Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Client promised to bring certified medical report from hospital on Friday..."
                  value={newLogData.outcome}
                  onChange={e => setNewLogData({ ...newLogData, outcome: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Next Required Action</label>
                <input
                  type="text"
                  placeholder="e.g. Follow up on 15 Jul for physical collection"
                  value={newLogData.nextAction}
                  onChange={e => setNewLogData({ ...newLogData, nextAction: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow"
                >
                  Save Interaction Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRELIMINARY CLIENT INTAKE MODAL (CASE CHASER / STAFF) */}
      {showIntakeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-[#081729] border border-[#C9A227]/40 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#081729]">
              <h3 className="font-serif font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#C9A227]" />
                Capture Preliminary Client Intake (Unprocessed Bucket)
              </h3>
              <button
                type="button"
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-white font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIntake} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {/* SECTION 1: BASIC CLIENT INFORMATION */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-[#C9A227] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    Basic Client Information
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        Client Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Kamau Mwangi"
                        value={newIntakeData.clientFullName}
                        onChange={e => setNewIntakeData({ ...newIntakeData, clientFullName: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0722000111"
                        value={newIntakeData.phoneNumber}
                        onChange={e => setNewIntakeData({ ...newIntakeData, phoneNumber: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        Alternative Phone Number <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0733999888"
                        value={newIntakeData.altPhoneNumber}
                        onChange={e => setNewIntakeData({ ...newIntakeData, altPhoneNumber: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        National ID Number <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 28941039"
                        value={newIntakeData.nationalIdNumber}
                        onChange={e => setNewIntakeData({ ...newIntakeData, nationalIdNumber: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        County / Town <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nairobi / Kasarani"
                        value={newIntakeData.countyTown}
                        onChange={e => setNewIntakeData({ ...newIntakeData, countyTown: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        Referral Source <span className="text-slate-500">(Optional)</span>
                      </label>
                      <select
                        value={newIntakeData.referralSource}
                        onChange={e => setNewIntakeData({ ...newIntakeData, referralSource: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                      >
                        <option value="Walk-in / Client Referral">Walk-in / Client Referral</option>
                        <option value="Field Sourcing Agent">Field Sourcing Agent</option>
                        <option value="Hospital Referral">Hospital Referral</option>
                        <option value="Police Station Referral">Police Station Referral</option>
                        <option value="Advocate Referral">Advocate Referral</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: MATTER INFORMATION */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-[#C9A227] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Matter Information
                  </h4>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        Case Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={newIntakeData.caseType}
                        onChange={e => setNewIntakeData({ ...newIntakeData, caseType: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-[#C9A227] focus:outline-none"
                      >
                        <option value="Motor Accident / Insurance">Motor Accident / Insurance Claim</option>
                        <option value="Civil Litigation">Civil Litigation</option>
                        <option value="Land Dispute">Land Dispute / Property</option>
                        <option value="Employment & Labour">Employment & Labour Relations</option>
                        <option value="Succession & Probate">Succession & Probate</option>
                        <option value="Family Law">Family Law & Custody</option>
                        <option value="Commercial Law">Commercial & Business Law</option>
                        <option value="Criminal Defense">Criminal Defense</option>
                        <option value="General Legal">General Legal Matter</option>
                      </select>
                    </div>

                    {/* Preview of Preliminary File Code generated after selecting Case Type */}
                    <div className="md:col-span-2 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-300 font-mono block">Preliminary File Reference (Initials / Case Abbr / Seq / Year):</span>
                        <span className="font-mono font-bold text-emerald-300 text-sm">
                          {(() => {
                            const { number: seqNum, year: curYear, firmInitials } = getNextPreliminarySequence(currentFirm);
                            const initials = currentFirm?.firmInitials || firmInitials || 'NTA';
                            return generatePreliminaryFileNumber(initials, newIntakeData.caseType || 'Motor Accident / Insurance', seqNum, curYear);
                          })()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                        Abbr: {getCaseTypeAbbreviation(newIntakeData.caseType)}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        Date Matter Received <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newIntakeData.dateMatterReceived}
                        onChange={e => setNewIntakeData({ ...newIntakeData, dateMatterReceived: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        Accident Date <span className="text-slate-500">(If applicable)</span>
                      </label>
                      <input
                        type="date"
                        value={newIntakeData.accidentDate}
                        onChange={e => setNewIntakeData({ ...newIntakeData, accidentDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        Court Station <span className="text-slate-500">(If known)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Milimani Law Courts"
                        value={newIntakeData.courtStation}
                        onChange={e => setNewIntakeData({ ...newIntakeData, courtStation: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-300 mb-1">
                        Insurance Company <span className="text-slate-500">(If applicable)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Directline Assurance / CIC Insurance / Jubilee"
                        value={newIntakeData.insuranceCompany}
                        onChange={e => setNewIntakeData({ ...newIntakeData, insuranceCompany: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-200 mb-1">
                        Brief Description of the Matter <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Summarize key facts, incident details, injuries, vehicle registration or claims involved..."
                        value={newIntakeData.briefDescription}
                        onChange={e => setNewIntakeData({ ...newIntakeData, briefDescription: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PRELIMINARY FILE DOCUMENT CHECKLIST */}
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h4 className="font-bold text-[#C9A227] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Preliminary File Document Checklist (Physical Documents Brought During Intake)
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                      {Object.values(newIntakeData.documentsChecklist || {}).filter(Boolean).length} / {STANDARD_MISSING_REQUIREMENTS_CHECKLIST.length} Present
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Check off physical documents brought by the client during initial preliminary intake:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                    {STANDARD_MISSING_REQUIREMENTS_CHECKLIST.map(docItem => {
                      const isChecked = Boolean(newIntakeData.documentsChecklist?.[docItem]);
                      return (
                        <button
                          key={docItem}
                          type="button"
                          onClick={() => {
                            const currentMap = newIntakeData.documentsChecklist || {};
                            setNewIntakeData({
                              ...newIntakeData,
                              documentsChecklist: {
                                ...currentMap,
                                [docItem]: !isChecked
                              }
                            });
                          }}
                          className={`p-2.5 rounded-lg border text-left text-xs transition flex items-center gap-2 cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300 font-bold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{docItem}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 4: ASSIGNMENT & METADATA (AUTO-FILLED) */}
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Case Chaser (Auto):</span>
                    <strong className="text-amber-300">{activeChaser?.fullName || currentUser?.fullName || 'Case Chaser'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Date & Time Captured:</span>
                    <strong className="text-slate-200 font-mono">{new Date().toISOString().split('T')[0]} (Auto)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Initial Status:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 inline-block mt-0.5">
                      🟡 Pending Review
                    </span>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 border-t border-slate-800 flex justify-end gap-2 shrink-0 bg-[#081729]">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C9A227] hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Inbox className="w-4 h-4" />
                  Submit to Unprocessed Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REVIEW INTAKE MODAL (CLERK & PROPRIETOR) */}
      {/* MODAL 5: DETAILS VIEW MODAL */}
      {selectedRecordDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-[#081729] border border-[#C9A227]/40 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#081729]">
              <h3 className="font-serif font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#C9A227]" />
                Preliminary Intake Record Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRecordDetails(null)}
                className="text-slate-400 hover:text-white font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 text-xs flex-1">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-base text-white">{selectedRecordDetails.clientFullName}</div>
                  <div className="text-amber-300 font-bold text-xs">{selectedRecordDetails.caseType}</div>
                </div>
                <div>
                  {selectedRecordDetails.status === 'Pending Review' && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">🟡 Pending Review</span>}
                  {selectedRecordDetails.status === 'Approved' && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">🟢 Approved</span>}
                  {selectedRecordDetails.status === 'Rejected' && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">🔴 Rejected</span>}
                  {selectedRecordDetails.status === 'Converted to Registry' && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 font-mono">🔵 Converted ({selectedRecordDetails.createdFileNumber})</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div><span className="text-slate-400 font-semibold">Phone:</span> <span className="font-mono text-slate-200">{selectedRecordDetails.phoneNumber}</span></div>
                <div><span className="text-slate-400 font-semibold">Alt Phone:</span> <span className="font-mono text-slate-200">{selectedRecordDetails.altPhoneNumber || 'N/A'}</span></div>
                <div><span className="text-slate-400 font-semibold">National ID:</span> <span className="font-mono text-slate-200">{selectedRecordDetails.nationalIdNumber || 'N/A'}</span></div>
                <div><span className="text-slate-400 font-semibold">County / Town:</span> <span className="text-slate-200">{selectedRecordDetails.countyTown}</span></div>
                <div><span className="text-slate-400 font-semibold">Referral Source:</span> <span className="text-slate-200">{selectedRecordDetails.referralSource || 'N/A'}</span></div>
                <div><span className="text-slate-400 font-semibold">Date Received:</span> <span className="font-mono text-slate-200">{selectedRecordDetails.dateMatterReceived}</span></div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Brief Description of Matter:</span>
                <p className="text-slate-200 leading-relaxed italic">"{selectedRecordDetails.briefDescription}"</p>
              </div>

              {selectedRecordDetails.notes && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Additional Remarks:</span>
                  <p className="text-slate-300">{selectedRecordDetails.notes}</p>
                </div>
              )}

              {selectedRecordDetails.documentsChecklist && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-[#C9A227]" />
                      Preliminary Intake Documents Checklist:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {Object.values(selectedRecordDetails.documentsChecklist).filter(Boolean).length} / {STANDARD_MISSING_REQUIREMENTS_CHECKLIST.length} Present
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] max-h-36 overflow-y-auto p-1">
                    {Object.entries(selectedRecordDetails.documentsChecklist).map(([doc, present]) => (
                      <div key={doc} className={`p-1.5 rounded flex items-center gap-1.5 ${present ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50' : 'bg-slate-900/40 text-slate-500'}`}>
                        {present ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Sourcing Chaser:</span>
                  <strong className="text-amber-300">{selectedRecordDetails.caseChaserName}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Captured Timestamp:</span>
                  <span className="text-slate-200">{selectedRecordDetails.dateCaptured} at {selectedRecordDetails.timeCaptured}</span>
                </div>
                {selectedRecordDetails.reviewedBy && (
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Reviewed By:</span>
                    <span className="text-emerald-300">{selectedRecordDetails.reviewedBy}</span>
                  </div>
                )}
                {selectedRecordDetails.reviewedAt && (
                  <div className="flex justify-between text-slate-400">
                    <span>Reviewed Timestamp:</span>
                    <span className="text-slate-200">{selectedRecordDetails.reviewedAt}</span>
                  </div>
                )}
                {selectedRecordDetails.rejectionReason && (
                  <div className="pt-1 border-t border-slate-800 text-red-400 font-sans">
                    <span className="font-bold block">Rejection Reason:</span>
                    <p className="italic text-red-300 mt-0.5">"{selectedRecordDetails.rejectionReason}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end shrink-0 bg-[#081729]">
              <button
                type="button"
                onClick={() => setSelectedRecordDetails(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

