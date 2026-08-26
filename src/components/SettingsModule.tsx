import React, { useState } from 'react';
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
  FileText,
  Sliders,
  Copy,
  Check,
  Tag,
  RefreshCw,
  Info
} from 'lucide-react';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';
import {
  FILE_NUMBER_FORMAT_PRESETS,
  getCaseTypeAbbreviation,
  buildFormattedFileNumber,
  formatSequenceNumber
} from '../utils/fileNumberUtils';

interface SettingsModuleProps {
  settings: SystemSettings;
  currentFirm?: LawFirmProfile | null;
  currentUser?: User | null;
  onSaveSettings: (settings: SystemSettings) => void;
  onUpdateFirm?: (firm: LawFirmProfile) => void;
  onResetData: () => void;
  onClearDataForProduction?: () => void;
  onUpdatePassword?: (userId: string, newPassword: string) => void;
}

const SAMPLE_CASE_CATEGORIES = [
  'Succession & Probate',
  'Civil Litigation',
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
  onUpdatePassword
}) => {
  // Initialize form data merging settings and firm profile properties
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

  // Compute real-time live preview for sample case type
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

  const directExampleNumber = buildFormattedFileNumber({
    firmInitials: effectiveInitials,
    caseTypeOrCategory: sampleCaseType,
    sequenceNumber: 42,
    year: sampleYear,
    pattern: effectivePattern,
    padding: effectivePadding,
    delimiter: effectiveDelimiter,
    includeCaseType: effectiveIncludeCaseType
  });

  const sampleCaseAbbr = effectiveIncludeCaseType ? getCaseTypeAbbreviation(sampleCaseType) : '';
  const sampleFormattedSeq = formatSequenceNumber(sampleSeqNum, effectivePadding);

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
      setPasswordSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } else {
      setPasswordError('Unable to update password. Session user not found.');
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

    // Also update firm profile if present
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
    setTimeout(() => setSavedMsg(false), 3000);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#081729] p-6 rounded-2xl border border-[#C9A227]/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#C9A227]" />
            <h2 className="font-serif font-bold text-xl text-white">System Preferences & Proprietor Settings</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Configure firm brand identity, internal file numbering format rules, default court stations & physical cabinets.
          </p>
        </div>

        {savedMsg && (
          <div className="px-3 py-1.5 bg-emerald-950/90 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-emerald-700 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Settings Saved & Applied
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Brand Identity Card */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C9A227]" />
            Firm Identity & Branding
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Firm Title</label>
              <input
                type="text"
                required
                value={formData.firmName}
                onChange={e => setFormData({ ...formData, firmName: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-serif font-bold text-sm focus:border-[#C9A227]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Firm Code / Ref</label>
              <input
                type="text"
                value={formData.firmCode || ''}
                onChange={e => setFormData({ ...formData, firmCode: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono font-bold focus:border-[#C9A227]"
                placeholder="e.g. NTA-ADV-001"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Law Society Reg #</label>
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
              <label className="block font-bold text-slate-300 mb-1">Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded font-mono focus:border-[#C9A227]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded focus:border-[#C9A227]"
              />
            </div>
          </div>
        </div>

        {/* PROPRIETOR INTERNAL FILE NUMBERING FORMAT & LIVE EXAMPLES */}
        <div className="bg-[#081729] rounded-2xl border-2 border-[#C9A227]/60 p-6 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle glowing backdrop highlight */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#C9A227]" />
                <span>Internal File Numbering System & Format Configuration</span>
              </h3>
              <p className="text-slate-300 text-xs mt-0.5">
                Set and customize your firm's file code structure, matter category abbreviations, sequential numbering, and view real-time live examples.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-3 py-1 rounded-lg border border-amber-800 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Active Format: <strong className="text-white">{liveExampleNumber}</strong></span>
              </span>
            </div>
          </div>

          {/* Configuration Controls Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            
            {/* Left Column: Format Pattern, Delimiter, Padding */}
            <div className="space-y-4">
              
              {/* Firm Initials / Acronym */}
              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span>Firm Initials / Acronym <span className="text-red-400">*</span></span>
                  <span className="text-[11px] font-normal text-slate-400">Leading prefix on all files</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NTA, HVA, KMM"
                  value={formData.firmInitials || formData.fileNumberPrefix || ''}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setFormData({ ...formData, firmInitials: val, fileNumberPrefix: val });
                  }}
                  maxLength={6}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-base rounded-xl focus:border-[#C9A227] tracking-wider"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Appears at the start of physical file tags and barcode covers (e.g. <strong className="text-slate-200 font-mono">{effectiveInitials}</strong>).
                </p>
              </div>

              {/* Format Pattern Presets */}
              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>File Number Format Pattern</span>
                </label>
                <select
                  value={isCustomPattern ? 'custom' : (formData.fileNumberFormatPattern || '{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}')}
                  onChange={e => handlePresetSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono focus:border-[#C9A227]"
                >
                  {FILE_NUMBER_FORMAT_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.pattern}>
                      {preset.name} — e.g. {preset.example}
                    </option>
                  ))}
                  <option value="custom">Custom Format Pattern...</option>
                </select>
              </div>

              {/* Custom Pattern Editor (if custom selected) */}
              {isCustomPattern && (
                <div className="p-3 bg-slate-950 border border-amber-800/60 rounded-xl space-y-1.5">
                  <label className="block text-[11px] font-bold text-amber-300">
                    Custom Pattern String (Tokens: {'{INITIALS}'}, {'{CASE_TYPE}'}, {'{NUMBER}'}, {'{YEAR}'})
                  </label>
                  <input
                    type="text"
                    value={formData.fileNumberFormatPattern || ''}
                    onChange={e => setFormData({ ...formData, fileNumberFormatPattern: e.target.value })}
                    placeholder="{INITIALS}/{CASE_TYPE}/{NUMBER}/{YEAR}"
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-lg focus:border-[#C9A227]"
                  />
                  <p className="text-[10px] text-slate-400">
                    Available tags: <code className="text-amber-300 font-mono">{'{INITIALS}'}</code>, <code className="text-amber-300 font-mono">{'{CASE_TYPE}'}</code>, <code className="text-amber-300 font-mono">{'{NUMBER}'}</code>, <code className="text-amber-300 font-mono">{'{YEAR}'}</code>
                  </p>
                </div>
              )}

              {/* Leading Zero Padding & Delimiter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Number Padding</label>
                  <select
                    value={formData.fileNumberPadding !== undefined ? formData.fileNumberPadding : 2}
                    onChange={e => setFormData({ ...formData, fileNumberPadding: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl text-xs focus:border-[#C9A227]"
                  >
                    <option value={2}>2 Digits (e.g. 01, 08, 42) [Default]</option>
                    <option value={3}>3 Digits (e.g. 001, 008, 042)</option>
                    <option value={4}>4 Digits (e.g. 0001, 0008, 0042)</option>
                    <option value={0}>Unpadded (e.g. 1, 8, 42)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Standard Delimiter</label>
                  <select
                    value={formData.fileNumberDelimiter || '/'}
                    onChange={e => setFormData({ ...formData, fileNumberDelimiter: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono focus:border-[#C9A227]"
                  >
                    <option value="/">Slash ( / ) [Standard]</option>
                    <option value="-">Hyphen ( - )</option>
                    <option value=".">Dot ( . )</option>
                  </select>
                </div>
              </div>

              {/* Include Case Type Abbreviation Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>Include Case Category Abbreviation</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Auto-derives SUCC, LIT, COMM, CONV, FAM, CRIM, INS, ELC, ELRC based on matter type.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.includeCaseTypeInFileNumber !== false}
                  onChange={e => setFormData({ ...formData, includeCaseTypeInFileNumber: e.target.checked })}
                  className="w-4 h-4 accent-[#C9A227] cursor-pointer"
                />
              </div>

            </div>

            {/* Right Column: Sequence Counters & Annual Reset */}
            <div className="space-y-4">
              
              {/* Preliminary Starting Number & Current Active Counter */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="font-serif font-bold text-white text-xs flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-[#C9A227]">
                    <Layers className="w-4 h-4" />
                    <span>Sequential Number Counters</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Active Year: {new Date().getFullYear()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      className="w-full p-2 bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-sm rounded-lg focus:border-[#C9A227]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Counter initial start value (e.g. 1 or 8).
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 text-[11px]">
                      Active Year Next Number
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
                      className="w-full p-2 bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold text-sm rounded-lg focus:border-[#C9A227]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Current sequence in {new Date().getFullYear()}.
                    </p>
                  </div>
                </div>

                {/* Annual Reset Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div>
                    <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Annual Sequence Reset (Jan 1st)</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Automatically reset counter to Starting Number on new calendar year.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.annualSequenceReset !== false}
                    onChange={e => setFormData({ ...formData, annualSequenceReset: e.target.checked })}
                    className="w-4 h-4 accent-[#C9A227] cursor-pointer"
                  />
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="font-bold text-[#C9A227] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>How This Format Is Applied Across Modules</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  When Case Chasers or Registry Staff capture new preliminary matters in the <strong className="text-slate-200">Unprocessed Intake Bucket</strong> or register cases in the <strong className="text-slate-200">Registry Module</strong>, the system formats the internal file reference strictly adhering to this proprietor pattern.
                </p>
              </div>

            </div>

          </div>

          {/* INTERACTIVE REAL-TIME LIVE EXAMPLE & SANDBOX */}
          <div className="bg-gradient-to-br from-slate-950 via-[#06111e] to-slate-950 p-5 rounded-2xl border border-[#C9A227]/40 shadow-inner space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A227]" />
                <h4 className="font-serif font-bold text-sm text-white">
                  Real-Time Live Example & Interactive Format Preview
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Interactive preview updates instantly as you adjust options
              </span>
            </div>

            {/* Big Highlighted Live Format Display */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-amber-400/90 uppercase block mb-1">
                  Live Preliminary File Number Format
                </span>
                <div className="font-mono font-extrabold text-2xl text-white tracking-wide flex items-center gap-2 flex-wrap">
                  <span className="text-[#C9A227]">{liveExampleNumber}</span>
                  <span className="text-[10px] font-sans font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md">
                    Valid
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleCopyExample}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Copy sample file number"
                >
                  {copiedExample ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>Copy Example</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Sandbox Parameters: Case Category Selector, Test Sequence, Test Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Test Case Category
                </label>
                <select
                  value={sampleCaseType}
                  onChange={e => setSampleCaseType(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-xs font-medium focus:border-[#C9A227]"
                >
                  {SAMPLE_CASE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Test Sequence #
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={sampleSeqNum}
                  onChange={e => setSampleSeqNum(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs rounded-lg focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Test Year
                </label>
                <input
                  type="text"
                  value={sampleYear}
                  onChange={e => setSampleYear(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-slate-200 font-mono font-bold text-xs rounded-lg focus:border-[#C9A227]"
                />
              </div>

            </div>

            {/* Segment Breakdown Anatomy Badges */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Format Anatomy & Segment Breakdown
              </span>
              
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                
                <div className="px-2.5 py-1 bg-amber-950/60 border border-amber-800 text-amber-300 rounded-lg flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-400 font-sans font-bold">1. Initials:</span>
                  <span className="font-extrabold text-white">{effectiveInitials}</span>
                </div>

                {effectiveIncludeCaseType && (
                  <div className="px-2.5 py-1 bg-blue-950/60 border border-blue-800 text-blue-300 rounded-lg flex items-center gap-1.5">
                    <span className="text-[10px] text-blue-400 font-sans font-bold">2. Case Abbr:</span>
                    <span className="font-extrabold text-white">{sampleCaseAbbr || 'SUCC'}</span>
                  </div>
                )}

                <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg flex items-center gap-1.5">
                  <span className="text-[10px] text-emerald-400 font-sans font-bold">3. Sequence:</span>
                  <span className="font-extrabold text-white">{sampleFormattedSeq}</span>
                </div>

                <div className="px-2.5 py-1 bg-purple-950/60 border border-purple-800 text-purple-300 rounded-lg flex items-center gap-1.5">
                  <span className="text-[10px] text-purple-400 font-sans font-bold">4. Year:</span>
                  <span className="font-extrabold text-white">{sampleYear}</span>
                </div>

              </div>
            </div>

            {/* Side-by-Side Comparison: Preliminary Intake vs Direct Registered File */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <FileText className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Preliminary Matter Intake Example</span>
                </div>
                <div className="font-mono font-bold text-sm text-white">
                  {liveExampleNumber}
                </div>
                <div className="text-[10px] text-slate-400">
                  Assigned automatically to incoming unsourced client records during preliminary onboarding.
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Registry File Example (e.g. #42)</span>
                </div>
                <div className="font-mono font-bold text-sm text-white">
                  {directExampleNumber}
                </div>
                <div className="text-[10px] text-slate-400">
                  Formatted when registering court cases directly or converting preliminary matters.
                </div>
              </div>

            </div>

            {/* Real-time Multi-Category Reference Grid */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sample File Numbers Across Common Practice Areas
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  { cat: 'Succession & Probate', name: 'Probate / Succession' },
                  { cat: 'Civil Litigation', name: 'Civil Litigation' },
                  { cat: 'Conveyancing', name: 'Conveyancing / Land' },
                  { cat: 'Commercial & Corporate', name: 'Commercial Dispute' },
                  { cat: 'Motor Accident / Insurance', name: 'Insurance / RTA' },
                  { cat: 'Family Law', name: 'Family & Divorce' }
                ].map((item, idx) => {
                  const exampleNum = buildFormattedFileNumber({
                    firmInitials: effectiveInitials,
                    caseTypeOrCategory: item.cat,
                    sequenceNumber: idx === 0 ? sampleSeqNum : (idx * 15 + 3),
                    year: sampleYear,
                    pattern: effectivePattern,
                    padding: effectivePadding,
                    delimiter: effectiveDelimiter,
                    includeCaseType: effectiveIncludeCaseType
                  });

                  return (
                    <div key={idx} className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate mr-2">{item.name}</span>
                      <span className="font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] whitespace-nowrap">
                        {exampleNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* User Account Security - Change Password */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/40 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#C9A227]" />
              <span>User Security & Change Password</span>
            </h3>
            {currentUser && (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800">
                Account: {currentUser.fullName} ({currentUser.role})
              </span>
            )}
          </div>

          <p className="text-slate-300 text-xs">
            Update your account login password. Ensure your password is at least 6 characters and contains a mix of letters and numbers.
          </p>

          {passwordError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2.5 pr-9 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:border-[#C9A227]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  placeholder="Min. 6 characters"
                  className="w-full p-2.5 pr-9 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:border-[#C9A227]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl font-mono text-xs focus:border-[#C9A227]"
              />
            </div>
          </div>

          <PasswordRequirementsChecklist password={newPassword} />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleChangePassword}
              className="px-5 py-2 bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-950" />
              <span>Update Password</span>
            </button>
          </div>
        </div>

        {/* Court Stations Management */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2">
            Default Court Stations Directory
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new court station (e.g. Kisumu High Court Commercial)"
              value={newStation}
              onChange={e => setNewStation(e.target.value)}
              className="flex-1 p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
            />
            <button
              type="button"
              onClick={handleAddStation}
              className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded cursor-pointer"
            >
              Add Station
            </button>
          </div>

          <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40">
            {formData.courtStations.map((cs, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900/60">
                <span className="font-semibold text-slate-200">{cs}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveStation(idx)}
                  className="p-1 text-red-400 hover:bg-red-950/60 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Registry Cabinets Management */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2">
            Physical Registry Cabinets Configuration
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add physical cabinet (e.g. Cabinet F - Admiralty Vault)"
              value={newCabinet}
              onChange={e => setNewCabinet(e.target.value)}
              className="flex-1 p-2 bg-slate-950 border border-slate-700 text-slate-100 rounded text-xs focus:border-[#C9A227]"
            />
            <button
              type="button"
              onClick={handleAddCabinet}
              className="px-4 py-2 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold rounded cursor-pointer"
            >
              Add Cabinet
            </button>
          </div>

          <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40">
            {formData.cabinets.map((cab, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900/60">
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

        {/* Security & Data Reset */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
            Security & System Reset Controls
          </h3>

          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-white">Mandatory 2FA for Administrators</div>
              <div className="text-slate-400 text-[11px]">Require two-factor authentication codes for Proprietor sessions.</div>
            </div>
            <input
              type="checkbox"
              checked={formData.requireTwoFactor}
              onChange={e => setFormData({ ...formData, requireTwoFactor: e.target.checked })}
              className="w-4 h-4 accent-[#C9A227]"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#B08D1E] hover:from-[#B08D1E] hover:to-[#8F7014] text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save System & Format Settings</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
