// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, CheckCircle, Clock, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageBackground } from "@/components/ui/page-background"
import { cn } from "@/lib/utils"

import { Step1IDUpload, Step2PersonalInfo, Step3ContactInfo, Step4Payment, Step5Review } from "./components/RegistrationSteps"

export default function KRARegistrationPage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // ID Information (extracted from ID)
    idNumber: "",
    surname: "",
    givenName: "",
    dateOfBirth: "",
    sex: "",
    placeOfBirth: "",
    nationality: "KEN",
    dateOfExpiry: "",
    placeOfIssue: "",
    
    // Additional Personal Info
    profession: "11", // Default to student (71-Students in KRA portal)
    citizenship: "KE", // Kenyan citizen
    
    // Address Information
    streetRoad: "Nairobi",
    city: "NAIROBI",
    county: "30",
    district: "93",
    locality: "664",
    town: "00100",
    poBox: "00100",
    
    // Contact Information
    mobileNumber: "",
    mainEmail: "",
    secondaryEmail: "",
    
    // Obligations
    hasAlternativeAddress: "No",
    declareBankAccounts: "No",
    isDirectorTrustee: "No",
    isTreasuryBond: "No",
    
    // Tax Obligations
    incomeTax: true,
    incomeTaxDate: new Date().toLocaleDateString('en-CA'),
    
    // Source of Income
    employmentIncome: "No",
    businessIncome: "No",
    rentalIncome: "No",
    
    // ID Images
    idFrontImage: null,
    idBackImage: null,
    idFrontPreview: null,
    idBackPreview: null,
  })
  
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "extracting" | "success" | "error">("idle")
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [newPIN, setNewPIN] = useState<string | null>(null)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [progressSteps, setProgressSteps] = useState<{text: string, done: boolean}[]>([])
  const [currentProgressStep, setCurrentProgressStep] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "paid">("idle")
  const [mpesaNumber, setMpesaNumber] = useState("")

  const steps = ["Upload ID", "Personal Info", "Contact Info", "Payment", "Review & Submit"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 5) {
      setStep(prev => prev + 1)
    } else {
      handleRegistration()
    }
  }

  const handleRegistration = async () => {
    setRegistrationStatus("processing")
    setRegistrationError(null)
    setShowOTPDialog(true)
    setProgressSteps([
      { text: "Navigating to KRA portal", done: false },
      { text: "Filling personal information", done: false },
      { text: "Filling address details", done: false },
      { text: "Sending OTP to mobile", done: false },
      { text: "Waiting for OTP verification", done: false },
      { text: "Submitting registration", done: false },
      { text: "Extracting PIN", done: false },
    ])

    try {
      // Step 1: Start registration (will pause for OTP)
      setCurrentProgressStep("Navigating to KRA portal")
      
      // Simulate progress updates during automation
      const progressInterval = setInterval(() => {
        setProgressSteps(prev => {
          const firstIncomplete = prev.findIndex(s => !s.done);
          if (firstIncomplete !== -1 && firstIncomplete < 4) {
            const newSteps = [...prev];
            newSteps[firstIncomplete] = { ...newSteps[firstIncomplete], done: true };
            setCurrentProgressStep(newSteps[firstIncomplete + 1]?.text || "Processing...");
            return newSteps;
          }
          return prev;
        });
      }, 8000); // Update every 8 seconds
      
      const response = await fetch('/api/kra/register-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, step: 'start' }),
      })

      clearInterval(progressInterval);
      const data = await response.json()

      if (data.needsOTP) {
        // Update progress to show OTP is needed
        setProgressSteps(prev => prev.map((s, i) => i <= 3 ? {...s, done: true} : s))
        setCurrentProgressStep("Waiting for OTP verification")
        setSessionId(data.sessionId)
        setRegistrationStatus("idle") // Reset to idle so button shows "Verify OTP & Continue"
        // Dialog is already open, waiting for user to enter OTP
      } else if (data.success) {
        setRegistrationStatus("success")
        setNewPIN(data.pin)
        setShowOTPDialog(false)
        setShowSuccessDialog(true)
      } else {
        setRegistrationStatus("error")
        setRegistrationError(data.error || "Registration failed")
        setShowOTPDialog(false)
      }
    } catch (error: any) {
      setRegistrationStatus("error")
      setRegistrationError(error.message || "An error occurred during registration")
      setShowOTPDialog(false)
    }
  }

  const handlePayment = async () => {
    if (!mpesaNumber || mpesaNumber.length < 10) {
      setRegistrationError("Please enter a valid M-Pesa number")
      return
    }

    setPaymentStatus("processing")
    setRegistrationError(null)

    // Simulate STK push and payment (3 seconds)
    setTimeout(() => {
      setPaymentStatus("paid")
    }, 3000)
  }

  const handleOTPSubmit = async () => {
    if (!otpValue || otpValue.length !== 4) {
      setRegistrationError("Please enter a valid 4-digit OTP")
      return
    }

    if (!sessionId) {
      setRegistrationError("Session expired. Please try again.")
      return
    }

    setRegistrationStatus("processing")
    setCurrentProgressStep("Verifying OTP and submitting registration")
    setProgressSteps(prev => prev.map((s, i) => i === 4 ? {...s, done: true} : s))

    try {
      const response = await fetch('/api/kra/register-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, step: 'complete', otp: otpValue, sessionId }),
      })

      const data = await response.json()

      if (data.success) {
        setProgressSteps(prev => prev.map(s => ({...s, done: true})))
        setCurrentProgressStep("Registration complete!")
        setRegistrationStatus("success")
        setNewPIN(data.pin)
        setTimeout(() => {
          setShowOTPDialog(false)
          setShowSuccessDialog(true)
        }, 1500)
      } else {
        setRegistrationStatus("error")
        setRegistrationError(data.error || "OTP verification failed")
      }
    } catch (error: any) {
      setRegistrationStatus("error")
      setRegistrationError(error.message || "An error occurred during OTP verification")
    }
  }

  const handleIDExtraction = async (frontImage: File, backImage: File | null) => {
    setExtractionStatus("extracting")
    setExtractionError(null)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('frontImage', frontImage)
      if (backImage) {
        formDataToSend.append('backImage', backImage)
      }

      const response = await fetch('/api/kra/extract-id', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (data.success) {
        setExtractionStatus("success")
        // Update form data with extracted information
        setFormData(prev => ({
          ...prev,
          idNumber: data.extractedData.idNumber || prev.idNumber,
          surname: data.extractedData.surname || prev.surname,
          givenName: data.extractedData.givenName || prev.givenName,
          dateOfBirth: data.extractedData.dateOfBirth || prev.dateOfBirth,
          sex: data.extractedData.sex || prev.sex,
          placeOfBirth: data.extractedData.placeOfBirth || prev.placeOfBirth,
          dateOfExpiry: data.extractedData.dateOfExpiry || prev.dateOfExpiry,
          placeOfIssue: data.extractedData.placeOfIssue || prev.placeOfIssue,
        }))
      } else {
        setExtractionStatus("error")
        setExtractionError(data.error || "Failed to extract ID information")
      }
    } catch (error: any) {
      setExtractionStatus("error")
      setExtractionError(error.message || "An error occurred during ID extraction")
    }
  }

  return (
    <PageBackground>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/services')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Register KRA PIN</h1>
          <p className="text-muted-foreground">
            Complete the steps below to register for your KRA Personal Identification Number
          </p>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">
              KRA PIN Registration
            </CardTitle>
            <CardDescription>
              Step {step} of 5: {steps[step - 1]}
            </CardDescription>

            {/* Progress Steps */}
            <div className="mt-6">
              <Progress value={(step / 5) * 100} className="h-2" />
              <div className="flex justify-between mt-2">
                {steps.map((s, index) => (
                  <div key={index} className={`flex flex-col items-center ${index < step ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm ${index < step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {index < step ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className="text-[10px] md:text-xs mt-1 text-center hidden md:block">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <Step1IDUpload
                  formData={formData}
                  setFormData={setFormData}
                  extractionStatus={extractionStatus}
                  extractionError={extractionError}
                  onExtract={handleIDExtraction}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <Step2PersonalInfo
                  formData={formData}
                  setFormData={setFormData}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}

              {step === 3 && (
                <Step3ContactInfo
                  formData={formData}
                  setFormData={setFormData}
                  otpSent={otpSent}
                  setOtpSent={setOtpSent}
                  otp={otp}
                  setOtp={setOtp}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              )}

              {step === 4 && (
                <Step4Payment
                  paymentStatus={paymentStatus}
                  onPayment={handlePayment}
                  mpesaNumber={mpesaNumber}
                  setMpesaNumber={setMpesaNumber}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                />
              )}

              {step === 5 && (
                <Step5Review
                  formData={formData}
                  registrationStatus={registrationStatus}
                  registrationError={registrationError}
                  onBack={() => setStep(4)}
                  onSubmit={handleRegistration}
                />
              )}
            </form>
          </CardContent>
        </Card>

        {/* OTP Verification Dialog */}
        <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
          <DialogContent className="w-[90%] max-w-[500px] rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-xl">KRA PIN Registration</DialogTitle>
              <DialogDescription>
                {currentProgressStep}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Error Alert - show at top if registration failed */}
              {registrationStatus === "error" && registrationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription className="text-sm">
                    {registrationError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Progress Steps */}
              <div className="space-y-2">
                {progressSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {step.done ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm ${step.done ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* OTP Input - only show when waiting for OTP */}
              {currentProgressStep === "Waiting for OTP verification" && registrationStatus !== "error" && (
                <div className="space-y-4 pt-4 border-t">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Enter OTP</AlertTitle>
                    <AlertDescription>
                      An OTP has been sent to your email address <strong>{formData.mainEmail}</strong>. Please enter it below.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code *</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>

                  {registrationError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{registrationError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleOTPSubmit}
                    disabled={otpValue.length !== 4 || registrationStatus === "processing"}
                    className="w-full"
                  >
                    {registrationStatus === "processing" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP & Continue"
                    )}
                  </Button>
                </div>
              )}

              {/* Try Again button when error occurs */}
              {registrationStatus === "error" && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowOTPDialog(false)
                      setRegistrationStatus("idle")
                      setRegistrationError(null)
                      setProgressSteps([])
                      setCurrentProgressStep("")
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Close & Try Again
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="w-[90%] max-w-[500px] rounded-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Registration Successful!
              </DialogTitle>
              <div className="text-base space-y-3 pt-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Your KRA PIN</AlertTitle>
                  <AlertDescription className="text-green-700">
                    <div className="text-2xl font-mono font-bold mt-2">{newPIN}</div>
                  </AlertDescription>
                </Alert>

                <p className="text-sm text-muted-foreground">
                  Your KRA PIN has been successfully registered. Please save this PIN for future use.
                </p>
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => router.push('/file')}
                className="w-full bg-gradient-to-r from-green-500 to-green-700"
              >
                File Nil Returns
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageBackground>
  )
}
