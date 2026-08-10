import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { 
  Settings as SettingsIcon, 
  Building2, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2,
  Save,
  Lock
} from 'lucide-react';

interface SettingsModuleProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onResetData: () => void;
  onClearDataForProduction?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onClearDataForProduction
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [newStation, setNewStation] = useState('');
  const [newCabinet, setNewCabinet] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
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
            <h2 className="font-serif font-bold text-xl text-white">System Preferences & Configuration</h2>
          </div>
          <p className="text-slate-300 text-xs mt-1">
            Configure firm brand identity, default court stations, physical cabinets & security policies.
          </p>
        </div>

        {savedMsg && (
          <div className="px-3 py-1.5 bg-emerald-950/80 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1 border border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved
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
                placeholder="e.g. OM-ADV-001"
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

        {/* System File Numbering Scheme */}
        <div className="bg-[#081729] rounded-2xl border border-[#C9A227]/30 p-6 shadow-xl space-y-4">
          <h3 className="font-serif font-bold text-base text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
              Internal File Numbering Scheme
            </span>
            <span className="text-[11px] font-mono font-normal text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-800">
              Pattern: {formData.fileNumberPrefix || 'NGA'}/001/{new Date().getFullYear()}
            </span>
          </h3>

          <div className="grid md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Firm File Number Prefix <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NGA"
                value={formData.fileNumberPrefix || 'NGA'}
                onChange={e => setFormData({ ...formData, fileNumberPrefix: e.target.value.toUpperCase() })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-base rounded-lg focus:border-[#C9A227]"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Admin set default prefix. Formats file numbers as <strong className="text-slate-200 font-mono">{formData.fileNumberPrefix || 'NGA'}/[Number]/[Year]</strong>.
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-[#C9A227] flex items-center gap-1">
                <span>⚡ System-Generated Yearly Reset Rules</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Internal numbers are sequentially generated per calendar year so that file numbers are never shared across different years or duplicated. The year automatically changes annually (e.g. <span className="font-mono text-slate-200">{(formData.fileNumberPrefix || 'NGA') + '/001/' + new Date().getFullYear()}</span>).
              </p>
            </div>
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

          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all file records, movements & settings back to initial pre-seeded data?')) {
                    onResetData();
                  }
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Reset Sample Data
              </button>

              {onClearDataForProduction && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Wipe all sample files, movements, court dates & test records to start with a fresh blank workspace for your actual firm data?')) {
                      onClearDataForProduction();
                    }
                  }}
                  className="px-3.5 py-2 bg-red-950/90 hover:bg-red-900 text-red-200 font-extrabold rounded-xl border border-red-700 transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  Wipe Sample Data (Clean Production Slate)
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C9A227] text-slate-950 font-extrabold text-xs rounded-xl shadow hover:bg-[#B08D1E] transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save System Settings
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
