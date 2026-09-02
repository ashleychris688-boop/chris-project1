import React, { useState, useMemo } from 'react';
import { SystemSettings, User, LawFirmProfile } from '../types';
import { 
  Settings as SettingsIcon, 
  Building2, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2,
  Save,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Hash,
  Sparkles,
  Layers,
  Sliders,
  Copy,
  Check,
  Tag,
  RefreshCw,
  Scale,
  Search,
  Landmark,
  X,
  Palette,
  Sun,
  Moon,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';
import { SettingsThemeSelector } from '../context/ThemeContext';
import {
  FILE_NUMBER_FORMAT_PRESETS,
  buildFormattedFileNumber
} from '../utils/fileNumberUtils';
import {
  DEFAULT_KENYA_COURT_STATIONS,
  KENYA_COURT_CATEGORIES,
  CourtCategory,
  getCourtCategoryByName
} from '../data/kenyaCourts';

interface SettingsModuleProps {
  settings: SystemSettings;
  currentFirm?: LawFirmProfile | null;
  currentUser?: User | null;
  onSaveSettings: (settings: SystemSettings) => void;
  onUpdateFirm?: (firm: LawFirmProfile) => void;
  onResetData: () => void;
  onClearDataForProduction?: () => void;
  onUpdatePassword?: (userId: string, newPassword: string) => void;
  onCleanUpDemoFiles?: () => Promise<void> | void;
  demoFilesCount?: number;
  onCleanUpDiaryAndTasks?: () => Promise<void> | void;
  diaryTasksCount?: { sessions: number; tasks: number };
}

const SAMPLE_CASE_CATEGORIES = [
  'Succession & Probate',
  'Civil Litigation',
  'Accidents',
  'Commercial & Corporate',
  'Conveyancing',
  'Land & Environment',
  'Family Law',
  'Criminal Matters',
  'Motor Accident / Insurance',
  'Employment & Labour',
  'Small Claims Court',
  'Debt & Recovery',
  'Alternative Dispute Resolution (ADR)'
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  currentFirm,
  currentUser,
  onSaveSettings,
  onUpdateFirm,
  onResetData: _onResetData,
  onClearDataForProduction: _onClearDataForProduction,
  onUpdatePassword,
  onCleanUpDemoFiles,
  demoFilesCount = 0,
  onCleanUpDiaryAndTasks,
  diaryTasksCount = { sessions: 0, tasks: 0 }
}) => {
  const [isCleaningDemo, setIsCleaningDemo] = useState(false);
  const [showConfirmClean, setShowConfirmClean] = useState(false);
  const [isCleaningDiaryTasks, setIsCleaningDiaryTasks] = useState(false);
  const [showConfirmDiaryTasks, setShowConfirmDiaryTasks] = useState(false);
  const [formData, setFormData] = useState<SystemSettings>({
    ...settings,
    firmInitials: settings.firmInitials || currentFirm?.firmInitials || settings.fileNumberPrefix || currentFirm?.fileNumberPrefix || 'NTA',
    fileNumberPrefix: settings.fileNumberPrefix || currentFirm?.fileNumberPrefix || settings.firmInitials || currentFirm?.firmInitials || 'NTA',
    fileNumberFormatPattern: settings.fileNumberFormatPattern || currentFirm?.fileNumberFormatPattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}',
    fileNumberPadding: settings.fileNumberPadding !== undefined ? settings.fileNumberPadding : (currentFirm?.fileNumberPadding !== undefined ? currentFirm.fileNumberPadding : 2),
    fileNumberDelimiter: settings.fileNumberDelimiter || currentFirm?.fileNumberDelimiter || '/',
    includeCaseTypeInFileNumber: settings.includeCaseTypeInFileNumber !== undefined ? settings.includeCaseTypeInFileNumber : (currentFirm?.includeCaseTypeInFileNumber !== false),
    preliminaryStartingNumber: settings.preliminaryStartingNumber !== undefined ? settings.preliminaryStartingNumber : (currentFirm?.preliminaryStartingNumber !== undefined ? currentFirm.preliminaryStartingNumber : 1),
    preliminaryNextNumber: settings.preliminaryNextNumber !== undefined ? settings.preliminaryNextNumber : (currentFirm?.preliminaryNextNumber !== undefined ? currentFirm.preliminaryNextNumber : 8),
    preliminaryYear: settings.preliminaryYear !== undefined ? settings.preliminaryYear : (currentFirm?.preliminaryYear || new Date().getFullYear()),
    annualSequenceReset: settings.annualSequenceReset !== undefined ? settings.annualSequenceReset : (currentFirm?.annualSequenceReset !== false)
  });

  const [newStation, setNewStation] = useState('');
  const [newCabinet, setNewCabinet] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [stationCategoryFilter, setStationCategoryFilter] = useState<CourtCategory | 'ALL'>('ALL');

  // Filtered court stations for management view
  const filteredCourtStations = useMemo(() => {
    return formData.courtStations.filter(st => {
      const matchesSearch = !stationSearchQuery.trim() || st.toLowerCase().includes(stationSearchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (stationCategoryFilter === 'ALL') return true;
      const cat = getCourtCategoryByName(st);
      return cat === stationCategoryFilter;
    });
  }, [formData.courtStations, stationSearchQuery, stationCategoryFilter]);

  const handleResetToKenyaCourts = () => {
    if (window.confirm('Reset court stations to the full official Kenya Judiciary directory (~250 courts organized by type)?')) {
      setFormData({
        ...formData,
        courtStations: DEFAULT_KENYA_COURT_STATIONS
      });
    }
  };

  // Interactive Live Example Sandbox States
  const [sampleCaseType, setSampleCaseType] = useState('Succession & Probate');
  const [sampleSeqNum, setSampleSeqNum] = useState<number>(formData.preliminaryStartingNumber !== undefined ? formData.preliminaryStartingNumber : 8);
  const [sampleYear, setSampleYear] = useState<string>(String(new Date().getFullYear()));
  const [isCustomPattern, setIsCustomPattern] = useState(
    !FILE_NUMBER_FORMAT_PRESETS.some(p => p.pattern === (formData.fileNumberFormatPattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}'))
  );
  const [copiedExample, setCopiedExample] = useState(false);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Compute real-time live preview
  const effectiveInitials = (formData.firmInitials || formData.fileNumberPrefix || 'NTA').trim().toUpperCase();
  const effectivePattern = formData.fileNumberFormatPattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}';
  const effectivePadding = formData.fileNumberPadding !== undefined ? formData.fileNumberPadding : 2;
  const effectiveDelimiter = formData.fileNumberDelimiter || '/';
  const effectiveIncludeCaseType = formData.includeCaseTypeInFileNumber !== false;

  const liveExampleNumber = buildFormattedFileNumber({
    firmInitials: effectiveInitials,
    caseTypeOrCategory: sampleCaseType,
    sequenceNumber: sampleSeqNum,
    year: sampleYear,
    pattern: effectivePattern,
    padding: effectivePadding,
    delimiter: effectiveDelimiter,
    includeCaseType: effectiveIncludeCaseType
  });

  const handleCopyExample = () => {
    navigator.clipboard.writeText(liveExampleNumber);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  const handlePresetSelect = (presetPattern: string) => {
    if (presetPattern === 'custom') {
      setIsCustomPattern(true);
    } else {
      setIsCustomPattern(false);
      setFormData(prev => ({
        ...prev,
        fileNumberFormatPattern: presetPattern
      }));
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      setPasswordError(passCheck.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (currentUser?.password && currentPassword !== currentUser.password) {
      setPasswordError('Incorrect current password provided.');
      return;
    }

    if (currentUser && onUpdatePassword) {
      onUpdatePassword(currentUser.id, newPassword);
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } else {
      setPasswordError('Unable to update password.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = (formData.firmInitials || formData.fileNumberPrefix || 'NTA').trim().toUpperCase();
    
    const updatedSettings: SystemSettings = {
      ...formData,
      firmInitials: initials,
      fileNumberPrefix: initials
    };

    onSaveSettings(updatedSettings);

    if (currentFirm && onUpdateFirm) {
      const updatedFirm: LawFirmProfile = {
        ...currentFirm,
        firmInitials: initials,
        fileNumberPrefix: initials,
        fileNumberFormatPattern: updatedSettings.fileNumberFormatPattern,
        fileNumberPadding: updatedSettings.fileNumberPadding,
        fileNumberDelimiter: updatedSettings.fileNumberDelimiter,
        includeCaseTypeInFileNumber: updatedSettings.includeCaseTypeInFileNumber,
        preliminaryStartingNumber: updatedSettings.preliminaryStartingNumber,
        preliminaryNextNumber: updatedSettings.preliminaryNextNumber,
        preliminaryYear: updatedSettings.preliminaryYear,
        annualSequenceReset: updatedSettings.annualSequenceReset,
        firmName: updatedSettings.firmName,
        registrationNumber: updatedSettings.firmRegistrationNumber || currentFirm.registrationNumber,
        cityOrBranch: updatedSettings.cityOrBranch || currentFirm.cityOrBranch
      };
      onUpdateFirm(updatedFirm);
    }

    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleAddStation = () => {
    if (!newStation.trim()) return;
    setFormData({
      ...formData,
      courtStations: [...formData.courtStations, newStation.trim()]
    });
    setNewStation('');
  };

  const handleRemoveStation = (idx: number) => {
    const updated = [...formData.courtStations];
    updated.splice(idx, 1);
    setFormData({ ...formData, courtStations: updated });
  };

  const handleAddCabinet = () => {
    if (!newCabinet.trim()) return;
    setFormData({
      ...formData,
      cabinets: [...formData.cabinets, newCabinet.trim()]
    });
    setNewCabinet('');
  };

  const handleRemoveCabinet = (idx: number) => {
    const updated = [...formData.cabinets];
    updated.splice(idx, 1);
    setFormData({ ...formData, cabinets: updated });
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-5 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="w-5 h-5 text-[#C9A227]" />
          <h2 className="font-serif font-bold text-lg text-white">System & Firm Settings</h2>
        </div>

        {savedMsg && (
          <div className="px-3 py-1 bg-emerald-950/90 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Saved
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Workspace Theme & Display Appearance */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#C9A227]" />
              Display Theme & Accessibility
            </h3>
            <span className="text-[11px] text-amber-300 font-mono">Daylight / Low-Light Support</span>
          </div>

          <p className="text-xs text-slate-300">
            Switch between the deep dark theme and high-contrast light mode to optimize readability in brightly lit court offices or client conference rooms.
          </p>

          <SettingsThemeSelector />
        </div>

        {/* Brand Identity Card */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C9A227]" />
            Firm Details
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Firm Name</label>
              <input
                type="text"
                required
                value={formData.firmName}
                onChange={e => setFormData({ ...formData, firmName: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-serif font-bold text-sm focus:border-[#C9A227]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Firm Code</label>
              <input
                type="text"
                value={formData.firmCode || ''}
                onChange={e => setFormData({ ...formData, firmCode: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono font-bold focus:border-[#C9A227]"
                placeholder="e.g. NTA-ADV-001"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Registration #</label>
              <input
                type="text"
                value={formData.firmRegistrationNumber || ''}
                onChange={e => setFormData({ ...formData, firmRegistrationNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono focus:border-[#C9A227]"
                placeholder="e.g. LR/2026/001"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
              />
            </div>
          </div>
        </div>

        {/* FILE NUMBERING FORMAT CONFIGURATION */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/40 p-5 shadow-xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#C9A227]" />
              <span>File Numbering Format</span>
            </h3>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{liveExampleNumber}</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Left Column */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-200 mb-1">
                  Firm Initials / Prefix
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NTA"
                  value={formData.firmInitials || formData.fileNumberPrefix || ''}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setFormData({ ...formData, firmInitials: val, fileNumberPrefix: val });
                  }}
                  maxLength={6}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-sm rounded-xl focus:border-[#C9A227] tracking-wider"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Pattern Preset</span>
                </label>
                <select
                  value={isCustomPattern ? 'custom' : (formData.fileNumberFormatPattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}')}
                  onChange={e => handlePresetSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono focus:border-[#C9A227]"
                >
                  {FILE_NUMBER_FORMAT_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.pattern}>
                      {preset.name}
                    </option>
                  ))}
                  <option value="custom">Custom Pattern...</option>
                </select>
              </div>

              {isCustomPattern && (
                <div className="p-2.5 bg-slate-950 border border-amber-800/60 rounded-xl space-y-1">
                  <input
                    type="text"
                    value={formData.fileNumberFormatPattern || ''}
                    onChange={e => setFormData({ ...formData, fileNumberFormatPattern: e.target.value })}
                    placeholder="{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}"
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-lg focus:border-[#C9A227]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Padding</label>
                  <select
                    value={formData.fileNumberPadding !== undefined ? formData.fileNumberPadding : 2}
                    onChange={e => setFormData({ ...formData, fileNumberPadding: parseInt(e.target.value, 10) })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg text-xs focus:border-[#C9A227]"
                  >
                    <option value={2}>2 Digits (01, 08)</option>
                    <option value={3}>3 Digits (001, 008)</option>
                    <option value={4}>4 Digits (0001, 0008)</option>
                    <option value={0}>Unpadded (1, 8)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Delimiter</label>
                  <select
                    value={formData.fileNumberDelimiter || '/'}
                    onChange={e => setFormData({ ...formData, fileNumberDelimiter: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg text-xs font-mono focus:border-[#C9A227]"
                  >
                    <option value="/">Slash ( / )</option>
                    <option value="-">Hyphen ( - )</option>
                    <option value=".">Dot ( . )</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Include Matter Category Abbreviation</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.includeCaseTypeInFileNumber !== false}
                  onChange={e => setFormData({ ...formData, includeCaseTypeInFileNumber: e.target.checked })}
                  className="w-4 h-4 accent-[#C9A227] cursor-pointer"
                />
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-3">
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-white text-xs flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-[#C9A227]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Sequence Counters</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Year: {new Date().getFullYear()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 text-[11px]">
                      Starting Sequence #
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={formData.preliminaryStartingNumber !== undefined ? formData.preliminaryStartingNumber : 1}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setFormData({ ...formData, preliminaryStartingNumber: val });
                      }}
                      className="w-full p-2 bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs rounded-lg focus:border-[#C9A227]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 text-[11px]">
                      Current Sequence #
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={formData.preliminaryNextNumber !== undefined ? formData.preliminaryNextNumber : 8}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setFormData({ ...formData, preliminaryNextNumber: val });
                      }}
                      className="w-full p-2 bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold text-xs rounded-lg focus:border-[#C9A227]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Annual Reset (Jan 1)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.annualSequenceReset !== false}
                    onChange={e => setFormData({ ...formData, annualSequenceReset: e.target.checked })}
                    className="w-4 h-4 accent-[#C9A227] cursor-pointer"
                  />
                </div>
              </div>

              {/* Quick Preview Box */}
              <div className="p-3 bg-slate-950 rounded-xl border border-[#C9A227]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Live Preview</span>
                  <button
                    type="button"
                    onClick={handleCopyExample}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold flex items-center gap-1"
                  >
                    {copiedExample ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#C9A227]" />}
                    <span>{copiedExample ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="font-mono font-bold text-lg text-amber-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-center">
                  {liveExampleNumber}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <select
                    value={sampleCaseType}
                    onChange={e => setSampleCaseType(e.target.value)}
                    className="p-1.5 bg-slate-900 border border-slate-700 text-slate-200 rounded text-xs"
                  >
                    {SAMPLE_CASE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={sampleSeqNum}
                    onChange={e => setSampleSeqNum(parseInt(e.target.value, 10) || 1)}
                    className="p-1.5 bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs rounded"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Change Password */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#C9A227]" />
              <span>Change Password</span>
            </h3>
            {currentUser && (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                {currentUser.fullName}
              </span>
            )}
          </div>

          {passwordError && (
            <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-300 rounded-lg text-xs font-bold">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full p-2 pr-8 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono text-xs focus:border-[#C9A227]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2 pr-8 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono text-xs focus:border-[#C9A227]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono text-xs focus:border-[#C9A227]"
              />
            </div>
          </div>

          <PasswordRequirementsChecklist password={newPassword} />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleChangePassword}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Lock className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>Update Password</span>
            </button>
          </div>
        </div>

        {/* Court Stations Directory */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#C9A227]" />
              <h3 className="font-serif font-bold text-sm text-white">
                Kenya Court Stations Directory ({formData.courtStations.length} Active Stations)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleResetToKenyaCourts}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-[#C9A227]/40 rounded-lg text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Official Kenya Directory</span>
            </button>
          </div>

          {/* Add custom station */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new court station or sub-registry..."
              value={newStation}
              onChange={e => setNewStation(e.target.value)}
              className="flex-1 p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl text-xs focus:border-[#C9A227]"
            />
            <button
              type="button"
              onClick={handleAddStation}
              className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded-xl cursor-pointer text-xs transition"
            >
              Add Station
            </button>
          </div>

          {/* Search and Category Filter Tabs */}
          <div className="space-y-2 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stationSearchQuery}
                onChange={e => setStationSearchQuery(e.target.value)}
                placeholder="Filter stations by name, town or county..."
                className="w-full pl-8 pr-7 py-2 bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl text-xs focus:outline-none focus:border-[#C9A227]"
              />
              {stationSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStationSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setStationCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                  stationCategoryFilter === 'ALL'
                    ? 'bg-[#C9A227] text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({formData.courtStations.length})
              </button>
              {KENYA_COURT_CATEGORIES.map(cat => {
                const countInFirm = formData.courtStations.filter(s => getCourtCategoryByName(s) === cat.category).length;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => setStationCategoryFilter(cat.category)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                      stationCategoryFilter === cat.category
                        ? 'bg-[#C9A227] text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat.shortLabel} ({countInFirm})
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Court Stations */}
          <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 p-1">
            {filteredCourtStations.length > 0 ? (
              filteredCourtStations.map((cs, idx) => {
                const cat = getCourtCategoryByName(cs);
                const catMeta = KENYA_COURT_CATEGORIES.find(c => c.category === cat);
                const originalIdx = formData.courtStations.indexOf(cs);
                return (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs hover:bg-slate-900/70 rounded-lg group">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-slate-200 font-medium truncate">{cs}</span>
                      {catMeta && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border shrink-0 ${catMeta.badgeColor}`}>
                          {catMeta.shortLabel}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStation(originalIdx)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer"
                      title="Remove station"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                No court stations match filter "{stationSearchQuery || stationCategoryFilter}"
              </div>
            )}
          </div>
        </div>

        {/* Registry Cabinets */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl space-y-3">
          <h3 className="font-serif font-bold text-sm text-white border-b border-slate-800 pb-2">
            Registry Cabinets
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add cabinet..."
              value={newCabinet}
              onChange={e => setNewCabinet(e.target.value)}
              className="flex-1 p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
            />
            <button
              type="button"
              onClick={handleAddCabinet}
              className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded cursor-pointer text-xs"
            >
              Add
            </button>
          </div>

          <div className="divide-y divide-slate-800 max-h-40 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40">
            {formData.cabinets.map((cab, idx) => (
              <div key={idx} className="p-2 flex items-center justify-between text-xs hover:bg-slate-900/60">
                <span className="font-mono font-bold text-[#C9A227]">{cab}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCabinet(idx)}
                  className="p-1 text-red-400 hover:bg-red-950/60 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Database Maintenance & Demo Cleanup */}
        {onCleanUpDemoFiles && (
          <div className="bg-[#081729] rounded-2xl border border-rose-500/40 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Demo Data Cleanup & Registry Maintenance</h3>
                  <p className="text-xs text-slate-400">Permanently purge pre-seeded demonstration client files from your system</p>
                </div>
              </div>
              {demoFilesCount > 0 ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/60">
                  {demoFilesCount} demo records detected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Registry Clean
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If your registry contains pre-seeded demo files (e.g. Apex Hauliers Kenya Ltd, Dr. Beatrice Wanjiru, Bahari Logistics, etc.), this one-time cleanup will permanently purge them from your local browser storage, backend server, and cloud database, leaving exclusively your firm's genuine client files.
            </p>

            {showConfirmClean ? (
              <div className="p-4 bg-rose-950/50 border border-rose-500/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Are you sure you want to permanently delete all {demoFilesCount > 0 ? demoFilesCount : ''} demonstration files?</span>
                </div>
                <p className="text-[11px] text-rose-300/80">
                  This action cannot be undone. Authentic files registered for your firm will be preserved.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCleaningDemo}
                    onClick={async () => {
                      setIsCleaningDemo(true);
                      try {
                        await onCleanUpDemoFiles();
                        setShowConfirmClean(false);
                      } finally {
                        setIsCleaningDemo(false);
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCleaningDemo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Purging Demo Records...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Yes, Permanently Delete Demo Files</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isCleaningDemo}
                    onClick={() => setShowConfirmClean(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowConfirmClean(true)}
                  className="px-4 py-2 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-600/50 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clean Up All Demo Files {demoFilesCount > 0 ? `(${demoFilesCount})` : ''}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Diary & Task Management Zero-State Sync */}
        {onCleanUpDiaryAndTasks && (
          <div className="bg-[#081729] rounded-2xl border border-amber-500/40 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Court Diary & Task Management Zero-State Sync</h3>
                  <p className="text-xs text-slate-400">Reset diary hearings and task management items to align with an empty registry</p>
                </div>
              </div>
              {((diaryTasksCount?.sessions || 0) > 0 || (diaryTasksCount?.tasks || 0) > 0) ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/60">
                  {diaryTasksCount.sessions} sessions, {diaryTasksCount.tasks} tasks
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Zero State Active (0 Files / 0 Stray Records)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When the physical file registry is empty or after clearing demo files, court hearings and chaser tasks should contain zero records. This action immediately wipes any stray court sessions, cause list entries, and task items across local storage, backend server memory, and Firebase Firestore.
            </p>

            {showConfirmDiaryTasks ? (
              <div className="p-4 bg-amber-950/50 border border-amber-500/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Reset court diary and task management to 0 files / 0 records?</span>
                </div>
                <p className="text-[11px] text-amber-300/80">
                  All active court hearing sessions and case chaser tasks will be permanently wiped to achieve an authentic zero-state.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCleaningDiaryTasks}
                    onClick={async () => {
                      setIsCleaningDiaryTasks(true);
                      try {
                        await onCleanUpDiaryAndTasks();
                        setShowConfirmDiaryTasks(false);
                      } finally {
                        setIsCleaningDiaryTasks(false);
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCleaningDiaryTasks ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Purging Diary & Tasks...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Yes, Reset Diary & Tasks to 0</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isCleaningDiaryTasks}
                    onClick={() => setShowConfirmDiaryTasks(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowConfirmDiaryTasks(true)}
                  className="px-4 py-2 bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 hover:text-white border border-amber-600/50 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clean Up Diary & Tasks to Zero State</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security & Save */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
            <span className="font-bold text-white text-xs">Mandatory 2FA for Administrators</span>
            <input
              type="checkbox"
              checked={formData.requireTwoFactor}
              onChange={e => setFormData({ ...formData, requireTwoFactor: e.target.checked })}
              className="w-4 h-4 accent-[#C9A227]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
};
