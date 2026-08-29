import React, { useRef } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { isWeekend, ensureWeekday, getTodayStr, getNextBusinessDay } from '../utils/dateUtils';

interface LaptopDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  allowWeekends?: boolean;
  className?: string;
  showQuickPills?: boolean;
  placeholder?: string;
  id?: string;
}

export const LaptopDatePicker: React.FC<LaptopDatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  disabled = false,
  allowWeekends = false,
  className = '',
  showQuickPills = true,
  placeholder = 'Select date',
  id
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = getTodayStr();

  const handleDateChange = (newVal: string) => {
    if (!newVal) {
      onChange('');
      return;
    }

    if (!allowWeekends && isWeekend(newVal)) {
      const adjusted = ensureWeekday(newVal);
      onChange(adjusted);
    } else {
      onChange(newVal);
    }
  };

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const calculateFutureDate = (daysToAdd: number): string => {
    const base = new Date();
    base.setDate(base.getDate() + daysToAdd);
    const dateStr = base.toISOString().split('T')[0];
    return allowWeekends ? dateStr : ensureWeekday(dateStr);
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return null;
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dStr;
    }
  };

  const formattedLabel = formatDisplayDate(value);
  const isWeekendSelected = value && isWeekend(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-200" htmlFor={id}>
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          {formattedLabel && (
            <span className="text-[11px] font-mono text-amber-300 font-semibold">
              {formattedLabel}
            </span>
          )}
        </div>
      )}

      {/* Main Interactive Date Input Container for Laptops */}
      <div 
        onClick={handleOpenPicker}
        className={`relative flex items-center bg-slate-950 border rounded-xl transition cursor-pointer group ${
          isWeekendSelected && !allowWeekends
            ? 'border-rose-500 ring-1 ring-rose-500/50'
            : 'border-slate-700 hover:border-[#C9A227] focus-within:border-[#C9A227] focus-within:ring-1 focus-within:ring-[#C9A227]/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPicker();
          }}
          disabled={disabled}
          title="Open calendar picker"
          className="pl-3 pr-2 py-2 text-[#C9A227] group-hover:text-amber-300 transition cursor-pointer flex items-center justify-center shrink-0"
        >
          <Calendar className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          id={id}
          type="date"
          required={required}
          min={min}
          max={max}
          disabled={disabled}
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => handleDateChange(e.target.value)}
          onClick={(e) => {
            try {
              (e.currentTarget as any).showPicker?.();
            } catch {
              // fallback to native
            }
          }}
          className="w-full bg-transparent py-2.5 pr-3 text-slate-100 text-xs font-mono font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Clear date"
            className="pr-3 text-slate-500 hover:text-slate-300 text-xs transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Weekend Alert Warning if applicable */}
      {isWeekendSelected && !allowWeekends && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Weekend court dates are not permitted. Auto-adjusting to weekday.</span>
        </div>
      )}

      {/* Quick Laptop Date Preset Pills */}
      {showQuickPills && !disabled && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          <button
            type="button"
            onClick={() => handleDateChange(today)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded border transition cursor-pointer ${
              value === today
                ? 'bg-[#C9A227] text-slate-950 font-bold border-[#C9A227]'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(getNextBusinessDay(today))}
            className="px-2 py-0.5 text-[10px] font-mono rounded border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white transition cursor-pointer"
          >
            Next Court Day
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(calculateFutureDate(7))}
            className="px-2 py-0.5 text-[10px] font-mono rounded border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white transition cursor-pointer"
          >
            +1 Wk
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(calculateFutureDate(14))}
            className="px-2 py-0.5 text-[10px] font-mono rounded border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white transition cursor-pointer"
          >
            +14 Days
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(calculateFutureDate(30))}
            className="px-2 py-0.5 text-[10px] font-mono rounded border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white transition cursor-pointer"
          >
            +30 Days
          </button>

          <button
            type="button"
            onClick={() => handleDateChange(calculateFutureDate(60))}
            className="px-2 py-0.5 text-[10px] font-mono rounded border bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white transition cursor-pointer"
          >
            +60 Days
          </button>
        </div>
      )}
    </div>
  );
};
