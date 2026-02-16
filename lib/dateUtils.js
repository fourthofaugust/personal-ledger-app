/**
 * Date utilities for handling dates without timezone issues
 */

/**
 * Convert a date to YYYY-MM-DD string in local timezone
 * @param {Date} date - The date to convert
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - Date object at noon local time
 */
export function fromDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Get current date as YYYY-MM-DD string
 * @returns {string} - Current date in YYYY-MM-DD format
 */
export function getCurrentDateString() {
  return toDateString(new Date());
}

/**
 * Get current date as Date object at noon
 * @returns {Date} - Current date at noon
 */
export function getCurrentDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}
