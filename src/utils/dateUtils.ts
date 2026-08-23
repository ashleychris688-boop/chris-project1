/**
 * Utility functions for court date validation and calendar business logic
 */

export function getTimeBasedGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 4 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

export interface DateValidationResult {
  isValid: boolean;
  errorMessage?: string;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  suggestedNextBusinessDay?: string;
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
}

export function getNextBusinessDay(fromDateStr?: string): string {
  const baseDate = fromDateStr ? new Date(fromDateStr + 'T00:00:00') : new Date();
  const current = new Date(baseDate);
  
  // Advance by 1 day
  current.setDate(current.getDate() + 1);
  
  // If Saturday (6), move to Monday (+2 days)
  if (current.getDay() === 6) {
    current.setDate(current.getDate() + 2);
  } else if (current.getDay() === 0) {
    // If Sunday (0), move to Monday (+1 day)
    current.setDate(current.getDate() + 1);
  }
  
  return current.toISOString().split('T')[0];
}

export function ensureWeekday(dateStr: string): string {
  if (!dateStr) return dateStr;
  if (!isWeekend(dateStr)) return dateStr;

  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  
  // If Saturday (6), add 2 days to get Monday. If Sunday (0), add 1 day to get Monday.
  if (d.getDay() === 6) {
    d.setDate(d.getDate() + 2);
  } else if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }
  
  return d.toISOString().split('T')[0];
}

export function validateNonWeekendDate(dateStr: string, fieldLabel = 'Selected date'): { isValid: boolean; errorMessage?: string; suggestedDate?: string } {
  if (!dateStr) return { isValid: true };
  if (isWeekend(dateStr)) {
    const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    const suggested = ensureWeekday(dateStr);
    return {
      isValid: false,
      errorMessage: `${fieldLabel} (${dateStr}) falls on a weekend (${dayName}). Courts, law registries, and firm operations are strictly closed on weekends.`,
      suggestedDate: suggested
    };
  }
  return { isValid: true };
}

export function validateCourtDate(dateStr: string, timeStr?: string): DateValidationResult {
  if (!dateStr) {
    return {
      isValid: false,
      errorMessage: 'Hearing date is required.',
      isToday: false,
      isWeekend: false,
      isPast: false
    };
  }

  const todayStr = getTodayStr();
  const suggestedNextBusinessDay = getNextBusinessDay(todayStr);

  if (dateStr < todayStr) {
    return {
      isValid: false,
      errorMessage: `Selected date (${dateStr}) is in the past. Court dates cannot be scheduled in the past.`,
      isToday: false,
      isWeekend: false,
      isPast: true,
      suggestedNextBusinessDay
    };
  }

  if (isWeekend(dateStr)) {
    const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    return {
      isValid: false,
      errorMessage: `Selected date (${dateStr}) falls on a weekend (${dayName}). Courts and registry offices are strictly closed on weekends.`,
      isToday: false,
      isWeekend: true,
      isPast: false,
      suggestedNextBusinessDay: getNextBusinessDay(dateStr)
    };
  }

  if (dateStr === todayStr) {
    if (!timeStr || !timeStr.trim()) {
      return {
        isValid: false,
        errorMessage: 'For Same-Day (Today) court outcomes or sessions, you MUST enter a hearing time (e.g., 02:30 PM).',
        isToday: true,
        isWeekend: false,
        isPast: false,
        suggestedNextBusinessDay
      };
    }

    return {
      isValid: true,
      isToday: true,
      isWeekend: false,
      isPast: false
    };
  }

  return {
    isValid: true,
    isToday: false,
    isWeekend: false,
    isPast: false
  };
}
