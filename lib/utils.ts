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
