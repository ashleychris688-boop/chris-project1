import React, { useState } from 'react';
import { LawFirmProfile, User } from '../types';
import { 
  Building2, 
  Landmark, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ArrowRight, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
import { saveDocumentToFirebase } from '../lib/firebase';

interface RegisterFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFirmRegistered: (newFirm: LawFirmProfile, proprietorUser: User) => void;
}

const KENYA_COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Uasin Gishu (Eldoret)',
  'Kiambu',
  'Machakos',
  'Nyeri',
  'Kilifi',
  'Meru',
  'Kakamega',
  'Kericho',
  'Bungoma',
  'Kajiado',
  'Murang\'a',
  'Garissa'
];

export const RegisterFirmModal: React.FC<RegisterFirmModalProps> = ({
  isOpen,
  onClose,
  onFirmRegistered
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [firmName, setFirmName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [proprietorName, setProprietorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [county, setCounty] = useState('Nairobi');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [createdFirm, setCreatedFirm] = useState<LawFirmProfile | null>(null);
  const [createdProprietor, setCreatedProprietor] = useState<User | null>(null);

  if (!isOpen) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firmName.trim() || !proprietorName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields marked with *');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    // Auto-generate Firm ID and Code
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const firmId = `LFR${randomDigits}`;
    const initials = firmName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
    const firmCode = `${initials}-ADV-${Math.floor(100 + Math.random() * 900)}`;

    const newFirm: LawFirmProfile = {
      id: firmId,
      firmName: firmName.trim(),
      firmCode: firmCode,
      registrationNumber: registrationNumber.trim() || `LR/2026/${Math.floor(100 + Math.random() * 900)}`,
      proprietorName: proprietorName.trim(),
      cityOrBranch: `${county} HQ`,
      physicalAddress: physicalAddress.trim() || `Suite 101, Legal Chambers, ${county}`,
      country: country,
      county: county,
      adminUsername: proprietorName.trim().split(' ')[0] || 'Proprietor',
      email: email.trim(),
      phone: phone.trim() || '+254 700 000000',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Active',
      subscriptionTier: 'Professional',
      subscriptionStatus: 'Active',
      activeUsersCount: 1,
      activeCasesCount: 0,
      totalFilesCount: 0,
      monthlyFeeKsh: 25000
    };

    const proprietorUser: User = {
      id: `usr-prop-${Date.now()}`,
      firmId: firmId,
      firmName: firmName.trim(),
      username: email.split('@')[0] || 'proprietor',
      fullName: `${proprietorName.trim()} (Proprietor)`,
      role: 'Proprietor',
      email: email.trim(),
      phone: phone.trim() || '+254 700 000000',
      password: password,
      status: 'Active',
      lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      permissions: ['all']
    };

    saveDocumentToFirebase('law_firms', newFirm);
    saveDocumentToFirebase('users', proprietorUser);

    setCreatedFirm(newFirm);
    setCreatedProprietor(proprietorUser);
    setStep(2);
  };

  const handleLaunchWorkspace = () => {
    if (createdFirm && createdProprietor) {
      onFirmRegistered(createdFirm, createdProprietor);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#081729] rounded-3xl border-2 border-[#C9A227]/60 shadow-2xl max-w-2xl w-full p-6 sm:p-8 text-slate-100 my-8 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#C9A227] text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 shadow-xl flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#081729] rounded-[14px] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#C9A227]" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#C9A227] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
              MULTI-TENANT LAW FIRM ONBOARDING
            </div>
            <h2 className="font-serif font-extrabold text-2xl text-white">
              {step === 1 ? 'Register Your Law Firm Workspace' : 'Workspace Created Successfully!'}
            </h2>
          </div>
        </div>

        {/* STEP 1: FORM */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-xl font-semibold flex items-center gap-2">
                <X className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              
              {/* Firm Name */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Law Firm Name *
                </label>
                <div className="relative">
                  <Landmark className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Advocates & Legal Consultants"
                    value={firmName}
                    onChange={e => setFirmName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Registration Number (Optional) */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  LSK Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. LSK/2026/088"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* Proprietor Name */}
              <div>
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Proprietor / Managing Partner *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adv. Jane Wanjiku"
                    value={proprietorName}
                    onChange={e => setProprietorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Official Firm Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@abc.co.ke"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Telephone / Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. +254 712 345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Physical Address */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-300 mb-1">
                  Physical Office Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Suite 802, Upper Hill Legal Towers, Hospital Road"
                    value={physicalAddress}
                    onChange={e => setPhysicalAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* County */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">County / Region</label>
                <select
                  value={county}
                  onChange={e => setCounty(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                >
                  {KENYA_COUNTIES.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Admin Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Create Law Firm Workspace</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: CREATED WORKSPACE SUMMARY */}
        {step === 2 && createdFirm && createdProprietor && (
          <div className="space-y-6">
            
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-white">Your Workspace Is Live & Provisioned!</h4>
                <p>The Proprietor Account has been registered with administrative privileges for this workspace.</p>
              </div>
            </div>

            {/* Generated Details Grid */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Assigned Firm ID</span>
                  <p className="text-lg font-mono font-bold text-[#C9A227]">{createdFirm.id}</p>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Firm Code / Ref</span>
                  <p className="text-lg font-mono font-bold text-white">{createdFirm.firmCode}</p>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Law Firm Workspace</span>
                  <p className="text-sm font-bold text-white">{createdFirm.firmName}</p>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Proprietor Administrator</span>
                  <p className="text-sm font-bold text-amber-300">{createdProprietor.fullName}</p>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Administrator Login Email</span>
                  <p className="text-xs font-mono text-slate-200">{createdProprietor.email}</p>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">County & Branch</span>
                  <p className="text-xs font-semibold text-slate-200">{createdFirm.county}, {createdFirm.cityOrBranch}</p>
                </div>
              </div>
            </div>

            {/* Direct Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Proprietor credentials are active & verified</span>
              </div>

              <button
                onClick={handleLaunchWorkspace}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#C9A227] to-[#B08D1E] hover:from-[#B08D1E] hover:to-[#967616] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>[ Launch {createdFirm.firmName.toUpperCase()} Workspace ]</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
