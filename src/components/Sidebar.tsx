import React from 'react';
import { User } from '../types';
import { 
  Home, 
  CheckSquare,
  FolderArchive, 
  Scale, 
  FileCheck2, 
  PackageSearch, 
  ListOrdered, 
  Gavel, 
  UserSquare2, 
  FileSpreadsheet, 
  Handshake, 
  Inbox, 
  Building, 
  Receipt, 
  CircleDollarSign, 
  BarChart3, 
  Users, 
  Settings, 
  History,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: User | null;
  counts?: {
    sessionsToday?: number;
    filesOut?: number;
    incompleteFiles?: number;
    pendingCheques?: number;
    commissions?: number;
    pendingReviewIntakes?: number;
    pendingTasks?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  currentUser,
  counts
}) => {
  const isAdmin = currentUser?.role === 'Proprietor';
  const role = currentUser?.role || 'Proprietor';

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['Proprietor', 'Secretary', 'Clerk', 'Advocate', 'Case Chaser', 'Super Admin', 'Client'] },
    { id: 'tasks', label: 'Task Management', icon: CheckSquare, badge: counts?.pendingTasks, badgeColor: 'bg-[#C9A227] text-slate-950 font-bold', roles: ['Proprietor', 'Secretary', 'Clerk', 'Advocate', 'Case Chaser', 'Super Admin', 'Client'] },
    { id: 'registry', label: 'Registry', icon: FolderArchive, roles: ['Proprietor', 'Secretary', 'Advocate', 'Clerk', 'Super Admin', 'Client'] },
    { id: 'court-diary', label: 'Court Diary', icon: Scale, badge: counts?.sessionsToday, roles: ['Proprietor', 'Secretary', 'Advocate', 'Super Admin', 'Client'] },
    { id: 'court-outcomes', label: 'Court Outcomes', icon: FileCheck2, roles: ['Proprietor', 'Secretary', 'Advocate', 'Super Admin'] },
    { id: 'file-tracker', label: 'Physical File Tracker', icon: PackageSearch, badge: counts?.filesOut, badgeColor: 'bg-orange-600', roles: ['Proprietor', 'Clerk', 'Super Admin'] },
    { id: 'bring-up', label: 'Bring-Up Lists', icon: ListOrdered, roles: ['Proprietor', 'Secretary', 'Clerk', 'Super Admin'] },
    { id: 'advocates', label: 'Advocates Workspace', icon: Gavel, roles: ['Proprietor', 'Advocate', 'Super Admin'] },
    { id: 'secretaries', label: 'Secretaries Workspace', icon: UserSquare2, roles: ['Proprietor', 'Secretary', 'Super Admin'] },
    { id: 'clerks', label: 'Clerks Workspace', icon: FileSpreadsheet, roles: ['Proprietor', 'Clerk', 'Super Admin'] },
    { id: 'case-chasers', label: 'Case Chasers Workspace', icon: Handshake, roles: ['Proprietor', 'Case Chaser', 'Super Admin'] },
    { id: 'unprocessed-bucket', label: 'Unprocessed Sourcing Bucket', icon: Inbox, badge: counts?.pendingReviewIntakes, badgeColor: 'bg-amber-500 text-slate-950 font-black', roles: ['Proprietor', 'Clerk', 'Super Admin'] },
    { id: 'insurance', label: 'Insurance Companies', icon: Building, roles: ['Proprietor', 'Secretary', 'Clerk', 'Advocate', 'Super Admin'] },
    { id: 'pending-cheques', label: 'Pending Cheques', icon: Receipt, badge: counts?.pendingCheques, badgeColor: 'bg-[#C9A227] text-slate-900', roles: ['Proprietor', 'Secretary', 'Clerk', 'Advocate', 'Super Admin'] },
    { id: 'commission-tracker', label: 'Commission Tracker', icon: CircleDollarSign, badge: counts?.commissions, badgeColor: 'bg-red-600', roles: ['Proprietor', 'Super Admin'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Proprietor', 'Super Admin'] },
    { id: 'user-management', label: 'User Management', icon: Users, roles: ['Proprietor', 'Super Admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Proprietor', 'Super Admin'] },
    { id: 'audit-log', label: 'Audit Log', icon: History, roles: ['Proprietor', 'Super Admin'] }
  ];

  // Filter menu items if not admin/super-admin
  const visibleItems = menuItems.filter(item => isSuperAdmin || isAdmin || item.roles.includes(role));

  return (
    <aside 
      className={`bg-[#081729] text-slate-200 border-r border-[#C9A227]/20 transition-all duration-300 flex flex-col z-20 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Collapse Toggle Bar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-1 px-2">
            <span className="text-[11px] font-bold text-[#C9A227] uppercase tracking-wider">
              {isAdmin ? 'ADMIN NAVIGATION' : isSuperAdmin ? 'WORKSPACE NAVIGATION' : `${role.toUpperCase()} MENU`}
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#C9A227] to-[#A07F19] text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-[#C9A227]'}`} />
              
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  item.badgeColor || (isActive ? 'bg-slate-900 text-white' : 'bg-[#DC3545] text-white')
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 border border-slate-700">
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Footer info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 bg-slate-950/40 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-300">LAW FIRM REGISTRY</div>
            <div className="text-slate-500">{role} Workspace</div>
          </div>
          {isAdmin ? (
            <Shield className="w-4 h-4 text-[#C9A227]" title="Admin / Proprietor Role" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-400" title="Role Restricted" />
          )}
        </div>
      )}
    </aside>
  );
};
