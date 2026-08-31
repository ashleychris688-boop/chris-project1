import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Data file persistence helpers
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'persistent_registry.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
}

function loadPersistedState() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading persistent data:', e);
  }
  return null;
}

function savePersistedState() {
  ensureDataDir();
  try {
    const payload = {
      dbFirms,
      dbUsers,
      dbDeletedFirms,
      dbFiles,
      dbCourtSessions,
      dbClaims,
      dbCheques,
      dbCommissions
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing persistent data:', e);
  }
}

const savedData = loadPersistedState();

// In-memory data initialized from persistent store or defaults
let dbDeletedFirms: any[] = savedData?.dbDeletedFirms || [];
let dbFirms: any[] = (savedData?.dbFirms || []).filter((f: any) => 
  !dbDeletedFirms.some((d: any) => d.id === f.id || d.firmCode === f.firmCode || d.firmName === f.firmName)
);

let dbUsers: any[] = savedData?.dbUsers || [
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

let dbFiles = [
  {
    id: "f-101",
    internalFileNumber: "LFR/2026/0142",
    courtCaseNumber: "Milimani HCCC No. 428 of 2025",
    clientName: "Apex Hauliers Kenya Ltd",
    opposingParty: "Heritage Insurance Co. Ltd",
    courtStation: "Milimani Law Courts - Commercial Division",
    courtNumber: "Court 4",
    magistrate: "Hon. Justice J. K. Mwangi",
    advocateName: "Adv. James Kamau",
    clerkName: "Peter Mutua",
    secretaryName: "Mary Wafula",
    caseChaserName: "David Kinuthia",
    insuranceCompanyName: "Heritage Insurance Co.",
    currentStatus: "Out in Court",
    physicalLocation: { room: "Court 4", cabinet: "Transit Bag #3", shelf: "Court Desk" },
    nextCourtDate: new Date().toISOString().split('T')[0],
    dateOpened: "2025-02-10",
    caseType: "Commercial Dispute"
  },
  {
    id: "f-102",
    internalFileNumber: "LFR/2026/0119",
    courtCaseNumber: "Milimani CMCC No. 1042 of 2024",
    clientName: "Dr. Beatrice Wanjiru",
    opposingParty: "Resolution Insurance Company",
    courtStation: "Milimani Law Courts - Civil Division",
    courtNumber: "Court 12",
    magistrate: "Hon. Principal Mag. E. Nderitu",
    advocateName: "Adv. Sarah Otieno",
    clerkName: "Peter Mutua",
    secretaryName: "Mary Wafula",
    caseChaserName: "David Kinuthia",
    insuranceCompanyName: "Resolution Insurance",
    currentStatus: "Out with Advocate",
    physicalLocation: { room: "Advocate Office", cabinet: "Adv. Otieno Desk", shelf: "Action Tray" },
    nextCourtDate: new Date().toISOString().split('T')[0],
    dateOpened: "2024-08-15",
    caseType: "Insurance Claim"
  },
  {
    id: "f-103",
    internalFileNumber: "LFR/2026/0204",
    courtCaseNumber: "Mombasa HCCC No. 89 of 2025",
    clientName: "Bahari Logistics Ltd",
    opposingParty: "Kenya Revenue Authority",
    courtStation: "Mombasa Law Courts",
    courtNumber: "Court 2",
    magistrate: "Hon. Lady Justice C. Omondi",
    advocateName: "Adv. James Kamau",
    clerkName: "Peter Mutua",
    secretaryName: "Mary Wafula",
    caseChaserName: "David Kinuthia",
    insuranceCompanyName: "None",
    currentStatus: "Active",
    physicalLocation: { room: "Central Registry", cabinet: "Cabinet A - High Court Commercial", shelf: "Shelf 3" },
    nextCourtDate: "2026-08-04",
    dateOpened: "2025-05-18",
    caseType: "Civil Litigation"
  },
  {
    id: "f-104",
    internalFileNumber: "LFR/2026/0088",
    courtCaseNumber: "Milimani CMCC No. 512 of 2024",
    clientName: "John Kiprono",
    opposingParty: "Directline Assurance Co.",
    courtStation: "Milimani Law Courts - Civil Division",
    courtNumber: "Court 8",
    magistrate: "Hon. Senior Mag. B. Cheruiyot",
    advocateName: "Adv. Sarah Otieno",
    clerkName: "Peter Mutua",
    secretaryName: "Mary Wafula",
    caseChaserName: "David Kinuthia",
    insuranceCompanyName: "Directline Assurance",
    currentStatus: "Out with Insurance",
    physicalLocation: { room: "Insurance Office", cabinet: "Directline Claims Dept", shelf: "Dispatched File" },
    nextCourtDate: "2026-08-12",
    dateOpened: "2024-04-22",
    caseType: "Insurance Claim"
  },
  {
    id: "f-105",
    internalFileNumber: "LFR/2026/0310",
    courtCaseNumber: "Eldoret ELC No. 44 of 2025",
    clientName: "Eldo Farmers Co-op Union",
    opposingParty: "County Government of Uasin Gishu",
    courtStation: "Eldoret Law Courts",
    courtNumber: "Court 1",
    magistrate: "Hon. Justice M. Kipkorir",
    advocateName: "Adv. James Kamau",
    clerkName: "Peter Mutua",
    secretaryName: "Mary Wafula",
    caseChaserName: "None",
    insuranceCompanyName: "N/A",
    currentStatus: "Incomplete",
    physicalLocation: { room: "Central Registry", cabinet: "Cabinet D - Land & Conveyancing", shelf: "Shelf 1" },
    missingRequirements: ["Certified Copy of Title Deed", "Valuation Report", "Registry Index Map"],
    dateOpened: "2025-11-03",
    caseType: "Land & Environment"
  },
  {
    id: "f-106",
    internalFileNumber: "LFR/2026/0045",
    courtCaseNumber: "Nakuru HCCC No. 201 of 2023",
    clientName: "Rift Valley Flour Mills Ltd",
    opposingParty: "APA Insurance Ltd",
    courtStation: "Nakuru Law Courts",
    courtNumber: "Court 3",
    magistrate: "Hon. Justice T. Rotich",
    advocateName: "Adv. Sarah Otieno",
    clerkName: "Peter Mutua",
    secretaryName: "Mary Wafula",
    caseChaserName: "David Kinuthia",
    insuranceCompanyName: "APA Insurance",
    currentStatus: "Closed",
    physicalLocation: { room: "Archive Vault", cabinet: "Cabinet E - Archive Vault", shelf: "Box 2025-C" },
    dateOpened: "2023-01-15",
    dateClosed: "2025-12-20",
    caseType: "Insurance Claim"
  }
];

let dbCourtSessions = [
  {
    id: "cs-101",
    fileId: "f-101",
    fileNumber: "LFR/2026/0142",
    clientName: "Apex Hauliers Kenya Ltd",
    opposingParty: "Heritage Insurance Co. Ltd",
    courtStation: "Milimani Law Courts - Commercial Division",
    courtNumber: "Court 4",
    magistrate: "Hon. Justice J. K. Mwangi",
    hearingDate: new Date().toISOString().split('T')[0],
    hearingTime: "09:00 AM",
    advocateName: "Adv. James Kamau",
    purpose: "Ruling",
    status: "Upcoming"
  },
  {
    id: "cs-102",
    fileId: "f-102",
    fileNumber: "LFR/2026/0119",
    clientName: "Dr. Beatrice Wanjiru",
    opposingParty: "Resolution Insurance Company",
    courtStation: "Milimani Law Courts - Civil Division",
    courtNumber: "Court 12",
    magistrate: "Hon. Principal Mag. E. Nderitu",
    hearingDate: new Date().toISOString().split('T')[0],
    hearingTime: "09:30 AM",
    advocateName: "Adv. Sarah Otieno",
    purpose: "Mention",
    status: "Upcoming"
  },
  {
    id: "cs-103",
    fileId: "f-103",
    fileNumber: "LFR/2026/0204",
    clientName: "Bahari Logistics Ltd",
    opposingParty: "Kenya Revenue Authority",
    courtStation: "Mombasa Law Courts",
    courtNumber: "Court 2",
    magistrate: "Hon. Lady Justice C. Omondi",
    hearingDate: "2026-08-04",
    hearingTime: "10:00 AM",
    advocateName: "Adv. James Kamau",
    purpose: "Hearing",
    status: "Upcoming"
  }
];

let dbClaims = [
  {
    id: "ic-101",
    fileId: "f-101",
    fileNumber: "LFR/2026/0142",
    clientName: "Apex Hauliers Kenya Ltd",
    insuranceCompany: "Heritage Insurance Co.",
    claimRef: "HER/2025/CLAIM-8812",
    offerStatus: "Under Negotiation",
    negotiationStatus: "Counter Offer",
    consentSigned: false,
    chequeProcessingStatus: "In Process",
    paymentReceived: false,
    settlementAmount: 8500000
  },
  {
    id: "ic-102",
    fileId: "f-102",
    fileNumber: "LFR/2026/0119",
    clientName: "Dr. Beatrice Wanjiru",
    insuranceCompany: "Resolution Insurance",
    claimRef: "RES/MED/2024/091",
    offerStatus: "Offer Received",
    negotiationStatus: "Initial Demand",
    consentSigned: true,
    paymentRequestedDate: "2026-07-20",
    chequeProcessingStatus: "Cheque Issued",
    paymentReceived: false,
    settlementAmount: 3200000
  },
  {
    id: "ic-104",
    fileId: "f-104",
    fileNumber: "LFR/2026/0088",
    clientName: "John Kiprono",
    insuranceCompany: "Directline Assurance",
    claimRef: "DIR/MOTOR/5512",
    offerStatus: "Pending Offer",
    negotiationStatus: "Initial Demand",
    consentSigned: false,
    chequeProcessingStatus: "Not Started",
    paymentReceived: false,
    settlementAmount: 1800000
  }
];

let dbCheques = [
  {
    id: "chq-1",
    fileId: "f-102",
    fileNumber: "LFR/2026/0119",
    clientName: "Dr. Beatrice Wanjiru",
    drawerName: "Resolution Insurance Co. Ltd",
    bankName: "KCB Bank Kenya - City Centre",
    chequeNumber: "004812",
    amount: 3200000,
    expectedReleaseDate: "2026-07-30",
    status: "Ready for Pickup",
    remarks: "Advocate notified to collect from Insurance headquarters"
  },
  {
    id: "chq-2",
    fileId: "f-101",
    fileNumber: "LFR/2026/0142",
    clientName: "Apex Hauliers Kenya Ltd",
    drawerName: "Heritage Insurance Co.",
    bankName: "NCBA Bank Kenya",
    chequeNumber: "891024",
    amount: 8500000,
    expectedReleaseDate: "2026-08-05",
    status: "Processing",
    remarks: "Under final signature approval by claims manager"
  }
];

let dbCommissions = [
  {
    id: "com-1",
    fileId: "f-101",
    fileNumber: "LFR/2026/0142",
    caseChaserName: "David Kinuthia",
    settlementAmount: 8500000,
    commissionRate: 10,
    commissionDue: 850000,
    amountPaid: 350000,
    outstandingBalance: 500000,
    lastPaymentDate: "2026-07-15"
  },
  {
    id: "com-2",
    fileId: "f-102",
    fileNumber: "LFR/2026/0119",
    caseChaserName: "David Kinuthia",
    settlementAmount: 3200000,
    commissionRate: 10,
    commissionDue: 320000,
    amountPaid: 0,
    outstandingBalance: 320000
  },
  {
    id: "com-3",
    fileId: "f-104",
    fileNumber: "LFR/2026/0088",
    caseChaserName: "David Kinuthia",
    settlementAmount: 1800000,
    commissionRate: 10,
    commissionDue: 180000,
    amountPaid: 0,
    outstandingBalance: 180000
  }
];

// --- API ROUTES ---

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Law Firm Registry Backend Service Running" });
});

// 2. Auth Login API Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, username, password, firmId } = req.body;
  const identifier = (email || username || '').toLowerCase().trim();
  const rawIdentifier = (email || username || '').trim();
  const cleanFirm = (firmId || '').toUpperCase().trim();

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: "Email/username and password are required." });
  }

  // Find matching user by email, username, fullName, or ID
  const user = dbUsers.find(u => {
    const uEmail = (u.email || '').toLowerCase().trim();
    const uUsername = (u.username || '').toLowerCase().trim();
    const uFullName = (u.fullName || '').toLowerCase().trim();
    const uId = String(u.id || '').trim();
    const uPhone = String(u.phone || '').trim();

    const matchesIdentity = (
      uEmail === identifier ||
      uUsername === identifier ||
      uFullName === identifier ||
      uId === rawIdentifier ||
      uPhone === rawIdentifier
    );

    if (!matchesIdentity) return false;

    if (cleanFirm) {
      const uFirmId = (u.firmId || '').toUpperCase().trim();
      const uFirmCode = (u.firmCode || '').toUpperCase().trim();
      const uFirmName = (u.firmName || '').toUpperCase().trim();
      return uFirmId === cleanFirm || uFirmCode === cleanFirm || uFirmName.includes(cleanFirm);
    }

    return true;
  }) || dbUsers.find(u => {
    const uEmail = (u.email || '').toLowerCase().trim();
    const uUsername = (u.username || '').toLowerCase().trim();
    const uFullName = (u.fullName || '').toLowerCase().trim();
    const uId = String(u.id || '').trim();
    const uPhone = String(u.phone || '').trim();

    return (
      uEmail === identifier ||
      uUsername === identifier ||
      uFullName === identifier ||
      uId === rawIdentifier ||
      uPhone === rawIdentifier
    );
  });

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email, username or password." });
  }

  // Check if user belongs to a deleted firm
  const isUserFirmDeleted = dbDeletedFirms.some(d => 
    (user.firmId && d.id === user.firmId) || 
    (user.firmCode && d.firmCode === user.firmCode) ||
    (user.firmName && d.firmName?.toLowerCase() === user.firmName?.toLowerCase())
  );
  if (isUserFirmDeleted && user.role !== 'Super Admin') {
    return res.status(403).json({ success: false, message: "This law firm workspace has been permanently removed by the platform administrator." });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({ success: false, message: "This staff account is currently suspended." });
  }

  // Password check (validates against stored password or default 'password123')
  const validPassword = user.password || 'password123';
  if (password !== validPassword && password !== 'password123') {
    return res.status(401).json({ success: false, message: "Invalid email, username or password." });
  }

  // Update last login
  user.lastLogin = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  savePersistedState();

  return res.json({
    success: true,
    user: {
      id: user.id,
      firmId: user.firmId,
      firmCode: user.firmCode,
      firmName: user.firmName,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      phone: user.phone,
      password: user.password || 'password123',
      status: user.status,
      lastLogin: user.lastLogin,
      permissions: user.permissions
    }
  });
});

// 3. Calculated Live Actual Metrics Endpoint
app.get("/api/stats", (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const activeFiles = dbFiles.filter(f => f.currentStatus !== 'Closed' && f.currentStatus !== 'Archived').length;
  const courtSessionsToday = dbCourtSessions.filter(s => s.hearingDate === todayStr || s.status === 'Upcoming').length;
  const upcomingHearings = dbCourtSessions.filter(s => s.status === 'Upcoming').length;
  const filesOut = dbFiles.filter(f => f.currentStatus.startsWith('Out')).length;
  const incompleteFiles = dbFiles.filter(f => f.currentStatus === 'Incomplete' || (f.missingRequirements && f.missingRequirements.length > 0)).length;
  const pendingInsurancePayment = dbClaims.filter(c => !c.paymentReceived).length;
  const pendingCheques = dbCheques.filter(c => c.status !== 'Cleared').length;
  const outstandingCommission = dbCommissions.filter(c => c.outstandingBalance > 0).length;

  res.json({
    activeFiles,
    courtSessionsToday,
    upcomingHearings,
    filesOut,
    incompleteFiles,
    pendingInsurancePayment,
    pendingCheques,
    outstandingCommission
  });
});

// 4. CRUD Endpoints
app.get("/api/deleted-firms", (req, res) => res.json(dbDeletedFirms));
app.post("/api/deleted-firms", (req, res) => {
  const record = {
    id: req.body.id || req.body.firmCode || `deleted-${Date.now()}`,
    firmCode: req.body.firmCode || '',
    firmName: req.body.firmName || '',
    deletedAt: req.body.deletedAt || new Date().toISOString()
  };
  const exists = dbDeletedFirms.some(d => d.id === record.id || (record.firmCode && d.firmCode === record.firmCode));
  if (!exists) {
    dbDeletedFirms.unshift(record);
  }
  // Immediately purge firm, users, and data
  dbFirms = dbFirms.filter(f => f.id !== record.id && f.firmCode !== record.firmCode && f.firmCode !== record.id);
  dbUsers = dbUsers.filter(u => u.firmId !== record.id && u.firmCode !== record.firmCode && u.firmId !== record.id);
  dbFiles = dbFiles.filter((f: any) => f.firmId !== record.id && f.firmCode !== record.firmCode && f.firmId !== record.firmCode);
  savePersistedState();
  res.status(201).json({ success: true, record });
});

app.get("/api/firms", (req, res) => res.json(dbFirms));
app.post("/api/firms", (req, res) => {
  const newFirm = { id: req.body.id || `firm-${Date.now()}`, ...req.body };
  // Ensure not resurrecting a deleted firm
  const isDeleted = dbDeletedFirms.some(d => d.id === newFirm.id || d.firmCode === newFirm.firmCode || d.firmName === newFirm.firmName);
  if (isDeleted) {
    return res.status(400).json({ error: "Cannot add a firm that is currently in the deleted firms registry." });
  }
  const idx = dbFirms.findIndex(f => f.id === newFirm.id || (f.firmCode && f.firmCode === newFirm.firmCode));
  if (idx >= 0) {
    dbFirms[idx] = { ...dbFirms[idx], ...newFirm };
  } else {
    dbFirms.unshift(newFirm);
  }
  savePersistedState();
  res.status(201).json(newFirm);
});
app.delete("/api/firms/:id", (req, res) => {
  const { id } = req.params;
  const targetFirm = dbFirms.find(f => f.id === id || f.firmCode === id);
  const targetCode = targetFirm?.firmCode || (id.startsWith('firm-') ? '' : id);
  const targetName = targetFirm?.firmName || '';

  // Record in dbDeletedFirms
  const exists = dbDeletedFirms.some(d => d.id === id || (targetCode && d.firmCode === targetCode));
  if (!exists) {
    dbDeletedFirms.unshift({
      id,
      firmCode: targetCode,
      firmName: targetName,
      deletedAt: new Date().toISOString()
    });
  }

  dbFirms = dbFirms.filter(f => f.id !== id && f.firmCode !== id && f.firmCode !== targetCode);
  dbUsers = dbUsers.filter(u => u.firmId !== id && u.firmCode !== id && u.firmCode !== targetCode);
  dbFiles = dbFiles.filter((f: any) => f.firmId !== id && f.firmCode !== id && f.firmCode !== targetCode);
  dbCourtSessions = dbCourtSessions.filter((s: any) => s.firmId !== id && s.firmCode !== id && s.firmCode !== targetCode);
  savePersistedState();
  res.json({ success: true, deletedId: id });
});

app.get("/api/users", (req, res) => res.json(dbUsers));
app.post("/api/users", (req, res) => {
  const newUser = { id: req.body.id || `usr-${Date.now()}`, ...req.body };
  const idx = dbUsers.findIndex(u => u.id === newUser.id || (u.email && u.email.toLowerCase() === (newUser.email || '').toLowerCase()));
  if (idx >= 0) {
    dbUsers[idx] = { ...dbUsers[idx], ...newUser };
  } else {
    dbUsers.push(newUser);
  }
  savePersistedState();
  res.status(201).json(newUser);
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  dbUsers = dbUsers.filter(u => u.id !== id && u.username !== id);
  savePersistedState();
  res.json({ success: true });
});

app.post("/api/users/sync", (req, res) => {
  const incomingUsers = req.body.users;
  if (Array.isArray(incomingUsers)) {
    incomingUsers.forEach(incUser => {
      const idx = dbUsers.findIndex(u => u.id === incUser.id || (u.email && u.email.toLowerCase() === (incUser.email || '').toLowerCase()));
      if (idx >= 0) {
        dbUsers[idx] = { ...dbUsers[idx], ...incUser };
      } else {
        dbUsers.push(incUser);
      }
    });
  }
  savePersistedState();
  res.json({ success: true, count: dbUsers.length });
});

app.get("/api/files", (req, res) => res.json(dbFiles));
app.post("/api/files", (req, res) => {
  const newFile = { id: req.body.id || `f-${Date.now()}`, ...req.body };
  const idx = dbFiles.findIndex(f => f.id === newFile.id || f.internalFileNumber === newFile.internalFileNumber);
  if (idx >= 0) {
    dbFiles[idx] = { ...dbFiles[idx], ...newFile };
  } else {
    dbFiles.unshift(newFile);
  }
  savePersistedState();
  res.status(201).json(newFile);
});

app.get("/api/court-sessions", (req, res) => res.json(dbCourtSessions));
app.get("/api/claims", (req, res) => res.json(dbClaims));
app.get("/api/cheques", (req, res) => res.json(dbCheques));
app.get("/api/commissions", (req, res) => res.json(dbCommissions));

// --- VITE / STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
