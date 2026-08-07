/**
 * Utility functions for court date validation and calendar business logic
 */

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
    return {
      isValid: false,
      errorMessage: `Selected date (${dateStr}) falls on a weekend. Courts are closed on weekends.`,
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
