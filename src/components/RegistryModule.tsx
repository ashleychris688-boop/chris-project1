import React, { useState, useEffect } from 'react';
import { 
  RegistryFile, 
  FileStatus, 
  FileMovement,
  ClientType,
  PartyCapacity,
  UnprocessedClientRecord,
  User,
  LawFirmProfile,
  CorumEntry,
  CourtOutcome
} from '../types';
import { DEFAULT_CASE_CATEGORIES, CaseCategoryConfig } from '../data/caseCategories';
import { 
  getCaseTypeAbbreviation,
  generatePreliminaryFileNumber,
  formatDirectFileNumber,
  formatSequenceNumber,
  getNextPreliminarySequence
} from '../utils/fileNumberUtils';
import { generateSystemInternalFileNumber } from '../utils/fileNumberGenerator';
import { validateCourtDate, getNextBusinessDay, getTodayStr, isWeekend, ensureWeekday } from '../utils/dateUtils';
import { UnprocessedSourcingModule } from './UnprocessedSourcingModule';
import { CourtStationPicker } from './CourtStationPicker';
import { 
  FolderArchive, 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  X, 
  Eye, 
  PackageSearch,
  CheckCircle2,
  ShieldAlert,
  FileCheck2,
  FolderLock,
  FilePlus2,
  Gavel,
  UserCheck,
  AlertCircle,
  Landmark,
  Building2,
  Layers,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  User as UserIcon,
  Briefcase,
  Scale,
  ShieldCheck,
  Tag,
  Check,
  Filter,
  Inbox,
  Sparkles,
  Calendar,
  FileText,
  MessageSquare,
  ScrollText,
  Edit3
} from 'lucide-react';

export const CLIENT_TYPES: ClientType[] = [
  'Individual',
  'Company',
  'Government Agency',
  'Non-Governmental Organisation (NGO)',
  'Partnership',
  'Sole Proprietorship',
  'Sacco',
  'Cooperative Society',
  'Trust',
  'Estate',
  'School/University',
  'Religious Organisation'
];

export const ALL_PARTY_CAPACITIES: PartyCapacity[] = [
  'Plaintiff',
  'Defendant',
  'Claimant',
  'Respondent',
  'Applicant',
  'Petitioner',
  'Complainant',
  'Accused',
  'Witness',
  'Insured',
  'Insurer',
  'Beneficiary',
  'Administrator',
  'Executor',
  'Objector',
  'Appellant',
  'Interested Party',
  'Decree Holder',
  'Judgment Debtor',
  'Guardian',
  'Legal Representative'
];

export const RECOMMENDED_CAPACITIES_BY_CASE_TYPE: Record<string, PartyCapacity[]> = DEFAULT_CASE_CATEGORIES.reduce((acc, cat) => {
  acc[cat.category] = cat.recommendedCapacities;
  cat.subTypes.forEach(sub => {
    acc[sub] = cat.recommendedCapacities;
  });
  return acc;
}, {} as Record<string, PartyCapacity[]>);

interface RegistryModuleProps {
  files: RegistryFile[];
  movements: FileMovement[];
  onAddFile: (file: RegistryFile) => void;
  onUpdateFile: (file: RegistryFile) => void;
  onOpenMoveModal: (file: RegistryFile) => void;
  courtStations: string[];
  cabinets: string[];
  openNewModalInitially?: boolean;
  unprocessedRecords?: UnprocessedClientRecord[];
  onUpdateUnprocessedRecord?: (record: UnprocessedClientRecord) => void;
  fileNumberPrefix?: string;
  users?: User[];
  currentFirm?: LawFirmProfile | null;
  onUpdateFirm?: (firm: LawFirmProfile) => void;
  corumEntries?: CorumEntry[];
  courtOutcomes?: CourtOutcome[];
  onAddCorumEntry?: (entry: CorumEntry, nextCourtDate?: string, updatedCaseStatus?: RegistryFile['currentStatus']) => void;
  onAddCourtOutcome?: (outcome: CourtOutcome, nextCourtDate?: string, updatedCaseStatus?: RegistryFile['currentStatus']) => void;
}

export type RegistryCategoryTab = 'ACTIVE' | 'CLOSED' | 'INCOMPLETE' | 'ALL';

export const RegistryModule: React.FC<RegistryModuleProps> = ({
  files,
  movements,
  onAddFile,
  onUpdateFile,
  onOpenMoveModal,
  courtStations,
  cabinets,
  openNewModalInitially = false,
  unprocessedRecords = [],
  onUpdateUnprocessedRecord,
  fileNumberPrefix = 'NGA',
  users = [],
  currentFirm = null,
  onUpdateFirm,
  corumEntries = [],
  courtOutcomes = [],
  onAddCorumEntry,
  onAddCourtOutcome
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourtStation, setSelectedCourtStation] = useState<string>('ALL');
  const [selectedCaseCategoryFilter, setSelectedCaseCategoryFilter] = useState<string>('ALL');
  const [categoryTab, setCategoryTab] = useState<RegistryCategoryTab>('ACTIVE');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('ALL');
  const [selectedFile, setSelectedFile] = useState<RegistryFile | null>(null);
  const [showAddModal, setShowAddModal] = useState(openNewModalInitially);
  const [showUnprocessedBucketModal, setShowUnprocessedBucketModal] = useState(false);

  // Record CORUM modal state
  const [showRecordCorumModal, setShowRecordCorumModal] = useState(false);
  const [corumTargetFile, setCorumTargetFile] = useState<RegistryFile | null>(null);
  const [corumValidationError, setCorumValidationError] = useState<string | null>(null);
  const [corumSearchQuery, setCorumSearchQuery] = useState('');

  const todayStr = getTodayStr();

  const [corumFormData, setCorumFormData] = useState({
    date: todayStr,
    time: '09:00 AM',
    coram: '',
    courtStation: '',
    courtNumber: 'Court 1',
    advocatePresent: '',
    defendantAdvocate: '',
    comingUpFor: 'Mention',
    customComingUpFor: '',
    orders: '',
    remarks: '',
    officeAction: '',
    nextCourtDate: '',
    nextCourtTime: '09:00 AM',
    nextComingUpFor: 'Mention',
    caseStatusAfter: 'Active' as RegistryFile['currentStatus'],
    recordedBy: ''
  });

  // Direct File Registration manual inputs: File Number (e.g. 08) and Year (e.g. 2026)
  const [directFileNumber, setDirectFileNumber] = useState('');
  const [directYear, setDirectYear] = useState(String(new Date().getFullYear()));

  // File Closing Modal State
  const [showCloseModalForFile, setShowCloseModalForFile] = useState<RegistryFile | null>(null);
  const [closeJudgmentNotes, setCloseJudgmentNotes] = useState('');
  const [closedByRole, setClosedByRole] = useState<'Clerk' | 'Advocate' | 'Proprietor'>('Clerk');

  // Station search state for large list of court stations
  const [stationSearchTerm, setStationSearchTerm] = useState('');

  // Active Station drill-down view state (null = showing court stations list, string = viewing specific station files)
  const [activeStationView, setActiveStationView] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Helpers for Preliminary and Direct File Numbering
  const getFirmInitials = () => {
    return (currentFirm?.firmInitials || currentFirm?.firmCode?.split('-')[0] || fileNumberPrefix || 'NTA').trim().toUpperCase();
  };

  const computePreliminaryNumber = (caseTypeOrCategory: string) => {
    const { number: seqNum, year: curYear, firmInitials } = getNextPreliminarySequence(currentFirm);
    const initials = currentFirm?.firmInitials || firmInitials || getFirmInitials();
    return generatePreliminaryFileNumber(initials, caseTypeOrCategory, seqNum, curYear);
  };

  const computeDirectNumber = (caseTypeOrCategory: string, fileNum: string, yr: string) => {
    const initials = getFirmInitials();
    return formatDirectFileNumber(initials, caseTypeOrCategory, fileNum || '01', yr || String(new Date().getFullYear()));
  };

  // Escape key keyboard listener to return to station directory list
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!selectedFile && !showAddModal && !showCloseModalForFile) {
          if (activeStationView !== null) {
            setActiveStationView(null);
            setCurrentPage(1);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStationView, selectedFile, showAddModal, showCloseModalForFile]);

  // Only show court stations that actually have registered files (Active, Closed, or Incomplete)
  const stationsWithFiles: string[] = (Array.from(
    new Set(files.map(f => f.courtStation).filter(Boolean))
  ) as string[]).sort((a: string, b: string) => a.localeCompare(b));

  const filteredStationsWithFiles = stationsWithFiles.filter((st: string) => 
    st.toLowerCase().includes(stationSearchTerm.toLowerCase())
  );

  // Filtered and merged CORUM proceedings list for the currently selected file in Record Details
  const fileCorumList: CorumEntry[] = React.useMemo(() => {
    if (!selectedFile) return [];

    const directEntries = corumEntries.filter(
      c => c.fileId === selectedFile.id || c.fileNumber === selectedFile.internalFileNumber
    );

    const outcomeMappedEntries: CorumEntry[] = courtOutcomes
      .filter(o => o.fileId === selectedFile.id || o.fileNumber === selectedFile.internalFileNumber)
      .filter(o => !directEntries.some(d => d.id === o.id || d.id === `corum-${o.id}` || `co-${d.id}` === o.id))
      .map(o => ({
        id: o.id,
        firmCode: o.firmCode,
        fileId: o.fileId,
        fileNumber: o.fileNumber,
        date: o.appearanceDate,
        time: o.nextHearingTime || '09:00 AM',
        courtStation: o.courtStation || selectedFile.courtStation,
        courtNumber: o.courtNumber || selectedFile.courtNumber,
        coram: o.coram || o.magistrate || selectedFile.magistrate || 'Hon. Presiding Magistrate/Judge',
        advocatePresent: o.advocatePresent || selectedFile.advocateName || 'Advocate on Record',
        defendantAdvocate: o.defendantAdvocate || 'Opposing Counsel on Record',
        comingUpFor: o.comingUpFor || o.outcomeDetails?.split(':')[0] || 'Mention',
        orders: o.ordersIssued || 'Orders issued in court.',
        remarks: o.remarks || o.outcomeDetails || 'Attended court proceedings.',
        officeAction: o.officeAction || 'Diary for compliance and next court date.',
        nextCourtDate: o.nextHearingDate,
        nextCourtTime: o.nextHearingTime,
        nextComingUpFor: 'Mention',
        caseStatusAfter: o.caseStatusAfter,
        recordedBy: o.recordedBy || 'Advocate',
        recordedAt: o.recordedAt || o.appearanceDate
      }));

    return [...directEntries, ...outcomeMappedEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [selectedFile, corumEntries, courtOutcomes]);

  // Dual-mode Registration State: 'unprocessed' (from bucket) vs 'direct' (walk-in/outside)
  const [registrationMode, setRegistrationMode] = useState<'unprocessed' | 'direct'>('direct');
  const [selectedUnprocessedId, setSelectedUnprocessedId] = useState<string>('');

  // Unprocessed records available for registry conversion
  const availableUnprocessedRecords = (unprocessedRecords || []).filter(
    r => r.status !== 'Converted to Registry'
  );

  // New File Form State
  const [formData, setFormData] = useState<Partial<RegistryFile>>({
    internalFileNumber: '',
    courtCaseNumber: '',
    clientName: '',
    clientType: 'Individual',
    partyCapacity: 'Plaintiff',
    opposingParty: '',
    courtStation: courtStations[0] || 'Milimani Law Courts - Commercial Division',
    courtNumber: 'Court 1',
    magistrate: '',
    advocateName: users?.find(u => u.role === 'Advocate' || u.role === 'Proprietor')?.fullName || '',
    clerkName: users?.find(u => u.role === 'Clerk')?.fullName || '',
    secretaryName: users?.find(u => u.role === 'Secretary')?.fullName || '',
    caseChaserName: 'Direct / Walk-in (No Chaser)',
    insuranceCompanyName: 'None',
    currentStatus: 'Active',
    physicalLocation: {
      room: 'Central Registry',
      cabinet: cabinets[0] || 'Cabinet A - High Court Commercial',
      shelf: 'Shelf 1'
    },
    dateOpened: new Date().toISOString().split('T')[0],
    caseCategory: 'Civil Litigation',
    caseType: 'General Civil Suit',
    subCaseType: 'General Civil Suit'
  });

  // Open modal and initialize system generated file number
  const openRegistrationModal = (mode: 'unprocessed' | 'direct' = 'direct') => {
    setRegistrationMode(mode);
    setSelectedUnprocessedId('');
    const defaultCat = 'Civil Litigation';
    const defaultSub = 'General Civil Suit';

    let initialNum = '';
    if (mode === 'unprocessed') {
      initialNum = computePreliminaryNumber(defaultSub);
    } else {
      setDirectFileNumber('');
      setDirectYear(String(new Date().getFullYear()));
      initialNum = '';
    }

    setFormData({
      internalFileNumber: initialNum,
      courtCaseNumber: '',
      clientName: '',
      clientType: 'Individual',
      partyCapacity: 'Plaintiff',
      opposingParty: '',
      courtStation: courtStations[0] || 'Milimani Law Courts - Commercial Division',
      courtNumber: 'Court 1',
      magistrate: '',
      advocateName: users?.find(u => u.role === 'Advocate' || u.role === 'Proprietor')?.fullName || '',
      clerkName: users?.find(u => u.role === 'Clerk')?.fullName || '',
      secretaryName: users?.find(u => u.role === 'Secretary')?.fullName || '',
      caseChaserName: mode === 'direct' ? 'Direct / Walk-in (No Chaser)' : '',
      insuranceCompanyName: 'None',
      currentStatus: 'Active',
      physicalLocation: {
        room: 'Central Registry',
        cabinet: cabinets[0] || 'Cabinet A - High Court Commercial',
        shelf: 'Shelf 1'
      },
      dateOpened: new Date().toISOString().split('T')[0],
      caseCategory: defaultCat,
      caseType: defaultSub,
      subCaseType: defaultSub
    });
    setShowAddModal(true);
  };

  // Pre-fill form when selecting an unprocessed record
  const handleSelectUnprocessedRecord = (recordId: string) => {
    setSelectedUnprocessedId(recordId);
    const rec = (unprocessedRecords || []).find(r => r.id === recordId);
    if (!rec) return;

    const caseType = rec.caseType || 'General Civil Suit';
    const preliminaryNum = rec.preliminaryRefNumber || computePreliminaryNumber(caseType);

    setFormData(prev => ({
      ...prev,
      internalFileNumber: preliminaryNum,
      clientName: rec.clientFullName,
      caseChaserName: rec.caseChaserName,
      insuranceCompanyName: rec.insuranceCompany || 'None',
      courtStation: rec.courtStation || courtStations[0] || 'Milimani Law Courts',
      caseType: caseType,
      subCaseType: caseType,
      notes: rec.briefDescription ? `[Preliminary Intake Note]: ${rec.briefDescription}` : prev.notes,
      dateOpened: rec.dateCaptured || new Date().toISOString().split('T')[0]
    }));
  };

  // Open Record CORUM Modal for a given file
  const openRecordCorumModal = (file: RegistryFile) => {
    setCorumTargetFile(file);
    setCorumValidationError(null);
    setCorumFormData({
      date: todayStr,
      time: '09:00 AM',
      coram: file.magistrate || '',
      courtStation: file.courtStation || '',
      courtNumber: file.courtNumber || 'Court 1',
      advocatePresent: file.advocateName || users?.find(u => u.role === 'Advocate' || u.role === 'Proprietor')?.fullName || '',
      defendantAdvocate: '',
      comingUpFor: 'Mention',
      customComingUpFor: '',
      orders: '',
      remarks: '',
      officeAction: '',
      nextCourtDate: '',
      nextCourtTime: '09:00 AM',
      nextComingUpFor: 'Mention',
      caseStatusAfter: file.currentStatus || 'Active',
      recordedBy: users?.find(u => u.role === 'Advocate' || u.role === 'Clerk')?.fullName || 'Advocate on Record'
    });
    setShowRecordCorumModal(true);
  };

  // Save CORUM Entry
  const handleSaveCorum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corumTargetFile) return;

    if (!corumFormData.defendantAdvocate.trim()) {
      setCorumValidationError('Please enter the Defendant Advocate / Opposing Counsel (e.g. "M/s Kamau & Co. Advocates for Defendant" or "Self-Represented").');
      return;
    }

    if (!corumFormData.orders.trim()) {
      setCorumValidationError('Please provide the Court Orders Issued.');
      return;
    }

    const finalComingUpFor = corumFormData.comingUpFor === 'Other' && corumFormData.customComingUpFor.trim()
      ? corumFormData.customComingUpFor.trim()
      : corumFormData.comingUpFor;

    // Validate Next Court Date if provided
    if (corumFormData.nextCourtDate) {
      const val = validateCourtDate(corumFormData.nextCourtDate, corumFormData.nextCourtTime);
      if (!val.isValid) {
        setCorumValidationError(val.errorMessage || 'Invalid Next Court Date.');
        return;
      }
    }

    const newCorumEntry: CorumEntry = {
      id: `corum-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      firmCode: currentFirm?.firmCode,
      fileId: corumTargetFile.id,
      fileNumber: corumTargetFile.internalFileNumber,
      courtCaseNumber: corumTargetFile.courtCaseNumber,
      date: corumFormData.date,
      time: corumFormData.time,
      courtStation: corumFormData.courtStation || corumTargetFile.courtStation,
      courtNumber: corumFormData.courtNumber || corumTargetFile.courtNumber,
      coram: corumFormData.coram.trim() || corumTargetFile.magistrate || 'Hon. Presiding Magistrate/Judge',
      advocatePresent: corumFormData.advocatePresent.trim() || corumTargetFile.advocateName || 'Plaintiff Advocate',
      defendantAdvocate: corumFormData.defendantAdvocate.trim(),
      comingUpFor: finalComingUpFor,
      orders: corumFormData.orders.trim(),
      remarks: corumFormData.remarks.trim() || 'Attended court. Proceedings recorded.',
      officeAction: corumFormData.officeAction.trim() || 'Extract order and diary for compliance.',
      nextCourtDate: corumFormData.nextCourtDate || undefined,
      nextCourtTime: corumFormData.nextCourtDate ? corumFormData.nextCourtTime : undefined,
      nextComingUpFor: corumFormData.nextCourtDate ? corumFormData.nextComingUpFor : undefined,
      caseStatusAfter: corumFormData.caseStatusAfter,
      recordedBy: corumFormData.recordedBy || 'Advocate',
      recordedAt: new Date().toISOString()
    };

    if (onAddCorumEntry) {
      onAddCorumEntry(newCorumEntry, corumFormData.nextCourtDate || undefined, corumFormData.caseStatusAfter);
    } else if (onAddCourtOutcome) {
      const outcomeBridge: CourtOutcome = {
        id: `co-${newCorumEntry.id}`,
        firmCode: currentFirm?.firmCode,
        fileId: corumTargetFile.id,
        fileNumber: corumTargetFile.internalFileNumber,
        appearanceDate: newCorumEntry.date,
        courtStation: newCorumEntry.courtStation,
        courtNumber: newCorumEntry.courtNumber,
        coram: newCorumEntry.coram,
        magistrate: newCorumEntry.coram,
        advocatePresent: newCorumEntry.advocatePresent,
        defendantAdvocate: newCorumEntry.defendantAdvocate,
        comingUpFor: newCorumEntry.comingUpFor,
        outcomeDetails: `${newCorumEntry.comingUpFor}: ${newCorumEntry.remarks}`,
        ordersIssued: newCorumEntry.orders,
        remarks: newCorumEntry.remarks,
        officeAction: newCorumEntry.officeAction,
        nextHearingDate: newCorumEntry.nextCourtDate,
        nextHearingTime: newCorumEntry.nextCourtTime,
        caseStatusAfter: newCorumEntry.caseStatusAfter || 'Active',
        recordedBy: newCorumEntry.recordedBy,
        recordedAt: newCorumEntry.recordedAt
      };
      onAddCourtOutcome(outcomeBridge, corumFormData.nextCourtDate || undefined, corumFormData.caseStatusAfter);
    }

    if (selectedFile && selectedFile.id === corumTargetFile.id) {
      setSelectedFile({
        ...selectedFile,
        nextCourtDate: corumFormData.nextCourtDate || selectedFile.nextCourtDate,
        currentStatus: corumFormData.caseStatusAfter || selectedFile.currentStatus
      });
    }

    setShowRecordCorumModal(false);
    setCorumTargetFile(null);
  };

  // Step 1 Overall Category Totals
  const allActiveFiles = files.filter(f => 
    f.currentStatus === 'Active' || 
    f.currentStatus === 'Out in Court' || 
    f.currentStatus === 'Out with Advocate' || 
    f.currentStatus === 'Out with Insurance' || 
    f.currentStatus === 'Pending Court'
  );

  const allClosedFiles = files.filter(f => 
    f.currentStatus === 'Closed' || 
    f.currentStatus === 'Archived'
  );

  // Step 2 Category Filtered Files (used to derive stations that have files in selected category)
  const categoryFilteredFiles = files.filter(f => {
    if (categoryTab === 'ACTIVE') {
      return f.currentStatus === 'Active' || 
             f.currentStatus === 'Out in Court' || 
             f.currentStatus === 'Out with Advocate' || 
             f.currentStatus === 'Out with Insurance' || 
             f.currentStatus === 'Pending Court';
    }
    if (categoryTab === 'CLOSED') {
      return f.currentStatus === 'Closed' || f.currentStatus === 'Archived';
    }
    return true; // 'ALL'
  });

  // Stations that actually have registered files in the currently selected Category
  const stationsForSelectedCategory: string[] = (Array.from(
    new Set(categoryFilteredFiles.map(f => f.courtStation).filter(Boolean))
  ) as string[]).sort((a: string, b: string) => a.localeCompare(b));

  const filteredStationsForSelectedCategory = stationsForSelectedCategory.filter((st: string) => 
    st.toLowerCase().includes(stationSearchTerm.toLowerCase())
  );

  // Files in Selected Category AND Selected Court Station
  const filesInSelectedStation = categoryFilteredFiles.filter(f => 
    selectedCourtStation === 'ALL' || f.courtStation === selectedCourtStation
  );

  const getStatusBadge = (status: FileStatus) => {
    switch (status) {
      case 'Active':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">Active</span>;
      case 'Out in Court':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C9A227]/20 text-amber-300 border border-[#C9A227]">Out in Court</span>;
      case 'Out with Advocate':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-950 text-sky-300 border border-sky-700">Out with Advocate</span>;
      case 'Out with Insurance':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-950 text-orange-300 border border-orange-700">Out with Insurance</span>;
      case 'Preliminary Intake':
      case 'Incomplete':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-700 font-mono uppercase">Preliminary Intake</span>;
      case 'Closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-600">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  // Filter Files based on Court Station, Category Tab and Search Input
  const filteredFiles = files.filter(f => {
    // 1st: Filter by Court Station View
    if (activeStationView !== null && activeStationView !== 'ALL') {
      if (f.courtStation !== activeStationView) return false;
    }

    // 2nd: Filter by Case Category filter if selected
    if (selectedCaseCategoryFilter !== 'ALL') {
      const catMatch = f.caseCategory === selectedCaseCategoryFilter || f.caseType === selectedCaseCategoryFilter;
      if (!catMatch) return false;
    }

    const matchesSearch = 
      f.internalFileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.courtCaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.clientType && f.clientType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.partyCapacity && f.partyCapacity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.caseCategory && f.caseCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.caseType && f.caseType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.subCaseType && f.subCaseType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.opposingParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.advocateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.caseChaserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.courtStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.physicalLocation.cabinet.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryTab === 'ACTIVE') {
      const isActiveStatus = 
        f.currentStatus === 'Active' || 
        f.currentStatus === 'Out in Court' || 
        f.currentStatus === 'Out with Advocate' || 
        f.currentStatus === 'Out with Insurance' || 
        f.currentStatus === 'Pending Court';
      
      if (!isActiveStatus) return false;
      if (subStatusFilter !== 'ALL' && f.currentStatus !== subStatusFilter) return false;
      return true;
    }

    if (categoryTab === 'CLOSED') {
      return f.currentStatus === 'Closed' || f.currentStatus === 'Archived';
    }

    // ALL TAB
    if (subStatusFilter !== 'ALL' && f.currentStatus !== subStatusFilter) return false;
    return true;
  });

  // Pagination calculations (max 15 files per page)
  const totalPages = Math.ceil(filteredFiles.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + pageSize);

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.courtCaseNumber) {
      alert('Please fill in mandatory fields: Court Case Number and Client Name.');
      return;
    }

    const chosenCat = formData.caseCategory || 'Civil Litigation';
    const chosenType = formData.subCaseType || formData.caseType || 'General Civil Suit';

    let chosenNum = '';

    if (registrationMode === 'direct') {
      if (!directFileNumber.trim()) {
        alert('For Direct File Registration, please enter the File Number (e.g. 08, 42, 101).');
        return;
      }
      if (!directYear.trim()) {
        alert('For Direct File Registration, please enter the Year (e.g. 2026).');
        return;
      }
      chosenNum = computeDirectNumber(chosenType, directFileNumber, directYear);
    } else {
      // Preliminary intake mode: auto-generated format (FirmInitials/CaseTypeAbbr/Number/Year)
      chosenNum = formData.internalFileNumber || computePreliminaryNumber(chosenType);

      // Increment firm preliminary sequence
      if (currentFirm && onUpdateFirm) {
        const { number: seqNum, year: curYear } = getNextPreliminarySequence(currentFirm);
        onUpdateFirm({
          ...currentFirm,
          preliminaryNextNumber: seqNum + 1,
          preliminaryYear: curYear
        });
      }
    }

    const newFile: RegistryFile = {
      id: `f-${Date.now()}`,
      internalFileNumber: chosenNum,
      courtCaseNumber: formData.courtCaseNumber,
      clientName: formData.clientName,
      clientType: (formData.clientType as ClientType) || 'Individual',
      partyCapacity: (formData.partyCapacity as PartyCapacity) || 'Plaintiff',
      opposingParty: formData.opposingParty || 'N/A',
      courtStation: formData.courtStation || courtStations[0],
      courtNumber: formData.courtNumber || 'Court 1',
      magistrate: formData.magistrate || 'Hon. Magistrate',
      advocateName: formData.advocateName || '',
      clerkName: formData.clerkName || '',
      secretaryName: formData.secretaryName || '',
      caseChaserName: registrationMode === 'direct' ? (formData.caseChaserName || 'Direct / Walk-in (No Chaser)') : (formData.caseChaserName || 'Case Chaser'),
      insuranceCompanyName: formData.insuranceCompanyName || 'None',
      currentStatus: (formData.currentStatus as FileStatus) || 'Active',
      physicalLocation: formData.physicalLocation || { room: 'Central Registry', cabinet: cabinets[0] || 'Cabinet A', shelf: 'Shelf 1' },
      dateOpened: formData.dateOpened || new Date().toISOString().split('T')[0],
      caseCategory: chosenCat,
      caseType: chosenType,
      subCaseType: formData.subCaseType || chosenType,
      notes: formData.notes
    };

    onAddFile(newFile);

    // If sourced from unprocessed bucket, convert record status
    if (registrationMode === 'unprocessed' && selectedUnprocessedId && onUpdateUnprocessedRecord) {
      const rec = (unprocessedRecords || []).find(r => r.id === selectedUnprocessedId);
      if (rec) {
        onUpdateUnprocessedRecord({
          ...rec,
          status: 'Converted to Registry',
          createdFileNumber: newFile.internalFileNumber,
          reviewedAt: new Date().toISOString()
        });
      }
    }

    setShowAddModal(false);
  };

  // Submit File Closure
  const handleConfirmCloseFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCloseModalForFile) return;

    const updatedFile: RegistryFile = {
      ...showCloseModalForFile,
      currentStatus: 'Closed',
      dateClosed: new Date().toISOString().split('T')[0],
      notes: closeJudgmentNotes 
        ? `[Judgment Entered / Closed by ${closedByRole}]: ${closeJudgmentNotes}` 
        : `[Closed by ${closedByRole}] Court judgment entered and file archived.`
    };

    onUpdateFile(updatedFile);
    setShowCloseModalForFile(null);
    setCloseJudgmentNotes('');
    if (selectedFile?.id === updatedFile.id) {
      setSelectedFile(updatedFile);
    }
  };

  // Mark File Active (Re-activate or completed)
  const handleReactivateFile = (file: RegistryFile) => {
    const updatedFile: RegistryFile = {
      ...file,
      currentStatus: 'Active',
      missingRequirements: []
    };
    onUpdateFile(updatedFile);
    if (selectedFile?.id === updatedFile.id) {
      setSelectedFile(updatedFile);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/40 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <FolderArchive className="w-6 h-6 text-[#C9A227]" />
          <h2 className="font-serif font-bold text-xl text-white">Physical File Registry</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#B08D1E] hover:from-[#B08D1E] hover:to-[#967616] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register New Physical File
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY & COURT STATION DIRECTORY LIST                       */}
      {/* ------------------------------------------------------------- */}
      {activeStationView === null ? (
        <div className="space-y-6">
          
          {/* CATEGORY STATUS SELECTION */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* CARD 1: ACTIVE FILES */}
              <div 
                onClick={() => {
                  setCategoryTab('ACTIVE');
                  setActiveStationView(null);
                  setSubStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-xl relative overflow-hidden ${
                  categoryTab === 'ACTIVE'
                    ? 'bg-gradient-to-br from-[#0B1F3A] to-[#071526] border-[#C9A227] ring-2 ring-[#C9A227]/50 scale-[1.01]'
                    : 'bg-[#081729] border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black font-mono text-emerald-400">{allActiveFiles.length}</span>
                </div>

                <div className="mt-3">
                  <h3 className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
                    Active Files
                    {categoryTab === 'ACTIVE' && <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold">
                  <span>ACTIVE LITIGATION</span>
                  <span>{categoryTab === 'ACTIVE' ? 'SELECTED' : 'SELECT'}</span>
                </div>
              </div>

              {/* CARD 2: CLOSED FILES */}
              <div 
                onClick={() => {
                  setCategoryTab('CLOSED');
                  setActiveStationView(null);
                  setSubStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer shadow-xl relative overflow-hidden ${
                  categoryTab === 'CLOSED'
                    ? 'bg-gradient-to-br from-[#0B1F3A] to-[#071526] border-[#C9A227] ring-2 ring-[#C9A227]/50 scale-[1.01]'
                    : 'bg-[#081729] border-slate-800 hover:border-[#C9A227]/50 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-200">
                    <FolderLock className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black font-mono text-slate-300">{allClosedFiles.length}</span>
                </div>

                <div className="mt-3">
                  <h3 className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
                    Closed Files
                    {categoryTab === 'CLOSED' && <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                  <span>JUDGMENT ENTERED</span>
                  <span>{categoryTab === 'CLOSED' ? 'SELECTED' : 'SELECT'}</span>
                </div>
              </div>

              {/* CARD 3: UNPROCESSED SOURCING BUCKET */}
              <div 
                onClick={() => setShowUnprocessedBucketModal(true)}
                className="p-4 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-[#081729] to-[#081729] hover:border-amber-400 hover:bg-amber-950/50 transition cursor-pointer shadow-xl relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-300">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {availableUnprocessedRecords.length}
                    </span>
                    {availableUnprocessedRecords.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-serif font-bold text-sm text-white flex items-center gap-1.5 group-hover:text-amber-300 transition">
                    Unprocessed Sourcing Bucket
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-900/60 flex items-center justify-between text-[10px] text-amber-400 font-mono font-bold">
                  <span>PENDING REVIEW</span>
                  <span className="underline group-hover:text-amber-200">OPEN BUCKET &rarr;</span>
                </div>
              </div>

            </div>
          </div>

          {/* COURT STATIONS DIRECTORY LIST */}
          <div className="bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-base text-white">
                Court Stations Directory
              </h3>

              {/* Station Search Input */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter court station name..."
                  value={stationSearchTerm}
                  onChange={e => setStationSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-xs text-slate-100 rounded-xl focus:outline-none focus:border-[#C9A227] w-64"
                />
              </div>
            </div>

            {/* ADMIN NAVIGATION PANE LIST LAYOUT */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              
              {/* ALL STATIONS LIST ITEM */}
              <div
                onClick={() => {
                  setActiveStationView('ALL');
                  setCurrentPage(1);
                  setSearchTerm('');
                }}
                className="group p-3.5 rounded-xl border border-slate-800 hover:border-[#C9A227]/60 bg-slate-900/80 hover:bg-[#0B1F3A] transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227] shrink-0 group-hover:scale-105 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-black text-white group-hover:text-[#C9A227] transition">
                      ALL COURT STATIONS
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="font-mono font-black text-xs bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-[#C9A227]">
                    {categoryFilteredFiles.length} Files
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition" />
                </div>
              </div>

              {/* INDIVIDUAL STATIONS WITH REGISTERED FILES */}
              {filteredStationsForSelectedCategory.map(station => {
                const stationFiles = categoryFilteredFiles.filter(f => f.courtStation === station);
                const count = stationFiles.length;

                return (
                  <div
                    key={station}
                    onClick={() => {
                      setActiveStationView(station);
                      setCurrentPage(1);
                      setSearchTerm('');
                    }}
                    className="group p-3.5 rounded-xl border border-slate-800/80 hover:border-[#C9A227]/50 bg-slate-900/60 hover:bg-[#0B1F3A] transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-[#C9A227] group-hover:border-[#C9A227]/40 shrink-0 transition">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate" title={station}>
                          {station}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="font-mono font-bold text-xs bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-amber-300">
                        {count} File{count === 1 ? '' : 's'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#C9A227] group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}

              {filteredStationsForSelectedCategory.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-950/50 rounded-xl border border-slate-800/60">
                  No court stations found with registered {categoryTab.toLowerCase()} files matching "{stationSearchTerm}".
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (

        /* ------------------------------------------------------------- */
        /* STEP 3: DRILL-DOWN VIEW FOR SELECTED COURT STATION FILES      */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          
          {/* TOP HEADER WITH BACK BUTTON & STATION TITLE */}
          <div className="bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/40 shadow-2xl space-y-3">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <button
                onClick={() => {
                  setActiveStationView(null);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#C9A227] hover:text-amber-300 text-xs font-bold rounded-xl border border-[#C9A227]/40 transition flex items-center gap-2 cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Court Stations List
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">Esc</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-700/80 text-emerald-300 uppercase">
                  {categoryTab} FILES
                </span>
                <span className="text-xs font-mono font-black text-[#C9A227] bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  {filteredFiles.length} File{filteredFiles.length === 1 ? '' : 's'} Total
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#C9A227]" />
                <h3 className="font-serif font-black text-lg text-white">
                  {activeStationView === 'ALL' ? 'ALL COURT STATIONS MASTER REGISTER' : activeStationView}
                </h3>
              </div>
            </div>

          </div>

          {/* SEARCH BAR & QUICK SUB-FILTERS */}
          <div className="bg-[#081729] p-4 rounded-2xl border border-[#C9A227]/30 shadow-xl space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              
              <div className="relative flex-1 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search files in ${activeStationView === 'ALL' ? 'all stations' : 'this station'} by file #, client, case #, advocate, or chaser...`}
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 text-slate-100 border border-slate-700 text-xs rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                  <select
                    value={selectedCaseCategoryFilter}
                    onChange={e => {
                      setSelectedCaseCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="py-2 px-3 bg-slate-950 text-slate-100 border border-slate-700 text-xs rounded-xl focus:outline-none focus:border-[#C9A227] font-medium max-w-[220px]"
                  >
                    <option value="ALL">All Case Categories (18)</option>
                    {DEFAULT_CASE_CATEGORIES.map(cat => (
                      <option key={cat.category} value={cat.category}>{cat.category}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search
                </button>
              </div>

              {/* Sub-status filters for Active/All */}
              {(categoryTab === 'ACTIVE' || categoryTab === 'ALL') && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  <span className="text-[10px] text-slate-400 font-mono uppercase mr-1">Status:</span>
                  {['ALL', 'Active', 'Out in Court', 'Out with Advocate', 'Out with Insurance'].map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setSubStatusFilter(st);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                        subStatusFilter === st
                          ? 'bg-[#C9A227] text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* REGISTER FILES TABLE VIEW */}
          <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl overflow-hidden">
            <div className="p-4 bg-[#0B1F3A] border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                {categoryTab === 'ACTIVE' && <FileCheck2 className="w-4 h-4 text-emerald-400" />}
                {categoryTab === 'CLOSED' && <FolderLock className="w-4 h-4 text-slate-300" />}
                {categoryTab === 'INCOMPLETE' && <ShieldAlert className="w-4 h-4 text-red-400" />}
                {categoryTab === 'ALL' && <FolderArchive className="w-4 h-4 text-[#C9A227]" />}
                {categoryTab} REGISTRY REGISTER ({filteredFiles.length} Total Records)
              </h3>

              <div className="text-xs text-slate-300 font-mono">
                Showing {filteredFiles.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, filteredFiles.length)} of {filteredFiles.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#071526] text-[#C9A227] font-serif uppercase tracking-wider text-[11px] border-b border-[#C9A227]/30">
                  <tr>
                    <th className="p-3.5 pl-4">Internal File #</th>
                    <th className="p-3.5">Court Case #</th>
                    <th className="p-3.5">Client vs Opposing Party</th>
                    <th className="p-3.5">Court Station & Magistrate</th>
                    <th className="p-3.5">Assigned Staff</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Physical File Location</th>
                    <th className="p-3.5 pr-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedFiles.map(file => (
                    <tr 
                      key={file.id} 
                      className="hover:bg-slate-800/60 transition cursor-pointer"
                      onClick={() => setSelectedFile(file)}
                    >
                      <td className="p-3.5 pl-4 font-mono font-extrabold text-[#C9A227]">
                        {file.internalFileNumber}
                      </td>
                      <td className="p-3.5 font-medium text-slate-100">
                        <div className="font-semibold text-slate-100">{file.courtCaseNumber}</div>
                        {(file.caseCategory || file.caseType) && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30">
                              {file.caseCategory || 'Civil Litigation'}
                            </span>
                            {file.caseType && file.caseType !== file.caseCategory && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-700">
                                {file.caseType}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 max-w-[260px]">
                        <div className="font-bold text-slate-100 truncate">{file.clientName}</div>
                        <div className="flex flex-wrap items-center gap-1 my-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-amber-300 border border-amber-500/30 shrink-0">
                            {file.clientType || 'Individual'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-200 border border-indigo-700/50 shrink-0">
                            {file.partyCapacity || 'Plaintiff'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">vs {file.opposingParty}</div>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="truncate font-semibold text-slate-200">{file.courtStation}</div>
                        <div className="text-[10px] text-slate-400">{file.courtNumber} • {file.magistrate}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{file.advocateName}</div>
                        <div className="text-[10px] text-amber-300">Chaser: {file.caseChaserName}</div>
                      </td>
                      <td className="p-3.5">
                        {getStatusBadge(file.currentStatus)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                          <span className="truncate">{file.physicalLocation.cabinet} ({file.physicalLocation.shelf})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-5">{file.physicalLocation.room}</div>
                      </td>
                      <td className="p-3.5 pr-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedFile(file)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                            title="View Record Details"
                          >
                            <Eye className="w-4 h-4 text-[#C9A227]" />
                          </button>

                          <button
                            onClick={() => onOpenMoveModal(file)}
                            className="p-1.5 rounded-lg hover:bg-amber-950/60 text-amber-300 transition"
                            title="Move Physical File"
                          >
                            <PackageSearch className="w-4 h-4" />
                          </button>

                          {/* Quick Close Button if active/incomplete */}
                          {file.currentStatus !== 'Closed' && (
                            <button
                              onClick={() => {
                                setShowCloseModalForFile(file);
                                setCloseJudgmentNotes('');
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title="Close File"
                            >
                              <FolderLock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedFiles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 text-xs space-y-2">
                        <FolderArchive className="w-8 h-8 text-slate-600 mx-auto" />
                        <div>No physical files found in <strong>{activeStationView === 'ALL' ? 'All Stations' : activeStationView}</strong> ({categoryTab}) matching search filters.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#0B1F3A] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
                <div>
                  Showing <span className="font-bold text-white">{startIndex + 1}</span> to <span className="font-bold text-white">{Math.min(startIndex + pageSize, filteredFiles.length)}</span> of <span className="font-bold text-white">{filteredFiles.length}</span> physical files
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Page
                  </button>

                  <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono font-bold">
                    Page {safeCurrentPage} of {totalPages}
                  </div>

                  <button
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    Next Page
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* FILE DETAIL DRAWER / MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-[#081729] text-slate-100 w-full max-w-2xl h-full shadow-2xl overflow-y-auto p-6 space-y-6 border-l-2 border-[#C9A227] font-sans">
            
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-mono font-bold text-[#C9A227] flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4 text-[#C9A227]" />
                  REGISTRY FILE RECORD
                </span>
                <h3 className="font-serif font-extrabold text-2xl text-white mt-1">
                  {selectedFile.internalFileNumber}
                </h3>
                <p className="text-slate-300 text-xs font-semibold mt-0.5">
                  {selectedFile.courtCaseNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#C9A227] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Quick Action Bar */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Current Status</div>
                {getStatusBadge(selectedFile.currentStatus)}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = selectedFile;
                    setSelectedFile(null);
                    onOpenMoveModal(target);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <PackageSearch className="w-4 h-4" />
                  Move Location
                </button>

                {selectedFile.currentStatus !== 'Closed' ? (
                  <button
                    onClick={() => {
                      setShowCloseModalForFile(selectedFile);
                      setCloseJudgmentNotes('');
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 hover:bg-white text-xs font-black rounded-lg shadow transition flex items-center gap-1.5"
                  >
                    <FolderLock className="w-4 h-4" />
                    Close File (Judgment)
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivateFile(selectedFile)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Re-open File
                  </button>
                )}
              </div>
            </div>

            {/* Incomplete Status Alert Banner (if applicable) */}
            {selectedFile.currentStatus === 'Incomplete' && (
              <div className="p-4 bg-red-950/80 border border-red-700/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    INCOMPLETE FILE - MISSING CHASER DOCUMENTS
                  </div>

                  <button
                    onClick={() => handleReactivateFile(selectedFile)}
                    className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-500"
                  >
                    Mark Docs Received
                  </button>
                </div>

                <ul className="list-disc list-inside text-xs text-red-200 space-y-1">
                  {selectedFile.missingRequirements && selectedFile.missingRequirements.length > 0 ? (
                    selectedFile.missingRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))
                  ) : (
                    <li>Pending Police Abstract / Medical Reports from Case Chaser ({selectedFile.caseChaserName})</li>
                  )}
                </ul>
              </div>
            )}

            {/* Closed File Judgment Note (if applicable) */}
            {selectedFile.currentStatus === 'Closed' && (
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                <div className="text-xs font-bold text-[#C9A227] flex items-center gap-1.5 uppercase font-mono">
                  <Gavel className="w-4 h-4 text-[#C9A227]" />
                  COURT JUDGMENT & CLOSURE RECORD
                </div>
                <div className="text-xs text-slate-200">
                  Closed Date: <strong className="text-white">{selectedFile.dateClosed || 'Recorded'}</strong>
                </div>
                <p className="text-xs text-slate-300 italic pt-1">
                  {selectedFile.notes || 'Court judgment was entered and file subsequently closed by authorized clerk / advocate / proprietor.'}
                </p>
              </div>
            )}

            {/* Current Physical Location Banner */}
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 space-y-1">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C9A227]" />
                CURRENT PHYSICAL LOCATION
              </div>
              <div className="text-sm font-extrabold text-white font-mono">
                {selectedFile.physicalLocation.room} → {selectedFile.physicalLocation.cabinet} ({selectedFile.physicalLocation.shelf})
              </div>
              {selectedFile.physicalLocation.detail && (
                <div className="text-xs text-amber-200">
                  Note: {selectedFile.physicalLocation.detail}
                </div>
              )}
            </div>

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-semibold flex items-center justify-between">
                  <span>Client Name & Entity Type</span>
                  <span className="text-amber-300 font-bold px-1.5 py-0.5 bg-slate-950 rounded border border-amber-500/30 text-[10px]">
                    {selectedFile.clientType || 'Individual'}
                  </span>
                </div>
                <div className="font-bold text-slate-100 text-sm">{selectedFile.clientName}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-semibold flex items-center justify-between">
                  <span>Party Legal Capacity</span>
                  <span className="text-indigo-300 font-bold px-1.5 py-0.5 bg-indigo-950 rounded border border-indigo-700/50 text-[10px]">
                    {selectedFile.partyCapacity || 'Plaintiff'}
                  </span>
                </div>
                <div className="font-bold text-indigo-200 text-sm">{selectedFile.partyCapacity || 'Plaintiff'} in Matter</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 col-span-2">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Opposing Party</div>
                <div className="font-bold text-slate-100 text-sm">{selectedFile.opposingParty}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Court Station</div>
                <div className="font-bold text-slate-100">{selectedFile.courtStation}</div>
                <div className="text-[10px] text-slate-400">{selectedFile.courtNumber}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Magistrate / Judge</div>
                <div className="font-bold text-slate-100">{selectedFile.magistrate}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Assigned Advocate</div>
                <div className="font-bold text-slate-100">{selectedFile.advocateName}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Assigned Case Chaser</div>
                <div className="font-bold text-amber-300">{selectedFile.caseChaserName}</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Registry Staff</div>
                <div className="text-slate-200">Clerk: <strong>{selectedFile.clerkName}</strong></div>
                <div className="text-slate-200">Secretary: <strong>{selectedFile.secretaryName}</strong></div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Insurance Firm</div>
                <div className="font-bold text-slate-100">{selectedFile.insuranceCompanyName}</div>
              </div>
            </div>

            {/* CORUM & COURT PROCEEDINGS REGISTER */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#C9A227]/20 border border-[#C9A227]/40 rounded-lg text-[#C9A227]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                      CORUM & COURT PROCEEDINGS
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-[#C9A227] border border-[#C9A227]/30 rounded-full font-mono font-bold">
                        {fileCorumList.length} {fileCorumList.length === 1 ? 'Record' : 'Records'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Court proceedings history recorded by attending advocate
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openRecordCorumModal(selectedFile)}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#C9A227] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-lg shadow-lg flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  Record CORUM
                </button>
              </div>

              {/* CORUM Entries List or Empty State */}
              <div className="space-y-3">
                {fileCorumList.length === 0 ? (
                  <div className="p-5 bg-slate-900/60 border border-dashed border-slate-700/70 rounded-xl text-center space-y-2">
                    <Scale className="w-7 h-7 text-slate-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-300">No CORUM Proceedings Recorded Yet</div>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Log proceedings for this file including <strong>Defendant Advocate</strong>, <strong>Coming Up For</strong>, <strong>Court Orders</strong>, <strong>Advocate Remarks</strong>, <strong>Office Action</strong>, and <strong>Date</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => openRecordCorumModal(selectedFile)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[#C9A227] text-xs font-bold rounded-lg border border-[#C9A227]/40 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Record First CORUM Entry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {fileCorumList.map((corum, idx) => (
                      <div
                        key={corum.id || idx}
                        className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition"
                      >
                        {/* Top Bar: Date, Coram, Court Station */}
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500/15 text-[#C9A227] border border-[#C9A227]/30 text-xs font-mono font-bold rounded-md flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {corum.date} {corum.time ? `• ${corum.time}` : ''}
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              Coram: <span className="text-amber-200">{corum.coram || selectedFile.magistrate || 'Hon. Presiding Magistrate/Judge'}</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Landmark className="w-3 h-3 text-slate-500" />
                            {corum.courtStation || selectedFile.courtStation} ({corum.courtNumber || selectedFile.courtNumber})
                          </div>
                        </div>

                        {/* Counsel Row: Plaintiff / Attending Advocate & Defendant Advocate */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-0.5">
                            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              Firm / Plaintiff Advocate
                            </div>
                            <div className="font-bold text-slate-200">{corum.advocatePresent || selectedFile.advocateName || 'Advocate on Record'}</div>
                          </div>

                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-0.5">
                            <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-rose-400" />
                              Defendant Advocate
                            </div>
                            <div className="font-bold text-rose-300">{corum.defendantAdvocate || 'Opposing Counsel on Record'}</div>
                          </div>
                        </div>

                        {/* Coming Up For */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 text-[11px] font-semibold">Coming Up For:</span>
                          <span className="px-2.5 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 rounded text-xs font-bold">
                            {corum.comingUpFor}
                          </span>
                        </div>

                        {/* Court Orders Issued */}
                        <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg space-y-1">
                          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Gavel className="w-3.5 h-3.5 text-[#C9A227]" />
                            Court Orders Issued
                          </div>
                          <p className="text-xs text-amber-100/90 whitespace-pre-wrap leading-relaxed">
                            {corum.orders}
                          </p>
                        </div>

                        {/* Remarks / Proceedings Recorded by Advocate */}
                        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <ScrollText className="w-3.5 h-3.5 text-slate-400" />
                            Advocate Remarks & Proceedings
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed italic">
                            "{corum.remarks}"
                          </p>
                        </div>

                        {/* Office Action Required */}
                        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg space-y-1">
                          <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Office Action Required
                          </div>
                          <p className="text-xs text-emerald-200 whitespace-pre-wrap leading-relaxed font-medium">
                            {corum.officeAction}
                          </p>
                        </div>

                        {/* Next Court Appearance & Attribution Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                          {corum.nextCourtDate ? (
                            <div className="flex items-center gap-1 text-amber-300 font-bold">
                              <Clock className="w-3 h-3 text-[#C9A227]" />
                              Next Court Appearance: <span className="underline font-mono">{corum.nextCourtDate} {corum.nextCourtTime || ''}</span>
                              {corum.nextComingUpFor && (
                                <span className="text-slate-300 font-normal">({corum.nextComingUpFor})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No future court date fixed</span>
                          )}

                          <div className="text-[10px] text-slate-500 font-mono">
                            Recorded by: <span className="text-slate-400 font-medium">{corum.recordedBy || 'Advocate'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* File Movement History */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C9A227]" />
                Physical Movement Audit Trail
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {movements
                  .filter(m => m.fileNumber === selectedFile.internalFileNumber)
                  .map(mov => (
                    <div key={mov.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <span>{mov.date} {mov.time}</span>
                        <span className="font-bold text-slate-300">{mov.user}</span>
                      </div>
                      <div className="text-slate-200 font-semibold">
                        {mov.fromLocation} → <span className="text-amber-300">{mov.toLocation}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 italic">"{mov.reason}"</div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CLOSE FILE MODAL (JUDGMENT ENTERED & CLOSED BY CLERK, ADVOCATE, OR ADMIN) */}
      {showCloseModalForFile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#C9A227]/50 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-[#C9A227]" />
                Close File (Judgment Entered)
              </h3>
              <button onClick={() => setShowCloseModalForFile(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseFile} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-white text-sm">{showCloseModalForFile.internalFileNumber}</div>
                <div className="text-slate-300">{showCloseModalForFile.courtCaseNumber}</div>
                <div className="text-amber-300 font-medium">{showCloseModalForFile.clientName} vs {showCloseModalForFile.opposingParty}</div>
              </div>

              <div>
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Closed By Role Authority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Clerk', 'Advocate', 'Proprietor'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setClosedByRole(role)}
                      className={`p-2 rounded-lg border text-xs font-bold transition ${
                        closedByRole === role
                          ? 'bg-[#C9A227] text-slate-950 border-[#C9A227]'
                          : 'bg-slate-950 text-slate-300 border-slate-700'
                      }`}
                    >
                      {role === 'Proprietor' ? 'Admin' : role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Court Judgment Details & Closure Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Judgment entered in favor of plaintiff for KSh 3,500,000. Decree satisfied and court file closed."
                  value={closeJudgmentNotes}
                  onChange={e => setCloseJudgmentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModalForFile(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C9A227] text-slate-950 font-black rounded-lg hover:bg-amber-400 uppercase tracking-wider"
                >
                  Confirm File Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New File Modal (Dual-Mode: From Unprocessed Bucket VS Direct Registration) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-3xl w-full p-6 space-y-5 border border-[#C9A227]/40 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">Register New Physical File</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C9A227]" />
                  {formData.internalFileNumber || generateSystemInternalFileNumber(files, fileNumberPrefix)}
                </span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* REGISTRATION MODE TABS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRegistrationMode('unprocessed');
                  if (availableUnprocessedRecords.length > 0 && !selectedUnprocessedId) {
                    handleSelectUnprocessedRecord(availableUnprocessedRecords[0].id);
                  } else {
                    const defaultSub = formData.subCaseType || formData.caseType || 'General Civil Suit';
                    setFormData(prev => ({
                      ...prev,
                      internalFileNumber: computePreliminaryNumber(defaultSub)
                    }));
                  }
                }}
                className={`p-3 rounded-lg border text-left transition flex items-center gap-3 cursor-pointer ${
                  registrationMode === 'unprocessed'
                    ? 'bg-[#0B1F3A] border-[#C9A227] text-white shadow-lg ring-1 ring-[#C9A227]/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  registrationMode === 'unprocessed' ? 'bg-[#C9A227] text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>From Sourced Bucket</span>
                    {availableUnprocessedRecords.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">
                        {availableUnprocessedRecords.length}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegistrationMode('direct');
                  setSelectedUnprocessedId('');
                  setFormData(prev => ({
                    ...prev,
                    internalFileNumber: directFileNumber ? computeDirectNumber(prev.subCaseType || prev.caseType || 'General Civil Suit', directFileNumber, directYear) : '',
                    clientName: '',
                    caseChaserName: 'Direct / Walk-in (No Chaser)',
                    notes: ''
                  }));
                }}
                className={`p-3 rounded-lg border text-left transition flex items-center gap-3 cursor-pointer ${
                  registrationMode === 'direct'
                    ? 'bg-[#0B1F3A] border-[#C9A227] text-white shadow-lg ring-1 ring-[#C9A227]/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  registrationMode === 'direct' ? 'bg-[#C9A227] text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  <FilePlus2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Direct Registration</div>
                </div>
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-4 text-xs">
              
              {/* MODE 1: SELECT UNPROCESSED RECORD FROM BUCKET */}
              {registrationMode === 'unprocessed' && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                    <div className="font-serif font-bold text-amber-200 flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-[#C9A227]" />
                      Select Sourced Intake Record from Preliminary Bucket
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {availableUnprocessedRecords.length} Record(s) Available
                    </span>
                  </div>

                  {availableUnprocessedRecords.length === 0 ? (
                    <div className="p-3 bg-slate-950/80 rounded-lg text-slate-400 text-xs text-center border border-slate-800">
                      No unprocessed client records in bucket. Please switch to <strong>Direct Registration</strong> mode above.
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-amber-300 mb-1">
                        Select Unprocessed Client Intake Record *
                      </label>
                      <select
                        value={selectedUnprocessedId}
                        onChange={e => handleSelectUnprocessedRecord(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-100 font-medium focus:border-[#C9A227]"
                      >
                        <option value="">-- Select Sourced Client Record --</option>
                        {availableUnprocessedRecords.map(rec => (
                          <option key={rec.id} value={rec.id}>
                            {rec.clientFullName} ({rec.phoneNumber || 'No Tel'}) — Sourced by {rec.caseChaserName} [Intake: {rec.dateCaptured}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedUnprocessedId && (
                    <div className="p-2.5 bg-slate-950/90 rounded-lg border border-amber-500/30 text-[11px] space-y-1 text-slate-200">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>✓ Pre-filled from Preliminary Intake</span>
                        <span className="font-mono text-[10px] text-slate-400">Status: {availableUnprocessedRecords.find(r => r.id === selectedUnprocessedId)?.status}</span>
                      </div>
                      <div>Client: <strong className="text-white">{formData.clientName}</strong></div>
                      <div>Sourced By Chaser: <strong className="text-amber-300">{formData.caseChaserName}</strong></div>
                      <div>Insurance Firm: <strong className="text-slate-100">{formData.insuranceCompanyName}</strong></div>
                      {formData.notes && <div className="text-slate-400 italic mt-1">{formData.notes}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* CASE CLASSIFICATION & MATTER TYPE */}
              <div className="p-3.5 bg-[#0B1F3A]/80 border border-[#C9A227]/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-serif font-bold text-slate-200 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#C9A227]" />
                    Case Classification & Matter Type
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono">
                    Abbreviation: <strong className="text-emerald-400 font-bold">{getCaseTypeAbbreviation(formData.subCaseType || formData.caseType || formData.caseCategory)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#C9A227] mb-1">
                      Primary Case Category
                    </label>
                    <select
                      value={formData.caseCategory || 'Civil Litigation'}
                      onChange={e => {
                        const newCat = e.target.value;
                        const catObj = DEFAULT_CASE_CATEGORIES.find(c => c.category === newCat) || DEFAULT_CASE_CATEGORIES[0];
                        const defaultSub = catObj.subTypes[0] || newCat;
                        const defaultCap = catObj.recommendedCapacities[0] || 'Plaintiff';
                        
                        let nextNum = formData.internalFileNumber;
                        if (registrationMode === 'unprocessed') {
                          nextNum = computePreliminaryNumber(defaultSub);
                        } else if (directFileNumber) {
                          nextNum = computeDirectNumber(defaultSub, directFileNumber, directYear);
                        }

                        setFormData({
                          ...formData,
                          caseCategory: newCat,
                          caseType: defaultSub,
                          subCaseType: defaultSub,
                          partyCapacity: defaultCap,
                          internalFileNumber: nextNum
                        });
                      }}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-[#C9A227]"
                    >
                      {DEFAULT_CASE_CATEGORIES.map(cat => (
                        <option key={cat.category} value={cat.category}>{cat.category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#C9A227] mb-1">
                      Specific Matter / Sub-Type *
                    </label>
                    {(() => {
                      const selectedCatObj = DEFAULT_CASE_CATEGORIES.find(c => c.category === (formData.caseCategory || 'Civil Litigation')) || DEFAULT_CASE_CATEGORIES[0];
                      return (
                        <select
                          value={formData.subCaseType || formData.caseType || selectedCatObj.subTypes[0]}
                          onChange={e => {
                            const newSub = e.target.value;
                            let nextNum = formData.internalFileNumber;
                            if (registrationMode === 'unprocessed') {
                              nextNum = computePreliminaryNumber(newSub);
                            } else if (directFileNumber) {
                              nextNum = computeDirectNumber(newSub, directFileNumber, directYear);
                            }
                            setFormData({
                              ...formData,
                              caseType: newSub,
                              subCaseType: newSub,
                              internalFileNumber: nextNum
                            });
                          }}
                          className="w-full p-2.5 bg-slate-950 border border-[#C9A227]/70 rounded-xl text-slate-100 font-bold focus:border-[#C9A227]"
                        >
                          {selectedCatObj.subTypes.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* INTERNAL FILE NUMBER SECTION */}
              {registrationMode === 'unprocessed' ? (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-emerald-500/30 pb-2">
                    <label className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Auto-Generated Preliminary File Number
                    </label>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                      {getFirmInitials()}/{getCaseTypeAbbreviation(formData.subCaseType || formData.caseType)}/SEQ/{new Date().getFullYear()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      required
                      readOnly
                      value={formData.internalFileNumber || computePreliminaryNumber(formData.subCaseType || formData.caseType || 'GEN')}
                      className="w-full p-3 bg-slate-950 border-2 border-emerald-500/60 rounded-xl font-mono text-base font-black text-emerald-300 tracking-wider cursor-not-allowed shadow-inner"
                      title="File Number"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-950/20 border border-[#C9A227]/40 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#C9A227]/30 pb-2">
                    <label className="font-bold text-amber-300 flex items-center gap-1.5">
                      <FilePlus2 className="w-4 h-4 text-[#C9A227]" />
                      Direct File Number Assignment
                    </label>
                    <span className="text-[10px] font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-amber-700/50">
                      {getFirmInitials()}/{getCaseTypeAbbreviation(formData.subCaseType || formData.caseType)}/{directFileNumber ? formatSequenceNumber(directFileNumber) : '##'}/{directYear || new Date().getFullYear()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        File Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 08, 42, or 104"
                        value={directFileNumber}
                        onChange={e => {
                          const val = e.target.value;
                          setDirectFileNumber(val);
                          const generated = computeDirectNumber(
                            formData.subCaseType || formData.caseType || 'General Civil Suit',
                            val,
                            directYear
                          );
                          setFormData(prev => ({ ...prev, internalFileNumber: generated }));
                        }}
                        className="w-full p-2.5 bg-slate-950 border-2 border-amber-500/60 rounded-xl font-mono text-amber-300 font-bold focus:border-[#C9A227] shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-200 mb-1">
                        Year <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1980"
                        max="2100"
                        placeholder="e.g. 2026"
                        value={directYear}
                        onChange={e => {
                          const val = e.target.value;
                          setDirectYear(val);
                          const generated = computeDirectNumber(
                            formData.subCaseType || formData.caseType || 'General Civil Suit',
                            directFileNumber,
                            val
                          );
                          setFormData(prev => ({ ...prev, internalFileNumber: generated }));
                        }}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-100 font-bold focus:border-[#C9A227]"
                      />
                    </div>
                  </div>

                  {/* Formatted Internal File Result Preview */}
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-[#C9A227]/50 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Direct Internal File Number:</span>
                    <span className="font-mono font-black text-amber-300 text-sm">
                      {directFileNumber ? computeDirectNumber(formData.subCaseType || formData.caseType || 'GEN', directFileNumber, directYear) : 'Enter file number above'}
                    </span>
                  </div>
                </div>
              )}

              {/* COURT CASE NUMBER & OPPOSING PARTY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-amber-300">Court Case Number *</label>
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Milimani HCCC No. 892 of 2026 or CMCC/1042/2026"
                    value={formData.courtCaseNumber}
                    onChange={e => setFormData({ ...formData, courtCaseNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border-2 border-amber-400 rounded-xl text-slate-100 font-bold focus:border-[#C9A227] shadow-inner"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Opposing Party</label>
                  <input
                    type="text"
                    placeholder="e.g. Jubilee Insurance Co. / John Doe"
                    value={formData.opposingParty}
                    onChange={e => setFormData({ ...formData, opposingParty: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* CLIENT DETAILS SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">
                    Client Full Name * {registrationMode === 'unprocessed' && '(Pre-filled from Bucket)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Enterprises Ltd or Jane Wanjiku"
                    value={formData.clientName}
                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                    className={`w-full p-2.5 bg-slate-950 border rounded-xl text-slate-100 focus:border-[#C9A227] ${
                      registrationMode === 'unprocessed' ? 'border-amber-500/60 font-semibold' : 'border-slate-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Insurance Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Directline, CIC, APA Insurance (or None)"
                    value={formData.insuranceCompanyName}
                    onChange={e => setFormData({ ...formData, insuranceCompanyName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Client Profile & Legal Capacity */}
              <div className="p-3.5 bg-[#0B1F3A]/80 border border-[#C9A227]/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-serif font-bold text-slate-200 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#C9A227]" />
                    Client Profile & Legal Role
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono">Kenyan Law Firm Matter Standard</span>
                </div>

                {/* Grid 2: Client Type & Party Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#C9A227] mb-1">
                      3. Client Entity Type (Who Client Is)
                    </label>
                    <select
                      value={formData.clientType}
                      onChange={e => setFormData({ ...formData, clientType: e.target.value as ClientType })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                    >
                      {CLIENT_TYPES.map(ct => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#C9A227] mb-1">
                      4. Party Capacity (Client's Legal Role)
                    </label>
                    <select
                      value={formData.partyCapacity}
                      onChange={e => setFormData({ ...formData, partyCapacity: e.target.value as PartyCapacity })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-indigo-200 font-bold focus:border-[#C9A227]"
                    >
                      {ALL_PARTY_CAPACITIES.map(pc => (
                        <option key={pc} value={pc}>{pc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Recommendation Pills based on Case Category */}
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-between font-mono">
                    <span>Recommended Legal Capacities for {formData.caseCategory || 'Selected Category'}:</span>
                    <span className="text-[#C9A227] font-semibold">Click to assign capacity</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(RECOMMENDED_CAPACITIES_BY_CASE_TYPE[formData.caseCategory || 'Civil Litigation'] || ALL_PARTY_CAPACITIES).map(cap => {
                      const isSelected = formData.partyCapacity === cap;
                      return (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => setFormData({ ...formData, partyCapacity: cap })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500/50 hover:text-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-amber-300" />}
                          {cap}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Court Station</label>
                  <CourtStationPicker
                    value={formData.courtStation}
                    onChange={val => setFormData({ ...formData, courtStation: val })}
                    availableStations={courtStations}
                    placeholder="Search or select court station..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Court Number</label>
                  <input
                    type="text"
                    value={formData.courtNumber}
                    onChange={e => setFormData({ ...formData, courtNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Magistrate / Judge</label>
                  <input
                    type="text"
                    placeholder="Hon. Magistrate"
                    value={formData.magistrate}
                    onChange={e => setFormData({ ...formData, magistrate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Initial Category</label>
                  <select
                    value={formData.currentStatus}
                    onChange={e => setFormData({ ...formData, currentStatus: e.target.value as FileStatus })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  >
                    <option value="Active">Active (Filed in Court)</option>
                    <option value="Closed">Closed (Judgment Entered)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Assigned Advocate</label>
                  <input
                    type="text"
                    value={formData.advocateName}
                    onChange={e => setFormData({ ...formData, advocateName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#C9A227] mb-1">Case Chaser</label>
                  <input
                    type="text"
                    value={formData.caseChaserName}
                    onChange={e => setFormData({ ...formData, caseChaserName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                    placeholder={registrationMode === 'direct' ? 'Direct / Walk-in (No Chaser)' : 'Chaser Name'}
                  />
                </div>
              </div>

              {/* Cabinet & Shelf initial physical location */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <label className="block font-bold text-[#C9A227] flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#C9A227]" />
                  Initial Physical Registry Cabinet & Shelf
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Room (e.g. Central Registry)"
                    value={formData.physicalLocation?.room}
                    onChange={e => setFormData({
                      ...formData,
                      physicalLocation: { ...formData.physicalLocation!, room: e.target.value }
                    })}
                    className="p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                  <select
                    value={formData.physicalLocation?.cabinet}
                    onChange={e => setFormData({
                      ...formData,
                      physicalLocation: { ...formData.physicalLocation!, cabinet: e.target.value }
                    })}
                    className="p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
                  >
                    {cabinets.map(cab => (
                      <option key={cab} value={cab}>{cab}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Shelf (e.g. Shelf 3)"
                    value={formData.physicalLocation?.shelf}
                    onChange={e => setFormData({
                      ...formData,
                      physicalLocation: { ...formData.physicalLocation!, shelf: e.target.value }
                    })}
                    className="p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#C9A227] text-slate-950 font-black rounded-lg hover:bg-amber-400 uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Confirm & Save Physical File
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Standalone Unprocessed Sourcing Bucket Modal */}
      {showUnprocessedBucketModal && (
        <UnprocessedSourcingModule
          unprocessedRecords={unprocessedRecords}
          onUpdateUnprocessedRecord={onUpdateUnprocessedRecord || (() => {})}
          onAddFile={onAddFile}
          files={files}
          courtStations={courtStations}
          cabinets={cabinets}
          fileNumberPrefix={fileNumberPrefix}
          users={users}
          currentUser={null}
          isModal={true}
          onCloseModal={() => setShowUnprocessedBucketModal(false)}
        />
      )}

      {/* RECORD CORUM MODAL */}
      {showRecordCorumModal && corumTargetFile && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-[#C9A227]/60 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#C9A227]/20 border border-[#C9A227]/40 rounded-lg text-[#C9A227]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Record CORUM & Court Proceedings</h3>
                  <p className="text-xs text-slate-400">
                    Log court appearance details, orders, remarks, opposing counsel & office actions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecordCorumModal(false);
                  setCorumTargetFile(null);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target File Info Summary Banner */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">File Number:</span>
                <div className="font-mono font-bold text-amber-300 text-sm">{corumTargetFile.internalFileNumber}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Court Case No:</span>
                <div className="font-bold text-slate-200">{corumTargetFile.courtCaseNumber || 'Pending Filing'}</div>
              </div>
              <div className="w-full sm:w-auto">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Parties:</span>
                <div className="font-medium text-slate-300">{corumTargetFile.clientName} <span className="text-amber-400 font-bold">vs</span> {corumTargetFile.opposingParty}</div>
              </div>
            </div>

            {corumValidationError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{corumValidationError}</div>
              </div>
            )}

            <form onSubmit={handleSaveCorum} className="space-y-4 text-xs">
              
              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Date of Appearance <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={corumFormData.date}
                    onChange={e => {
                      const sel = e.target.value;
                      if (sel && isWeekend(sel)) {
                        const valid = ensureWeekday(sel);
                        setCorumFormData({ ...corumFormData, date: valid });
                        setCorumValidationError(`Weekend court date prohibited. Auto-adjusted to weekday (${valid}).`);
                      } else {
                        setCorumFormData({ ...corumFormData, date: sel });
                        setCorumValidationError(null);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Time of Session
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={corumFormData.time}
                    onChange={e => setCorumFormData({ ...corumFormData, time: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227] font-mono"
                  />
                </div>
              </div>

              {/* Coram & Court Station */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Presiding Coram (Magistrate / Judge / Bench)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hon. E. C. Cherono, Principal Magistrate"
                    value={corumFormData.coram}
                    onChange={e => setCorumFormData({ ...corumFormData, coram: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Court Station & Room
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Station"
                      value={corumFormData.courtStation}
                      onChange={e => setCorumFormData({ ...corumFormData, courtStation: e.target.value })}
                      className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                    />
                    <input
                      type="text"
                      placeholder="Court Room"
                      value={corumFormData.courtNumber}
                      onChange={e => setCorumFormData({ ...corumFormData, courtNumber: e.target.value })}
                      className="p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                    />
                  </div>
                </div>
              </div>

              {/* Counsel Row: Plaintiff Advocate & Defendant Advocate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Firm / Attending Advocate (Plaintiff Counsel)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adv. Anthony Omollo"
                    value={corumFormData.advocatePresent}
                    onChange={e => setCorumFormData({ ...corumFormData, advocatePresent: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">
                    Defendant Advocate (Opposing Counsel) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M/s Kamau, Ndung'u & Co. Advocates (for Defendant)"
                    value={corumFormData.defendantAdvocate}
                    onChange={e => setCorumFormData({ ...corumFormData, defendantAdvocate: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-[#C9A227]/70 rounded-xl text-slate-100 focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Coming Up For */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Coming Up For (Purpose of Appearance) <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={corumFormData.comingUpFor}
                    onChange={e => setCorumFormData({ ...corumFormData, comingUpFor: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-bold focus:border-[#C9A227]"
                  >
                    <option value="Mention">Mention</option>
                    <option value="Mention for Pre-Trial Directions">Mention for Pre-Trial Directions</option>
                    <option value="Mention to Confirm Compliance">Mention to Confirm Compliance</option>
                    <option value="Hearing of Main Suit">Hearing of Main Suit</option>
                    <option value="Hearing of Preliminary Objection">Hearing of Preliminary Objection</option>
                    <option value="Hearing of Notice of Motion">Hearing of Notice of Motion</option>
                    <option value="Hearing of Application for Injunction">Hearing of Application for Injunction</option>
                    <option value="Ruling">Ruling</option>
                    <option value="Judgment">Judgment</option>
                    <option value="Formal Proof">Formal Proof</option>
                    <option value="Cross-Examination">Cross-Examination</option>
                    <option value="Taxing of Bill of Costs">Taxing of Bill of Costs</option>
                    <option value="Pre-Trial Conference">Pre-Trial Conference</option>
                    <option value="Other">Other (Custom Purpose)</option>
                  </select>

                  {corumFormData.comingUpFor === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify exact court purpose..."
                      value={corumFormData.customComingUpFor}
                      onChange={e => setCorumFormData({ ...corumFormData, customComingUpFor: e.target.value })}
                      className="p-2.5 bg-slate-950 border border-[#C9A227] rounded-xl text-slate-100"
                    />
                  )}
                </div>
              </div>

              {/* Court Orders Issued */}
              <div>
                <label className="block font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Gavel className="w-3.5 h-3.5 text-[#C9A227]" />
                  Court Orders Issued <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 1. Application dated 14/05/2026 is allowed as prayed. 2. Plaintiff given 14 days to file and serve amended plaint. 3. Costs in the cause."
                  value={corumFormData.orders}
                  onChange={e => setCorumFormData({ ...corumFormData, orders: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-slate-100 focus:border-[#C9A227]"
                />
              </div>

              {/* Advocate Remarks & Proceedings */}
              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center gap-1">
                  <ScrollText className="w-3.5 h-3.5 text-slate-400" />
                  Advocate Remarks & Proceedings Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Both counsel appeared before Hon. Magistrate. Argued preliminary objection on limitation of time. Court stood matter over to 2:30 PM for brief ruling."
                  value={corumFormData.remarks}
                  onChange={e => setCorumFormData({ ...corumFormData, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-[#C9A227]"
                />
              </div>

              {/* Office Action Required */}
              <div>
                <label className="block font-bold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Office Action Required (Law Firm Directive)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Extract formal court order before Friday; serve Defendant's Advocate with hearing notice and file Affidavit of Service."
                  value={corumFormData.officeAction}
                  onChange={e => setCorumFormData({ ...corumFormData, officeAction: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-100 focus:border-emerald-400"
                />
              </div>

              {/* Next Court Date & Case Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Next Court Date (If fixed)
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={corumFormData.nextCourtDate}
                    onChange={e => {
                      const sel = e.target.value;
                      if (sel && isWeekend(sel)) {
                        const valid = ensureWeekday(sel);
                        setCorumFormData({ ...corumFormData, nextCourtDate: valid });
                        setCorumValidationError(`Weekend next court date prohibited. Adjusted to (${valid}).`);
                      } else {
                        setCorumFormData({ ...corumFormData, nextCourtDate: sel });
                        setCorumValidationError(null);
                      }
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Next Purpose (Coming up for)
                  </label>
                  <select
                    value={corumFormData.nextComingUpFor}
                    onChange={e => setCorumFormData({ ...corumFormData, nextComingUpFor: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Mention">Mention</option>
                    <option value="Hearing">Hearing</option>
                    <option value="Ruling">Ruling</option>
                    <option value="Judgment">Judgment</option>
                    <option value="Pre-Trial Conference">Pre-Trial Conference</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Update File Status
                  </label>
                  <select
                    value={corumFormData.caseStatusAfter}
                    onChange={e => setCorumFormData({ ...corumFormData, caseStatusAfter: e.target.value as RegistryFile['currentStatus'] })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Court">Pending Court</option>
                    <option value="Out with Advocate">Out with Advocate</option>
                    <option value="Closed">Closed / Judgment</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordCorumModal(false);
                    setCorumTargetFile(null);
                  }}
                  className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#C9A227] text-slate-950 font-black rounded-lg hover:bg-amber-400 uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  Save CORUM Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

