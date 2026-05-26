/**
 * Timezone-aware date utilities for the Runner Wellness app.
 * 
 * These functions ensure consistent date handling across different user timezones.
 * The app stores dates in YYYY-MM-DD format in the user's local timezone.
 */

/**
 * Get today's date string in the user's timezone (or specified timezone)
 * @param timezone - IANA timezone string (e.g., "America/New_York"). Defaults to user's browser timezone.
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayInTimezone(timezone?: string): string {
  const now = new Date();
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return now.toLocaleDateString('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD format
}

/**
 * Get yesterday's date string in the user's timezone
 * @param timezone - IANA timezone string
 * @returns Date string in YYYY-MM-DD format
 */
export function getYesterdayInTimezone(timezone?: string): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return now.toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Get a date N days ago in the user's timezone
 * @param daysAgo - Number of days to go back
 * @param timezone - IANA timezone string
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateDaysAgo(daysAgo: number, timezone?: string): string {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return now.toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Check if a date string is "today" in the given timezone
 * Also returns true if it's "yesterday" to handle edge cases around midnight
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timezone - IANA timezone string
 * @param allowYesterday - If true, also returns true for yesterday (for timezone tolerance)
 */
export function isToday(dateStr: string, timezone?: string, allowYesterday = true): boolean {
  const today = getTodayInTimezone(timezone);
  if (dateStr === today) return true;
  
  if (allowYesterday) {
    const yesterday = getYesterdayInTimezone(timezone);
    return dateStr === yesterday;
  }
  
  return false;
}

/**
 * Calculate streak from an array of date strings.
 * Handles timezone differences by allowing the streak to start from today or yesterday.
 * @param dates - Array of date strings in YYYY-MM-DD format (should be sorted newest first)
 * @param timezone - IANA timezone string
 * @returns Number of consecutive days
 */
export function calculateStreak(dates: string[], timezone?: string): number {
  if (!dates || dates.length === 0) return 0;
  
  // Remove duplicates and sort descending (newest first)
  const uniqueDates = [...new Set(dates)].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  const today = getTodayInTimezone(timezone);
  const yesterday = getYesterdayInTimezone(timezone);
  const mostRecentDate = uniqueDates[0];
  
  // Streak only counts if the most recent activity is today or yesterday
  if (mostRecentDate !== today && mostRecentDate !== yesterday) {
    return 0;
  }
  
  // Count consecutive days starting from the most recent date
  let streak = 0;
  const startDate = new Date(mostRecentDate + 'T12:00:00'); // Use noon to avoid DST issues
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDate = new Date(startDate);
    expectedDate.setDate(startDate.getDate() - i);
    const expectedStr = expectedDate.toISOString().split('T')[0];
    
    if (uniqueDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Get the start and end dates for "this week" (Monday to Sunday) in the user's timezone
 * @param timezone - IANA timezone string
 * @returns Object with weekStart and weekEnd date strings
 */
export function getThisWeekRange(timezone?: string): { weekStart: string; weekEnd: string } {
  const today = new Date();
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = today.getDay();
  // Calculate days since Monday (if Sunday, go back 6 days)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    weekStart: monday.toLocaleDateString('en-CA', { timeZone: tz }),
    weekEnd: sunday.toLocaleDateString('en-CA', { timeZone: tz }),
  };
}

/**
 * Server-side: Get today's date using a fallback timezone
 * On the server, we can't detect the user's timezone from Intl.
 * Use "America/New_York" as default or pass the user's stored timezone.
 * @param userTimezone - User's timezone from their profile (optional)
 * @returns Date string in YYYY-MM-DD format
 */
export function getServerToday(userTimezone?: string): string {
  const tz = userTimezone || 'America/New_York';
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Server-side: Get yesterday's date using a fallback timezone
 * @param userTimezone - User's timezone from their profile (optional)
 * @returns Date string in YYYY-MM-DD format
 */
export function getServerYesterday(userTimezone?: string): string {
  const tz = userTimezone || 'America/New_York';
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Server-side: Get date N days ago using a fallback timezone
 * @param daysAgo - Number of days to go back
 * @param userTimezone - User's timezone from their profile (optional)
 * @returns Date string in YYYY-MM-DD format
 */
export function getServerDateDaysAgo(daysAgo: number, userTimezone?: string): string {
  const tz = userTimezone || 'America/New_York';
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);
  return now.toLocaleDateString('en-CA', { timeZone: tz });
}
