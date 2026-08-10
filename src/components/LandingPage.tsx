import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  FolderCheck, 
  Scale, 
  FileSearch, 
  Building, 
  CircleDollarSign, 
  Lock,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  PlusCircle,
  LogIn,
  Landmark,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
  onOpenRegisterFirm: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGoToLogin,
  onOpenRegisterFirm
}) => {
  return (
    <div className="min-h-screen bg-[#071526] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="bg-[#081729] text-white border-b border-[#C9A227]/40 py-4 px-6 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#081729] rounded-[7px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#C9A227]" />
              </div>
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg tracking-wider text-white">LAW FIRM REGISTRY</h1>
              <p className="text-[11px] text-[#C9A227]">Physical File & Litigation Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRegisterFirm}
              className="px-4 py-2 rounded-lg border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227]/10 font-bold text-xs tracking-wide transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Law Firm</span>
            </button>

            <button
              onClick={onGoToLogin}
              className="px-5 py-2 rounded-lg bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-extrabold text-xs tracking-wider uppercase transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section (Reflecting user spec UI layout) */}
      <section className="bg-gradient-to-b from-[#081729] via-[#0B1F3A] to-[#071526] text-white py-16 px-6 relative overflow-hidden border-b-2 border-[#C9A227]/40">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/60 text-[#C9A227] text-xs font-mono font-bold tracking-wider uppercase mb-2">
            <ShieldCheck className="w-4 h-4" /> Multi-Tenant Legal SaaS Platform
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            LAW FIRM REGISTRY
          </h2>

          <p className="text-xl sm:text-2xl text-[#C9A227] font-serif italic">
            Physical File & Litigation Management System
          </p>

          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
            Secure multi-tenant workspace for legal practices. Track physical file movements, court hearing diaries, upcoming lists, insurance claims, and chaser commissions with 100% data isolation.
          </p>

          {/* User Requested Call-to-Actions Box */}
          <div className="pt-4 max-w-lg mx-auto bg-[#081729]/90 p-6 rounded-2xl border border-[#C9A227]/40 shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenRegisterFirm}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#9B7B12] hover:from-[#B08D1E] hover:to-[#84680F] text-slate-950 font-black text-xs tracking-wider uppercase transition shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-slate-950" />
                <span>[ Register Your Law Firm ]</span>
              </button>

              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 border-2 border-[#C9A227]/60 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#C9A227]" />
                <span>[ Login ]</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-mono text-center">
              Already have an account? Simply click Login to access your firm workspace.
            </p>

          </div>

          <div className="text-xs text-slate-400 font-mono pt-2 flex flex-wrap items-center justify-center gap-4">
            <span>• Multi-Tenant Isolation</span>
            <span>• Role-Based Security</span>
            <span>• Real-Time Audit Logs</span>
            <span>• Complete Court Station Mapping</span>
          </div>

        </div>
      </section>

      {/* About & Core Capabilities */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="font-serif text-2xl font-bold text-[#C9A227] mb-3">Multi-Tenant Legal Platform Architecture</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Every law firm receives an isolated, dedicated workspace with custom registration codes, firm profiles, and staff role permissions (Proprietors, Advocates, Clerks, Secretaries, and Case Chasers). Data is isolated at the database level so each law firm only sees its own files and court records.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#081729] p-6 rounded-xl border border-[#C9A227]/30 shadow-xl hover:border-[#C9A227]/60 transition">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F3A] border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mb-4">
              <FolderCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white mb-2">Physical File Tracker</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Track physical file locations across Registry Cabinets A–E, Advocate Desks, Court Rooms, and Insurance Offices with timestamped check-in/out registers.
            </p>
          </div>

          <div className="bg-[#081729] p-6 rounded-xl border border-[#C9A227]/30 shadow-xl hover:border-[#C9A227]/60 transition">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F3A] border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white mb-2">Court Diary & Outcomes</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Consolidated daily and weekly court hearing schedules, assigned advocates, magistrates, and post-court outcome registers with next hearing date tracking.
            </p>
          </div>

          <div className="bg-[#081729] p-6 rounded-xl border border-[#C9A227]/30 shadow-xl hover:border-[#C9A227]/60 transition">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F3A] border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mb-4">
              <FileSearch className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white mb-2">Upcoming Lists</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Automated weekly retrieval lists grouped by Court Station and Court Number so registry staff retrieve every required physical file before court.
            </p>
          </div>

          <div className="bg-[#081729] p-6 rounded-xl border border-[#C9A227]/30 shadow-xl hover:border-[#C9A227]/60 transition">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F3A] border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white mb-2">Insurance Claim Tracker</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Monitor negotiation offers, signed consent forms, cheque processing statuses, and pending insurance payments across all insurance firms.
            </p>
          </div>

          <div className="bg-[#081729] p-6 rounded-xl border border-[#C9A227]/30 shadow-xl hover:border-[#C9A227]/60 transition">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F3A] border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mb-4">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white mb-2">Commission & Cheques</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Transparent tracking of case chaser commission rates, settlement amounts, payout histories, and pending cheque release dates.
            </p>
          </div>

          <div className="bg-[#081729] p-6 rounded-xl border border-[#C9A227]/30 shadow-xl hover:border-[#C9A227]/60 transition">
            <div className="w-12 h-12 rounded-lg bg-[#0B1F3A] border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-white mb-2">Role Permissions & Audit</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Granular role-based security for Proprietor, Advocates, Secretaries, Clerks, and Case Chasers with complete audit trails for every file movement.
            </p>
          </div>
        </div>

        {/* Confidentiality Notice */}
        <div className="bg-[#0B1F3A] text-white p-6 rounded-xl border border-[#C9A227]/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-lg text-[#C9A227]">Enterprise Legal Compliance & Isolation</h4>
            <p className="text-slate-300 text-xs">
              Built in strict adherence to Advocates Act guidelines and Advocates Practice Rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRegisterFirm}
              className="px-6 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shrink-0 cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#050F1B] border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 Law Firm Registry Platform. All Rights Reserved.
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Multi-Tenant Law Firm Physical File & Litigation System
          </div>
        </div>
      </footer>

    </div>
  );
};
