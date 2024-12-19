import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDomainTheme(hostname: string) {
  // Convert hostname to lowercase for case-insensitive comparison
  const lowercaseHostname = hostname.toLowerCase()
  
  // Check for development environment
  if (lowercaseHostname.includes('localhost')) {
    return 'default'
  }
  
  // Check for partner domain
  if (lowercaseHostname.includes('winguapps.co.ke')) {
    return 'partner'
  }
  
  // Check for main domain
  if (lowercaseHostname.includes('nungereturns.com')) {
    return 'default'
  }
  
  // Default fallback
  return 'default'
}
