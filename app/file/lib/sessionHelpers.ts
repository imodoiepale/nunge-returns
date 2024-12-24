// @ts-nocheck

import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { extractManufacturerDetails, validatePIN, fileNilReturn } from './returnHelpers'
import { FormData, ManufacturerDetails, FilingStatus } from './types'

const sessionService = new SessionManagementService()

export const fetchManufacturerDetails = async (
  pin: string,
  step: number,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setStep: (step: number) => void,
  setManufacturerDetails: (details: ManufacturerDetails | null) => void
) => {
  setLoading(true)
  setError(null)

  const validation = validatePIN(pin)
  if (!validation.isValid) {
    setError(validation.error)
    setStep(1)
    setLoading(false)
    setManufacturerDetails(null)
    return
  }

  const timeoutId = setTimeout(() => {
    setLoading(false)
    setError('You entered an invalid PIN. Please try again.')
    setStep(1)
    setManufacturerDetails(null)
  }, 12000)

  try {
    const details = await extractManufacturerDetails(pin)
    clearTimeout(timeoutId)

    if (!details.taxpayerName || details.taxpayerName.trim() === '') {
      setError('You entered an invalid PIN. Please try again.')
      setStep(1)
      setManufacturerDetails(null)
      setLoading(false)
      return
    }

    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        pin: pin,
        status: 'active',
        current_step: step,
        form_data: {
          pin: pin,
          manufacturerName: details.taxpayerName,
          taxpayerName: details.taxpayerName,
          email: details.mainEmailId,
          mobileNumber: details.mobileNumber
        }
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    sessionService.saveData('sessionId', newSession.id)
    sessionService.saveData('formData', {
      pin: pin,
      manufacturerName: details.taxpayerName,
      email: details.mainEmailId,
      mobileNumber: details.mobileNumber
    })
    sessionService.saveData('step', step)

    setManufacturerDetails({
      pin: pin,
      name: details.taxpayerName,
      contactDetails: {
        mobile: details.mobileNumber,
        email: details.mainEmailId,
        secondaryEmail: details.mainEmailId
      },
      businessDetails: {
        name: details.taxpayerName,
        registrationNumber: details.businessRegCertiNo,
        registrationDate: details.busiRegDt,
        commencedDate: details.busiCommencedDt
      },
      postalAddress: {
        postalCode: details.postalAddress.postalCode,
        town: details.postalAddress.town,
        poBox: details.postalAddress.poBox
      },
      physicalAddress: {
        descriptive: details.descriptiveAddress
      }
    })
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('Error in fetchManufacturerDetails:', error)
    setError('You entered an invalid PIN. Please try again.')
    setStep(1)
    setManufacturerDetails(null)
  } finally {
    setLoading(false)
  }
}

export const checkExistingSession = async (
  pin: string,
  setExistingSessionData: (data: any) => void,
  setShowDialog: (show: boolean) => void,
  restoreSession: (data: any) => Promise<void>
) => {
  try {
    if (pin.length !== 11) return true

    const { data: existingSessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'active')

    if (error) throw error

    if (existingSessions && existingSessions.length > 0) {
      const differentPinSession = existingSessions.find(session => session.pin !== pin)
      if (differentPinSession) {
        console.log("Found existing session:", differentPinSession)

        const manufacturerName = differentPinSession.form_data?.manufacturerName ||
          differentPinSession.form_data?.taxpayerName

        console.log("Manufacturer name found:", manufacturerName)

        setExistingSessionData({
          ...differentPinSession,
          form_data: {
            ...differentPinSession.form_data,
            manufacturerName: manufacturerName || 'unknown'
          }
        })

        setShowDialog(true)
        return false
      } else {
        console.log("Found existing session for same PIN")
        await restoreSession(existingSessions[0])
        return true
      }
    }

    return true
  } catch (error) {
    console.error('Error checking existing session:', error)
    return true
  }
}

export const handlePINChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  formData: FormData,
  setFormData: (formData: FormData) => void,
  checkExistingSession: (pin: string) => Promise<boolean>,
  setError: (error: string | null) => void
) => {
  const newPin = e.target.value.toUpperCase()
  setFormData({ ...formData, pin: newPin })
  
  const validation = validatePIN(newPin)
  if (validation.isValid) {
    console.log("Checking session for PIN:", newPin)
    const canProceed = await checkExistingSession(newPin)
    if (!canProceed) {
      console.log("Cannot proceed - existing session found")
      return
    }
    setError(null)
  } else {
    setError(validation.error)
  }
}

export const handleDialogConfirm = async (
  existingSessionData: any,
  formData: FormData,
  setManufacturerDetails: (details: ManufacturerDetails | null) => void,
  setShowDialog: (show: boolean) => void,
  setStep: (step: number) => void,
  fetchManufacturerDetails: (pin: string) => Promise<void>
) => {
  if (existingSessionData?.id) {
    try {
      await supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', existingSessionData.id)

      setManufacturerDetails(null)
      setShowDialog(false)

      if (formData.pin) {
        setStep(2)
        await fetchManufacturerDetails(formData.pin)
      }
    } catch (error) {
      console.error('Error handling dialog confirmation:', error)
    }
  }
}

export const handleDialogCancel = (
  existingSessionData: any,
  setShowDialog: (show: boolean) => void,
  restoreSession: (data: any) => Promise<void>
) => {
  setShowDialog(false)
  if (existingSessionData) {
    restoreSession(existingSessionData)
  }
}

export const restoreSession = async (
  sessionData: any,
  setFormData: (data: FormData) => void,
  setManufacturerDetails: (details: ManufacturerDetails | null) => void,
  setStep: (step: number) => void,
  setPaymentStatus: (status: "Not Paid" | "Processing" | "Paid") => void
) => {
  try {
    console.log("Restoring session data:", sessionData)

    if (sessionData.form_data.manufacturerDetails) {
      setManufacturerDetails(sessionData.form_data.manufacturerDetails)
    }

    setFormData({
      pin: sessionData.form_data.pin || "",
      manufacturerName: sessionData.form_data.manufacturerName || "",
      email: sessionData.form_data.email || "",
      mobileNumber: sessionData.form_data.mobileNumber || "",
      mpesaNumber: sessionData.form_data.mpesaNumber || "",
      password: sessionData.form_data.password || "",
    })

    setStep(sessionData.current_step || 1)

    if (sessionData.form_data.paymentStatus) {
      setPaymentStatus(sessionData.form_data.paymentStatus)
    }

    sessionService.saveData('sessionId', sessionData.id)
    sessionService.saveData('formData', sessionData.form_data)
    sessionService.saveData('step', sessionData.current_step)

  } catch (error) {
    console.error('Error restoring session:', error)
  }
}

export const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>,
  formData: FormData,
  step: number,
  setError: (error: string | null) => void,
  setFilingStatus: (status: FilingStatus) => void,
  setStep: (step: number) => void
) => {
  e.preventDefault()

  try {
    if (!validatePIN(formData.pin).isValid) {
      setError('Please enter a valid PIN before proceeding.')
      return
    }

    setError(null)

    const sessionId = sessionService.getData('sessionId')
    if (!sessionId) {
      try {
        const newSessionId = await sessionService.createSession(formData.pin)
        sessionService.saveData('sessionId', newSessionId)
      } catch (sessionError) {
        console.error('Error creating new session:', sessionError)
        setError('Failed to create new session. Please try again.')
        return
      }
    }

    if (step === 4) {
      try {
        setFilingStatus(prev => ({ ...prev, loggedIn: true }))

        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            current_step: step,
            form_data: {
              ...formData,
              password: formData.password
            }
          })
          .eq('id', sessionId)

        if (updateError) throw updateError

        const result = await fileNilReturn({
          pin: formData.pin,
          password: formData.password
        })

        if (result.status === "success") {
          const { error: completionError } = await supabase
            .from('sessions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              form_data: {
                ...formData,
                receiptNumber: result.receiptNumber
              }
            })
            .eq('id', sessionId)

          if (completionError) throw completionError

          setFilingStatus({
            loggedIn: true,
            filing: true,
            extracting: true,
            completed: true
          })
        } else {
          throw new Error(result.message)
        }
      } catch (filingError: any) {
        console.error('Error in filing process:', filingError)
        setError(filingError.message || 'Failed to complete filing process')
        return
      }
    } else {
      try {
        const { error: stepUpdateError } = await supabase
          .from('sessions')
          .update({
            current_step: step + 1,
            form_data: {
              ...formData,
              step: step + 1
            }
          })
          .eq('id', sessionId)

        if (stepUpdateError) throw stepUpdateError

        sessionService.saveData('step', step + 1)
        sessionService.saveData('formData', formData)

        setStep(step + 1)
      } catch (stepError: any) {
        console.error('Error updating step:', stepError)
        setError('Failed to proceed to next step. Please try again.')
        return
      }
    }
  } catch (error: any) {
    console.error('Unexpected error in handleSubmit:', error)
    setError('An unexpected error occurred. Please try again.')
  }
}

export const simulatePayment = (
  setPaymentStatus: (status: "Not Paid" | "Processing" | "Paid") => void
) => {
  setPaymentStatus("Processing")
  setTimeout(() => {
    setPaymentStatus("Paid")
  }, 2000)
}

export const downloadReceipt = (
  type: string,
  manufacturerDetails: ManufacturerDetails | null,
  endSession: () => void
) => {
  const link = document.createElement('a')
  link.href = '/nunge.pdf'
  const fileName = `${manufacturerDetails?.name || 'Unknown'} - ${type} Receipt.pdf`
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  if (type === 'all') {
    setTimeout(() => {
      endSession()
    }, 2000)
  }
}

export const endSession = async (
  formData: FormData,
  router: any
) => {
  try {
    const { data: currentSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('pin', formData.pin)
      .eq('status', 'active')
      .single()

    if (currentSession) {
      await sessionService.completeSession(currentSession.id)
      sessionService.clearAllData()
    }
  } catch (error) {
    console.error('Error ending session:', error)
  } finally {
    router.push('/')
  }
}