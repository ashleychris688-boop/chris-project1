import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  FileText, 
  Gavel, 
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4500;

  useEffect(() => {
    if (duration <= 0) return;

    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          const next = prev - step;
          return next > 0 ? next : 0;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isPaused]);

  useEffect(() => {
    if (duration > 0 && progress <= 0) {
      onDismiss(toast.id);
    }
  }, [progress, duration, toast.id, onDismiss]);

  const getIcon = () => {
    // If title or message hints at specific domain operations
    const lowerTitle = (toast.title + ' ' + (toast.message || '')).toLowerCase();
    
    if (lowerTitle.includes('court') || lowerTitle.includes('coram') || lowerTitle.includes('outcome') || lowerTitle.includes('session') || lowerTitle.includes('hearing')) {
      return <Gavel className="w-5 h-5 text-amber-600 flex-shrink-0" />;
    }
    if (lowerTitle.includes('movement') || lowerTitle.includes('transfer') || lowerTitle.includes('relocat') || lowerTitle.includes('check-in') || lowerTitle.includes('check-out')) {
      return <ArrowRightLeft className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
    if (lowerTitle.includes('file') || lowerTitle.includes('registered') || lowerTitle.includes('intake') || lowerTitle.includes('archive')) {
      return <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
    }

    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200 bg-white shadow-emerald-900/5';
      case 'warning':
        return 'border-amber-200 bg-white shadow-amber-900/5';
      case 'error':
        return 'border-rose-200 bg-white shadow-rose-900/5';
      case 'info':
      default:
        return 'border-indigo-200 bg-white shadow-indigo-900/5';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      case 'info':
      default:
        return 'bg-indigo-500';
    }
  };

  const getAccentBg = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700';
      case 'warning':
        return 'bg-amber-50 text-amber-700';
      case 'error':
        return 'bg-rose-50 text-rose-700';
      case 'info':
      default:
        return 'bg-indigo-50 text-indigo-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm sm:max-w-md rounded-xl border shadow-xl overflow-hidden pointer-events-auto transition-all ${getBorderColor()}`}
      role="alert"
      id={`toast-${toast.id}`}
    >
      <div className="p-4 flex items-start gap-3.5">
        <div className={`p-2 rounded-lg flex items-center justify-center ${getAccentBg()}`}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-900 leading-tight">
              {toast.title}
            </h4>
          </div>
          
          {toast.message && (
            <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
              {toast.message}
            </p>
          )}

          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>{toast.action.label}</span>
              <Sparkles className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle bottom progress bar */}
      {duration > 0 && (
        <div className="h-1 w-full bg-slate-100 overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div 
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
