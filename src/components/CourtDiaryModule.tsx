import React, { useState } from 'react';
import { 
  CourtSession, 
  RegistryFile 
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
  Bell
} from 'lucide-react';
import { validateCourtDate, getNextBusinessDay, getTodayStr, isWeekend, ensureWeekday } from '../utils/dateUtils';

interface CourtDiaryModuleProps {
  sessions: CourtSession[];
  files: RegistryFile[];
  onAddSession: (session: CourtSession, sameDayAlert?: { fileNumber: string; time: string; purpose: string }) => void;
  onNavigateToOutcome: (session: CourtSession) => void;
  courtStations: string[];
}

export const CourtDiaryModule: React.FC<CourtDiaryModuleProps> = ({
  sessions,
  files,
  onAddSession,
  onNavigateToOutcome,
  courtStations
}) => {
  const [viewMode, setViewMode] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const todayStr = getTodayStr();

  // New Court Session form state
  const [formData, setFormData] = useState<Partial<CourtSession>>({
    fileId: files[0]?.id || '',
    fileNumber: files[0]?.internalFileNumber || 'LFR/2026/0142',
    clientName: files[0]?.clientName || '',
    opposingParty: files[0]?.opposingParty || '',
    courtStation: courtStations[0] || 'Milimani Law Courts - Commercial Division',
    courtNumber: 'Court 4',
    magistrate: 'Hon. Justice J. K. Mwangi',
    hearingDate: getNextBusinessDay(todayStr),
    hearingTime: '09:00 AM',
    advocateName: 'Adv. James Kamau',
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
      advocateName: formData.advocateName || 'Adv. James Kamau',
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

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">Court Diary & Hearings Calendar</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Consolidated court appearance schedules across all court stations, assigned advocates & magistrates.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Court Hearing / Session
        </button>
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
            Today's Hearings ({todaySessionsCount})
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              viewMode === 'weekly' ? 'bg-[#C9A227] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Upcoming Hearings ({upcomingSessionsCount})
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
                <span className="font-mono font-extrabold text-[#C9A227] text-sm">
                  {session.fileNumber}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800">
                  {session.purpose}
                </span>
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
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Status: {session.status}
              </span>
              <button
                onClick={() => onNavigateToOutcome(session)}
                className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 text-xs font-bold rounded-lg shadow transition flex items-center gap-1 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Record Outcome
              </button>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Hearing Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={formData.hearingDate}
                    onChange={e => {
                      const selected = e.target.value;
                      if (selected && isWeekend(selected)) {
                        const valid = ensureWeekday(selected);
                        setFormData({ ...formData, hearingDate: valid });
                        setValidationError(`Weekend court dates are forbidden. Auto-adjusted from ${selected} to next business day (${valid}).`);
                      } else {
                        setFormData({ ...formData, hearingDate: selected });
                        setValidationError(null);
                      }
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  />
                  {formData.hearingDate && isWeekend(formData.hearingDate) && (
                    <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">⚠️ Selected date is a weekend</span>
                  )}
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
                <select
                  value={formData.courtStation}
                  onChange={e => setFormData({ ...formData, courtStation: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
                >
                  {courtStations.map(cs => (
                    <option key={cs} value={cs} className="bg-slate-900">{cs}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                <input
                  type="text"
                  value={formData.advocateName}
                  onChange={e => setFormData({ ...formData, advocateName: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
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

    </div>
  );
};
