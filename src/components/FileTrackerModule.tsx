import React, { useState, useMemo } from 'react';
import { 
  RegistryFile, 
  FileMovement, 
  User 
} from '../types';
import { 
  PackageSearch, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Search, 
  Plus, 
  Filter, 
  UserCheck, 
  Building, 
  FileText, 
  History,
  X,
  CheckCircle2,
  Landmark,
  FolderArchive,
  User as UserIcon,
  ShieldCheck,
  Scale,
  Briefcase,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface FileTrackerModuleProps {
  files: RegistryFile[];
  movements: FileMovement[];
  currentUser: User | null;
  onRecordMovement: (
    movement: FileMovement, 
    updatedLocation: { room: string; cabinet: string; shelf: string; detail?: string }, 
    newStatus?: RegistryFile['currentStatus']
  ) => void;
  selectedFileToMove?: RegistryFile | null;
  onClearSelectedFileToMove?: () => void;
}

export type PhysicalLocationCategory = 
  | 'Central Registry' 
  | "Clerk's Desk" 
  | "Secretary's Desk" 
  | "Advocate's Desk" 
  | "Proprietor's Desk";

export function getFileLocationCategory(file: RegistryFile): PhysicalLocationCategory {
  const room = (file.physicalLocation?.room || '').toLowerCase();
  const cab = (file.physicalLocation?.cabinet || '').toLowerCase();
  const loc = `${room} ${cab}`;

  if (loc.includes('proprietor')) return "Proprietor's Desk";
  if (loc.includes('secretary')) return "Secretary's Desk";
  if (loc.includes('clerk')) return "Clerk's Desk";
  if (loc.includes('advocate')) return "Advocate's Desk";
  return 'Central Registry';
}

export const FileTrackerModule: React.FC<FileTrackerModuleProps> = ({
  files,
  movements,
  currentUser,
  onRecordMovement,
  selectedFileToMove,
  onClearSelectedFileToMove
}) => {
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  // Court Station Filter
  const [selectedCourtStation, setSelectedCourtStation] = useState<string>('ALL');

  // Location Category Filter
  const [selectedLocationCategory, setSelectedLocationCategory] = useState<string>('ALL');

  // Modal State
  const [showMoveModal, setShowMoveModal] = useState(!!selectedFileToMove);
  const [activeFile, setActiveFile] = useState<RegistryFile | null>(selectedFileToMove || files[0] || null);

  // Form state for movement transfer
  const [targetFileId, setTargetFileId] = useState<string>(selectedFileToMove?.id || files[0]?.id || '');
  const [toRoom, setToRoom] = useState<PhysicalLocationCategory>("Clerk's Desk");
  const [toCabinet, setToCabinet] = useState('Clerk Workstation #1');
  const [toShelf, setToShelf] = useState('Action Tray');
  const [reason, setReason] = useState('Pending review and preparation of court documents');
  const [newStatus, setNewStatus] = useState<RegistryFile['currentStatus']>('Active');

  React.useEffect(() => {
    if (selectedFileToMove) {
      setActiveFile(selectedFileToMove);
      setTargetFileId(selectedFileToMove.id);
      setShowMoveModal(true);
    }
  }, [selectedFileToMove]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearchTerm('');
  };

  const handleSelectTargetFile = (fileId: string) => {
    setTargetFileId(fileId);
    const found = files.find(f => f.id === fileId);
    if (found) {
      setActiveFile(found);
    }
  };

  const openTransferModalForFile = (file: RegistryFile) => {
    setActiveFile(file);
    setTargetFileId(file.id);
    setShowMoveModal(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const currentFile = files.find(f => f.id === targetFileId) || activeFile;
    if (!currentFile) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const fromLocStr = `${currentFile.physicalLocation.room} (${currentFile.physicalLocation.cabinet})`;
    const toLocStr = `${toRoom} (${toCabinet}${toShelf ? `, ${toShelf}` : ''})`;

    const newMovement: FileMovement = {
      id: `mov-${Date.now()}`,
      fileId: currentFile.id,
      fileNumber: currentFile.internalFileNumber,
      date: dateStr,
      time: timeStr,
      fromLocation: fromLocStr,
      toLocation: toLocStr,
      user: currentUser ? `${currentUser.fullName} (${currentUser.role})` : 'Registry Clerk',
      reason
    };

    const newLocation = {
      room: toRoom,
      cabinet: toCabinet,
      shelf: toShelf,
      detail: reason
    };

    onRecordMovement(newMovement, newLocation, newStatus);
    setShowMoveModal(false);
    if (onClearSelectedFileToMove) onClearSelectedFileToMove();
  };

  // Calculate Unique Court Stations
  const availableCourtStations = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.courtStation) set.add(f.courtStation);
    });
    return Array.from(set).sort();
  }, [files]);

  // Counts by Physical Location Category
  const locationCounts = useMemo(() => {
    const counts: Record<PhysicalLocationCategory, number> = {
      'Central Registry': 0,
      "Clerk's Desk": 0,
      "Secretary's Desk": 0,
      "Advocate's Desk": 0,
      "Proprietor's Desk": 0
    };

    files.forEach(f => {
      const cat = getFileLocationCategory(f);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return counts;
  }, [files]);

  // Filtered files arranged by court station
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      // Location category filter
      if (selectedLocationCategory !== 'ALL') {
        const cat = getFileLocationCategory(f);
        if (cat !== selectedLocationCategory) return false;
      }

      // Court station filter
      if (selectedCourtStation !== 'ALL') {
        if (f.courtStation !== selectedCourtStation) return false;
      }

      // Search term matching
      if (!activeSearchTerm) return true;
      const term = activeSearchTerm.toLowerCase();
      const cat = getFileLocationCategory(f).toLowerCase();
      const locRoom = (f.physicalLocation?.room || '').toLowerCase();
      const locCab = (f.physicalLocation?.cabinet || '').toLowerCase();

      return (
        f.internalFileNumber.toLowerCase().includes(term) ||
        (f.courtCaseNumber && f.courtCaseNumber.toLowerCase().includes(term)) ||
        f.clientName.toLowerCase().includes(term) ||
        (f.opposingParty && f.opposingParty.toLowerCase().includes(term)) ||
        (f.courtStation && f.courtStation.toLowerCase().includes(term)) ||
        (f.advocateName && f.advocateName.toLowerCase().includes(term)) ||
        (f.clerkName && f.clerkName.toLowerCase().includes(term)) ||
        (f.secretaryName && f.secretaryName.toLowerCase().includes(term)) ||
        cat.includes(term) ||
        locRoom.includes(term) ||
        locCab.includes(term)
      );
    });
  }, [files, selectedLocationCategory, selectedCourtStation, activeSearchTerm]);

  // Files Grouped by Designated Court Station
  const filesByCourtStation = useMemo<Record<string, RegistryFile[]>>(() => {
    const grouped: Record<string, RegistryFile[]> = {};

    filteredFiles.forEach(f => {
      const st = f.courtStation || 'Unassigned Court Station';
      if (!grouped[st]) grouped[st] = [];
      grouped[st].push(f);
    });

    return grouped;
  }, [filteredFiles]);

  // Filtered Movement Logs
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (!activeSearchTerm) return true;
      const term = activeSearchTerm.toLowerCase();
      return (
        m.fileNumber.toLowerCase().includes(term) ||
        m.fromLocation.toLowerCase().includes(term) ||
        m.toLocation.toLowerCase().includes(term) ||
        m.user.toLowerCase().includes(term) ||
        m.reason.toLowerCase().includes(term)
      );
    });
  }, [movements, activeSearchTerm]);

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">Physical File Movement & Custody Tracker</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Real-time physical location tracking between Central Registry, Clerk's Desk, Secretary's Desk, Advocate's Desk, and Proprietor's Desk.
          </p>
        </div>

        <button
          onClick={() => {
            const first = files[0];
            if (first) {
              setActiveFile(first);
              setTargetFileId(first.id);
            }
            setShowMoveModal(true);
          }}
          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record Physical File Transfer
        </button>
      </div>

      {/* Grid: 5 Live Location Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        
        {/* Central Registry */}
        <button
          onClick={() => setSelectedLocationCategory(selectedLocationCategory === 'Central Registry' ? 'ALL' : 'Central Registry')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
            selectedLocationCategory === 'Central Registry'
              ? 'bg-amber-900/60 border-[#C9A227] ring-2 ring-[#C9A227]/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between font-serif font-bold text-xs text-amber-300">
            <span>Central Registry</span>
            <FolderArchive className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {locationCounts['Central Registry']}
          </div>
          <p className="text-[10px] text-slate-400">
            Stored in main registry vault cabinets.
          </p>
        </button>

        {/* Clerk's Desk */}
        <button
          onClick={() => setSelectedLocationCategory(selectedLocationCategory === "Clerk's Desk" ? 'ALL' : "Clerk's Desk")}
          className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
            selectedLocationCategory === "Clerk's Desk"
              ? 'bg-sky-900/60 border-sky-400 ring-2 ring-sky-500/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between font-serif font-bold text-xs text-sky-300">
            <span>Clerk's Desk</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {locationCounts["Clerk's Desk"]}
          </div>
          <p className="text-[10px] text-slate-400">
            With court clerks for filing & court prep.
          </p>
        </button>

        {/* Secretary's Desk */}
        <button
          onClick={() => setSelectedLocationCategory(selectedLocationCategory === "Secretary's Desk" ? 'ALL' : "Secretary's Desk")}
          className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
            selectedLocationCategory === "Secretary's Desk"
              ? 'bg-purple-900/60 border-purple-400 ring-2 ring-purple-500/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between font-serif font-bold text-xs text-purple-300">
            <span>Secretary's Desk</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {locationCounts["Secretary's Desk"]}
          </div>
          <p className="text-[10px] text-slate-400">
            With advocates' secretaries for correspondence.
          </p>
        </button>

        {/* Advocate's Desk */}
        <button
          onClick={() => setSelectedLocationCategory(selectedLocationCategory === "Advocate's Desk" ? 'ALL' : "Advocate's Desk")}
          className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
            selectedLocationCategory === "Advocate's Desk"
              ? 'bg-emerald-900/60 border-emerald-400 ring-2 ring-emerald-500/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between font-serif font-bold text-xs text-emerald-300">
            <span>Advocate's Desk</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {locationCounts["Advocate's Desk"]}
          </div>
          <p className="text-[10px] text-slate-400">
            With partner / associate for drafting & research.
          </p>
        </button>

        {/* Proprietor's Desk */}
        <button
          onClick={() => setSelectedLocationCategory(selectedLocationCategory === "Proprietor's Desk" ? 'ALL' : "Proprietor's Desk")}
          className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
            selectedLocationCategory === "Proprietor's Desk"
              ? 'bg-rose-900/60 border-rose-400 ring-2 ring-rose-500/50'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between font-serif font-bold text-xs text-rose-300">
            <span>Proprietor's Desk</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {locationCounts["Proprietor's Desk"]}
          </div>
          <p className="text-[10px] text-slate-400">
            With Managing Proprietor for executive review.
          </p>
        </button>

      </div>

      {/* SEARCH BAR WITH DEDICATED SEARCH BUTTON & COURT STATION SELECTOR */}
      <div className="bg-[#081729] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
        
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file #, court case #, client name, opposing party, court station, custodian..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-700 text-white text-xs rounded-xl focus:outline-none focus:border-[#C9A227] placeholder-slate-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search Physical Files</span>
          </button>
        </form>

        {/* COURT STATION ARRANGEMENT SELECTOR TABS */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-[#C9A227] font-bold">
              <Landmark className="w-4 h-4" />
              <span>Arranged by Designated Court Station:</span>
            </span>
            {(selectedCourtStation !== 'ALL' || selectedLocationCategory !== 'ALL' || activeSearchTerm) && (
              <button
                onClick={() => {
                  setSelectedCourtStation('ALL');
                  setSelectedLocationCategory('ALL');
                  handleClearSearch();
                }}
                className="text-amber-400 hover:underline text-[11px]"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCourtStation('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCourtStation === 'ALL'
                  ? 'bg-[#C9A227] text-slate-950 font-bold shadow'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>All Court Stations</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-900/60 text-[10px]">{files.length}</span>
            </button>

            {availableCourtStations.map(station => {
              const stationCount = files.filter(f => f.courtStation === station).length;
              return (
                <button
                  key={station}
                  onClick={() => setSelectedCourtStation(selectedCourtStation === station ? 'ALL' : station)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    selectedCourtStation === station
                      ? 'bg-[#C9A227] text-slate-950 font-bold shadow'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[200px]">{station}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    selectedCourtStation === station ? 'bg-slate-950/40 text-slate-950 font-bold' : 'bg-slate-900 text-amber-300'
                  }`}>
                    {stationCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* PHYSICAL FILES ARRANGED BY DESIGNATED COURT STATION */}
      <div className="space-y-6">
        {Object.keys(filesByCourtStation).length === 0 ? (
          <div className="bg-[#081729] rounded-2xl border border-slate-800 p-8 text-center space-y-3">
            <FolderArchive className="w-10 h-10 text-slate-500 mx-auto" />
            <div className="text-slate-300 font-bold text-sm">No physical files found matching search and filters.</div>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Try adjusting your court station selection, physical location filter, or search keywords.
            </p>
          </div>
        ) : (
          (Object.entries(filesByCourtStation) as [string, RegistryFile[]][]).map(([stationName, stationFiles]) => (
            <div key={stationName} className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl overflow-hidden">
              
              {/* Court Station Group Header */}
              <div className="bg-[#0B1F3A] px-5 py-3.5 border-b border-[#C9A227]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#C9A227]/10 rounded-lg border border-[#C9A227]/30 text-[#C9A227]">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                      <span>{stationName}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Designated Court Station Registry • {stationFiles.length} Physical File{stationFiles.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#C9A227] font-semibold bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                  {stationFiles.length} Active Files in {stationName}
                </div>
              </div>

              {/* Station Files Cards / Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stationFiles.map(file => {
                  const locCategory = getFileLocationCategory(file);

                  return (
                    <div 
                      key={file.id} 
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-[#C9A227]/50 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        
                        {/* File Numbers & Status Badge */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <div>
                            <span className="font-mono text-xs font-extrabold text-[#C9A227]">
                              {file.internalFileNumber}
                            </span>
                            {file.courtCaseNumber && (
                              <div className="text-[11px] text-slate-300 font-semibold truncate max-w-[180px]">
                                {file.courtCaseNumber}
                              </div>
                            )}
                          </div>

                          {/* Physical Location Category Badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase tracking-wider ${
                            locCategory === 'Central Registry' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                            locCategory === "Clerk's Desk" ? 'bg-sky-950 text-sky-300 border-sky-800' :
                            locCategory === "Secretary's Desk" ? 'bg-purple-950 text-purple-300 border-purple-800' :
                            locCategory === "Advocate's Desk" ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                            'bg-rose-950 text-rose-300 border-rose-800'
                          }`}>
                            {locCategory}
                          </span>
                        </div>

                        {/* Parties */}
                        <div className="text-xs space-y-0.5">
                          <div className="text-slate-400 text-[10px] uppercase font-mono font-bold">Parties</div>
                          <div className="font-semibold text-white truncate">{file.clientName}</div>
                          <div className="text-slate-400 text-[11px] truncate">vs {file.opposingParty || 'N/A'}</div>
                        </div>

                        {/* Current Physical Location Detail */}
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 text-[11px] space-y-1">
                          <div className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#C9A227]" />
                            <span>CURRENT CUSTODY DETAILS</span>
                          </div>
                          <div className="text-slate-200 font-medium">
                            Room: <span className="text-white font-semibold">{file.physicalLocation.room}</span>
                          </div>
                          <div className="text-slate-400">
                            Desk/Cabinet: <span className="text-slate-200">{file.physicalLocation.cabinet}</span>
                          </div>
                          {file.physicalLocation.shelf && (
                            <div className="text-slate-400">
                              Shelf/Tray: <span className="text-slate-300">{file.physicalLocation.shelf}</span>
                            </div>
                          )}
                        </div>

                        {/* Staff Responsible */}
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                          <div>Advocate: <span className="text-slate-200 font-medium">{file.advocateName || 'N/A'}</span></div>
                          <div>Clerk: <span className="text-slate-200 font-medium">{file.clerkName || 'N/A'}</span></div>
                        </div>

                      </div>

                      {/* Card Action */}
                      <button
                        onClick={() => openTransferModalForFile(file)}
                        className="w-full mt-2 py-2 bg-slate-900 hover:bg-[#C9A227] hover:text-slate-950 text-[#C9A227] font-bold text-xs rounded-lg border border-slate-700 hover:border-[#C9A227] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Transfer / Record Movement</span>
                      </button>

                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Audit Log Table of Movements */}
      <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 shadow-xl p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#C9A227]" />
            <h3 className="font-serif font-bold text-base text-white">
              Physical File Movement History Register
            </h3>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total Transfer Logs: {filteredMovements.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#0B1F3A] text-[#C9A227] font-serif uppercase tracking-wider text-[11px] border-b border-[#C9A227]/30">
              <tr>
                <th className="p-3 pl-4">Date & Time</th>
                <th className="p-3">File Number</th>
                <th className="p-3">From Location</th>
                <th className="p-3">To Destination</th>
                <th className="p-3">Transferred By</th>
                <th className="p-3 pr-4">Reason / Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMovements.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/60 transition">
                  <td className="p-3 pl-4 font-mono text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {m.date} {m.time}
                    </div>
                  </td>
                  <td className="p-3 font-mono font-extrabold text-[#C9A227]">
                    {m.fileNumber}
                  </td>
                  <td className="p-3 text-slate-300">
                    {m.fromLocation}
                  </td>
                  <td className="p-3 font-bold text-amber-300 bg-amber-950/40 rounded border border-amber-800/40">
                    {m.toLocation}
                  </td>
                  <td className="p-3 font-medium text-slate-200">
                    {m.user}
                  </td>
                  <td className="p-3 pr-4 text-slate-400 italic max-w-xs truncate">
                    "{m.reason}"
                  </td>
                </tr>
              ))}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    No physical file movement records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Movement / Transfer Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-lg w-full p-6 space-y-5 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Transfer Physical File Location</h3>
                <p className="text-xs text-slate-400">Record physical location movement with timestamp & staff signature.</p>
              </div>
              <button 
                onClick={() => {
                  setShowMoveModal(false);
                  if (onClearSelectedFileToMove) onClearSelectedFileToMove();
                }} 
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">Select Physical File</label>
                <select
                  value={targetFileId}
                  onChange={e => handleSelectTargetFile(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-slate-100 focus:border-[#C9A227]"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-900 text-slate-100">
                      {f.internalFileNumber} — {f.clientName} ({f.courtStation || 'Registry'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Location Display */}
              {activeFile && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Location</div>
                  <div className="font-bold font-mono text-[#C9A227]">
                    {activeFile.physicalLocation.room} → {activeFile.physicalLocation.cabinet} ({activeFile.physicalLocation.shelf})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Designated Station: <span className="text-white font-medium">{activeFile.courtStation || 'Unassigned'}</span>
                  </div>
                </div>
              )}

              {/* New Destination Form */}
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-3">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#C9A227]" />
                  NEW DESTINATION LOCATION
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">Location / Holder Room</label>
                    <select
                      value={toRoom}
                      onChange={e => setToRoom(e.target.value as PhysicalLocationCategory)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
                    >
                      <option value="Central Registry" className="bg-slate-900">Central Registry</option>
                      <option value="Clerk's Desk" className="bg-slate-900">Clerk's Desk</option>
                      <option value="Secretary's Desk" className="bg-slate-900">Secretary's Desk</option>
                      <option value="Advocate's Desk" className="bg-slate-900">Advocate's Desk</option>
                      <option value="Proprietor's Desk" className="bg-slate-900">Proprietor's Desk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1">Cabinet / Desk Detail</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adv. Kamau Desk / Clerk Peter Workstation"
                      value={toCabinet}
                      onChange={e => setToCabinet(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">Shelf / Tray Detail</label>
                  <input
                    type="text"
                    placeholder="e.g. Action Tray 2 / Vault Shelf A3"
                    value={toShelf}
                    onChange={e => setToShelf(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Update File Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as RegistryFile['currentStatus'])}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-semibold text-xs focus:border-[#C9A227]"
                >
                  <option value="Active" className="bg-slate-900">Active in Registry</option>
                  <option value="Pending Court" className="bg-slate-900">Pending Action / Hearing</option>
                  <option value="Incomplete" className="bg-slate-900">Incomplete Requirements</option>
                  <option value="Closed" className="bg-slate-900">Closed File</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Reason for Transfer</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State reason for transfer (e.g. Transferred to Advocate for drafting submissions)..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoveModal(false);
                    if (onClearSelectedFileToMove) onClearSelectedFileToMove();
                  }}
                  className="px-4 py-2 border border-slate-700 rounded text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded transition cursor-pointer"
                >
                  Confirm Physical Transfer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
