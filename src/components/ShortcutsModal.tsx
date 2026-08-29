import React from 'react';
import { 
  Keyboard, 
  Smartphone, 
  Clock, 
  ArrowLeft, 
  Home, 
  FolderArchive, 
  Scale, 
  CheckSquare, 
  PackageSearch, 
  FileCheck2, 
  ListOrdered, 
  Search, 
  LogOut, 
  X, 
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const laptopShortcuts = [
    { key: 'Alt + H', action: 'Go to Home Panel (Dashboard)', icon: Home, tab: 'dashboard' },
    { key: 'Alt + R', action: 'Open Physical Registry & Files', icon: FolderArchive, tab: 'registry' },
    { key: 'Alt + D', action: 'Open Court Diary & Cause List', icon: Scale, tab: 'court-diary' },
    { key: 'Alt + T', action: 'Open Task Management Panel', icon: CheckSquare, tab: 'tasks' },
    { key: 'Alt + F', action: 'Open Physical File Tracker', icon: PackageSearch, tab: 'file-tracker' },
    { key: 'Alt + O', action: 'Open Court Outcomes & Rulings', icon: FileCheck2, tab: 'court-outcomes' },
    { key: 'Alt + U', action: 'Open Upcoming Lists (Bring Up)', icon: ListOrdered, tab: 'bring-up' },
    { key: 'Alt + S / Ctrl + K', action: 'Focus Global File Search Bar', icon: Search },
    { key: 'Alt + L', action: 'Secure Logout of Session', icon: LogOut },
    { key: 'Esc', action: 'Close Modal or Return to Home', icon: ArrowLeft, tab: 'dashboard' },
    { key: '?', action: 'Toggle Shortcuts & Quick Actions', icon: Keyboard }
  ];

  const phoneShortcuts = [
    {
      title: 'Phone Back Button / Gesture',
      desc: 'Tapping your phone\'s back button returns you straight to the Home Dashboard panel (or closes any active modal first).',
      badge: 'Smart Back Flow',
      icon: ArrowLeft
    },
    {
      title: 'Persistent Session on Refresh',
      desc: 'Refreshing the page keeps you logged into your active workspace and preserves your current active module.',
      badge: 'Auto-Persist',
      icon: RefreshCw
    },
    {
      title: '1-Hour Inactivity Auto-Logout',
      desc: 'For high confidentiality, staying inactive for more than 1 hour automatically logs you out to protect sensitive litigation files.',
      badge: '1-Hr Security Lock',
      icon: Clock
    },
    {
      title: 'Mobile Bottom Quick Navigation Bar',
      desc: 'Use the docked mobile action bar at the bottom of your phone screen for 1-tap jumping between Home, Registry, Diary & Tasks.',
      badge: '1-Tap Navigation',
      icon: Zap
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#081729] rounded-2xl max-w-2xl w-full border border-[#C9A227]/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0B1F3A] border-b border-[#C9A227]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C9A227]/20 border border-[#C9A227]/50 rounded-xl text-[#C9A227]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                Quick Shortcuts & Gestures
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40 rounded-full">
                  Laptop & Mobile
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Speed up registry workflows with keyboard hotkeys, mobile gesture back-flows & session persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">

          {/* Phone & Mobile Gestures Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 font-serif">
              <Smartphone className="w-4 h-4 text-[#C9A227]" />
              <h4>Phone Gestures & Security Flow</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {phoneShortcuts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl hover:border-[#C9A227]/40 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <Icon className="w-4 h-4 text-[#C9A227] shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30 font-semibold shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Laptop Keyboard Shortcuts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-amber-300 font-serif">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#C9A227]" />
                <h4>Laptop & Desktop Keyboard Shortcuts</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-sans font-normal">Click any shortcut to jump</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {laptopShortcuts.map((sc, idx) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (sc.tab) {
                        onNavigateTab(sc.tab);
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl transition ${
                      sc.tab ? 'hover:bg-slate-800/80 hover:border-[#C9A227]/50 cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[#C9A227] shrink-0" />
                      <span className="text-slate-200 font-medium">{sc.action}</span>
                    </div>
                    <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md font-mono text-[10px] font-bold text-amber-300 shadow-sm shrink-0">
                      {sc.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inactivity Security Explainer Note */}
          <div className="p-3.5 bg-amber-950/30 border border-[#C9A227]/40 rounded-xl flex items-start gap-3 text-slate-300">
            <ShieldCheck className="w-5 h-5 text-[#C9A227] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 text-xs">Confidential Court Registry Security:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Interactions (clicks, keypresses, scrolls, touch taps) continuously reset your 1-hour session timer. If no activity occurs for 60 minutes, the session safely locks and routes to the login panel.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#0B1F3A] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-amber-300 font-mono text-[10px]">Esc</kbd> anytime to dismiss
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-[#C9A227] text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition cursor-pointer text-xs uppercase tracking-wider shadow-lg"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
