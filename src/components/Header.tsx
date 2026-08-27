import React, { useState } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  Search, 
  LogOut, 
  Building2, 
  ChevronDown,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Menu
} from 'lucide-react';
import { getTimeBasedGreeting } from '../utils/dateUtils';

interface HeaderProps {
  currentUser: User | null;
  allUsers: User[];
  firmName?: string;
  firmCode?: string;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  onSearchQuery?: (query: string) => void;
  onNavigateTab: (tab: string) => void;
  onGoToSuperAdmin?: () => void;
  onManualCloudSync?: () => void;
  lastSyncTime?: string;
  sessionsTodayCount?: number;
  filesOutCount?: number;
  pendingChequesCount?: number;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  firmName = 'Law Firm Registry',
  firmCode = 'LFR-001',
  onSwitchUser,
  onLogout,
  onSearchQuery,
  onNavigateTab,
  onGoToSuperAdmin,
  onManualCloudSync,
  lastSyncTime,
  sessionsTodayCount = 0,
  filesOutCount = 0,
  pendingChequesCount = 0,
  onToggleSidebar
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = () => {
    if (onManualCloudSync) {
      setIsSyncing(true);
      onManualCloudSync();
      setTimeout(() => setIsSyncing(false), 1200);
    }
  };

  const notifications = [
    { id: 1, title: `${sessionsTodayCount} Court Session${sessionsTodayCount === 1 ? '' : 's'} Today`, desc: 'Milimani Commercial & Civil Law Courts scheduled hearings.', type: 'urgent', tab: 'court-diary' },
    { id: 2, title: `${filesOutCount} Physical File${filesOutCount === 1 ? '' : 's'} Out of Registry`, desc: 'Files currently checked out in Court or with Advocates.', type: 'warning', tab: 'file-tracker' },
    { id: 3, title: 'Upcoming List Ready for Friday', desc: 'Retrieval list generated for upcoming week hearings.', type: 'info', tab: 'bring-up' },
    { id: 4, title: `${pendingChequesCount} Pending Cheque${pendingChequesCount === 1 ? '' : 's'} Active`, desc: 'Cheques in transit or awaiting bank clearance.', type: 'success', tab: 'pending-cheques' }
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchQuery) onSearchQuery(val);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Proprietor': return 'bg-[#C9A227] text-slate-900 border-[#C9A227]';
      case 'Advocate': return 'bg-sky-900 text-sky-100 border-sky-700';
      case 'Secretary': return 'bg-purple-900 text-purple-100 border-purple-700';
      case 'Clerk': return 'bg-emerald-900 text-emerald-100 border-emerald-700';
      case 'Case Chaser': return 'bg-amber-900 text-amber-100 border-amber-700';
      default: return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  return (
    <header className="bg-[#081729] text-white sticky top-0 z-30 border-b border-[#C9A227]/30 shadow-xl w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Mobile Menu Button + Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 md:hidden cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-[#C9A227]" />
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => onNavigateTab('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#C9A227] to-[#9B7B12] p-0.5 flex items-center justify-center shadow-inner shrink-0">
              <div className="w-full h-full bg-[#081729] rounded-[7px] flex items-center justify-center">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#C9A227]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-lg tracking-wide text-white font-serif truncate">{firmName}</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40 font-mono font-semibold shrink-0">{firmCode}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 hidden sm:block truncate">Physical File & Litigation Registry Portal</p>
            </div>
          </div>
        </div>


        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search file number (e.g. LFR/2026/0142), client, court, advocate..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-slate-900/80 text-white placeholder-slate-400 text-sm pl-9 pr-4 py-1.5 rounded-md border border-slate-700 focus:outline-none focus:border-[#C9A227] transition"
            />
          </div>
        </div>

        {/* Right: Quick Role Switcher, Notifications & User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

          {/* Cloud Redundancy Snapshot Sync Indicator */}
          {onManualCloudSync && (
            <button
              onClick={handleTriggerSync}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                isSyncing 
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 animate-pulse' 
                  : 'bg-slate-900/90 border-emerald-700/60 hover:bg-slate-800 text-emerald-400'
              }`}
              title={lastSyncTime ? `Firebase Sync (${lastSyncTime})` : 'Firebase Sync'}
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline text-[11px]">Firebase Backup</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/60">
                {isSyncing ? 'Syncing...' : 'Active'}
              </span>
            </button>
          )}

          {currentUser?.role === 'Super Admin' && onGoToSuperAdmin && (
            <button
              onClick={onGoToSuperAdmin}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Platform Admin"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Platform Admin</span>
            </button>
          )}
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 relative transition"
              title="Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#DC3545] rounded-full animate-pulse"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-xs sm:w-80 bg-slate-900 border border-[#C9A227]/40 rounded-xl shadow-2xl z-50 text-slate-100 overflow-hidden">
                <div className="p-3 bg-[#0B1F3A] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#C9A227]" />
                    <span className="font-semibold text-sm">System Alerts ({notifications.length})</span>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        onNavigateTab(n.tab);
                        setShowNotifications(false);
                      }}
                      className="p-3 hover:bg-slate-800/80 cursor-pointer transition text-xs"
                    >
                      <div className="font-medium text-[#C9A227] mb-0.5">{n.title}</div>
                      <div className="text-slate-300 leading-relaxed">{n.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/80 hover:border-[#C9A227]/60 transition text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B1F3A] border border-[#C9A227] flex items-center justify-center font-semibold text-xs text-[#C9A227]">
                {currentUser ? currentUser.fullName.charAt(0) : 'U'}
              </div>
              <div className="hidden lg:block text-xs">
                <div className="font-medium text-slate-100 truncate max-w-[130px]">
                  {currentUser?.fullName || 'User'}
                </div>
                <div className="text-[10px] text-[#C9A227] font-semibold">
                  {currentUser?.role || 'Guest'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Switch Role / User Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-xs sm:w-80 bg-slate-900 border border-[#C9A227]/50 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100">
                <div className="p-3.5 bg-[#0B1F3A] border-b border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#C9A227]" />
                      {getTimeBasedGreeting()}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#C9A227]/20 text-[#C9A227] font-mono text-[9px] font-bold border border-[#C9A227]/40">
                      {currentUser?.role}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">{currentUser?.fullName}</div>
                  
                  <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1 font-sans">
                    {currentUser?.email && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-[#C9A227] shrink-0" />
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                    )}
                    {currentUser?.phone && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3 h-3 text-[#C9A227] shrink-0" />
                        <span>{currentUser.phone}</span>
                      </div>
                    )}
                    {currentUser?.firmName && (
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <Building2 className="w-3 h-3 text-[#C9A227] shrink-0" />
                        <span className="truncate">{currentUser.firmName} ({currentUser.firmCode || 'N/A'})</span>
                      </div>
                    )}
                    {(currentUser?.physicalAddress || currentUser?.county) && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <MapPin className="w-3 h-3 text-[#C9A227] shrink-0" />
                        <span className="truncate">{currentUser.physicalAddress || currentUser.county}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ONLY ADMIN (Proprietor) CAN SEE OTHER USERS */}
                {currentUser?.role === 'Proprietor' ? (
                  <div className="p-2 border-b border-slate-800 bg-slate-950/50">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5 px-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#C9A227]" />
                      Switch Role (Logs Out & Prompts Password):
                    </div>
                    <div className="space-y-1">
                      {allUsers
                        .filter(u => {
                          if (
                            u.role === 'Super Admin' || 
                            u.role === 'Platform Owner' || 
                            u.username === 'superadmin' || 
                            u.id === '3TVRWijWagVJBVfuTcFXCDqDzR02' ||
                            u.firmId === 'platform-owner'
                          ) {
                            return false;
                          }
                          // Strict multi-tenant isolation
                          const targetFirmId = currentUser?.firmId;
                          const targetFirmCode = currentUser?.firmCode || firmCode;
                          const targetFirmName = currentUser?.firmName || firmName;

                          if (targetFirmId && u.firmId) {
                            return u.firmId === targetFirmId;
                          }
                          if (targetFirmCode && u.firmCode) {
                            return u.firmCode === targetFirmCode;
                          }
                          if (targetFirmName && u.firmName) {
                            return u.firmName.toLowerCase() === targetFirmName.toLowerCase();
                          }
                          return false;
                        })
                        .map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setShowUserDropdown(false);
                            onSwitchUser(user);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition ${
                            currentUser?.id === user.id ? 'bg-[#C9A227]/20 border border-[#C9A227]/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="truncate">{user.fullName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-[11px] text-slate-400 bg-slate-950/50 border-b border-slate-800 leading-relaxed">
                    Account switching restricted. To switch into another user account, please sign out first.
                  </div>
                )}

                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded flex items-center justify-center gap-2 font-medium transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out / Switch Account
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
