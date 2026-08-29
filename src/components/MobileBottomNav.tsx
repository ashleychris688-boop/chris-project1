import React from 'react';
import { 
  Home, 
  FolderArchive, 
  Scale, 
  CheckSquare, 
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onToggleSidebar: () => void;
  pendingTasksCount?: number;
  courtSessionsTodayCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleSidebar,
  pendingTasksCount = 0,
  courtSessionsTodayCount = 0
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#081729]/95 backdrop-blur-md border-t border-[#C9A227]/30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        
        {/* Home */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer flex-1 ${
            activeTab === 'dashboard'
              ? 'text-[#C9A227] font-bold bg-[#C9A227]/10 border border-[#C9A227]/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Home Panel"
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Home</span>
        </button>

        {/* Registry */}
        <button
          onClick={() => onSelectTab('registry')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer flex-1 ${
            activeTab === 'registry'
              ? 'text-[#C9A227] font-bold bg-[#C9A227]/10 border border-[#C9A227]/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Physical Registry"
        >
          <FolderArchive className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Registry</span>
        </button>

        {/* Court Diary */}
        <button
          onClick={() => onSelectTab('court-diary')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer relative flex-1 ${
            activeTab === 'court-diary'
              ? 'text-[#C9A227] font-bold bg-[#C9A227]/10 border border-[#C9A227]/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Court Diary"
        >
          <Scale className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Diary</span>
          {courtSessionsTodayCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Tasks */}
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer relative flex-1 ${
            activeTab === 'tasks'
              ? 'text-[#C9A227] font-bold bg-[#C9A227]/10 border border-[#C9A227]/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tasks"
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Tasks</span>
          {pendingTasksCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-[#C9A227] rounded-full animate-pulse" />
          )}
        </button>

        {/* More / Menu Drawer */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-200 flex-1"
          title="All Modules"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Menu</span>
        </button>

      </div>
    </div>
  );
};
