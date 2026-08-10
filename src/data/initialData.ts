import {
  User,
  RegistryFile,
  FileMovement,
  CourtSession,
  CourtOutcome,
  BringUpItem,
  InsuranceClaim,
  PendingCheque,
  CommissionRecord,
  AuditLogEntry,
  SystemSettings,
  LawFirmProfile
} from '../types';

export const INITIAL_FIRMS: LawFirmProfile[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
  firmName: "Law Firm Registry",
  firmCode: "LFR-MAIN",
  firmRegistrationNumber: "LR/2026/001",
  cityOrBranch: "Nairobi HQ",
  tagline: "Physical File & Litigation Management System",
  address: "Legal Plaza, City Centre, Nairobi",
  phone: "+254 700 000000",
  email: "admin@lawfirmregistry.co.ke",
  sessionTimeoutMinutes: 30,
  requireTwoFactor: false,
  courtStations: [
    "Milimani Law Courts - Commercial Division",
    "Milimani Law Courts - Civil Division",
    "Mombasa Law Courts",
    "Kisumu Law Courts",
    "Nakuru Law Courts",
    "Eldoret Law Courts",
    "Nyeri High Court",
    "Machakos High Court"
  ],
  cabinets: [
    "Cabinet A - Commercial Division",
    "Cabinet B - Civil Division",
    "Cabinet C - Insurance Claims",
    "Cabinet D - Land & Conveyancing",
    "Cabinet E - Archive Vault"
  ],
  fileNumberPrefix: "FILE"
};

export const INITIAL_USERS: User[] = [
  {
    id: "3TVRWijWagVJBVfuTcFXCDqDzR02",
    firmId: "platform-owner",
    firmCode: "PLATFORM",
    firmName: "Law Firm Registry Platform",
    username: "superadmin",
    fullName: "Platform Owner",
    role: "Super Admin",
    email: "anthonyomollo07@gmail.com",
    phone: "+254 700 000000",
    password: "password123",
    status: "Active",
    lastLogin: "Today at 09:00 AM",
    permissions: ["all", "superadmin"]
  }
];

export const INITIAL_FILES: RegistryFile[] = [];
export const INITIAL_MOVEMENTS: FileMovement[] = [];
export const INITIAL_COURT_SESSIONS: CourtSession[] = [];
export const INITIAL_COURT_OUTCOMES: CourtOutcome[] = [];
export const INITIAL_BRING_UP_ITEMS: BringUpItem[] = [];
export const INITIAL_INSURANCE_CLAIMS: InsuranceClaim[] = [];
export const INITIAL_PENDING_CHEQUES: PendingCheque[] = [];
export const INITIAL_COMMISSIONS: CommissionRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
