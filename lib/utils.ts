import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDomainTheme(hostname: string) {
  if (hostname.includes('nunge.winguapps.co.ke')) {
    return 'partner'
  }
  return 'default'
}
