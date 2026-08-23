import React, { useState, useRef } from 'react';
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
  ArrowLeft,
  Globe, 
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';
import { saveFirmToFirebase, saveUserToFirebase } from '../lib/firebase';
import { validatePassword } from '../utils/passwordValidator';
import { PasswordRequirementsChecklist } from './PasswordRequirementsChecklist';

const LEGAL_REGISTRY_FORMAT_REGEX = /^(LSK|LR|LFR|REG|P\.?\d+)\/(19\d{2}|20\d{2}|\d{2})\/(\d{2,6})$/i;

export const validateRegistrationNumber = (value: string): { isValid: boolean; message: string } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: true, message: 'Optional. Leave blank to auto-generate a provisional registration number.' };
  }
  if (LEGAL_REGISTRY_FORMAT_REGEX.test(trimmed)) {
    return { isValid: true, message: 'Verified official legal registry format.' };
  }
  
  if (!/^(LSK|LR|LFR|REG|P\.?\d+)/i.test(trimmed)) {
    return { isValid: false, message: 'Must start with official prefix (e.g. LSK, LR, LFR, REG, or P.105)' };
  }
  if (!trimmed.includes('/')) {
    return { isValid: false, message: 'Format requires slashes (e.g. LSK/2026/088)' };
  }
  return { isValid: false, message: 'Format must follow [PREFIX]/[YEAR]/[NUMBER] (e.g., LSK/2026/088 or LR/2026/101)' };
};

interface RegisterFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFirmRegistered?: (newFirm: LawFirmProfile, proprietorUser: User) => void;
  onSuccess?: (newFirm: LawFirmProfile, proprietorUser: User) => void;
}

const KENYA_COUNTIES = [
  'NAIROBI',
  'MOMBASA',
  'KISUMU',
  'NAKURU',
  'UASIN GISHU (ELDORET)',
  'KIAMBU',
  'MACHAKOS',
  'NYERI',
  'KILIFI',
  'MERU',
  'KAKAMEGA',
  'KERICHO',
  'BUNGOMA',
  'KAJIADO',
  'MURANG\'A',
  'GARISSA'
];

export const RegisterFirmModal: React.FC<RegisterFirmModalProps> = ({
  isOpen,
  onClose,
  onFirmRegistered,
  onSuccess
}) => {
  // Multi-step state (1: Firm Details, 2: Proprietor & Contact, 3: Security & Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form Fields (All transformed to UPPERCASE)
  const [firmName, setFirmName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [proprietorName, setProprietorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [country, setCountry] = useState('KENYA');
  const [county, setCounty] = useState('NAIROBI');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const regValidation = validateRegistrationNumber(registrationNumber);

  if (!isOpen) return null;

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    setErrorMessage('');
    if (!firmName.trim()) {
      setErrorMessage('Please enter the Law Firm Name.');
      scrollToTop();
      return false;
    }
    if (registrationNumber.trim() && !regValidation.isValid) {
      setErrorMessage(`Invalid Registration Number: ${regValidation.message}`);
      scrollToTop();
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    setErrorMessage('');
    if (!proprietorName.trim()) {
      setErrorMessage('Please enter the Proprietor / Managing Partner Name.');
      scrollToTop();
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Official Firm Email address.');
      scrollToTop();
      return false;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter an official phone or mobile number.');
      scrollToTop();
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    setErrorMessage('');
    if (!password.trim()) {
      setErrorMessage('Please create an Admin Password.');
      scrollToTop();
      return false;
    }
    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setErrorMessage(`Password requirement: ${passCheck.message}`);
      scrollToTop();
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and try again.');
      scrollToTop();
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        scrollToTop();
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        scrollToTop();
      }
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    scrollToTop();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setErrorMessage('');

    // Full validation
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      // Auto-generate Firm ID and Code
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const firmId = `LFR${randomDigits}`;
      const initials = firmName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'LFR';
      const firmCode = `${initials}-ADV-${Math.floor(100 + Math.random() * 900)}`;

      const newFirm: LawFirmProfile = {
        id: firmId,
        firmName: firmName.trim(),
        firmCode: firmCode,
        registrationNumber: registrationNumber.trim() || `LSK/2026/${Math.floor(100 + Math.random() * 900)}`,
        proprietorName: proprietorName.trim(),
        cityOrBranch: `${county} HQ`,
        physicalAddress: physicalAddress.trim() || `${county} Legal Chambers`,
        country: country,
        county: county,
        adminUsername: email.trim().split('@')[0] || proprietorName.trim().toLowerCase().replace(/\s+/g, ''),
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
        firmCode: firmCode,
        firmName: firmName.trim(),
        username: email.trim().split('@')[0] || proprietorName.trim().toLowerCase().replace(/\s+/g, ''),
        fullName: proprietorName.trim(),
        role: 'Proprietor',
        email: email.trim(),
        phone: phone.trim() || '+254 700 000000',
        physicalAddress: physicalAddress.trim() || `${county} Legal Chambers`,
        county: county,
        country: country,
        password: password,
        status: 'Active',
        lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        permissions: ['all']
      };

      // 1. Instantly trigger callback to authenticate and open workspace without blocking
      if (onSuccess) {
        onSuccess(newFirm, proprietorUser);
      }
      if (onFirmRegistered) {
        onFirmRegistered(newFirm, proprietorUser);
      }

      // 2. Synchronize to Firebase Firestore in background
      saveFirmToFirebase(newFirm).catch(err => console.warn('Background Firebase firm sync:', err));
      saveUserToFirebase(proprietorUser).catch(err => console.warn('Background Firebase user sync:', err));

      // 3. Clear form state & close modal
      setFirmName('');
      setRegistrationNumber('');
      setProprietorName('');
      setEmail('');
      setPhone('');
      setPhysicalAddress('');
      setPassword('');
      setConfirmPassword('');
      setCurrentStep(1);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Error registering law firm:', err);
      setErrorMessage(err?.message || 'Failed to complete registration. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isStep1Complete = firmName.trim().length > 0 && (!registrationNumber.trim() || regValidation.isValid);
  const isStep2Complete = proprietorName.trim().length > 0 && email.trim().includes('@') && phone.trim().length > 0;
  const isStep3Complete = password.length >= 6 && password === confirmPassword;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-hidden">
      <div 
        id="register-firm-modal-container"
        className="bg-[#081729] sm:rounded-3xl rounded-t-3xl border-t-2 sm:border-2 border-[#C9A227]/60 shadow-2xl max-w-2xl w-full text-slate-100 flex flex-col max-h-[95vh] sm:max-h-[90vh] h-[92vh] sm:h-auto relative animate-in fade-in slide-in-from-bottom-6 duration-200"
      >
        
        {/* Header - Fixed Top */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-[#081729] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 shadow-xl flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#081729] rounded-[14px] flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A227]" />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#C9A227] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C9A227]" />
                  <span>LAW FIRM ONBOARDING</span>
                </div>
                <h2 className="font-serif font-extrabold text-base sm:text-xl text-white leading-tight">
                  Register Your Law Firm
                </h2>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#C9A227] text-slate-400 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Smartphone-Optimized Stepper Tabs */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4">
            
            {/* Step 1 Tab */}
            <button
              type="button"
              onClick={() => { setCurrentStep(1); scrollToTop(); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                currentStep === 1
                  ? 'bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]'
                  : isStep1Complete
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                currentStep === 1
                  ? 'bg-[#C9A227] text-slate-950 font-black'
                  : isStep1Complete
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400'
              }`}>
                {isStep1Complete ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '1'}
              </div>
              <span className="truncate">1. Firm Info</span>
            </button>

            {/* Step 2 Tab */}
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) {
                  setCurrentStep(2);
                  scrollToTop();
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                currentStep === 2
                  ? 'bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]'
                  : isStep2Complete
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                currentStep === 2
                  ? 'bg-[#C9A227] text-slate-950 font-black'
                  : isStep2Complete
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400'
              }`}>
                {isStep2Complete ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '2'}
              </div>
              <span className="truncate">2. Contact</span>
            </button>

            {/* Step 3 Tab */}
            <button
              type="button"
              onClick={() => {
                if (validateStep1() && validateStep2()) {
                  setCurrentStep(3);
                  scrollToTop();
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                currentStep === 3
                  ? 'bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]'
                  : isStep3Complete
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                currentStep === 3
                  ? 'bg-[#C9A227] text-slate-950 font-black'
                  : isStep3Complete
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400'
              }`}>
                {isStep3Complete ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '3'}
              </div>
              <span className="truncate">3. Security</span>
            </button>

          </div>
        </div>

        {/* Scrollable Content Body - Fits 100% on Smartphone screens */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 bg-red-950/90 border border-red-600 text-red-100 text-xs rounded-xl font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= STEP 1: LAW FIRM PROFILE ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span><strong>Step 1 of 3:</strong> Enter your registered practice information.</span>
              </div>

              {/* Firm Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider flex items-center justify-between">
                  <span>LAW FIRM NAME <span className="text-red-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">OFFICIAL REGISTERED PRACTICE NAME</span>
                </label>
                <div className="relative">
                  <Landmark className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A227]" />
                  <input
                    id="input-firm-name"
                    type="text"
                    required
                    placeholder="E.G. OMOLLO & ASSOCIATES ADVOCATES LLP"
                    value={firmName}
                    onChange={e => setFirmName(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-3 bg-slate-950 border-2 border-[#C9A227]/40 focus:border-[#C9A227] text-white uppercase rounded-xl focus:outline-none text-sm sm:text-xs font-semibold placeholder:text-slate-500 shadow-inner"
                  />
                </div>
              </div>

              {/* LSK Registration Number */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-200 text-xs uppercase">
                    LSK / PRACTICE REGISTRATION NUMBER
                  </label>
                  {registrationNumber.trim() && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase ${
                      regValidation.isValid 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' 
                        : 'bg-rose-950 text-rose-400 border border-rose-700/60'
                    }`}>
                      {regValidation.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{regValidation.isValid ? 'VERIFIED' : 'INVALID'}</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <FileCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="E.G. LSK/2026/088 OR LR/2026/101"
                    value={registrationNumber}
                    onChange={e => setRegistrationNumber(e.target.value.toUpperCase())}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 text-white uppercase rounded-xl focus:outline-none transition border text-sm sm:text-xs font-mono tracking-wide ${
                      !registrationNumber.trim() 
                        ? 'border-slate-700 focus:border-[#C9A227]' 
                        : regValidation.isValid 
                          ? 'border-emerald-500 focus:border-emerald-400 text-emerald-200' 
                          : 'border-rose-500 focus:border-rose-400 text-rose-200'
                    }`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                  <span className={regValidation.isValid ? 'text-slate-400' : 'text-rose-400'}>
                    {regValidation.message}
                  </span>
                  {!registrationNumber.trim() && (
                    <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                      <span className="text-slate-500 uppercase">QUICK:</span>
                      <button
                        type="button"
                        onClick={() => setRegistrationNumber('LSK/2026/088')}
                        className="text-[#C9A227] hover:underline font-mono uppercase"
                      >
                        LSK/2026/088
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* County & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">COUNTY / REGION</label>
                  <select
                    value={county}
                    onChange={e => setCounty(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white uppercase rounded-xl focus:outline-none focus:border-[#C9A227] text-sm sm:text-xs"
                  >
                    {KENYA_COUNTIES.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-white uppercase">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">COUNTRY</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white uppercase rounded-xl focus:outline-none focus:border-[#C9A227] text-sm sm:text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">PHYSICAL CHAMBERS ADDRESS</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="E.G. 5TH FLOOR, MEGA PLAZA, OGINGA ODINGA ST, KISUMU"
                    value={physicalAddress}
                    onChange={e => setPhysicalAddress(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white uppercase rounded-xl focus:outline-none focus:border-[#C9A227] text-sm sm:text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PROPRIETOR & CONTACTS ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#C9A227] shrink-0" />
                <span><strong>STEP 2 OF 3:</strong> ENTER MANAGING PARTNER AND OFFICIAL CONTACT INFO.</span>
              </div>

              {/* Proprietor Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider">
                  PROPRIETOR / MANAGING PARTNER <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A227]" />
                  <input
                    id="input-proprietor-name"
                    type="text"
                    required
                    placeholder="E.G. SC ANTHONY OMOLLO"
                    value={proprietorName}
                    onChange={e => setProprietorName(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-3 bg-slate-950 border-2 border-[#C9A227]/40 focus:border-[#C9A227] text-white uppercase rounded-xl focus:outline-none text-sm sm:text-xs font-semibold placeholder:text-slate-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Official Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider">
                  FIRM OFFICIAL / ADMIN EMAIL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-firm-email"
                    type="email"
                    required
                    placeholder="E.G. ADMIN@OMOLLO-LAW.CO.KE"
                    value={email}
                    onChange={e => setEmail(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-[#C9A227] text-white uppercase rounded-xl focus:outline-none text-sm sm:text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 uppercase">THIS EMAIL WILL BE YOUR PRIMARY USERNAME FOR ADMINISTRATOR ACCESS.</p>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  OFFICIAL PHONE / MOBILE <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="E.G. +254 712 345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-[#C9A227] text-white uppercase rounded-xl focus:outline-none text-sm sm:text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SECURITY & ACCESS ================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>STEP 3 OF 3:</strong> SET UP YOUR SECURE ADMINISTRATOR PASSWORD.</span>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider">
                    ADMIN PASSWORD <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227] text-sm sm:text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider">
                    CONFIRM PASSWORD <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-confirm-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-950 border ${
                        confirmPassword
                          ? password === confirmPassword
                            ? 'border-emerald-500'
                            : 'border-red-500'
                          : 'border-slate-700'
                      } text-white rounded-xl focus:outline-none focus:border-[#C9A227] text-sm sm:text-xs`}
                    />
                  </div>
                </div>
              </div>

              {/* Password Checklist */}
              <PasswordRequirementsChecklist password={password} />

              {/* Registration Summary Card */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 uppercase">
                <div className="text-[10px] uppercase font-bold text-[#C9A227] tracking-wider">REGISTRATION SUMMARY:</div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">FIRM:</span>
                  <span className="font-semibold text-white truncate max-w-[200px] uppercase">{firmName || '—'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">PROPRIETOR:</span>
                  <span className="font-semibold text-amber-300 truncate max-w-[200px] uppercase">{proprietorName || '—'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">LOGIN EMAIL:</span>
                  <span className="font-mono text-emerald-400 truncate max-w-[200px] uppercase">{email || '—'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Bar - Fixed at Bottom */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#081729] shrink-0 flex items-center justify-between gap-3">
          {/* Back Button */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          {/* Next / Submit Button */}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentStep === 1 ? 'Next: Contact Details' : 'Next: Security Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Registering...' : 'Register & Enter Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
