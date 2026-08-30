import React, { useState } from 'react';
import { 
  CourtSession, 
  RegistryFile,
  User,
  CorumEntry,
  FileDocumentAttachment
} from '../types';
import { 
  Scale, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  X, 
  FileCheck2,
  AlertTriangle,
  Bell,
  FileType,
  Eye,
  FileText,
  Copy,
  Check,
  Folder,
  Building2,
  UserCheck,
  Briefcase,
  Layers,
  Shield,
  ExternalLink,
  Gavel,
  History,
  Lock,
  Paperclip,
  Download
} from 'lucide-react';
import { validateCourtDate, getNextBusinessDay, getTodayStr, isWeekend, ensureWeekday } from '../utils/dateUtils';
import { exportTableToPdf } from '../utils/pdfExport';
import { CourtStationPicker } from './CourtStationPicker';
import { LaptopDatePicker } from './LaptopDatePicker';

interface CourtDiaryModuleProps {
  sessions: CourtSession[];
  files: RegistryFile[];
  corumEntries?: CorumEntry[];
  documents?: FileDocumentAttachment[];
  onAddSession: (session: CourtSession, sameDayAlert?: { fileNumber: string; time: string; purpose: string }) => void;
  onNavigateToOutcome: (session: CourtSession) => void;
  courtStations: string[];
  users?: User[];
  onOpenDocumentManager?: (file: RegistryFile) => void;
  onViewDocument?: (doc: FileDocumentAttachment) => void;
}

export const CourtDiaryModule: React.FC<CourtDiaryModuleProps> = ({
  sessions,
  files,
  corumEntries = [],
  documents = [],
  onAddSession,
  onNavigateToOutcome,
  courtStations,
  users = [],
  onOpenDocumentManager,
  onViewDocument
}) => {
  const [viewMode, setViewMode] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // File Quick Glance Pop Pane State
  const [selectedFileForSummary, setSelectedFileForSummary] = useState<{
    file: RegistryFile | null;
    session?: CourtSession;
    fallbackNumber?: string;
  } | null>(null);
  const [copiedFileNum, setCopiedFileNum] = useState(false);

  const todayStr = getTodayStr();

  const fileCorums = selectedFileForSummary ? (corumEntries || [])
    .filter(c => 
      (selectedFileForSummary.file && c.fileId === selectedFileForSummary.file.id) ||
      (c.fileNumber && selectedFileForSummary.file?.internalFileNumber && c.fileNumber.trim().toLowerCase() === selectedFileForSummary.file.internalFileNumber.trim().toLowerCase()) ||
      (selectedFileForSummary.fallbackNumber && c.fileNumber && c.fileNumber.trim().toLowerCase() === selectedFileForSummary.fallbackNumber.trim().toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const fileDocuments = selectedFileForSummary ? (documents || [])
    .filter(d => 
      (selectedFileForSummary.file && d.fileId === selectedFileForSummary.file.id) ||
      (d.fileNumber && selectedFileForSummary.file?.internalFileNumber && d.fileNumber.trim().toLowerCase() === selectedFileForSummary.file.internalFileNumber.trim().toLowerCase()) ||
      (selectedFileForSummary.fallbackNumber && d.fileNumber && d.fileNumber.trim().toLowerCase() === selectedFileForSummary.fallbackNumber.trim().toLowerCase())
    )
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) : [];

  const handleOpenGlance = (session: CourtSession) => {
    const matched = files.find(
      f => f.id === session.fileId || 
           f.internalFileNumber.trim().toLowerCase() === session.fileNumber.trim().toLowerCase()
    );
    setSelectedFileForSummary({
      file: matched || null,
      session: session,
      fallbackNumber: session.fileNumber
    });
  };

  const handleCopyFileNumber = (fileNumber: string) => {
    navigator.clipboard.writeText(fileNumber);
    setCopiedFileNum(true);
    setTimeout(() => setCopiedFileNum(false), 2000);
  };

  // New Court Session form state
  const [formData, setFormData] = useState<Partial<CourtSession>>({
    fileId: files[0]?.id || '',
    fileNumber: files[0]?.internalFileNumber || '',
    clientName: files[0]?.clientName || '',
    opposingParty: files[0]?.opposingParty || '',
    courtStation: courtStations[0] || 'Milimani Law Courts - Commercial Division',
    courtNumber: 'Court 1',
    magistrate: '',
    hearingDate: getNextBusinessDay(todayStr),
    hearingTime: '09:00 AM',
    advocateName: '',
    purpose: 'Mention',
    status: 'Upcoming'
  });

  const todaySessionsCount = sessions.filter(s => s.hearingDate === todayStr).length;
  const upcomingSessionsCount = sessions.filter(s => s.status === 'Upcoming').length;

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = 
      s.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.opposingParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.advocateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.magistrate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStation = stationFilter === 'ALL' || s.courtStation === stationFilter;

    if (viewMode === 'today') {
      return matchesSearch && matchesStation && s.hearingDate === todayStr;
    }

    return matchesSearch && matchesStation;
  });

  const handleSelectFileForSession = (fileId: string) => {
    const selected = files.find(f => f.id === fileId);
    if (selected) {
      setFormData({
        ...formData,
        fileId: selected.id,
        fileNumber: selected.internalFileNumber,
        clientName: selected.clientName,
        opposingParty: selected.opposingParty,
        courtStation: selected.courtStation,
        courtNumber: selected.courtNumber,
        magistrate: selected.magistrate,
        advocateName: selected.advocateName
      });
    }
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.fileNumber || !formData.hearingDate) return;

    // Validate date
    const val = validateCourtDate(formData.hearingDate, formData.hearingTime);
    if (!val.isValid) {
      setValidationError(val.errorMessage || 'Invalid hearing date selected.');
      return;
    }

    const newSession: CourtSession = {
      id: `cs-${Date.now()}`,
      fileId: formData.fileId || `f-${Date.now()}`,
      fileNumber: formData.fileNumber,
      clientName: formData.clientName || 'Client',
      opposingParty: formData.opposingParty || 'Opposing Party',
      courtStation: formData.courtStation || courtStations[0],
      courtNumber: formData.courtNumber || 'Court 1',
      magistrate: formData.magistrate || 'Hon. Magistrate',
      hearingDate: formData.hearingDate,
      hearingTime: formData.hearingTime || '09:00 AM',
      advocateName: formData.advocateName || '',
      purpose: (formData.purpose as CourtSession['purpose']) || 'Mention',
      status: 'Upcoming'
    };

    let alertPayload = undefined;
    if (formData.hearingDate === todayStr) {
      if (!formData.hearingTime || !formData.hearingTime.trim()) {
        setValidationError('Hearing Time is strictly required when fixing a court session for Today (e.g., 09:30 AM).');
        return;
      }
      alertPayload = {
        fileNumber: formData.fileNumber,
        time: formData.hearingTime.trim(),
        purpose: `${formData.purpose || 'Mention'} — Station: ${formData.courtStation || 'Milimani Law Courts'}`
      };
    }

    onAddSession(newSession, alertPayload);
    setShowAddModal(false);
  };

  const handleExportPDF = () => {
    const titleMode = viewMode === 'today' ? "TODAY'S COURT CAUSE LIST" : viewMode === 'weekly' ? 'UPCOMING COURT CAUSE LIST' : 'MONTHLY COURT DIARY SCHEDULE';
    const cols = ['File #', 'Client Name vs Opposing Party', 'Court Station', 'Court #', 'Magistrate', 'Hearing Date & Time', 'Advocate', 'Purpose'];
    const rows = filteredSessions.map(cs => [
      cs.fileNumber,
      `${cs.clientName} vs ${cs.opposingParty}`,
      cs.courtStation,
      cs.courtNumber,
      cs.magistrate,
      `${cs.hearingDate} (${cs.hearingTime})`,
      cs.advocateName,
      cs.purpose
    ]);

    const summary = [
      { label: 'Total Cause List Items', value: filteredSessions.length },
      { label: 'Today Sessions', value: todaySessionsCount },
      { label: 'Upcoming Sessions', value: upcomingSessionsCount }
    ];

    exportTableToPdf(
      {
        title: titleMode,
        subtitle: `Official Advocate Cause List & Hearing Schedule — Filter: ${stationFilter}`,
        firmName: 'LAW FIRM REGISTRY',
        firmCode: 'LFR-001',
        generatedBy: 'Court Clerk Office'
      },
      cols,
      rows,
      `court_diary_${viewMode}_${Date.now()}.pdf`,
      summary
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Scale className="w-6 h-6 text-[#C9A227]" />
          <h2 className="font-serif font-bold text-xl text-white">Court Diary & Hearings Calendar</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-gradient-to-r from-[#C9A227] to-amber-500 text-slate-950 hover:from-amber-400 hover:to-amber-500 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <FileType className="w-4 h-4" />
            Export Court Cause List PDF
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Plus className="w-4 h-4 text-[#C9A227]" />
            Add Hearing / Session
          </button>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl">
        
        {/* Today / Weekly / Monthly Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('today')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === 'today' ? 'bg-[#C9A227] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Today's Matters ({todaySessionsCount})
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === 'weekly' ? 'bg-[#C9A227] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Upcoming Matters ({upcomingSessionsCount})
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === 'monthly' ? 'bg-[#C9A227] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Monthly Calendar
          </button>
        </div>

        {/* Station Filter */}
        <div className="flex items-center gap-2">
          <select
            value={stationFilter}
            onChange={e => setStationFilter(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-700 text-xs rounded-lg font-semibold text-slate-200"
          >
            <option value="ALL" className="bg-slate-900">All Court Stations</option>
            {courtStations.map(cs => (
              <option key={cs} value={cs} className="bg-slate-900">{cs}</option>
            ))}
          </select>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search file or advocate..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-[#C9A227]"
            />
          </div>
        </div>

      </div>

      {/* Court Sessions Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map(session => (
          <div 
            key={session.id}
            className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl hover:border-[#C9A227]/60 transition space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenGlance(session)}
                    className="font-mono font-extrabold text-[#C9A227] hover:text-amber-300 text-sm flex items-center gap-1.5 group cursor-pointer"
                    title="Tap to view file summary at a glance"
                  >
                    <span>{session.fileNumber}</span>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C9A227] transition" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenGlance(session)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-[#C9A227] hover:text-amber-300 border border-[#C9A227]/40 hover:border-[#C9A227] rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                    title="Tap for quick file overview"
                  >
                    <FileText className="w-3 h-3" />
                    File Glance
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800">
                    {session.purpose}
                  </span>
                </div>
              </div>

              <div className="font-bold text-white text-sm">
                {session.clientName}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                vs {session.opposingParty}
              </div>

              <div className="p-2.5 bg-slate-900/90 rounded-lg space-y-1 text-xs text-slate-200 border border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-[#C9A227]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{session.courtStation} ({session.courtNumber})</span>
                </div>
                <div className="text-slate-300 pl-5">
                  Magistrate: <strong>{session.magistrate}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
                  {session.hearingDate} @ {session.hearingTime}
                </span>
                <span className="font-bold text-slate-100">
                  {session.advocateName}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenGlance(session)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 hover:border-[#C9A227]/60 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Summary</span>
                </button>

                {(() => {
                  const docCount = documents.filter(d => 
                    d.fileId === session.fileId || 
                    (d.fileNumber && d.fileNumber.trim().toLowerCase() === session.fileNumber.trim().toLowerCase())
                  ).length;
                  if (docCount === 0) return null;
                  return (
                    <span 
                      className="flex items-center gap-1 text-[10px] text-[#C9A227] font-mono font-bold bg-[#C9A227]/10 px-1.5 py-1 rounded-lg border border-[#C9A227]/30 select-none"
                      title={`${docCount} document${docCount === 1 ? '' : 's'} attached to this case`}
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{docCount}</span>
                    </span>
                  );
                })()}
              </div>

              {session.hearingDate <= todayStr ? (
                <button
                  onClick={() => onNavigateToOutcome(session)}
                  className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 text-xs font-bold rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
                  title="Record court outcome for this hearing"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Record Outcome
                </button>
              ) : (
                <div 
                  className="px-2.5 py-1.5 bg-slate-950/90 text-slate-400 border border-slate-800 rounded-lg text-[11px] font-mono flex items-center gap-1.5 select-none"
                  title={`Outcome can only be recorded on or after the court due date (${session.hearingDate})`}
                >
                  <Lock className="w-3 h-3 text-amber-500/80" />
                  <span>Due: {session.hearingDate}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <div className="col-span-full p-12 bg-[#081729] rounded-2xl border border-[#C9A227]/30 text-center text-slate-400 text-xs">
            No court sessions found matching the criteria.
          </div>
        )}
      </div>

      {/* Add Court Hearing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-base text-white">Add Court Session / Hearing</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-3 text-xs">
              
              {validationError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div>{validationError}</div>
                    {formData.hearingDate && isWeekend(formData.hearingDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          const nxt = getNextBusinessDay(formData.hearingDate);
                          setFormData({ ...formData, hearingDate: nxt });
                          setValidationError(null);
                        }}
                        className="text-[11px] font-bold text-[#C9A227] underline hover:text-amber-300 block mt-1"
                      >
                        Auto-Set to Next Business Day ({getNextBusinessDay(formData.hearingDate)})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {formData.hearingDate === todayStr && (
                <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-200 text-xs flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C9A227] shrink-0" />
                  <span>
                    <strong>SAME-DAY ALERT:</strong> Scheduled for TODAY ({todayStr}). Urgent notification will be broadcast to <strong>Clerk</strong>, <strong>Admin</strong>, & <strong>Secretary</strong>.
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Select Physical File</label>
                <select
                  value={formData.fileId}
                  onChange={e => handleSelectFileForSession(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono font-bold text-xs focus:border-[#C9A227]"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-900">{f.internalFileNumber} — {f.clientName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <LaptopDatePicker
                    label="Hearing Date"
                    required
                    min={todayStr}
                    value={formData.hearingDate}
                    onChange={val => {
                      setFormData({ ...formData, hearingDate: val });
                      setValidationError(null);
                    }}
                    allowFuture={true}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${formData.hearingDate === todayStr ? 'text-amber-300' : 'text-slate-300'}`}>
                    Hearing Time {formData.hearingDate === todayStr ? '(Required Today)' : ''}
                  </label>
                  <input
                    type="text"
                    required={formData.hearingDate === todayStr}
                    placeholder="e.g. 09:30 AM"
                    value={formData.hearingTime}
                    onChange={e => setFormData({ ...formData, hearingTime: e.target.value })}
                    className={`w-full p-2 bg-slate-950 border rounded focus:border-[#C9A227] ${
                      formData.hearingDate === todayStr ? 'border-amber-600 text-amber-200 font-bold' : 'border-slate-700 text-slate-100'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Court Station</label>
                <CourtStationPicker
                  value={formData.courtStation}
                  onChange={val => setFormData({ ...formData, courtStation: val })}
                  availableStations={courtStations}
                  placeholder="Select or search court station..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Court Number</label>
                  <input
                    type="text"
                    value={formData.courtNumber}
                    onChange={e => setFormData({ ...formData, courtNumber: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Session Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value as CourtSession['purpose'] })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  >
                    <option value="Mention" className="bg-slate-900">Mention</option>
                    <option value="Hearing" className="bg-slate-900">Hearing</option>
                    <option value="Ruling" className="bg-slate-900">Ruling</option>
                    <option value="Judgment" className="bg-slate-900">Judgment</option>
                    <option value="Notice of Motion" className="bg-slate-900">Notice of Motion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Assigned Advocate</label>
                <select
                  value={formData.advocateName}
                  onChange={e => setFormData({ ...formData, advocateName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                >
                  <option value="">-- Select Assigned Advocate --</option>
                  {users.filter(u => u.role === 'Advocate' || u.role === 'Proprietor').map(u => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                  {users.filter(u => u.role !== 'Advocate' && u.role !== 'Proprietor').length > 0 && (
                    <optgroup label="Other Registered Staff">
                      {users.filter(u => u.role !== 'Advocate' && u.role !== 'Proprietor').map(u => (
                        <option key={u.id} value={u.fullName}>
                          {u.fullName} ({u.role})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
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
                  Save Hearing
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* File Quick Glance Pop Pane */}
      {selectedFileForSummary && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedFileForSummary(null);
            }
          }}
        >
          <div className="bg-[#081729] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-[#C9A227]/50 shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
            
            {/* Pop Pane Header */}
            <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227] shadow-inner">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-white">Physical File Summary</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30">
                      At a Glance
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Quick registry overview & court docket information
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedFileForSummary(null)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
                title="Close summary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pop Pane Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Primary File Identity Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-[#C9A227]/30 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-mono font-extrabold text-[#C9A227] tracking-wide">
                      {selectedFileForSummary.file?.internalFileNumber || selectedFileForSummary.fallbackNumber || 'File Record'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyFileNumber(selectedFileForSummary.file?.internalFileNumber || selectedFileForSummary.fallbackNumber || '')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                      title="Copy file number"
                    >
                      {copiedFileNum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copiedFileNum ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                      selectedFileForSummary.file?.currentStatus === 'Active'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : selectedFileForSummary.file?.currentStatus === 'Out in Court'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : selectedFileForSummary.file?.currentStatus === 'Out with Advocate'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                        : selectedFileForSummary.file?.currentStatus === 'Closed' || selectedFileForSummary.file?.currentStatus === 'Archived'
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
                    }`}>
                      {selectedFileForSummary.file?.currentStatus || selectedFileForSummary.session?.status || 'Active'}
                    </span>

                    {selectedFileForSummary.file?.isEdited && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        1-Time Lock
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-xs">
                  <div>
                    Court Case No: <strong className="text-white font-mono">{selectedFileForSummary.file?.courtCaseNumber || 'Pending Filing'}</strong>
                  </div>
                  {selectedFileForSummary.file?.dateOpened && (
                    <div className="text-slate-400">
                      Date Opened: <span className="font-mono text-slate-200">{selectedFileForSummary.file.dateOpened}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2-Column Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Litigants & Parties */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#C9A227] font-bold text-xs border-b border-slate-800 pb-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Litigants & Capacity</span>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Client / Main Litigant</div>
                      <div className="font-bold text-slate-100 flex flex-wrap items-center gap-1.5">
                        <span>{selectedFileForSummary.file?.clientName || selectedFileForSummary.session?.clientName || 'N/A'}</span>
                        {selectedFileForSummary.file?.partyCapacity && (
                          <span className="px-1.5 py-0.2 bg-blue-950/70 text-blue-300 border border-blue-800/80 rounded text-[10px]">
                            {selectedFileForSummary.file.partyCapacity}
                          </span>
                        )}
                        {selectedFileForSummary.file?.clientType && (
                          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px]">
                            {selectedFileForSummary.file.clientType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Opposing Party</div>
                      <div className="font-semibold text-slate-200">
                        {selectedFileForSummary.file?.opposingParty || selectedFileForSummary.session?.opposingParty || 'N/A'}
                      </div>
                    </div>

                    {selectedFileForSummary.file?.insuranceCompanyName && (
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Insurance Co.</div>
                        <div className="font-medium text-amber-300/90">
                          {selectedFileForSummary.file.insuranceCompanyName}
                        </div>
                      </div>
                    )}

                    {selectedFileForSummary.file?.additionalParties && selectedFileForSummary.file.additionalParties.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Other Parties ({selectedFileForSummary.file.additionalParties.length})</div>
                        <div className="text-[11px] text-slate-300">
                          {selectedFileForSummary.file.additionalParties.map(p => `${p.name} (${p.role})`).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Physical Location in Registry */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#C9A227] font-bold text-xs border-b border-slate-800 pb-1.5">
                    <Folder className="w-3.5 h-3.5" />
                    <span>Physical Registry Location</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Room</div>
                        <div className="font-bold text-amber-300 text-xs">
                          {selectedFileForSummary.file?.physicalLocation?.room || 'Registry'}
                        </div>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Cabinet</div>
                        <div className="font-bold text-amber-300 text-xs">
                          {selectedFileForSummary.file?.physicalLocation?.cabinet || 'Cab 1'}
                        </div>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Shelf</div>
                        <div className="font-bold text-amber-300 text-xs">
                          {selectedFileForSummary.file?.physicalLocation?.shelf || 'Shelf A'}
                        </div>
                      </div>
                    </div>

                    {selectedFileForSummary.file?.physicalLocation?.detail && (
                      <div className="text-[10px] text-slate-400 text-center italic">
                        {selectedFileForSummary.file.physicalLocation.detail}
                      </div>
                    )}
                  </div>

                  {/* Case Category & Type */}
                  <div className="pt-1 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Category / Nature</div>
                    <div className="text-slate-200 font-medium flex flex-wrap items-center gap-1">
                      <span>{selectedFileForSummary.file?.caseCategory || 'Civil Litigation'}</span>
                      {selectedFileForSummary.file?.caseType && (
                        <span className="text-slate-400">• {selectedFileForSummary.file.caseType}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Court Station & Bench */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#C9A227] font-bold text-xs border-b border-slate-800 pb-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Court Bench & Hearing</span>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Court Station</div>
                      <div className="font-bold text-slate-100">
                        {selectedFileForSummary.file?.courtStation || selectedFileForSummary.session?.courtStation || 'Not Assigned'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Court / Div</div>
                        <div className="font-semibold text-slate-200">
                          {selectedFileForSummary.file?.courtNumber || selectedFileForSummary.session?.courtNumber || 'Court 1'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Magistrate/Judge</div>
                        <div className="font-semibold text-slate-200">
                          {selectedFileForSummary.file?.magistrate || selectedFileForSummary.session?.magistrate || 'Hon. Magistrate'}
                        </div>
                      </div>
                    </div>

                    {selectedFileForSummary.session && (
                      <div className="p-2 bg-amber-950/30 rounded border border-amber-800/40 text-amber-200 space-y-0.5">
                        <div className="text-[10px] font-bold uppercase flex items-center gap-1 text-[#C9A227]">
                          <Clock className="w-3 h-3" />
                          <span>Session in Diary</span>
                        </div>
                        <div className="text-xs font-mono font-bold">
                          {selectedFileForSummary.session.hearingDate} @ {selectedFileForSummary.session.hearingTime}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Purpose: <strong>{selectedFileForSummary.session.purpose}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Legal Staff */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#C9A227] font-bold text-xs border-b border-slate-800 pb-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Assigned Firm Staff</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                      <span className="text-slate-400">Assigned Advocate:</span>
                      <span className="font-bold text-slate-100">
                        {selectedFileForSummary.file?.advocateName || selectedFileForSummary.session?.advocateName || 'Not Assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                      <span className="text-slate-400">Registry Clerk:</span>
                      <span className="font-medium text-slate-200">
                        {selectedFileForSummary.file?.clerkName || 'Registry Desk'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                      <span className="text-slate-400">Secretary:</span>
                      <span className="font-medium text-slate-200">
                        {selectedFileForSummary.file?.secretaryName || 'General Secretarial'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-400">Case Chaser:</span>
                      <span className="font-medium text-slate-200">
                        {selectedFileForSummary.file?.caseChaserName || 'Assigned Clerk'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Attached Documents & Case Vault */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-[#C9A227] font-bold text-xs">
                    <Paperclip className="w-4 h-4" />
                    <span>Attached Case Documents ({fileDocuments.length})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenDocumentManager && selectedFileForSummary.file && (
                      <button
                        type="button"
                        onClick={() => {
                          const fileObj = selectedFileForSummary.file!;
                          setSelectedFileForSummary(null);
                          onOpenDocumentManager(fileObj);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[#C9A227] hover:text-amber-300 border border-[#C9A227]/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Upload / Manage</span>
                      </button>
                    )}
                  </div>
                </div>

                {fileDocuments.length === 0 ? (
                  <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-center text-slate-400 text-xs">
                    <p className="font-semibold text-slate-300">No Attached Documents on File</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pleadings, affidavits, rulings and exhibits can be uploaded from the registry.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {fileDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30 shrink-0">
                              {doc.category}
                            </span>
                            {doc.isConfidential && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800 shrink-0">
                                Confidential
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-100 truncate" title={doc.title}>
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {doc.fileName}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          {onViewDocument && (
                            <button
                              type="button"
                              onClick={() => onViewDocument(doc)}
                              className="p-1 rounded-lg bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 transition cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {doc.dataUrl && (
                            <a
                              href={doc.dataUrl}
                              download={doc.fileName}
                              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recorded CORUM Proceedings History */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-[#C9A227]/40 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-[#C9A227] font-bold text-xs">
                    <Gavel className="w-4 h-4" />
                    <span>Recorded CORUM Proceedings ({fileCorums.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {fileCorums.length > 0 ? `${fileCorums.length} appearance${fileCorums.length === 1 ? '' : 's'} on record` : 'No appearances yet'}
                  </span>
                </div>

                {fileCorums.length === 0 ? (
                  <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-center text-slate-400 text-xs space-y-1">
                    <History className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                    <p className="font-semibold text-slate-300">No CORUM Proceedings Recorded Yet</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Court proceedings and advocate coram outcomes will be displayed here once recorded on or after the court due date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {fileCorums.map((corum, idx) => (
                      <div key={corum.id || idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 space-y-2 text-xs">
                        
                        {/* Corum Header */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-950/80 text-[#C9A227] border border-amber-800 font-mono font-bold text-[11px]">
                              {corum.date} {corum.time ? `@ ${corum.time}` : ''}
                            </span>
                            <span className="font-bold text-slate-200">
                              {corum.comingUpFor || 'Court Appearance'}
                            </span>
                          </div>
                          
                          {corum.caseStatusAfter && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300">
                              Status: {corum.caseStatusAfter}
                            </span>
                          )}
                        </div>

                        {/* Coram & Bench */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400">Coram (Judge/Magistrate):</span>{' '}
                            <strong className="text-slate-100">{corum.coram || 'Presiding Magistrate'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Court / Station:</span>{' '}
                            <span className="text-slate-200 font-medium">{corum.courtStation || 'Station'} ({corum.courtNumber || 'Court 1'})</span>
                          </div>
                        </div>

                        {/* Advocates Present */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Advocate for Firm / Plaintiff</div>
                            <div className="font-semibold text-slate-200">{corum.advocatePresent || 'Counsel on Record'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Opposing Advocate / Defendant</div>
                            <div className="font-semibold text-slate-200">{corum.defendantAdvocate || 'Opposing Counsel'}</div>
                          </div>
                        </div>

                        {/* Court Orders Issued */}
                        {corum.orders && (
                          <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-lg">
                            <div className="text-[10px] uppercase font-bold text-[#C9A227] mb-0.5">Court Orders Issued</div>
                            <p className="text-slate-200 leading-relaxed font-mono text-[11px] whitespace-pre-line">
                              {corum.orders}
                            </p>
                          </div>
                        )}

                        {/* Remarks & Proceedings Notes */}
                        {corum.remarks && (
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Proceedings / Advocate Notes</div>
                            <p className="text-slate-300 text-[11px] italic bg-slate-900/50 p-2 rounded border border-slate-800/50">
                              "{corum.remarks}"
                            </p>
                          </div>
                        )}

                        {/* Office Action Required */}
                        {corum.officeAction && (
                          <div className="text-[11px] text-sky-300 bg-sky-950/40 px-2.5 py-1.5 rounded border border-sky-800/50">
                            <span className="font-bold text-sky-400 uppercase text-[10px] mr-1">Office Action:</span>
                            <span>{corum.officeAction}</span>
                          </div>
                        )}

                        {/* Next Court Appearance & Attribution */}
                        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          {corum.nextCourtDate ? (
                            <div className="flex items-center gap-1 text-amber-300 font-bold">
                              <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
                              Next Appearance: <span className="underline font-mono">{corum.nextCourtDate} {corum.nextCourtTime || ''}</span>
                              {corum.nextComingUpFor && (
                                <span className="text-slate-300 font-normal">({corum.nextComingUpFor})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">No next date fixed</span>
                          )}

                          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>Recorded by: <strong className="text-slate-200">{corum.recordedBy || 'Advocate'}</strong></span>
                            </span>
                            {corum.isEdited && (
                              <span className="text-amber-400/90 font-medium px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
                                Amended
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes & Special Remarks (if any) */}
              {(selectedFileForSummary.file?.notes || (selectedFileForSummary.file?.missingRequirements && selectedFileForSummary.file.missingRequirements.length > 0)) && (
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  {selectedFileForSummary.file?.notes && (
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Case Notes / Directives</div>
                      <p className="text-slate-300 italic text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                        "{selectedFileForSummary.file.notes}"
                      </p>
                    </div>
                  )}

                  {selectedFileForSummary.file?.missingRequirements && selectedFileForSummary.file.missingRequirements.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] text-rose-400 font-semibold uppercase mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Pending / Missing Requirements</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFileForSummary.file.missingRequirements.map((req, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/80 text-[10px]">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Pop Pane Footer Actions */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyFileNumber(selectedFileForSummary.file?.internalFileNumber || selectedFileForSummary.fallbackNumber || '')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedFileNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedFileNum ? 'File Number Copied' : 'Copy File Number'}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedFileForSummary.session && (
                  selectedFileForSummary.session.hearingDate <= todayStr ? (
                    <button
                      type="button"
                      onClick={() => {
                        const sess = selectedFileForSummary.session!;
                        setSelectedFileForSummary(null);
                        onNavigateToOutcome(sess);
                      }}
                      className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Record Outcome</span>
                    </button>
                  ) : (
                    <div 
                      className="px-3 py-2 bg-slate-950 text-slate-400 border border-slate-800 rounded-xl text-xs font-mono flex items-center gap-1.5 select-none"
                      title={`Outcome can only be recorded on or after the court due date (${selectedFileForSummary.session.hearingDate})`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500/80" />
                      <span>Outcome Due On: {selectedFileForSummary.session.hearingDate}</span>
                    </div>
                  )
                )}
                
                <button
                  type="button"
                  onClick={() => setSelectedFileForSummary(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Close Pane
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
