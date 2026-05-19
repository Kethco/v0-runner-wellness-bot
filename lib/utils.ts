import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the user's timezone from the browser
 * Falls back to UTC if not available
 */
export function getUserTimezone(): string {
  if (typeof window !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
  return 'UTC';
}

/**
 * Get today's date string in the user's local timezone (YYYY-MM-DD format)
 */
export function getLocalDateString(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD format
}

/**
 * Get current day of week (0 = Sunday, 6 = Saturday) in user's timezone
 */
export function getLocalDayOfWeek(timezone?: string): number {
  const tz = timezone || getUserTimezone();
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(dayName);
}

/**
 * Format a date for display in user's timezone
 */
export function formatDateInTimezone(date: Date | string, timezone?: string, options?: Intl.DateTimeFormatOptions): string {
  const tz = timezone || getUserTimezone();
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { timeZone: tz, ...options });
}

/**
 * Check if a date string (YYYY-MM-DD) is today in user's timezone
 */
export function isToday(dateString: string, timezone?: string): boolean {
  return dateString === getLocalDateString(timezone);
}
