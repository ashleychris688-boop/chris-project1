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
  initialRoleTab?: SelectedRoleTab;
}

export type SelectedRoleTab = 'ADMIN' | 'ADVOCATE' | 'CLERK' | 'SECRETARY' | 'CHASER' | 'SUPER_ADMIN';

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
  onBackToLanding,
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
                  onClick={() => setShowForgotModal(true)}
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
          <div className="bg-[#081729] rounded-2xl border border-[#C9A227] p-6 max-w-sm w-full space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-[#C9A227]">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg">Reset Password</h3>
            </div>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs rounded-xl font-medium">
                Password reset link sent to your registered email address.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Enter your registered firm email to receive a password reset link.
                </p>
                <input
                  type="email"
                  defaultValue={usernameInput}
                  placeholder="Enter email"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-[#C9A227]"
                />
                <button
                  type="button"
                  onClick={() => setResetSuccess(true)}
                  className="w-full py-2.5 bg-[#C9A227] text-slate-950 font-bold rounded-xl hover:bg-[#B08D1E]"
                >
                  Send Reset Link
                </button>
              </div>
            )}

            <div className="text-right pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetSuccess(false);
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
