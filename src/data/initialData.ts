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
  },
  {
    id: "usr-1",
    firmId: "firm-1",
    firmCode: "OM-ADV-001",
    firmName: "Omollo & Associates Advocates",
    username: "proprietor",
    fullName: "Adv. Harrison Vance (Proprietor)",
    role: "Proprietor",
    email: "admin@omolloadvocates.co.ke",
    phone: "+254 722 000111",
    password: "password123",
    status: "Active",
    lastLogin: "Today at 08:15 AM",
    permissions: ["all"]
  },
  {
    id: "usr-2",
    firmId: "firm-1",
    firmCode: "OM-ADV-001",
    firmName: "Omollo & Associates Advocates",
    username: "adv.kamau",
    fullName: "Adv. James Kamau",
    role: "Advocate",
    email: "kamau@omolloadvocates.co.ke",
    phone: "+254 722 222333",
    password: "password123",
    status: "Active",
    lastLogin: "Today at 08:42 AM",
    permissions: ["registry_read", "court_write", "file_movement"]
  },
  {
    id: "usr-3",
    firmId: "firm-1",
    firmCode: "OM-ADV-001",
    firmName: "Omollo & Associates Advocates",
    username: "adv.otieno",
    fullName: "Adv. Sarah Otieno",
    role: "Advocate",
    email: "otieno@lawfirm.co.ke",
    phone: "+254 733 444555",
    password: "password123",
    status: "Active",
    lastLogin: "Yesterday at 04:30 PM",
    permissions: ["registry_read", "court_write", "file_movement"]
  },
  {
    id: "usr-4",
    firmId: "firm-1",
    firmCode: "OM-ADV-001",
    firmName: "Omollo & Associates Advocates",
    username: "sec.wafula",
    fullName: "Mary Wafula",
    role: "Secretary",
    email: "wafula@lawfirm.co.ke",
    phone: "+254 711 555666",
    password: "password123",
    status: "Active",
    lastLogin: "Today at 08:00 AM",
    permissions: ["registry_write", "court_read"]
  },
  {
    id: "usr-5",
    firmId: "firm-1",
    firmCode: "OM-ADV-001",
    firmName: "Omollo & Associates Advocates",
    username: "clerk.mutua",
    fullName: "Peter Mutua",
    role: "Clerk",
    email: "mutua@lawfirm.co.ke",
    phone: "+254 788 777888",
    password: "password123",
    status: "Active",
    lastLogin: "Today at 07:45 AM",
    permissions: ["file_movement", "bringup_manage"]
  },
  {
    id: "usr-6",
    firmId: "firm-1",
    firmCode: "OM-ADV-001",
    firmName: "Omollo & Associates Advocates",
    username: "chaser.kinuthia",
    fullName: "David Kinuthia",
    role: "Case Chaser",
    email: "kinuthia@chasers.co.ke",
    phone: "+254 799 112233",
    password: "password123",
    status: "Active",
    lastLogin: "2 days ago",
    permissions: ["chaser_portal"]
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
