// lib/types.ts

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
  
  export interface Credentials {
    pin: string
    password: string
  }
  
  export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: string
  }
  
  export interface SessionData {
    id: string
    pin: string
    status: 'active' | 'completed'
    current_step: number
    form_data: {
      pin: string
      manufacturerName: string
      taxpayerName: string
      email: string
      mobileNumber: string
      mpesaNumber?: string
      password?: string
      paymentStatus?: "Not Paid" | "Processing" | "Paid"
      receiptNumber?: string
      manufacturerDetails?: ManufacturerDetails
      step?: number
    }
    completed_at?: string
  }
  
  export interface TaxpayerResponse {
    taxpayerName: string
    mainEmailId: string
    mobileNumber: string
    businessRegCertiNo: string
    busiRegDt: string
    busiCommencedDt: string
    postalAddress: PostalAddress
    descriptiveAddress: string
  }