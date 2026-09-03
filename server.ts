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

function isDemoFile(f: any): boolean {
  if (!f) return false;
  if (f.isDemo) return true;
  const id = String(f.id || '').trim();
  const num = String(f.internalFileNumber || '').trim().toUpperCase();
  const client = String(f.clientName || '').trim().toLowerCase();
  if (/^f-1[0-6]\d$/.test(id)) return true;
  if (id === 'f-1785344239668' || num === 'LFR/2026/0449') return true;
  if (/^LFR\/2026\/0(142|119|204|088|310|045|449)$/.test(num)) return true;
  if (/^NGA\/1[0-6]\d\/2026$/.test(num)) return true;
  const demoClients = [
    'apex hauliers kenya ltd', 'dr. beatrice wanjiru', 'bahari logistics ltd',
    'john kiprono', 'eldo farmers co-op union', 'rift valley flour mills ltd',
    'hezron kamau', 'safaricom plc', 'kenya commercial bank ltd', 'crown paints kenya ltd',
    'east african breweries plc', 'equity bank kenya ltd', 'bamburi cement plc',
    'naivas supermarkets ltd', 'kakuzi plc', 'unga group ltd', 'kenolkobil kenya ltd',
    'nation media group plc', 'centum investment co.', 'sameer africa plc',
    'kcb group ltd', 'kenya airways plc', 'car & general kenya ltd', 'express kenya ltd',
    'tps eastern africa ltd', 'totalenergies marketing kenya', 'mumias sugar company ltd',
    'eveready east africa plc', 'williamson tea kenya plc', 'kapchorua tea plc',
    'standard group plc', 'james mwangi maina', 'grace wanjiru njoroge',
    'estate of david ochieng odhiambo', 'faith chebet korir', 'samuel kamau ndegwa',
    'kenya power & lighting co. (kplc)', 'cooperative bank of kenya ltd',
    'kenya revenue authority (kra)', 'kengen plc', 'ncba bank kenya plc',
    'stanbic bank kenya ltd', 'kakamega county government', 'nakuru tea estates ltd',
    'hassan abdi mohammed', 'meru farmers co-operative union', 'patrick muturi kimani',
    'coast bus company ltd', 'beatrice achieng otieno', 'kericho tea packers ltd',
    'mount kenya bottlers ltd', 'machakos water & sanitation co.', 'diamond trust bank kenya',
    'family bank kenya ltd', 'josephat kiprop cheruiyot', 'agnes wambui kinyanjui',
    'estate of samuel omwamba nyamweya', 'garissa livestock farmers sacco',
    'trans nzoia produce board', 'emmanuel wafula simiyu', 'lucy nyambura mwangi'
  ];
  return demoClients.includes(client);
}

function savePersistedState() {
  ensureDataDir();
  try {
    const payload = {
      dbFirms,
      dbUsers,
      dbDeletedFirms,
      dbDeletedFiles,
      dbFiles,
      dbCourtSessions,
      dbTasks,
      dbClaims,
      dbCheques,
      dbCommissions,
      dbFileDocuments,
      dbMovements,
      dbCourtOutcomes,
      dbCorumEntries,
      dbBringUpItems
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing persistent data:', e);
  }
}

const savedData = loadPersistedState();

// In-memory data initialized from persistent store or defaults
let dbDeletedFirms: any[] = savedData?.dbDeletedFirms || [];
let dbDeletedFiles: any[] = savedData?.dbDeletedFiles || [];
let dbFirms: any[] = savedData?.dbFirms || [];

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

let dbFiles: any[] = (savedData?.dbFiles ?? []).filter((f: any) => !isDemoFile(f));
let dbCourtSessions: any[] = savedData?.dbCourtSessions ?? [];
let dbTasks: any[] = savedData?.dbTasks ?? [];
let dbClaims: any[] = savedData?.dbClaims ?? [];
let dbCheques: any[] = savedData?.dbCheques ?? [];
let dbCommissions: any[] = savedData?.dbCommissions ?? [];
let dbFileDocuments: any[] = savedData?.dbFileDocuments ?? [];
let dbMovements: any[] = savedData?.dbMovements ?? [];
let dbCourtOutcomes: any[] = savedData?.dbCourtOutcomes ?? [];
let dbCorumEntries: any[] = savedData?.dbCorumEntries ?? [];
let dbBringUpItems: any[] = savedData?.dbBringUpItems ?? [];

// Purge orphaned sessions/tasks that belong to demo files or non-existent files
const validFileIds = new Set(dbFiles.map(f => f.id));
const validFileNums = new Set(dbFiles.map(f => (f.internalFileNumber || '').toLowerCase().trim()));

dbCourtSessions = dbCourtSessions.filter(s => 
  (s.fileId && validFileIds.has(s.fileId)) ||
  (s.fileNumber && validFileNums.has(s.fileNumber.toLowerCase().trim()))
);
dbTasks = dbTasks.filter(t => 
  (!t.fileId || validFileIds.has(t.fileId)) &&
  (!t.fileNumber || validFileNums.has(t.fileNumber.toLowerCase().trim()))
);

// If there are zero registered files, enforce zero orphaned diary sessions, tasks, and claims
if (dbFiles.length === 0) {
  dbCourtSessions = [];
  dbTasks = [];
  dbClaims = [];
  dbCheques = [];
  dbCommissions = [];
}

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
app.delete("/api/deleted-firms/:id", (req, res) => {
  const { id } = req.params;
  const cleanId = (id || '').trim().toLowerCase();
  dbDeletedFirms = dbDeletedFirms.filter(d => {
    const dId = (d.id || '').trim().toLowerCase();
    const dCode = (d.firmCode || '').trim().toLowerCase();
    return dId !== cleanId && dCode !== cleanId;
  });
  savePersistedState();
  res.json({ success: true, unmaskedId: id });
});

app.get("/api/firms", (req, res) => res.json(dbFirms));
app.post("/api/firms", (req, res) => {
  const newFirm = { id: req.body.id || `firm-${Date.now()}`, ...req.body };
  const firmIdClean = (newFirm.id || '').trim().toLowerCase();
  const firmCodeClean = (newFirm.firmCode || '').trim().toLowerCase();

  // Unmark from deleted firms tombstone list when saving an active firm
  dbDeletedFirms = dbDeletedFirms.filter(d => {
    const dId = (d.id || '').trim().toLowerCase();
    const dCode = (d.firmCode || '').trim().toLowerCase();
    return (dId !== firmIdClean && dCode !== firmIdClean && dId !== firmCodeClean && dCode !== firmCodeClean);
  });

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

app.delete("/api/files/:id", (req, res) => {
  const targetId = String(req.params.id || '').trim();
  const initCount = dbFiles.length;
  const fileToDelete = dbFiles.find(f => f.id === targetId || f.internalFileNumber === targetId);
  const targetNum = fileToDelete?.internalFileNumber || '';

  dbFiles = dbFiles.filter(f => f.id !== targetId && f.internalFileNumber !== targetId && (!targetNum || f.internalFileNumber !== targetNum));
  dbCourtSessions = dbCourtSessions.filter(s => s.fileId !== targetId && s.fileNumber !== targetId && (!targetNum || s.fileNumber !== targetNum));
  dbTasks = dbTasks.filter(t => t.fileId !== targetId && t.fileNumber !== targetId && (!targetNum || t.fileNumber !== targetNum));
  dbClaims = dbClaims.filter(c => c.fileId !== targetId && c.fileNumber !== targetId && (!targetNum || c.fileNumber !== targetNum));
  dbFileDocuments = dbFileDocuments.filter(d => d.fileId !== targetId && d.fileNumber !== targetId && (!targetNum || d.fileNumber !== targetNum));
  dbMovements = dbMovements.filter(m => m.fileId !== targetId && m.fileNumber !== targetId && (!targetNum || m.fileNumber !== targetNum));
  dbCourtOutcomes = dbCourtOutcomes.filter(o => o.fileId !== targetId && o.fileNumber !== targetId && (!targetNum || o.fileNumber !== targetNum));
  dbCorumEntries = dbCorumEntries.filter(c => c.fileId !== targetId && c.fileNumber !== targetId && (!targetNum || c.fileNumber !== targetNum));
  dbBringUpItems = dbBringUpItems.filter(b => b.fileId !== targetId && b.fileNumber !== targetId && (!targetNum || b.fileNumber !== targetNum));

  // Record deleted tombstone so all devices sync the deletion
  if (targetId && !dbDeletedFiles.some(d => d.id === targetId || (targetNum && d.internalFileNumber === targetNum))) {
    dbDeletedFiles.push({ id: targetId, internalFileNumber: targetNum, deletedAt: new Date().toISOString() });
  }

  // If there are zero registered files left, enforce zero orphaned diary sessions and tasks
  if (dbFiles.length === 0) {
    dbCourtSessions = [];
    dbTasks = [];
    dbClaims = [];
    dbCheques = [];
    dbCommissions = [];
    dbFileDocuments = [];
  }

  savePersistedState();
  res.json({ success: true, removed: initCount - dbFiles.length, remaining: dbFiles.length });
});

app.post("/api/files/clean-demo", (req, res) => {
  const isDemo = (f: any) => {
    if (!f) return false;
    if (f.isDemo) return true;
    const id = String(f.id || '').trim();
    const num = String(f.internalFileNumber || '').trim().toUpperCase();
    const client = String(f.clientName || '').trim().toLowerCase();
    if (/^f-1[0-6]\d$/.test(id)) return true;
    if (id === 'f-1785344239668' || num === 'LFR/2026/0449') return true;
    if (/^LFR\/2026\/0(142|119|204|088|310|045|449)$/.test(num)) return true;
    if (/^NGA\/1[0-6]\d\/2026$/.test(num)) return true;
    const demoClients = [
      'apex hauliers kenya ltd', 'dr. beatrice wanjiru', 'bahari logistics ltd',
      'john kiprono', 'eldo farmers co-op union', 'rift valley flour mills ltd',
      'hezron kamau', 'safaricom plc', 'kenya commercial bank ltd', 'crown paints kenya ltd',
      'east african breweries plc', 'equity bank kenya ltd', 'bamburi cement plc',
      'naivas supermarkets ltd', 'kakuzi plc', 'unga group ltd', 'kenolkobil kenya ltd',
      'nation media group plc', 'centum investment co.', 'sameer africa plc',
      'kcb group ltd', 'kenya airways plc', 'car & general kenya ltd', 'express kenya ltd',
      'tps eastern africa ltd', 'totalenergies marketing kenya', 'mumias sugar company ltd',
      'eveready east africa plc', 'williamson tea kenya plc', 'kapchorua tea plc',
      'standard group plc', 'james mwangi maina', 'grace wanjiru njoroge',
      'estate of david ochieng odhiambo', 'faith chebet korir', 'samuel kamau ndegwa',
      'kenya power & lighting co. (kplc)', 'cooperative bank of kenya ltd',
      'kenya revenue authority (kra)', 'kengen plc', 'ncba bank kenya plc',
      'stanbic bank kenya ltd', 'kakamega county government', 'nakuru tea estates ltd',
      'hassan abdi mohammed', 'meru farmers co-operative union', 'patrick muturi kimani',
      'coast bus company ltd', 'beatrice achieng otieno', 'kericho tea packers ltd',
      'mount kenya bottlers ltd', 'machakos water & sanitation co.', 'diamond trust bank kenya',
      'family bank kenya ltd', 'josephat kiprop cheruiyot', 'agnes wambui kinyanjui',
      'estate of samuel omwamba nyamweya', 'garissa livestock farmers sacco',
      'trans nzoia produce board', 'emmanuel wafula simiyu', 'lucy nyambura mwangi'
    ];
    if (demoClients.includes(client)) return true;
    return false;
  };

  const beforeCount = dbFiles.length;
  const demoFiles = dbFiles.filter(isDemo);
  const demoIds = new Set(demoFiles.map(f => f.id));
  const demoNums = new Set(demoFiles.map(f => f.internalFileNumber));

  dbFiles = dbFiles.filter(f => !isDemo(f));
  dbCourtSessions = dbCourtSessions.filter(s => !demoIds.has(s.fileId) && !demoNums.has(s.fileNumber));
  dbClaims = dbClaims.filter(c => !demoIds.has(c.fileId) && !demoNums.has(c.fileNumber));
  dbCheques = dbCheques.filter(ch => !demoNums.has(ch.fileNumber));
  dbCommissions = dbCommissions.filter(co => !demoNums.has(co.fileNumber));

  savePersistedState();
  res.json({
    success: true,
    deletedCount: beforeCount - dbFiles.length,
    remainingCount: dbFiles.length
  });
});

app.post("/api/files/bulk", (req, res) => {
  const incoming = req.body.files;
  if (Array.isArray(incoming)) {
    incoming.forEach((file: any) => {
      const idx = dbFiles.findIndex(f => f.id === file.id || f.internalFileNumber === file.internalFileNumber);
      if (idx >= 0) {
        dbFiles[idx] = { ...dbFiles[idx], ...file };
      } else {
        dbFiles.unshift(file);
      }
    });
    savePersistedState();
  }
  res.json({ success: true, count: dbFiles.length });
});

app.post("/api/sync/all", (req, res) => {
  const { files, courtSessions, claims, cheques, commissions, users, firms } = req.body;
  if (Array.isArray(files)) {
    files.forEach((f: any) => {
      const idx = dbFiles.findIndex(x => x.id === f.id || x.internalFileNumber === f.internalFileNumber);
      if (idx >= 0) dbFiles[idx] = { ...dbFiles[idx], ...f };
      else dbFiles.unshift(f);
    });
  }
  if (Array.isArray(users)) {
    users.forEach((u: any) => {
      const idx = dbUsers.findIndex(x => x.id === u.id || (u.email && x.email?.toLowerCase() === u.email.toLowerCase()));
      if (idx >= 0) dbUsers[idx] = { ...dbUsers[idx], ...u };
      else dbUsers.push(u);
    });
  }
  if (Array.isArray(firms)) {
    firms.forEach((fm: any) => {
      const idx = dbFirms.findIndex(x => x.id === fm.id || (fm.firmCode && x.firmCode === fm.firmCode));
      if (idx >= 0) dbFirms[idx] = { ...dbFirms[idx], ...fm };
      else dbFirms.unshift(fm);
    });
  }
  if (Array.isArray(courtSessions)) {
    dbCourtSessions = courtSessions;
  }
  if (Array.isArray(claims)) {
    dbClaims = claims;
  }
  if (Array.isArray(cheques)) {
    dbCheques = cheques;
  }
  if (Array.isArray(commissions)) {
    dbCommissions = commissions;
  }
  savePersistedState();
  res.json({
    success: true,
    counts: {
      files: dbFiles.length,
      users: dbUsers.length,
      firms: dbFirms.length,
      courtSessions: dbCourtSessions.length
    }
  });
});

app.get("/api/court-sessions", (req, res) => res.json(dbCourtSessions));

app.post("/api/court-sessions", (req, res) => {
  const session = req.body;
  if (!session || !session.id) {
    return res.status(400).json({ success: false, message: "Session object with id is required." });
  }
  const idx = dbCourtSessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    dbCourtSessions[idx] = { ...dbCourtSessions[idx], ...session };
  } else {
    dbCourtSessions.unshift(session);
  }
  savePersistedState();
  res.json({ success: true, count: dbCourtSessions.length, session });
});

app.delete("/api/court-sessions/:id", (req, res) => {
  const targetId = req.params.id;
  const initial = dbCourtSessions.length;
  dbCourtSessions = dbCourtSessions.filter(s => s.id !== targetId);
  savePersistedState();
  res.json({ success: true, removed: initial - dbCourtSessions.length, count: dbCourtSessions.length });
});

app.post("/api/court-sessions/clean-all", (req, res) => {
  const count = dbCourtSessions.length;
  dbCourtSessions = [];
  savePersistedState();
  res.json({ success: true, removedCount: count, remainingCount: 0 });
});

app.get("/api/tasks", (req, res) => res.json(dbTasks));

app.post("/api/tasks", (req, res) => {
  const task = req.body;
  if (!task || !task.id) {
    return res.status(400).json({ success: false, message: "Task object with id is required." });
  }
  const idx = dbTasks.findIndex(t => t.id === task.id);
  if (idx >= 0) {
    dbTasks[idx] = { ...dbTasks[idx], ...task };
  } else {
    dbTasks.unshift(task);
  }
  savePersistedState();
  res.json({ success: true, count: dbTasks.length, task });
});

app.delete("/api/tasks/:id", (req, res) => {
  const targetId = req.params.id;
  const initial = dbTasks.length;
  dbTasks = dbTasks.filter(t => t.id !== targetId);
  savePersistedState();
  res.json({ success: true, removed: initial - dbTasks.length, count: dbTasks.length });
});

app.post("/api/tasks/clean-all", (req, res) => {
  const count = dbTasks.length;
  dbTasks = [];
  savePersistedState();
  res.json({ success: true, removedCount: count, remainingCount: 0 });
});

app.post("/api/diary-tasks/clean-all", (req, res) => {
  const sessionCount = dbCourtSessions.length;
  const taskCount = dbTasks.length;
  dbCourtSessions = [];
  dbTasks = [];
  savePersistedState();
  res.json({ success: true, removedSessions: sessionCount, removedTasks: taskCount, courtSessionsCount: 0, tasksCount: 0 });
});

app.get("/api/claims", (req, res) => res.json(dbClaims));
app.get("/api/cheques", (req, res) => res.json(dbCheques));
app.get("/api/commissions", (req, res) => res.json(dbCommissions));

// Deleted Files tombstones for cross-device synchronization
app.get("/api/deleted-files", (req, res) => res.json(dbDeletedFiles));
app.post("/api/deleted-files", (req, res) => {
  const { id, internalFileNumber } = req.body;
  const targetId = String(id || '').trim();
  const targetNum = String(internalFileNumber || '').trim();
  if (targetId && !dbDeletedFiles.some(d => d.id === targetId || (targetNum && d.internalFileNumber === targetNum))) {
    dbDeletedFiles.push({ id: targetId, internalFileNumber: targetNum, deletedAt: new Date().toISOString() });
    savePersistedState();
  }
  res.json({ success: true, count: dbDeletedFiles.length });
});
app.delete("/api/deleted-files/:id", (req, res) => {
  const targetId = String(req.params.id || '').trim();
  dbDeletedFiles = dbDeletedFiles.filter(d => d.id !== targetId && d.internalFileNumber !== targetId);
  savePersistedState();
  res.json({ success: true, count: dbDeletedFiles.length });
});

// File Documents (attachments) persistence
app.get("/api/file-documents", (req, res) => res.json(dbFileDocuments));
app.post("/api/file-documents", (req, res) => {
  const doc = req.body;
  if (!doc || !doc.id) {
    return res.status(400).json({ success: false, message: "Document with id is required." });
  }
  const idx = dbFileDocuments.findIndex(d => d.id === doc.id);
  if (idx >= 0) {
    dbFileDocuments[idx] = { ...dbFileDocuments[idx], ...doc };
  } else {
    dbFileDocuments.unshift(doc);
  }
  savePersistedState();
  res.status(201).json({ success: true, count: dbFileDocuments.length, doc });
});
app.delete("/api/file-documents/:id", (req, res) => {
  const targetId = req.params.id;
  const initCount = dbFileDocuments.length;
  dbFileDocuments = dbFileDocuments.filter(d => d.id !== targetId);
  savePersistedState();
  res.json({ success: true, removed: initCount - dbFileDocuments.length, count: dbFileDocuments.length });
});

// File Movements tracking
app.get("/api/movements", (req, res) => res.json(dbMovements));
app.post("/api/movements", (req, res) => {
  const m = req.body;
  if (m && m.id) {
    const idx = dbMovements.findIndex(item => item.id === m.id);
    if (idx >= 0) dbMovements[idx] = { ...dbMovements[idx], ...m };
    else dbMovements.unshift(m);
    savePersistedState();
  }
  res.json({ success: true, count: dbMovements.length });
});

// Court Outcomes
app.get("/api/court-outcomes", (req, res) => res.json(dbCourtOutcomes));
app.post("/api/court-outcomes", (req, res) => {
  const outcome = req.body;
  if (outcome && outcome.id) {
    const idx = dbCourtOutcomes.findIndex(item => item.id === outcome.id);
    if (idx >= 0) dbCourtOutcomes[idx] = { ...dbCourtOutcomes[idx], ...outcome };
    else dbCourtOutcomes.unshift(outcome);
    savePersistedState();
  }
  res.json({ success: true, count: dbCourtOutcomes.length });
});

// Corum Entries
app.get("/api/corum-entries", (req, res) => res.json(dbCorumEntries));
app.post("/api/corum-entries", (req, res) => {
  const entry = req.body;
  if (entry && entry.id) {
    const idx = dbCorumEntries.findIndex(item => item.id === entry.id);
    if (idx >= 0) dbCorumEntries[idx] = { ...dbCorumEntries[idx], ...entry };
    else dbCorumEntries.unshift(entry);
    savePersistedState();
  }
  res.json({ success: true, count: dbCorumEntries.length });
});

// Bring Up Items
app.get("/api/bring-up-items", (req, res) => res.json(dbBringUpItems));
app.post("/api/bring-up-items", (req, res) => {
  const item = req.body;
  if (item && item.id) {
    const idx = dbBringUpItems.findIndex(i => i.id === item.id);
    if (idx >= 0) dbBringUpItems[idx] = { ...dbBringUpItems[idx], ...item };
    else dbBringUpItems.unshift(item);
    savePersistedState();
  }
  res.json({ success: true, count: dbBringUpItems.length });
});
app.delete("/api/bring-up-items/:id", (req, res) => {
  const targetId = req.params.id;
  dbBringUpItems = dbBringUpItems.filter(i => i.id !== targetId);
  savePersistedState();
  res.json({ success: true, count: dbBringUpItems.length });
});

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
