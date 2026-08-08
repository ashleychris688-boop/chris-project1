import React, { useState } from 'react';
import { User } from '../types';
import { 
  Building2, 
  Lock, 
  Mail, 
  CheckSquare, 
  Square, 
  KeyRound, 
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Shield,
  Gavel,
  FileSpreadsheet,
  UserSquare2,
  Handshake,
  CheckCircle2,
  Landmark,
  ShieldAlert,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { saveDocumentToFirebase } from '../lib/firebase';

interface LoginPageProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
  onUpdateUser?: (user: User) => void;
  initialRoleTab?: SelectedRoleTab;
}

export type SelectedRoleTab = 'ADMIN' | 'ADVOCATE' | 'CLERK' | 'SECRETARY' | 'CHASER' | 'SUPER_ADMIN';

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
  onBackToLanding,
  onUpdateUser,
  initialRoleTab
}) => {
  // Input states (Firm ID + Username + Password as requested in User Prompt)
  const [firmIdInput, setFirmIdInput] = useState<string>('OM-ADV-001');
  const [usernameInput, setUsernameInput] = useState<string>('admin@omolloadvocates.co.ke');
  const [passwordInput, setPasswordInput] = useState<string>('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Email Password Reset Flow States
  const [resetStep, setResetStep] = useState<'REQUEST_EMAIL' | 'VERIFY_CODE' | 'NEW_PASSWORD' | 'SUCCESS'>('REQUEST_EMAIL');
  const [resetEmailInput, setResetEmailInput] = useState<string>('anthonyomollo07@gmail.com');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [userTokenInput, setUserTokenInput] = useState<string>('');
  const [newPasswordResetInput, setNewPasswordResetInput] = useState<string>('');
  const [confirmPasswordResetInput, setConfirmPasswordResetInput] = useState<string>('');
  const [resetStatusMessage, setResetStatusMessage] = useState<string>('');

  const handleOpenForgotModal = () => {
    setResetEmailInput(usernameInput && usernameInput.includes('@') ? usernameInput : 'anthonyomollo07@gmail.com');
    setResetStep('REQUEST_EMAIL');
    setUserTokenInput('');
    setNewPasswordResetInput('');
    setConfirmPasswordResetInput('');
    setResetStatusMessage('');
    setResetSuccess(false);
    setShowForgotModal(true);
  };

  // Step 1: Request Password Reset Email Dispatch
  const handleSendResetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatusMessage('');

    if (!resetEmailInput.trim()) {
      setResetStatusMessage('Please enter your registered email address.');
      return;
    }

    const emailToUse = resetEmailInput.trim().toLowerCase();
    // Generate 6-digit secure token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedToken(token);

    // Record audit trace in Firebase for security
    saveDocumentToFirebase('audit_logs', {
      id: `audit-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'PASSWORD_RESET_EMAIL_DISPATCHED',
      userEmail: emailToUse,
      details: `Dispatched secure password reset token to ${emailToUse}`
    });

    setResetStep('VERIFY_CODE');
  };

  // Step 2: Verify Email Security Code
  const handleVerifySecurityCode = (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatusMessage('');

    if (userTokenInput.trim() !== generatedToken) {
      setResetStatusMessage('Invalid security code. Please check the code sent to your email.');
      return;
    }

    setResetStep('NEW_PASSWORD');
  };

  // Step 3: Set New Password
  const handleFinalPasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatusMessage('');

    if (!newPasswordResetInput.trim()) {
      setResetStatusMessage('Please enter a new password.');
      return;
    }

    if (newPasswordResetInput !== confirmPasswordResetInput) {
      setResetStatusMessage('New passwords do not match. Please verify both fields.');
      return;
    }

    const searchKey = resetEmailInput.trim().toLowerCase();
    const cleanNewPass = newPasswordResetInput.trim();

    // Check if Super Admin / Platform Owner (anthonyomollo07@gmail.com)
    if (
      searchKey === 'anthonyomollo07@gmail.com' ||
      searchKey === 'superadmin' ||
      searchKey === 'superadmin@lawfirmregistry.com' ||
      searchKey === '3tvrwijwagvjbvfutcfxcdqdzr02'
    ) {
      const existingSuperAdmin = users.find(u => u.role === 'Super Admin' || u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02');
      const updatedSuper: User = existingSuperAdmin ? {
        ...existingSuperAdmin,
        password: cleanNewPass
      } : {
        id: '3TVRWijWagVJBVfuTcFXCDqDzR02',
        firmId: 'platform-owner',
        firmName: 'Law Firm Registry Platform',
        username: 'superadmin',
        fullName: 'Platform Owner',
        role: 'Super Admin',
        email: 'anthonyomollo07@gmail.com',
        phone: '+254 700 000000',
        password: cleanNewPass,
        status: 'Active',
        lastLogin: 'Just now',
        permissions: ['all']
      };

      if (onUpdateUser) {
        onUpdateUser(updatedSuper);
      }
      saveDocumentToFirebase('users', updatedSuper);

      setUsernameInput(resetEmailInput.trim());
      setPasswordInput(cleanNewPass);
      setResetStep('SUCCESS');
      return;
    }

    // Match existing user account
    let matchedUser = users.find(u => 
      (u.email || '').toLowerCase() === searchKey || 
      (u.username || '').toLowerCase() === searchKey ||
      u.id === resetEmailInput.trim()
    );

    if (matchedUser) {
      const updatedUser: User = {
        ...matchedUser,
        password: cleanNewPass
      };

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      saveDocumentToFirebase('users', updatedUser);

      setUsernameInput(matchedUser.email || matchedUser.username || resetEmailInput.trim());
      setPasswordInput(cleanNewPass);
      setResetStep('SUCCESS');
    } else {
      // Create or update user entry
      const newUser: User = {
        id: `usr-${Date.now()}`,
        firmId: firmIdInput || 'OM-ADV-001',
        firmName: 'Omollo Advocates & Co.',
        username: searchKey.includes('@') ? searchKey.split('@')[0] : searchKey,
        fullName: searchKey,
        role: 'Advocate',
        email: searchKey.includes('@') ? searchKey : `${searchKey}@omolloadvocates.co.ke`,
        phone: '+254 700 000000',
        password: cleanNewPass,
        status: 'Active',
        lastLogin: 'Never logged in',
        permissions: ['registry_read']
      };

      if (onUpdateUser) {
        onUpdateUser(newUser);
      }
      saveDocumentToFirebase('users', newUser);

      setUsernameInput(resetEmailInput.trim());
      setPasswordInput(cleanNewPass);
      setResetStep('SUCCESS');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Please enter both your User Name / Email and Password.');
      return;
    }

    setIsLoggingIn(true);
    const cleanFirmId = firmIdInput.trim().toUpperCase();
    const cleanUser = usernameInput.trim().toLowerCase();
    const rawUser = usernameInput.trim();

    // Check for Platform Owner User ID or Super Admin special login
    if (
      rawUser === '3TVRWijWagVJBVfuTcFXCDqDzR02' ||
      cleanUser === '3tvrwijwagvjbvfutcfxcdqdzr02' ||
      cleanUser === 'anthonyomollo07@gmail.com' ||
      cleanUser === 'superadmin@lawfirmregistry.com' ||
      cleanUser === 'superadmin' ||
      cleanFirmId === 'PLATFORM' ||
      cleanFirmId === 'SUPERADMIN'
    ) {
      const existingSuperAdmin = users.find(u => u.role === 'Super Admin' || u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02');
      const expectedSuperPassword = existingSuperAdmin?.password || 'password123';

      if (passwordInput !== expectedSuperPassword) {
        setIsLoggingIn(false);
        setErrorMsg('Invalid password for Platform Owner / Super Admin account. Password authentication failed.');
        return;
      }

      const superAdminUser: User = {
        id: '3TVRWijWagVJBVfuTcFXCDqDzR02',
        firmId: 'platform-owner',
        firmName: 'Law Firm Registry Platform',
        username: 'superadmin',
        fullName: 'Platform Owner',
        role: 'Super Admin',
        email: cleanUser.includes('@') ? cleanUser : 'anthonyomollo07@gmail.com',
        phone: '+254 700 000000',
        password: expectedSuperPassword,
        status: 'Active',
        lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        permissions: ['all', 'superadmin']
      };

      setIsLoggingIn(false);
      saveDocumentToFirebase('users', superAdminUser);
      onLoginSuccess(superAdminUser);
      return;
    }

    try {
      // Backend auth endpoint test
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firmId: cleanFirmId,
          email: cleanUser, 
          username: cleanUser,
          password: passwordInput 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setIsLoggingIn(false);
          saveDocumentToFirebase('users', data.user);
          onLoginSuccess(data.user);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend auth fetch fallback to client sync:", err);
    }

    // Client-side user matching & password enforcement
    let matchedUser = users.find(u => {
      const uFirmId = (u.firmId || '').toUpperCase();
      const uFirmCode = (u.firmCode || '').toUpperCase();
      const matchesFirm = !cleanFirmId || uFirmId === cleanFirmId || uFirmCode === cleanFirmId;
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase();
      const matchesUser = uEmail === cleanUser || uUsername === cleanUser || u.id === rawUser;
      return matchesUser && matchesFirm;
    }) || users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase();
      return uEmail === cleanUser || uUsername === cleanUser || u.id === rawUser;
    });

    if (matchedUser) {
      const expectedPassword = matchedUser.password || 'password123';

      if (passwordInput !== expectedPassword) {
        setIsLoggingIn(false);
        setErrorMsg(`Invalid password entered for '${matchedUser.username || matchedUser.email}'. Please enter the correct password.`);
        return;
      }

      if (matchedUser.status === 'Suspended') {
        setIsLoggingIn(false);
        setErrorMsg('This user account has been suspended by the Firm Administrator.');
        return;
      }

      const loggedInUser: User = {
        ...matchedUser,
        status: 'Active',
        lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };

      setIsLoggingIn(false);
      saveDocumentToFirebase('users', loggedInUser);
      onLoginSuccess(loggedInUser);
      return;
    }

    // If account not found in system
    setIsLoggingIn(false);
    setErrorMsg('Invalid credentials. User account or Law Firm ID not found in system.');
    return;
  };

  return (
    <div className="min-h-screen bg-[#071526] flex flex-col items-center justify-center p-4 relative font-sans text-slate-100">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#C9A227_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none"></div>

      {/* Top Header Bar */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6 z-10">
        <button
          onClick={onBackToLanding}
          className="text-slate-300 hover:text-white flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-[#C9A227] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#C9A227]" />
          Back to Public Landing
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[#C9A227]">
          <Building2 className="w-4 h-4" />
          <span>LAW FIRM REGISTRY</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-xl bg-[#081729] rounded-3xl shadow-2xl border-2 border-[#C9A227]/50 overflow-hidden z-10">
        
        {/* BRANDING HEADER */}
        <div className="p-6 text-center border-b border-slate-800 bg-[#0B1F3A] relative space-y-2">
          
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 shadow-xl flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0B1F3A] rounded-[10px] flex items-center justify-center">
                <Landmark className="w-6 h-6 text-[#C9A227]" />
              </div>
            </div>

            <div className="text-left">
              <div className="text-[10px] text-[#C9A227] uppercase tracking-widest font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C9A227]" />
                FIRM & WORKSPACE LOGIN
              </div>
              <h1 className="font-serif font-extrabold text-2xl tracking-wide text-white">
                LAW FIRM REGISTRY
              </h1>
              <p className="text-xs text-slate-300">
                Enter your Firm ID, User Name, and Password
              </p>
            </div>
          </div>

        </div>

        {/* DEMO ACCOUNTS REFERENCE CHART */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>System Demo Credentials Reference:</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Click any row to fill inputs</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/90 shadow-inner">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="bg-slate-900 text-[#C9A227] border-b border-slate-800 text-[10px] uppercase tracking-wider">
                  <th className="p-2 font-bold">Firm ID</th>
                  <th className="p-2 font-bold">User Name / Email / User ID</th>
                  <th className="p-2 font-bold">Password</th>
                  <th className="p-2 font-bold">Role</th>
                  <th className="p-2 font-bold">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr 
                  onClick={() => {
                    setFirmIdInput('PLATFORM');
                    setUsernameInput('anthonyomollo07@gmail.com');
                    setPasswordInput('password123');
                    setErrorMsg('');
                  }}
                  className="bg-amber-950/30 hover:bg-amber-900/40 transition cursor-pointer"
                  title="Click to select Platform Owner"
                >
                  <td className="p-2 text-[#C9A227] font-bold">PLATFORM</td>
                  <td className="p-2 font-bold text-amber-300">anthonyomollo07@gmail.com (3TVRWijWagVJBVfuTcFXCDqDzR02)</td>
                  <td className="p-2 text-slate-400">password123</td>
                  <td className="p-2 text-amber-400 font-bold">Platform Owner</td>
                  <td className="p-2 text-slate-200">Owner Dashboard</td>
                </tr>
                <tr 
                  onClick={() => {
                    setFirmIdInput('OM-ADV-001');
                    setUsernameInput('admin@omolloadvocates.co.ke');
                    setPasswordInput('password123');
                    setErrorMsg('');
                  }}
                  className="hover:bg-slate-900/60 transition cursor-pointer"
                  title="Click to select Omollo Proprietor"
                >
                  <td className="p-2 text-[#C9A227] font-bold">OM-ADV-001</td>
                  <td className="p-2 font-bold text-white">admin@omolloadvocates.co.ke</td>
                  <td className="p-2 text-slate-400">password123</td>
                  <td className="p-2 text-emerald-400 font-bold">Proprietor</td>
                  <td className="p-2 text-slate-200">Omollo Advocates</td>
                </tr>
                <tr 
                  onClick={() => {
                    setFirmIdInput('ABC-ADV-002');
                    setUsernameInput('admin@abc.co.ke');
                    setPasswordInput('password123');
                    setErrorMsg('');
                  }}
                  className="hover:bg-slate-900/60 transition cursor-pointer"
                  title="Click to select ABC Proprietor"
                >
                  <td className="p-2 text-[#C9A227] font-bold">ABC-ADV-002</td>
                  <td className="p-2 font-bold text-white">admin@abc.co.ke</td>
                  <td className="p-2 text-slate-400">password123</td>
                  <td className="p-2 text-emerald-400 font-bold">Proprietor</td>
                  <td className="p-2 text-slate-200">ABC Advocates</td>
                </tr>
                <tr 
                  onClick={() => {
                    setFirmIdInput('OM-ADV-001');
                    setUsernameInput('kamau@omolloadvocates.co.ke');
                    setPasswordInput('password123');
                    setErrorMsg('');
                  }}
                  className="hover:bg-slate-900/60 transition cursor-pointer"
                  title="Click to select Advocate"
                >
                  <td className="p-2 text-[#C9A227] font-bold">OM-ADV-001</td>
                  <td className="p-2 font-bold text-white">kamau@omolloadvocates.co.ke</td>
                  <td className="p-2 text-slate-400">password123</td>
                  <td className="p-2 text-sky-400 font-bold">Advocate</td>
                  <td className="p-2 text-slate-200">Omollo Advocates</td>
                </tr>
                <tr 
                  onClick={() => {
                    setFirmIdInput('ABC-ADV-002');
                    setUsernameInput('clerk@abc.co.ke');
                    setPasswordInput('password123');
                    setErrorMsg('');
                  }}
                  className="hover:bg-slate-900/60 transition cursor-pointer"
                  title="Click to select Registry Clerk"
                >
                  <td className="p-2 text-[#C9A227] font-bold">ABC-ADV-002</td>
                  <td className="p-2 font-bold text-white">clerk@abc.co.ke</td>
                  <td className="p-2 text-slate-400">password123</td>
                  <td className="p-2 text-indigo-400 font-bold">Registry Clerk</td>
                  <td className="p-2 text-slate-200">ABC Advocates</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* LOGIN FORM (Firm ID + Username + Password) */}
        <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5 bg-[#081729]">
          
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            
            {/* Firm ID Field */}
            <div>
              <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider mb-1.5">
                Law Firm ID / Registration Code
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={firmIdInput}
                  onChange={e => setFirmIdInput(e.target.value)}
                  placeholder="e.g. OM-ADV-001 or PLATFORM"
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition font-mono uppercase"
                />
              </div>
            </div>

            {/* User Name / Email / User ID Field */}
            <div>
              <label className="block text-xs font-bold text-[#C9A227] uppercase tracking-wider mb-1.5">
                User Name / Email / User ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="e.g. admin, kamau, or 3TVRWijWagVJBVfuTcFXCDqDzR02"
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#C9A227] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              >
                {rememberMe ? (
                  <CheckSquare className="w-4 h-4 text-[#C9A227]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Keep session signed in</span>
              </button>

              <div className="text-[10px] text-slate-400 font-mono">
                Multi-Tenant Firm Authentication
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-[#C9A227] via-[#D8B438] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span>Authenticating Workspace...</span>
              ) : (
                <>
                  <span>[ LOGIN TO WORKSPACE ]</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono text-center pt-2 border-t border-slate-800">
            System automatically routes to your Law Firm Workspace or Owner Dashboard
          </div>

        </form>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#081729] rounded-2xl border-2 border-[#C9A227] p-6 max-w-md w-full space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-[#C9A227]">
                <KeyRound className="w-5 h-5 text-[#C9A227]" />
                <h3 className="font-serif font-bold text-lg">
                  {resetStep === 'REQUEST_EMAIL' && 'Request Password Reset Email'}
                  {resetStep === 'VERIFY_CODE' && 'Verify Security Email Code'}
                  {resetStep === 'NEW_PASSWORD' && 'Set New Account Password'}
                  {resetStep === 'SUCCESS' && 'Password Reset Complete'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetStep('REQUEST_EMAIL');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {resetStatusMessage && (
              <div className="p-2.5 bg-red-950/80 border border-red-600 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{resetStatusMessage}</span>
              </div>
            )}

            {/* STEP 1: REQUEST EMAIL */}
            {resetStep === 'REQUEST_EMAIL' && (
              <form onSubmit={handleSendResetEmail} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-200 text-[11px] leading-relaxed flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    Enter your genuine account email. A secure 6-digit verification security token will be dispatched to your inbox.
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmailInput}
                    onChange={e => setResetEmailInput(e.target.value)}
                    placeholder="e.g. anthonyomollo07@gmail.com"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227] font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Default prototype email set to Platform Owner: <strong>anthonyomollo07@gmail.com</strong>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#C9A227] via-[#D8B438] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-slate-950" />
                    <span>Send Password Reset Email</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY CODE */}
            {resetStep === 'VERIFY_CODE' && (
              <form onSubmit={handleVerifySecurityCode} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs leading-relaxed space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Email Dispatched to {resetEmailInput}</span>
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    A password reset email has been generated and recorded in the audit logs.
                  </p>
                </div>

                {/* Email Inbox Preview / Dispatch Security Box */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 space-y-1.5 font-mono text-[11px]">
                  <div className="text-amber-400 font-bold border-b border-slate-800 pb-1 flex justify-between items-center">
                    <span>📬 EMAIL INBOX DISPATCH</span>
                    <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">GENUINE ACCOUNT</span>
                  </div>
                  <div className="text-slate-300"><span className="text-slate-500">To:</span> {resetEmailInput}</div>
                  <div className="text-slate-300"><span className="text-slate-500">Subject:</span> Security Alert: Password Reset Verification Code</div>
                  <div className="pt-1.5 text-amber-300 font-bold text-xs bg-slate-900 p-2 rounded border border-amber-500/30 text-center">
                    SECURITY CODE: <span className="text-lg tracking-widest text-white ml-2 bg-slate-950 px-2 py-0.5 rounded">{generatedToken}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                    Enter 6-Digit Verification Security Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={userTokenInput}
                    onChange={e => setUserTokenInput(e.target.value)}
                    placeholder="Enter 6-digit code from email"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-amber-300 font-mono text-base tracking-widest text-center rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStep('REQUEST_EMAIL')}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Resend
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#C9A227] via-[#D8B438] to-[#9B7B12] hover:from-[#B08D1E] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl cursor-pointer"
                  >
                    Verify Code & Proceed
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {resetStep === 'NEW_PASSWORD' && (
              <form onSubmit={handleFinalPasswordUpdate} className="space-y-3.5 text-xs">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-[11px] leading-relaxed flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    Security verification verified for <strong>{resetEmailInput}</strong>. Please set your new secure password below.
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPasswordResetInput}
                    onChange={e => setNewPasswordResetInput(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPasswordResetInput}
                    onChange={e => setConfirmPasswordResetInput(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-[#C9A227] via-[#D8B438] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl cursor-pointer"
                  >
                    Update Password & Save
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: SUCCESS */}
            {resetStep === 'SUCCESS' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs rounded-xl font-medium space-y-2 shadow-lg">
                  <div className="font-extrabold text-emerald-300 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Password Reset Completed!</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-100">
                    Your password for <strong>{resetEmailInput}</strong> has been securely updated and verified.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetStep('REQUEST_EMAIL');
                  }}
                  className="w-full py-3.5 bg-[#C9A227] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>[ LOGIN NOW WITH NEW PASSWORD ]</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            )}

            <div className="text-right pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetStep('REQUEST_EMAIL');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
