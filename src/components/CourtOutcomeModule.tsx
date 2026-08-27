import React, { useState } from 'react';
import { 
  CourtOutcome, 
  RegistryFile, 
  CourtSession 
} from '../types';
import { 
  FileCheck2, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle,
  Bell,
  X
} from 'lucide-react';
import { validateCourtDate, getNextBusinessDay, getTodayStr, isWeekend, ensureWeekday } from '../utils/dateUtils';

interface CourtOutcomeModuleProps {
  outcomes: CourtOutcome[];
  files: RegistryFile[];
  onAddOutcome: (
    outcome: CourtOutcome, 
    nextCourtDate?: string, 
    updatedCaseStatus?: RegistryFile['currentStatus'],
    sameDayAlert?: { fileNumber: string; time: string; purpose: string }
  ) => void;
  preselectedSession?: CourtSession | null;
}

export const CourtOutcomeModule: React.FC<CourtOutcomeModuleProps> = ({
  outcomes,
  files,
  onAddOutcome,
  preselectedSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(!!preselectedSession);

  const todayStr = getTodayStr();

  // Form State
  const [targetFileId, setTargetFileId] = useState<string>(preselectedSession?.fileId || files[0]?.id || '');
  const [appearanceDate, setAppearanceDate] = useState(todayStr);
  const [outcomeDetails, setOutcomeDetails] = useState('Application heard. Ruling reserved.');
  const [ordersIssued, setOrdersIssued] = useState('Interim orders extended until next hearing date.');
  const [nextHearingDate, setNextHearingDate] = useState(getNextBusinessDay(todayStr));
  const [nextHearingTime, setNextHearingTime] = useState('09:00 AM');
  const [advocatePresent, setAdvocatePresent] = useState(preselectedSession?.advocateName || '');
  const [remarks, setRemarks] = useState('Mention to confirm compliance with court directions.');
  const [caseStatusAfter, setCaseStatusAfter] = useState<RegistryFile['currentStatus']>('Active');

  // Validation Error State
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedSession) {
      setTargetFileId(preselectedSession.fileId);
      setAdvocatePresent(preselectedSession.advocateName);
      setShowAddModal(true);
    }
  }, [preselectedSession]);

  const handleNextDateChange = (dateVal: string) => {
    if (dateVal && isWeekend(dateVal)) {
      const valid = ensureWeekday(dateVal);
      setNextHearingDate(valid);
      setValidationError(`Weekend court dates are forbidden. Auto-adjusted from ${dateVal} to next business day (${valid}).`);
    } else {
      setNextHearingDate(dateVal);
      setValidationError(null);
    }
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const file = files.find(f => f.id === targetFileId) || files[0];
    if (!file) return;

    // Validate Next Hearing Date if provided
    if (nextHearingDate) {
      const val = validateCourtDate(nextHearingDate, nextHearingTime);
      if (!val.isValid) {
        setValidationError(val.errorMessage || 'Invalid date selected.');
        return;
      }
    }

    const newOutcome: CourtOutcome = {
      id: `co-${Date.now()}`,
      fileId: file.id,
      fileNumber: file.internalFileNumber,
      appearanceDate,
      outcomeDetails,
      ordersIssued,
      nextHearingDate,
      advocatePresent,
      remarks,
      caseStatusAfter
    };

    // If next hearing date is TODAY, prepare same day alert for Clerk, Proprietor, Secretary
    let alertPayload = undefined;
    if (nextHearingDate === todayStr) {
      if (!nextHearingTime || !nextHearingTime.trim()) {
        setValidationError('Hearing Time is strictly required when fixing a court appearance for Today (e.g., 09:30 AM).');
        return;
      }
      alertPayload = {
        fileNumber: file.internalFileNumber,
        time: nextHearingTime.trim(),
        purpose: outcomeDetails.substring(0, 80)
      };
    }

    onAddOutcome(newOutcome, nextHearingDate, caseStatusAfter, alertPayload);
    setShowAddModal(false);
  };

  const filteredOutcomes = outcomes.filter(o => 
    o.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.outcomeDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.advocatePresent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.ordersIssued.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-6 h-6 text-[#C9A227]" />
          <h2 className="font-serif font-bold text-xl text-white">Court Outcome Register</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Record Court Appearance Outcome
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#081729] p-4 rounded-xl border border-[#C9A227]/30 shadow-xl flex items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search file #, orders issued, advocate..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-lg focus:outline-none focus:border-[#C9A227]"
          />
        </div>
      </div>

      {/* Outcome History Cards */}
      <div className="space-y-4">
        {filteredOutcomes.map(o => (
          <div key={o.id} className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-3">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-[#C9A227] text-sm">{o.fileNumber}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                  Status: {o.caseStatusAfter}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
                Appearance Date: <strong className="text-slate-200">{o.appearanceDate}</strong>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl space-y-1 border border-slate-800">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Appearance Outcome Details</div>
                <div className="text-slate-200 font-medium leading-relaxed">{o.outcomeDetails}</div>
              </div>

              <div className="p-3 bg-amber-950/40 rounded-xl space-y-1 border border-amber-800/60">
                <div className="text-amber-300 font-bold uppercase text-[10px]">Court Orders Issued</div>
                <div className="text-slate-100 font-semibold leading-relaxed">{o.ordersIssued}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A227]" />
                <span>Advocate Present: <strong className="text-white">{o.advocatePresent}</strong></span>
              </div>

              {o.nextHearingDate && (
                <div className="flex items-center gap-1.5 font-bold text-[#C9A227] bg-[#C9A227]/10 px-3 py-1 rounded-full border border-[#C9A227]/40">
                  <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Next Hearing Date: {o.nextHearingDate}</span>
                </div>
              )}
            </div>

          </div>
        ))}

        {filteredOutcomes.length === 0 && (
          <div className="p-12 bg-[#081729] rounded-2xl border border-[#C9A227]/30 text-center text-slate-400 text-xs">
            No court appearance outcomes recorded yet.
          </div>
        )}
      </div>

      {/* Record Outcome Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl max-w-lg w-full p-6 space-y-4 border border-[#C9A227]/40 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-serif font-bold text-base text-white">Record Court Appearance Outcome</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutcome} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-bold text-slate-300 mb-1">Select Physical File</label>
                <select
                  value={targetFileId}
                  onChange={e => setTargetFileId(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono font-bold focus:border-[#C9A227]"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-900">{f.internalFileNumber} — {f.clientName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Appearance Date</label>
                  <input
                    type="date"
                    required
                    value={appearanceDate}
                    onChange={e => {
                      const selected = e.target.value;
                      if (selected && isWeekend(selected)) {
                        const valid = ensureWeekday(selected);
                        setAppearanceDate(valid);
                        setValidationError(`Appearance date cannot fall on a weekend. Auto-adjusted from ${selected} to next business day (${valid}).`);
                      } else {
                        setAppearanceDate(selected);
                        setValidationError(null);
                      }
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Advocate Present</label>
                  <input
                    type="text"
                    required
                    value={advocatePresent}
                    onChange={e => setAdvocatePresent(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Court Outcome Summary</label>
                <textarea
                  required
                  rows={2}
                  value={outcomeDetails}
                  onChange={e => setOutcomeDetails(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Court Orders Issued</label>
                <textarea
                  required
                  rows={2}
                  value={ordersIssued}
                  onChange={e => setOrdersIssued(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
                />
              </div>

              {validationError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div>{validationError}</div>
                    {isWeekend(nextHearingDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          const nxt = getNextBusinessDay(nextHearingDate);
                          setNextHearingDate(nxt);
                          setValidationError(null);
                        }}
                        className="text-[11px] font-bold text-[#C9A227] underline hover:text-amber-300 block mt-1"
                      >
                        Auto-Set to Next Business Day ({getNextBusinessDay(nextHearingDate)})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {nextHearingDate === todayStr && (
                <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-200 text-xs flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C9A227] shrink-0" />
                  <span>
                    <strong>SAME-DAY COURT ALERT:</strong> This hearing is set for TODAY ({todayStr}). An urgent alert will be broadcast to the <strong>Clerk</strong>, <strong>Admin</strong>, and <strong>Secretary</strong>.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Next Hearing Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={nextHearingDate}
                    onChange={e => handleNextDateChange(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-[#C9A227] font-bold rounded focus:border-[#C9A227]"
                  />
                  {isWeekend(nextHearingDate) && (
                    <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">⚠️ Selected date is a weekend</span>
                  )}
                </div>

                {nextHearingDate === todayStr ? (
                  <div>
                    <label className="block font-bold text-amber-300 mb-1">Hearing Time (Required for Today)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 02:30 PM"
                      value={nextHearingTime}
                      onChange={e => setNextHearingTime(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-amber-600 text-amber-200 font-bold rounded focus:border-[#C9A227]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Update Case Status</label>
                    <select
                      value={caseStatusAfter}
                      onChange={e => setCaseStatusAfter(e.target.value as RegistryFile['currentStatus'])}
                      className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold focus:border-[#C9A227]"
                    >
                      <option value="Active" className="bg-slate-900">Active</option>
                      <option value="Pending Court" className="bg-slate-900">Pending Court</option>
                      <option value="Out with Advocate" className="bg-slate-900">Out with Advocate</option>
                      <option value="Closed" className="bg-slate-900">Closed / Judgment</option>
                    </select>
                  </div>
                )}
              </div>

              {nextHearingDate === todayStr && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Update Case Status</label>
                  <select
                    value={caseStatusAfter}
                    onChange={e => setCaseStatusAfter(e.target.value as RegistryFile['currentStatus'])}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-bold focus:border-[#C9A227]"
                  >
                    <option value="Active" className="bg-slate-900">Active</option>
                    <option value="Pending Court" className="bg-slate-900">Pending Court</option>
                    <option value="Out with Advocate" className="bg-slate-900">Out with Advocate</option>
                    <option value="Closed" className="bg-slate-900">Closed / Judgment</option>
                  </select>
                </div>
              )}

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
                  Save Outcome
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
