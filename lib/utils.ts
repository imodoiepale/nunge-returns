import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define available themes as a const array
export const AVAILABLE_THEMES = ['default', 'partner'] as const;
export type Theme = typeof AVAILABLE_THEMES[number];

export function getDomainTheme(hostname: string): Theme {
  if (!hostname) {
    console.warn('No hostname provided to getDomainTheme, falling back to default theme');
    return 'default';
  }

  // Convert hostname to lowercase for case-insensitive comparison
  const lowercaseHostname = hostname.toLowerCase();
  
  // Check for development environment
  if (lowercaseHostname.includes('localhost')) {
    return 'default';
  }
  
  // Check for partner domain
  if (lowercaseHostname.includes('winguapps.co.ke')) {
    return 'partner';
  }
  
  // Check for main domain
  if (lowercaseHostname.includes('nungereturns.com')) {
    return 'default';
  }
  
  // Default fallback
  return 'default';
}

/**
 * Formats a timestamp into a human-readable date string
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string): string {
  // Convert string to number if needed
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  
  // Check if timestamp is in seconds (10 digits) and convert to milliseconds if needed
  const msTimestamp = ts.toString().length === 10 ? ts * 1000 : ts;
  
  // Create date object
  const date = new Date(msTimestamp);
  
  // Format options
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  // Return formatted date
  return new Intl.DateTimeFormat('en-US', options).format(date);
}
