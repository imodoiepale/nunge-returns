// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Badge, Check, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Step1PIN, Step2Details, Step3Payment, Step4Filing } from "./components/ReturnSteps"
import { FormData, ManufacturerDetails, FilingStatus } from './lib/types'
import {
  validatePassword,
  resetPassword,
  resetPasswordAndEmail,
  validatePIN,
  extractManufacturerDetails,
  fileNilReturn
} from './lib/returnHelpers'

import { cn } from "@/lib/utils"
import SessionManagementService from "@/src/sessionManagementService"
import { supabase } from '@/lib/supabaseClient'

const sessionService = new SessionManagementService()

export default function FilePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    pin: "",
    manufacturerName: "",
    email: "",
    mobileNumber: "",
    mpesaNumber: "",
    password: "",
    activeTab: 'pin'
  })
  const [manufacturerDetails, setManufacturerDetails] = useState<ManufacturerDetails | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"Not Paid" | "Processing" | "Paid">("Not Paid")
  const [filingStatus, setFilingStatus] = useState<FilingStatus>({
    loggedIn: false,
    filing: false,
    extracting: false,
    completed: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userCount, setUserCount] = useState<number>(0)
  const [showDialog, setShowDialog] = useState(false)
  const [existingSessionData, setExistingSessionData] = useState<any>(null)
  const [pinValidationStatus, setPinValidationStatus] = useState<"idle" | "checking" | "invalid" | "valid">("idle");
  const [passwordValidationStatus, setPasswordValidationStatus] = useState<"idle" | "checking" | "invalid" | "valid">("idle")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [sessionTime, setSessionTime] = useState(300)
  const [showWarning, setShowWarning] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)

  // Fetch user count
  useEffect(() => {
    const fetchUserCount = async () => {
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')
        .eq('current_step', '4');

      setUserCount(count === 0 ? 1 : count + 1)
    }

    fetchUserCount()

    const subscription = supabase
      .channel('public:sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => fetchUserCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  useEffect(() => {
    const initializeSession = async () => {
      try {
        await sessionService.createProspectSession();
      } catch (error) {
        console.error('Error creating prospect session:', error);
      }
    };

    initializeSession();
  }, []);

  // Session timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step >= 2 && !sessionStartTime && !filingStatus.completed) {
      setSessionStartTime(new Date());
      setSessionTime(300); // 5 minutes
    }

    if (sessionStartTime && step >= 2 && !filingStatus.completed) {
      timer = setInterval(() => {
        setSessionTime((prev) => {
          if (prev <= 0) {
            setShowTimeoutDialog(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });

        // Show warning when 1 minute remaining
        if (sessionTime <= 60) {
          setShowWarning(true);
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionStartTime, step, filingStatus.completed]);

  const handlePINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPin = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, pin: newPin }));
    
    if (newPin.length === 11) {
      setPinValidationStatus("checking");
      try {
        const response = await fetch(`/api/manufacturer/kra?pin=${encodeURIComponent(newPin)}`, {
          method: 'GET'
        });
        const data = await response.json();
        
        if (data.success) {
          setPinValidationStatus("valid");
          setManufacturerDetails(data.data);
        } else {
          setPinValidationStatus("invalid");
        }
      } catch (error) {
        setPinValidationStatus("invalid");
      }
    } else {
      setPinValidationStatus("idle");
    }
  };

  const handlePasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData(prev => ({ ...prev, password: newPassword }));
    
    // Reset validation if password is empty
    if (!newPassword) {
      setPasswordValidationStatus("idle");
      setPasswordError(null);
      return;
    }

    // Only validate if we have a valid PIN
    if (formData.pin && pinValidationStatus === "valid") {
      setPasswordValidationStatus("checking");
      try {
        const response = await fetch('/api/validate-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pin: formData.pin, password: newPassword }),
        });

        const data = await response.json();

        if (data.success) {
          setPasswordValidationStatus("valid");
          setPasswordError(null);
        } else {
          setPasswordValidationStatus("invalid");
          setPasswordError(data.message || "Invalid password");
        }
      } catch (error) {
        setPasswordValidationStatus("invalid");
        setPasswordError("Error validating password");
      }
    }
  };

  const handleActiveTabChange = (tab: 'id' | 'pin') => {
    setFormData(prev => ({ ...prev, activeTab: tab }));
    // Reset validation states when switching tabs
    setPasswordValidationStatus("idle");
    setPasswordError(null);
  };

  const validatePassword = async (pin: string, password: string) => {
    setPasswordValidationStatus("checking");
    try {
      const response = await fetch('/api/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin, password }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordValidationStatus("valid");
        setPasswordError(null);
        
        // Only fetch manufacturer details if we don't already have them
        if (!manufacturerDetails) {
          setLoading(true);
          try {
            const id = formData.manufacturerName;
            const name = formData.manufacturerName;
            const pin = formData.pin;
            
            let response;
            if (id && name) {
              // Use BRS endpoint with GET request
              response = await fetch(
                `/api/manufacturer/brs?id=${encodeURIComponent(id)}&firstName=${encodeURIComponent(name)}`,
                { method: 'GET' }
              );
            } else {
              // Use KRA endpoint with GET request
              response = await fetch(
                `/api/manufacturer/kra?pin=${encodeURIComponent(pin)}`,
                { method: 'GET' }
              );
            }
            
            const detailsData = await response.json();
            
            if (detailsData.success) {
              setManufacturerDetails(detailsData.data);
            } else {
              setError(detailsData.error || "Failed to fetch manufacturer details");
            }
          } catch (error) {
            setError("Error fetching manufacturer details");
          } finally {
            setLoading(false);
          }
        }
      } else {
        setPasswordValidationStatus("invalid");
        setPasswordError(data.message || "Invalid password");
      }
    } catch (error) {
      setPasswordValidationStatus("invalid");
      setPasswordError("Error validating password");
    }
  };

  const handlePINChangeWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPin = e.target.value.toUpperCase();

    // Basic form update
    setFormData(prev => ({
        ...prev,
        pin: newPin,
        password: '', // Clear password when PIN changes
        manufacturerName: '', // Clear manufacturer name
        email: '', // Clear email
        mobileNumber: '', // Clear mpesa number
        mpesaNumber: '' // Clear mpesa number
    }));

    // Reset all states
    setPasswordValidationStatus("idle");
    setPasswordError(null);
    setManufacturerDetails(null);
    setError(null);
    setStep(1);
    setPaymentStatus("Not Paid");
    setFilingStatus({
        loggedIn: false,
        filing: false,
        extracting: false,
        completed: false
    });

    // Format validation first
    const validation = validatePIN(newPin);
    if (!validation.isValid) {
        setError(validation.error);
        setPinValidationStatus("invalid");
        return;
    }

    // Only proceed if PIN is complete
    if (newPin.length === 11) {
        setPinValidationStatus("checking");
        setLoading(true);

        try {
            // 1. First check for existing sessions
            const existingSession = await sessionService.handlePinChange(newPin);

            if (existingSession) {
                // Store current state and show dialog
                setExistingSessionData({
                    ...existingSession,
                    previousState: {
                        formData: { ...formData },
                        manufacturerDetails,
                        step,
                        passwordValidationStatus,
                        passwordError,
                        paymentStatus,
                        filingStatus
                    },
                    originalPin: newPin,
                    manufacturerName: existingSession.form_data?.manufacturerName || 'Unknown'
                });
                setShowDialog(true);
                setPinValidationStatus("idle");
                return;
            }

            // 2. If no existing session, validate PIN against KRA
            const details = await extractManufacturerDetails(newPin);
            
            if (!details || !details.taxpayerName) {
                setError('PIN NOT FOUND!');
                setManufacturerDetails(null);
                setPinValidationStatus("invalid");
                return;
            }

            // 3. Update current session with new PIN and details
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
              await sessionService.updateSession(currentSessionId, {
                pin: newPin,
                form_data: {
                  ...formData,
                  pin: newPin,
                  password: '',
                  manufacturerName: details.taxpayerName,
                  email: details.mainEmailId,
                  mobileNumber: details.mobileNumber,
                  manufacturerDetails: details
                }
              });

              // Update form data with fetched details
              setFormData(prev => ({
                ...prev,
                manufacturerName: details.taxpayerName,
                email: details.mainEmailId,
                mobileNumber: details.mobileNumber
              }));

              // Set manufacturer details in state
              setManufacturerDetails({
                pin: newPin,
                name: details.taxpayerName,
                contactDetails: {
                  mobile: details.mobileNumber,
                  email: details.mainEmailId,
                  secondaryEmail: details.mainEmailId
                },
                businessDetails: {
                  name: details.taxpayerName,
                  registrationNumber: details.businessRegCertiNo || '',
                  registrationDate: details.busiRegDt || '',
                  commencedDate: details.busiCommencedDt || ''
                },
                postalAddress: {
                  postalCode: details.postalAddress?.postalCode || '',
                  town: details.postalAddress?.town || '',
                  poBox: details.postalAddress?.poBox || ''
                },
                physicalAddress: {
                  descriptive: details.descriptiveAddress || ''
                }
              });
            }

            setPinValidationStatus("valid");
            setError(null);
            
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to verify PIN. Please try again.');
            setManufacturerDetails(null);
            setPinValidationStatus("invalid");
            
            // Attempt to mark session as error
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await sessionService.updateSession(currentSessionId, {
                        status: 'error',
                        error_message: error.message || 'Failed to verify PIN'
                    });
                } catch (sessionError) {
                    console.error('Error updating session status:', sessionError);
                }
            }
        } finally {
            setLoading(false);
        }
    } else {
        // Reset validation if PIN is incomplete
        setPinValidationStatus("idle");
        setManufacturerDetails(null);
    }
};

  // Corresponding handleDialogAction function for PIN change confirmation
  const handleDialogAction = async (action: 'proceed' | 'cancel') => {
    setShowDialog(false);

    if (action === 'cancel') {
      if (existingSessionData?.previousState) {
        const { formData, manufacturerDetails, step, passwordValidationStatus, passwordError, paymentStatus, filingStatus } = existingSessionData.previousState;
        setFormData(formData);
        setManufacturerDetails(manufacturerDetails);
        setStep(step);
        setPasswordValidationStatus(passwordValidationStatus);
        setPasswordError(passwordError);
        setPaymentStatus(paymentStatus);
        setFilingStatus(filingStatus);
      }
    } else {
      if (existingSessionData?.id) {
        try {
          setLoading(true);

          // Complete existing session
          await sessionService.completeSession(existingSessionData.id);

          // Clear states
          setManufacturerDetails(null);
          setPasswordValidationStatus("idle");
          setPasswordError(null);

          const newPin = existingSessionData.originalPin;
          if (newPin) {
            // Create or update session with user_id
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
              const userDetails = await extractManufacturerDetails(newPin);

              if (!userDetails || !userDetails.taxpayerName) {
                setError('PIN NOT FOUND!');
                setPinValidationStatus("invalid");
                return;
              }

              // Create user and get user_id
              const { data: userData, error: userError } = await supabase
                .from('users')
                .upsert({
                  pin: newPin,
                  name: userDetails.taxpayerName,
                  email: userDetails.mainEmailId,
                  phone: userDetails.mobileNumber
                })
                .select()
                .single();

              if (userError) throw userError;

              // Update session with user_id and details
              await sessionService.updateSession(currentSessionId, {
                pin: newPin,
                user_id: userData.id,
                status: 'active',
                form_data: {
                  ...formData,
                  pin: newPin,
                  password: '',
                  manufacturerDetails: userDetails
                }
              });

              // Set manufacturer details in state
              setManufacturerDetails({
                pin: newPin,
                name: userDetails.taxpayerName,
                contactDetails: {
                  mobile: userDetails.mobileNumber,
                  email: userDetails.mainEmailId,
                  secondaryEmail: userDetails.mainEmailId
                },
                businessDetails: {
                  name: userDetails.taxpayerName,
                  registrationNumber: userDetails.businessRegCertiNo || '',
                  registrationDate: userDetails.busiRegDt || '',
                  commencedDate: userDetails.busiCommencedDt || ''
                },
                postalAddress: {
                  postalCode: userDetails.postalAddress?.postalCode || '',
                  town: userDetails.postalAddress?.town || '',
                  poBox: userDetails.postalAddress?.poBox || ''
                },
                physicalAddress: {
                  descriptive: userDetails.descriptiveAddress || ''
                }
              });

              setPinValidationStatus("valid");
              setError(null);
            }
          }
        } catch (error) {
          console.error('Error handling session transition:', error);
          setError('Failed to transition session. Please try again.');
          setPinValidationStatus("invalid");
        } finally {
          setLoading(false);
        }
      }
    }
    setExistingSessionData(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (step === 1) {
      const isPasswordValid = await validatePassword(
        formData.pin,
        formData.password,
        setPasswordValidationStatus,
        setPasswordError
      )
      if (!isPasswordValid) return
      setStep(2)
    }

    if (step === 4) {
      setFilingStatus(prev => ({ ...prev, loggedIn: true }))

      try {
        const result = await fileNilReturn({
          pin: formData.pin,
          password: formData.password
        })

        if (result.status === "success") {
          setFilingStatus({
            loggedIn: true,
            filing: true,
            extracting: true,
            completed: true
          })
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        setError('Failed to complete filing process')
      }
    }
  }


  // Handle password reset
  const handlePasswordReset = async () => {
    const success = await resetPassword(formData.pin)
    if (success) {
      alert("Password reset instructions have been sent to your registered mobile number.")
    } else {
      alert("Failed to initiate password reset. Please try again.")
    }
  }

  // Handle password and email reset
  const handlePasswordEmailReset = async () => {
    const success = await resetPasswordAndEmail(formData.pin)
    if (success) {
      alert("Password and email reset instructions have been sent to your registered mobile number.")
    } else {
      alert("Failed to initiate reset. Please try again.")
    }
  }

  // Simulate payment
  const simulatePayment = () => {
    setPaymentStatus("Processing")
    setTimeout(() => {
      setPaymentStatus("Paid")
    }, 2000)
  }

  // Handle receipt download
  const downloadReceipt = (type: string) => {
    const link = document.createElement('a')
    link.href = '/receipt.pdf'  // Replace with actual receipt URL
    link.download = `${manufacturerDetails?.name || 'Unknown'}_${type}_receipt.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (type === 'all') {
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    }
  }

  // Handle session end
  const endSession = async () => {
    const currentSessionId = sessionService.getData('currentSessionId');

    if (currentSessionId) {
      await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', currentSessionId);
    }

    sessionService.clearAllData();
    setShowTimeoutDialog(false);
    window.location.href = '/file';
  }

  const renderStepButtons = () => {
    if (filingStatus.completed) return null;

    return (
      <div className="flex justify-between mt-4 space-x-4">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}

        {step === 1 && (
          <div className="space-x-4">
            {passwordValidationStatus !== "valid" && formData.activeTab === 'id' && (
              <Button
                type="button"
                disabled={!formData.pin || !validatePIN(formData.pin).isValid || !formData.password}
                onClick={() => validatePassword(formData.pin, formData.password)}
                className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] text-white"
              >
                Validate Password
              </Button>
            )}
            {(passwordValidationStatus === "valid" || formData.activeTab === 'pin') && (
              <Button
                type="button"
                disabled={formData.activeTab === 'id' ? (!formData.pin || !validatePIN(formData.pin).isValid || !formData.password || passwordValidationStatus !== "valid") : !formData.pin || pinValidationStatus !== "valid"}
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-purple-500 to-purple-700"
              >
                Proceed to Next Step
              </Button>
            )}
          </div>
        )}

        {step === 2 && (
          <Button
            type="button"
            onClick={() => setStep(3)}
            className="bg-gradient-to-r from-purple-500 to-purple-700"
          >
            Confirm & Continue
          </Button>
        )}

        {step === 3 && (
          <Button
            type="button"
            disabled={paymentStatus !== "Paid"}
            onClick={() => setStep(4)}
            className="bg-gradient-to-r from-purple-500 to-purple-700"
          >
            Continue to Filing
          </Button>
        )}

        {step === 4 && (
          <Button
            type="submit"
            className="animate-bounce bg-gradient-to-r from-purple-400 to-purple-700"
          >
            File Returns
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center py-4 md:py-8 px-4">
      {/* Back Link */}
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>
  
      {/* User Counter */}
      <div className="text-center mb-4 mt-12 md:mt-0">
        <p className="text-base md:text-lg font-semibold">
          You are user number: <span className="text-primary">#{userCount}</span>
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">
          Thank you for using our service!
        </p>
      </div>
  
      {/* Main Card */}
      <Card className={cn(
        "w-full max-w-6xl relative",
        showWarning && "border-yellow-500"
      )}>
        <CardHeader>
          {/* Session Timer */}
          {sessionStartTime && (
            <div className="absolute top-4 right-4">
              <div className={cn(
                "rounded-full px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 text-sm",
                showWarning
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                  : "bg-gradient-to-r from-purple-500 to-purple-700 text-white"
              )}>
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-mono">
                  {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
  
          <CardTitle className="text-xl md:text-2xl">File Your Returns</CardTitle>
          <CardDescription>
            Step {step} of 4: {steps[step - 1]}
          </CardDescription>
  
          {/* Progress Steps */}
          <div className="flex justify-between mt-4 px-2">
            {steps.map((s, index) => (
              <div key={index} className={`flex flex-col items-center ${index < step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm ${index < step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {index < step ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="text-[10px] md:text-xs mt-1 text-center hidden md:block">{s}</span>
              </div>
            ))}
          </div>
        </CardHeader>
  
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Filled Details Section */}
            <div className="w-full lg:w-1/2 lg:border-r lg:pr-8">
              <h3 className="text-base md:text-lg font-semibold mb-4">Filled Details</h3>
              {step > 1 && (
                <div className="rounded-lg border border-gray-100 bg-white/50 backdrop-blur-sm shadow-lg overflow-x-auto">
                  <Table className="[&_tr:last-child]:border-0 min-w-[300px]">
                    <TableBody className="divide-y divide-gray-50">
                      <TableRow className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">PIN</TableCell>
                        <TableCell className="font-mono tracking-wide text-gray-900">
                          {formData.pin}
                        </TableCell>
                      </TableRow>
  
                      <TableRow className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">Password</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <div className="font-mono tracking-wide text-gray-900">
                              {showPassword ? formData.password : "•".repeat(formData.password.length)}
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              {passwordValidationStatus === "valid" && (
                                <div className="rounded-full bg-gradient-to-r from-green-500 to-green-600 p-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
  
                      {step > 2 && manufacturerDetails && (
                        <>
                          <TableRow className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">Name</TableCell>
                            <TableCell className="text-gray-900 break-words">
                              {manufacturerDetails.name}
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">Email</TableCell>
                            <TableCell className="text-gray-900 break-words">
                              {manufacturerDetails.contactDetails.email}
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">Mobile</TableCell>
                            <TableCell className="text-gray-900">
                              {manufacturerDetails.contactDetails.mobile}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
  
                      {(step === 3 || step === 4) && (
                        <>
                          <TableRow className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">M-Pesa Number</TableCell>
                            <TableCell className="font-mono text-gray-900">
                              {formData.mpesaNumber}
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="font-medium text-gray-700 pl-4 md:pl-6">Payment Status</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "text-white font-medium text-xs md:text-sm",
                                paymentStatus === "Paid"
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : paymentStatus === "Processing"
                                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                    : "bg-gradient-to-r from-red-500 to-red-600"
                              )}>
                                {paymentStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
  
            {/* Form Section */}
            <div className="w-full lg:w-1/2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 && (
                  <Step1PIN
                    pin={formData.pin}
                    password={formData.password}
                    error={error}
                    passwordError={passwordError}
                    pinValidationStatus={pinValidationStatus}
                    passwordValidationStatus={passwordValidationStatus}
                    onPINChange={handlePINChange}
                    onPasswordChange={handlePasswordChange}
                    onPasswordReset={handlePasswordReset}
                    onPasswordEmailReset={handlePasswordEmailReset}
                    onNext={() => setStep(2)}
                    onActiveTabChange={handleActiveTabChange}
                    onManufacturerDetailsFound={setManufacturerDetails}
                  />
                )}
  
                {step === 2 && (
                  <Step2Details
                    loading={loading}
                    manufacturerDetails={manufacturerDetails}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                  />
                )}
  
                {step === 3 && (
                  <Step3Payment
                    mpesaNumber={formData.mpesaNumber}
                    paymentStatus={paymentStatus}
                    onMpesaNumberChange={(value) => setFormData({ ...formData, mpesaNumber: value })}
                    onSimulatePayment={simulatePayment}
                  />
                )}
  
                {step === 4 && (
                  <Step4Filing
                    pin={formData.pin}
                    password={formData.password}
                    error={error}
                    filingStatus={filingStatus}
                    sessionStartTime={sessionStartTime}
                    onPasswordChange={(value) => setFormData({ ...formData, password: value })}
                    onDownloadReceipt={downloadReceipt}
                    onEndSession={endSession}
                  />
                )}
  
                {/* Step Buttons */}
                <div className="flex flex-col md:flex-row md:justify-between md:gap-2 mt-6 lg:mt-8">
                  {renderStepButtons()}
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
  
      {/* Session Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[90%] max-w-[425px] rounded-lg p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Active Session Found</DialogTitle>
            <DialogDescription className="text-black space-y-2 text-sm">
              <p>
                There is an active session for <strong>{existingSessionData?.manufacturerName}</strong>
              </p>
              <p>PIN: {existingSessionData?.pin}</p>
              <p>Progress: Step {existingSessionData?.current_step || 1} of 4</p>
              <p className="font-semibold text-red-600">
                Proceeding will end the existing session and start a new one.
              </p>
            </DialogDescription>
          </DialogHeader>
  
          <DialogFooter className="flex flex-col space-y-2">
            <Button
              type="button"
              onClick={() => handleDialogAction('cancel')}
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
            >
              Keep Existing Session
            </Button>
            <Button
              type="button"
              onClick={() => handleDialogAction('proceed')}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            >
              End & Start New
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
      {/* Timeout Dialog */}
      <Dialog open={showTimeoutDialog} onOpenChange={setShowTimeoutDialog}>
        <DialogContent className="w-[90%] max-w-[425px] rounded-lg p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Session Timeout</DialogTitle>
            <DialogDescription className="text-black text-sm">
              Your session has expired due to inactivity. You will need to start a new session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={endSession}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700"
            >
              Start New Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const steps = ["Enter PIN", "Confirm Details", "Payment", "File Returns"]