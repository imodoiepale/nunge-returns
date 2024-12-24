// lib/returnHelpers.ts
import { supabase } from '@/lib/supabaseClient'

export interface PhysicalAddress {
  descriptive: string
}

export interface PostalAddress {
  postalCode: string
  town: string
  poBox: string
}

export interface ContactDetails {
  mobile: string
  email: string
  secondaryEmail: string
}

export interface BusinessDetails {
  name: string
  registrationNumber: string
  registrationDate: string
  commencedDate: string
}

export interface ManufacturerDetails {
  pin: string
  name: string
  physicalAddress: PhysicalAddress
  postalAddress: PostalAddress
  contactDetails: ContactDetails
  businessDetails: BusinessDetails
}

export interface FormData {
  pin: string
  manufacturerName: string
  email: string
  mobileNumber: string
  mpesaNumber: string
  password: string
}

export interface FilingStatus {
  loggedIn: boolean
  filing: boolean
  extracting: boolean
  completed: boolean
}

export interface FileReturnResponse {
  status: "success" | "error"
  message: string
  receiptNumber?: string
}

export const extractManufacturerDetails = async (pin: string) => {
  try {
    const response = await fetch('/api/manufacturer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error)
    }
    return data.data
  } catch (error: any) {
    console.error('Error extracting manufacturer details:', error)
    throw error
  }
}

export const fileNilReturn = async (credentials: { pin: string; password: string }): Promise<FileReturnResponse> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      status: "success",
      message: "Return filed successfully",
      receiptNumber: `NR${Math.random().toString().slice(2, 10)}`
    }
  } catch (error: any) {
    return {
      status: "error",
      message: "Failed to file return. Please try again."
    }
  }
}

export const validatePIN = (pin: string): { isValid: boolean; error: string | null } => {
  if (!pin) {
    return { isValid: false, error: 'Please enter a KRA PIN.' }
  }
  if (pin.length !== 11) {
    return { isValid: false, error: 'KRA PIN must be exactly 11 characters long.' }
  }
  if (!/^[AP]/.test(pin)) {
    return { isValid: false, error: 'KRA PIN must start with either A (for individuals) or P (for businesses).' }
  }
  if (!/^[AP]\d{9}/.test(pin)) {
    return { isValid: false, error: 'KRA PIN must have exactly 9 digits after the first letter.' }
  }
  if (!/^[AP]\d{9}[A-Z]$/.test(pin)) {
    return { isValid: false, error: 'KRA PIN must end with a letter (A-Z).' }
  }
  return { isValid: true, error: null }
}