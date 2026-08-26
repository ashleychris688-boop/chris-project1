export type UserRole = 'Proprietor' | 'Advocate' | 'Secretary' | 'Clerk' | 'Case Chaser' | 'Admin' | 'Super Admin' | 'Client';

export interface User {
  id: string;
  firmId?: string;
  firmCode?: string;
  firmName?: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone: string;
  physicalAddress?: string;
  county?: string;
  country?: string;
  password?: string;
  status: 'Active' | 'Suspended';
  lastLogin: string;
  permissions?: string[];
}

export type FileStatus = 
  | 'Active' 
  | 'Pending Court' 
  | 'Out with Advocate' 
  | 'Out in Court' 
  | 'Out with Insurance' 
  | 'Closed' 
  | 'Archived' 
  | 'Incomplete'
  | 'Preliminary Intake';

export interface PhysicalLocation {
  room: string;
  cabinet: string;
  shelf: string;
  detail?: string;
}

export interface FileMovement {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  date: string;
  time: string;
  fromLocation: string;
  toLocation: string;
  user: string;
  reason: string;
}

export type ClientType =
  | 'Individual'
  | 'Company'
  | 'Government Agency'
  | 'Non-Governmental Organisation (NGO)'
  | 'Partnership'
  | 'Sole Proprietorship'
  | 'Sacco'
  | 'Cooperative Society'
  | 'Trust'
  | 'Estate'
  | 'School/University'
  | 'Religious Organisation';

export type PartyCapacity =
  | 'Plaintiff'
  | 'Defendant'
  | 'Claimant'
  | 'Respondent'
  | 'Applicant'
  | 'Petitioner'
  | 'Complainant'
  | 'Accused'
  | 'Witness'
  | 'Insured'
  | 'Insurer'
  | 'Beneficiary'
  | 'Administrator'
  | 'Executor'
  | 'Objector'
  | 'Appellant'
  | 'Interested Party'
  | 'Decree Holder'
  | 'Judgment Debtor'
  | 'Guardian'
  | 'Legal Representative';

export interface RegistryFile {
  id: string;
  firmCode?: string;
  internalFileNumber: string; // e.g. LFR/2026/0142
  courtCaseNumber: string;    // e.g. Milimani HCCC No. 428 of 2025
  clientName: string;
  clientType?: ClientType;
  partyCapacity?: PartyCapacity;
  opposingParty: string;
  courtStation: string;       // e.g. Milimani Law Courts, Mombasa Law Courts
  courtNumber: string;        // e.g. Court 4, Court 12
  magistrate: string;         // e.g. Hon. J. K. Mwangi
  advocateId?: string;
  advocateName: string;
  clerkName: string;
  secretaryName: string;
  caseChaserName: string;
  insuranceCompanyName: string;
  currentStatus: FileStatus;
  physicalLocation: PhysicalLocation;
  nextCourtDate?: string;
  dateOpened: string;
  dateClosed?: string;
  missingRequirements?: string[];
  notes?: string;
  caseCategory?: string;
  caseType?: string;
  subCaseType?: string;
}

export interface CourtSession {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  clientName: string;
  opposingParty: string;
  courtStation: string;
  courtNumber: string;
  magistrate: string;
  hearingDate: string;
  hearingTime: string;
  advocateId?: string;
  advocateName: string;
  purpose: 'Mention' | 'Hearing' | 'Ruling' | 'Judgment' | 'Notice of Motion' | 'Pre-Trial Conference';
  status: 'Upcoming' | 'Completed' | 'Adjourned';
}

export interface CourtOutcome {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  sessionId?: string;
  appearanceDate: string;
  outcomeDetails: string;
  ordersIssued: string;
  nextHearingDate?: string;
  advocatePresent: string;
  remarks: string;
  caseStatusAfter: FileStatus;
}

export interface BringUpItem {
  id: string;
  firmCode?: string;
  courtStation: string;
  courtNumber: string;
  hearingDate: string;
  caseType: string;
  fileNumber: string;
  clientName: string;
  opposingParty: string;
  advocateName: string;
  currentLocation: string;
  retrieved: boolean;
  retrievedBy?: string;
  retrievedAt?: string;
}

export interface InsuranceClaim {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  clientName: string;
  insuranceCompany: string;
  claimRef: string;
  offerStatus: 'Pending Offer' | 'Offer Received' | 'Under Negotiation' | 'Accepted' | 'Rejected';
  negotiationStatus: 'Initial Demand' | 'Counter Offer' | 'Final Terms Agreed';
  consentSigned: boolean;
  paymentRequestedDate?: string;
  chequeProcessingStatus: 'Not Started' | 'In Process' | 'Cheque Issued' | 'Cheque Dispatched';
  paymentReceived: boolean;
  settlementAmount: number;
}

export interface PendingCheque {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  clientName: string;
  drawerName: string;
  bankName: string;
  chequeNumber: string;
  amount: number;
  expectedReleaseDate: string;
  status: 'Processing' | 'Ready for Pickup' | 'Cleared' | 'Bounced';
  remarks?: string;
}

export interface CommissionRecord {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  caseChaserName: string;
  settlementAmount: number;
  commissionRate: number; // e.g. 10%
  commissionDue: number;
  amountPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  category: 'Registry' | 'Movement' | 'Court' | 'Insurance' | 'Commission' | 'User' | 'Settings' | 'Auth' | 'SuperAdmin';
  details: string;
  ipAddress?: string;
}

export interface LawFirmProfile {
  id: string; // e.g. "LFR000245" or "firm-1"
  firmName: string;
  firmCode: string; // e.g., "OM-ADV-001"
  firmInitials?: string; // e.g. "NTA" or "HVA"
  fileNumberPrefix?: string; // synonym / fallback for firmInitials
  fileNumberFormatPattern?: string; // e.g. '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}'
  fileNumberPadding?: number; // 2, 3, or 4
  fileNumberDelimiter?: string; // '/' or '-'
  includeCaseTypeInFileNumber?: boolean;
  preliminaryStartingNumber?: number; // e.g. 1 or 8
  preliminaryNextNumber?: number; // current sequence number in year
  preliminaryYear?: number; // current year e.g. 2026 (resets annually)
  annualSequenceReset?: boolean;
  registrationNumber?: string;
  proprietorName?: string;
  cityOrBranch?: string;
  physicalAddress?: string;
  country?: string;
  county?: string;
  adminUsername?: string;
  email: string;
  phone: string;
  createdAt: string;
  status: 'Active' | 'Pending Verification' | 'Suspended';
  subscriptionTier?: 'Starter' | 'Professional' | 'Enterprise';
  subscriptionStatus?: 'Active' | 'Trial' | 'Past Due' | 'Cancelled';
  activeUsersCount?: number;
  activeCasesCount?: number;
  totalFilesCount?: number;
  monthlyFeeKsh?: number;
}

export interface SystemSettings {
  firmName: string;
  firmCode?: string;
  firmInitials?: string;
  firmRegistrationNumber?: string;
  cityOrBranch?: string;
  firmLogoUrl?: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  sessionTimeoutMinutes: number;
  requireTwoFactor: boolean;
  courtStations: string[];
  cabinets: string[];
  fileNumberPrefix?: string;
  fileNumberFormatPattern?: string; // e.g. '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}'
  fileNumberPadding?: number; // 2 for '08', 3 for '008', 4 for '0008', 0 for '8'
  fileNumberDelimiter?: string; // '/' or '-' or '.'
  includeCaseTypeInFileNumber?: boolean;
  preliminaryStartingNumber?: number; // e.g. 1 or 8
  preliminaryNextNumber?: number; // active sequence counter
  preliminaryYear?: number; // active sequence year
  annualSequenceReset?: boolean;
}

export interface CaseChaserProfile {
  id: string;
  firmCode?: string;
  chaserId: string; // e.g. "CC-001"
  userId?: string;
  fullName: string;
  idPassportNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  altPhoneNumber?: string;
  employmentStatus: 'Active' | 'Suspended' | 'Inactive';
  
  // System Account
  username: string;
  role: 'Case Chaser';
  lastLogin: string;
  accountStatus: 'Active' | 'Locked' | 'Disabled';
  passwordLastChanged: string;
  twoFactorEnabled: boolean;
  
  // Commission Info
  commissionType: string; // e.g. "10% per settled file"
  totalCases: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  outstandingCommission: number;
  lastCommissionPaymentDate?: string;
  
  // Performance Statistics
  activeFiles: number;
  closedFiles: number;
  incompleteFiles: number;
  pendingFollowUps: number;
  avgCompletionDays: number;
  casesSettled: number;
}

export interface ChaserFollowUpLog {
  id: string;
  firmCode?: string;
  fileId: string;
  fileNumber: string;
  clientName?: string;
  chaserId: string;
  chaserName: string;
  date: string;
  contactMethod: 'Phone Call' | 'Office Visit' | 'WhatsApp' | 'SMS' | 'Email' | 'Field Visit';
  outcome: string;
  nextAction: string;
  recordedBy: string;
}

export interface ChaserFileResponsibility {
  fileId: string;
  firmCode?: string;
  fileNumber: string;
  clientContacted: boolean;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  missingChecklist: Record<string, boolean>;
  customMissingItems?: string[];
  followUpRemarks?: string;
  clientResponsive: boolean;
  readyForAdvocateReview: boolean;
  readyForDoctorReview: boolean;
  updatedAt: string;
  updatedBy: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Awaiting Verification' | 'Completed' | 'Cancelled' | 'Overdue';
export type TaskCategory = 
  | 'Court'
  | 'Registry'
  | 'Client'
  | 'Insurance'
  | 'Financial'
  | 'Administrative'
  | 'Follow-Up'
  | 'Legal'
  | 'Other';

export interface TaskItem {
  id: string; // e.g. TSK-2026-001
  firmCode?: string;
  fileId?: string;
  fileNumber?: string; // Related File Number
  clientName?: string;
  courtCaseNumber?: string;
  courtStation?: string;
  opposingParty?: string;
  fileStatus?: string;
  taskCategory: TaskCategory;
  taskTitle: string;
  description?: string;
  assignedBy: string;
  assignedByRole: UserRole;
  assignedTo: string; // User Name or ID
  assignedToRole: UserRole;
  assignedToChaserId?: string; // For backward compatibility
  assignedToChaserName?: string; // For backward compatibility
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  status: TaskStatus;
  dateAssigned: string;
  dateCompleted?: string;
  completionNotes?: string;
  verificationStatus?: 'Unverified' | 'Verified' | 'Rejected';
  verifiedBy?: string;
  verifiedDate?: string;
  verificationNotes?: string;
  isRecurring?: boolean;
  recurringInterval?: 'Weekly' | 'Monthly' | 'Routine' | 'Daily';
  createdDate?: string;
}

export type ChaserTask = TaskItem;

export interface TaskTitlePreset {
  category: string;
  title: string;
  defaultRole: string;
}

export type UnprocessedStatus = 'Pending Review' | 'Approved' | 'Rejected' | 'Converted to Registry';

export interface UnprocessedClientRecord {
  id: string;
  firmCode?: string;
  preliminaryRefNumber?: string; // e.g. "NTA/SUCC/08/2026"
  // Basic Client Information
  clientFullName: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  nationalIdNumber?: string;
  countyTown: string;
  referralSource?: string;

  // Matter Information
  caseType: string;
  briefDescription: string;
  dateMatterReceived: string;
  accidentDate?: string;
  courtStation?: string;
  insuranceCompany?: string;

  // Assignment
  chaserId: string;
  caseChaserName: string;
  dateCaptured: string;
  timeCaptured: string;

  // Status & Notes
  status: UnprocessedStatus;
  notes?: string;
  documentsChecklist?: Record<string, boolean>;

  // Audit & Review Tracking
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdFileNumber?: string;
}

export interface UrgentAlert {
  id: string;
  firmCode?: string;
  fileNumber: string;
  time: string;
  purpose: string;
  date: string;
  createdAt?: string;
  acknowledgedBy?: string[];
  dismissed?: boolean;
}


