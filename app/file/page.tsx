// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Step1PIN, Step2Details, Step3Payment, Step4Filing } from "./components/ReturnSteps"
import { FormData, ManufacturerDetails, FilingStatus } from './lib/types'
import {
  fetchManufacturerDetails,
  checkExistingSession,
  handlePINChange,
  handleDialogConfirm,
  handleDialogCancel,
  restoreSession,
  handleSubmit,
  simulatePayment,
  downloadReceipt,
  endSession
} from './lib/sessionHelpers'
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

  useEffect(() => {
    const fetchUserCount = async () => {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')

      if (!error) {
        setUserCount(count === 0 ? 1 : count + 1)
      } else {
        console.error('Error fetching user count:', error)
        setUserCount(1)
      }
    }

    fetchUserCount()

    const subscription = supabase
      .channel('public:sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (_payload) => {
          fetchUserCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  useEffect(() => {
    const savedFormData = sessionService.getData('formData')
    const savedStep = sessionService.getData('step')

    if (savedFormData) setFormData(savedFormData)
    if (savedStep) setStep(savedStep)

    return () => {
      sessionService.saveData('formData', formData)
      sessionService.saveData('step', step)
    }
  }, [])

  useEffect(() => {
    sessionService.saveData('formData', formData)
    sessionService.saveData('step', step)
  }, [formData, step])

  useEffect(() => {
    if (step === 2 && formData.pin && !manufacturerDetails) {
      fetchManufacturerDetails(
        formData.pin,
        step,
        setLoading,
        setError,
        setStep,
        setManufacturerDetails
      )
    }
  }, [step, formData.pin, manufacturerDetails])

  const handlePINChangeWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handlePINChange(
      e,
      formData,
      setFormData,
      (pin: string) => checkExistingSession(pin, setExistingSessionData, setShowDialog, 
        (data: any) => restoreSession(data, setFormData, setManufacturerDetails, setStep, setPaymentStatus)),
      setError
    )
  }

  const handleDialogConfirmWrapper = async () => {
    await handleDialogConfirm(
      existingSessionData,
      formData,
      setManufacturerDetails,
      setShowDialog,
      setStep,
      (pin: string) => fetchManufacturerDetails(pin, step, setLoading, setError, setStep, setManufacturerDetails)
    )
  }

  const handleDialogCancelWrapper = () => {
    handleDialogCancel(
      existingSessionData,
      setShowDialog,
      (data: any) => restoreSession(data, setFormData, setManufacturerDetails, setStep, setPaymentStatus)
    )
  }

  const handleSubmitWrapper = async (e: React.FormEvent<HTMLFormElement>) => {
    await handleSubmit(e, formData, step, setError, setFilingStatus, setStep)
  }

  const simulatePaymentWrapper = () => {
    simulatePayment(setPaymentStatus)
  }

  const downloadReceiptWrapper = (type: string) => {
    downloadReceipt(type, manufacturerDetails, () => endSession(formData, router))
  }

  const endSessionWrapper = () => {
    endSession(formData, router)
  }

  const steps = ["Enter PIN", "Confirm Details", "Payment", "File Returns"]

  return (
    <div className="flex min-h-screen flex-col items-center py-8">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>

      <div className="text-center mb-4">
        <p className="text-lg font-semibold">You are user number: <span className="text-primary">#{userCount}</span></p>
        <p className="text-sm text-muted-foreground">Thank you for using our service!</p>
      </div>

      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>File Your Returns</CardTitle>
          <CardDescription>
            Step {step} of {steps.length}: {steps[step - 1]}
          </CardDescription>
          <div className="flex justify-between mt-4">
            {steps.map((s, index) => (
              <div key={index} className={`flex flex-col items-center ${index < step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index < step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {index < step ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs mt-1">{s}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-8">
            <div className="w-1/2 border-r pr-8">
              <h3 className="text-lg font-semibold mb-4">Filled Details</h3>
              {step > 1 && (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PIN</TableCell>
                      <TableCell>{formData.pin}</TableCell>
                    </TableRow>
                    {step > 2 && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">Name</TableCell>
                          <TableCell>{manufacturerDetails?.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Email</TableCell>
                          <TableCell>{manufacturerDetails?.contactDetails.email}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Mobile</TableCell>
                          <TableCell>{manufacturerDetails?.contactDetails.mobile}</TableCell>
                        </TableRow>
                      </>
                    )}
                    {step > 3 && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">M-Pesa Number</TableCell>
                          <TableCell>{formData.mpesaNumber}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Payment Status</TableCell>
                          <TableCell>{paymentStatus}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="w-1/2">
              <form onSubmit={handleSubmitWrapper} className="space-y-4">
                {step === 1 && (
                  <Step1PIN
                    pin={formData.pin}
                    error={error}
                    onPINChange={handlePINChangeWrapper}
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
                    onSimulatePayment={simulatePaymentWrapper}
                  />
                )}

                {step === 4 && (
                  <Step4Filing
                    pin={formData.pin}
                    password={formData.password}
                    error={error}
                    filingStatus={filingStatus}
                    onPasswordChange={(value) => setFormData({ ...formData, password: value })}
                    onDownloadReceipt={downloadReceiptWrapper}
                    onEndSession={endSessionWrapper}
                  />
                )}

                <div className="flex justify-between">
                  {step > 1 && !filingStatus.completed && (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                      Back
                    </Button>
                  )}
                  {!filingStatus.completed && (
                    <Button
                      type="submit"
                      disabled={step === 3 && paymentStatus !== "Paid"}
                    >
                      {step === 4 ? "File Returns" : "Next"}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Existing Session Found</DialogTitle>
            <DialogDescription className="text-black">
              There is an active session for <strong>{existingSessionData?.form_data?.manufacturerName || 'unknown'}</strong> ({existingSessionData?.pin}).
              Current progress: Step {existingSessionData?.current_step || 1} of 4.
              Do you want to end it and start a new session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleDialogCancelWrapper}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogConfirmWrapper}
            >
              End Session & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}