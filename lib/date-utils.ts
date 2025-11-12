/**
 * Date utility functions for handling browser timezone and UTC conversions
 */

/**
 * Get current date and time in browser's local timezone
 * Returns a Date object representing the current moment
 */
export function getCurrentBrowserDateTime(): Date {
  return new Date()
}

/**
 * Convert a Date object to a datetime-local input string (YYYY-MM-DDTHH:mm)
 * Uses browser's local timezone
 */
export function dateToDatetimeLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert a datetime-local string (YYYY-MM-DDTHH:mm) to a Date object
 * The string is interpreted in browser's local timezone
 */
export function datetimeLocalToDate(datetimeLocal: string): Date {
  // datetime-local input is in browser's local timezone
  // Create a date object from the local string
  return new Date(datetimeLocal)
}

/**
 * Convert a UTC Date from database to browser's local timezone for display
 * This is mainly for ensuring proper display, as Date objects already handle timezone
 */
export function utcToBrowserTime(utcDate: Date | string): Date {
  // Date objects from JSON are already in UTC
  // When we create a new Date, it automatically converts to browser timezone
  return new Date(utcDate)
}

/**
 * Convert a browser local Date to UTC for storage
 * This ensures the date is stored correctly in UTC in the database
 */
export function browserTimeToUTC(localDate: Date): Date {
  // When sending to server, Date objects are automatically serialized to ISO string (UTC)
  // But we need to ensure we're working with the correct time
  // The Date object already represents a moment in time, so we just return it
  // Prisma will handle the UTC conversion
  return localDate
}

/**
 * Format a date for display in browser's local timezone
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString()
}

/**
 * Format a date and time for display in browser's local timezone
 */
export function formatDateTimeForDisplay(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString()
}

/**
 * Format a date for datetime-local input (YYYY-MM-DDTHH:mm)
 * Converts UTC date to browser local time
 */
export function formatDateForDatetimeLocal(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  return dateToDatetimeLocal(d)
}

