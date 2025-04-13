// @ts-nocheck

import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { extractManufacturerDetails, validatePIN, fileNilReturn } from './returnHelpers'
import { FormData, ManufacturerDetails, FilingStatus } from './types'
import { v4 as uuidv4 } from 'uuid';

const sessionService = new SessionManagementService()

export const fetchManufacturerDetails = async (
    pin: string,
    step: number,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    setStep: (step: number) => void,
    setManufacturerDetails: (details: ManufacturerDetails | null) => void
) => {
    if (!pin || pin.length !== 11) {
        setError('Invalid PIN length. Please enter a valid 11-digit PIN.');
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const validation = validatePIN(pin);
        if (!validation.isValid) {
            setError(validation.error);
            setStep(1);
            setManufacturerDetails(null);
            return;
        }

        const details = await extractManufacturerDetails(pin);

        if (!details || !details.taxpayerName || details.taxpayerName.trim() === '') {
            setError('Could not find manufacturer details for this PIN. Please verify and try again.');
            setStep(1);
            setManufacturerDetails(null);
            return;
        }

        // First, try to find an existing active session with this PIN
        const { data: existingSession, error: existingSessionError } = await supabase
            .from('sessions')
            .select('id')
            .eq('pin', pin)
            .eq('status', 'active')
            .single();

        let newSession;
        if (existingSessionError || !existingSession) {
            // No existing active session, create a new one
            const { data, error } = await supabase
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
                .single();

            if (error) {
                console.error('Error creating new session:', error);
                setError('Failed to create session. Please try again.');
                return;
            }
            newSession = data;
        } else {
            // Update existing active session
            const { data, error } = await supabase
                .from('sessions')
                .update({
                    current_step: step,
                    form_data: {
                        pin: pin,
                        manufacturerName: details.taxpayerName,
                        taxpayerName: details.taxpayerName,
                        email: details.mainEmailId,
                        mobileNumber: details.mobileNumber
                    }
                })
                .eq('id', existingSession.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating existing session:', error);
                setError('Failed to update session. Please try again.');
                return;
            }
            newSession = data;
        }

        // Save session data
        sessionService.saveData('currentSessionId', newSession.id);
        sessionService.saveData('formData', {
            pin: pin,
            manufacturerName: details.taxpayerName,
            email: details.mainEmailId,
            mobileNumber: details.mobileNumber
        });
        sessionService.saveData('step', step);

        // Set manufacturer details
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
    } catch (error: any) {
        console.error('Error in fetchManufacturerDetails:', error);
        setError('Failed to fetch manufacturer details. Please try again.');
        setStep(1);
        setManufacturerDetails(null);
    } finally {
        setLoading(false);
    }
};

export const checkExistingSession = async (
    pin: string,
    setExistingSessionData: (data: any) => void,
    setShowDialog: (show: boolean) => void,
    restoreSession: (data: any) => Promise<void>
) => {
    try {
        if (pin.length !== 11) return true;

        // Get current session ID
        const currentSessionId = sessionService.getData('currentSessionId');

        // Get all active sessions
        const { data: allSessions, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('status', 'active');

        if (error) throw error;

        // Filter out expired sessions and process active ones
        for (const session of allSessions) {
            // Skip if this is the current session
            if (session.id === currentSessionId) continue;

            // Check if session is still active (less than 5 minutes old)
            const lastActivity = new Date(session.last_activity || session.created_at);
            const now = new Date();
            const diffMinutes = (now - lastActivity) / (1000 * 60);

            if (diffMinutes > 5) {
                // Complete expired sessions
                await supabase
                    .from('sessions')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', session.id);
                continue;
            }

            // If we find an active session with a different PIN
            if (session.pin !== pin && session.status === 'active') {
                console.log("Found active session:", session);

                const manufacturerName = session.form_data?.manufacturerName ||
                    session.form_data?.taxpayerName ||
                    'unknown';

                setExistingSessionData({
                    ...session,
                    originalPin: pin,
                    form_data: {
                        ...session.form_data,
                        manufacturerName
                    }
                });
                setShowDialog(true);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error checking existing session:', error);
        return true;
    }
};

export const handlePINChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    formData: FormData,
    setFormData: (formData: FormData) => void,
    checkExistingSession: (pin: string) => Promise<boolean>,
    setError: (error: string | null) => void
) => {
    const newPin = e.target.value.toUpperCase();

    // Update form data with new PIN
    setFormData(prevData => ({ ...prevData, pin: newPin }));

    // Only proceed with validation and session check if PIN is complete
    if (newPin.length === 11) {
        const validation = validatePIN(newPin);
        if (validation.isValid) {
            // Clear any existing errors before checking session
            setError(null);

            // Check for existing sessions with this PIN
            const canProceed = await checkExistingSession(newPin);
            if (!canProceed) {
                // Don't show validation error if there's a session conflict
                console.log("Session conflict detected for PIN:", newPin);
                return;
            }
        } else {
            setError(validation.error);
        }
    }
};

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
            // Complete the existing session
            await supabase
                .from('sessions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', existingSessionData.id);

            // Clear the dialog
            setShowDialog(false);
            setManufacturerDetails(null);

            // Create new session for current user
            if (formData.pin) {
                const newSessionId = await sessionService.createSession(formData.pin, {
                    pin: formData.pin,
                    status: 'active',
                    current_step: 1
                });
                sessionService.saveData('currentSessionId', newSessionId);

                // Proceed with manufacturer details fetch
                await fetchManufacturerDetails(formData.pin);
            }
        } catch (error) {
            console.error('Error handling dialog confirmation:', error);
        }
    }
};

export const handleDialogCancel = async (
    existingSessionData: any,
    setShowDialog: (show: boolean) => void,
    setFormData: (data: any) => void,
    setStep: (step: number) => void,
    setManufacturerDetails: (details: any) => void
) => {
    setShowDialog(false);

    // Restore to the original state before the conflicting session
    if (existingSessionData?.previousState) {
        const { formData, manufacturerDetails, step, passwordValidationStatus } = existingSessionData.previousState;

        setFormData(formData);
        setManufacturerDetails(manufacturerDetails);
        setStep(step);

        // Optional: Restore other states if needed
        // setPasswordValidationStatus(passwordValidationStatus);
    } else {
        // Fallback: Reset to initial state
        setFormData({
            pin: existingSessionData?.originalPin || "",
            manufacturerName: "",
            email: "",
            mobileNumber: "",
            mpesaNumber: "",
            password: "",
        });
        setManufacturerDetails(null);
        setStep(1);
    }
};

export const restoreSession = async (
    sessionData: any,
    setFormData: (data: FormData) => void,
    setManufacturerDetails: (details: ManufacturerDetails | null) => void,
    setStep: (step: number) => void,
    setPaymentStatus: (status: "Not Paid" | "Processing" | "Paid") => void,
    setPasswordValidationStatus?: (status: "idle" | "checking" | "invalid" | "valid") => void
) => {
    try {
        console.log("Restoring session data:", sessionData);

        // Clear existing states first
        setManufacturerDetails(null);
        setPaymentStatus("Not Paid");

        // Restore manufacturer details if they exist
        if (sessionData.form_data?.manufacturerDetails) {
            setManufacturerDetails(sessionData.form_data.manufacturerDetails);
        }

        // Restore form data
        setFormData({
            pin: sessionData.form_data?.pin || "",
            manufacturerName: sessionData.form_data?.manufacturerName || "",
            email: sessionData.form_data?.email || "",
            mobileNumber: sessionData.form_data?.mobileNumber || "",
            mpesaNumber: sessionData.form_data?.mpesaNumber || "",
            password: sessionData.form_data?.password || "",
        });

        // Restore step
        setStep(sessionData.current_step || 1);

        // Restore password validation status if function is provided
        if (setPasswordValidationStatus && sessionData.form_data?.passwordValidationStatus) {
            setPasswordValidationStatus(sessionData.form_data.passwordValidationStatus);
        }

        // Restore payment status if it exists
        if (sessionData.form_data?.paymentStatus) {
            setPaymentStatus(sessionData.form_data.paymentStatus);
        }

        // Save to session storage
        if (sessionData.id) {
            sessionService.saveData('currentSessionId', sessionData.id);
            sessionService.saveData('formData', sessionData.form_data);
            sessionService.saveData('step', sessionData.current_step);
        } else {
            // Clear session storage if no valid session
            sessionService.clearAllData();
        }

    } catch (error) {
        console.error('Error restoring session:', error);
    }
};

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

        // Get or create session ID
        let sessionId = sessionService.getData('currentSessionId')
        console.log('[SESSION] Current session ID from storage:', sessionId)

        if (!sessionId) {
            try {
                // Create a new prospect session in the database
                console.log('[SESSION] Creating new prospect session...')
                const newSessionId = await sessionService.createProspectSession()
                sessionId = newSessionId
                sessionService.saveData('currentSessionId', newSessionId)

                console.log('[SESSION] Created new prospect session:', newSessionId)
            } catch (sessionError) {
                console.error('[SESSION ERROR] Error creating new session:', sessionError)
                setError('Failed to create new session. Please try again.')
                return
            }
        }

        if (step === 4) {
            try {
                console.log('[FILING] Starting final filing step for session:', sessionId)
                setFilingStatus(prev => ({ ...prev, loggedIn: true }))

                // Update session with current form data
                console.log('[DB] Updating session data for step 4:', {
                    sessionId,
                    pin: formData.pin,
                    email: formData.email || null,
                    name: formData.name || formData.taxpayerName || null
                })

                const { data, error: updateError } = await supabase
                    .from('sessions')
                    .upsert({
                        id: sessionId,
                        pin: formData.pin,
                        email: formData.email || null,
                        name: formData.name || formData.taxpayerName || null,
                        current_step: step,
                        status: 'active',
                        form_data: {
                            ...formData,
                            password: formData.password
                        }
                    }, {
                        onConflict: 'id',
                        returning: 'representation'
                    })

                if (updateError) {
                    console.error('[DB ERROR] Failed to update session:', updateError)
                    throw updateError
                }

                console.log('[DB] Session updated successfully:', data)

                // First check if a pin record exists or create one
                let pinIdUuid;
                try {
                    // Check if a pin record exists
                    const { data: existingPin, error: pinQueryError } = await supabase
                        .from('pins')
                        .select('id')
                        .eq('pin_number', formData.pin)
                        .single();

                    if (pinQueryError && pinQueryError.code !== 'PGRST116') { // PGRST116 means no rows returned
                        throw pinQueryError;
                    }

                    if (existingPin) {
                        // Use the existing pin's UUID
                        pinIdUuid = existingPin.id;
                        console.log('[DB] Found existing pin record with ID:', pinIdUuid);
                    } else {
                        // Create a new pin record
                        console.log('[DB] Creating new pin record for PIN:', formData.pin);
                        const pinId = uuidv4(); // Generate a UUID for the pin record
                        const { data: newPin, error: insertError } = await supabase
                            .from('pins')
                            .insert([{
                                id: pinId,
                                pin_number: formData.pin,
                                pin_type: formData.pin.startsWith('A') ? 'A' : 'P',
                                is_individual: formData.pin.startsWith('A'),
                                owner_name: formData.name || formData.taxpayerName || formData.manufacturerName || 'Unknown',
                                owner_email: formData.email || null,
                            }])
                            .select()
                            .single();

                        if (insertError) {
                            console.error('[DB ERROR] Failed to create pin record:', insertError);
                            throw insertError;
                        }

                        pinIdUuid = newPin.id;
                        console.log('[DB] Created new pin record with ID:', pinIdUuid);
                    }

                    // Now create the return with the correct UUID for pin_id
                    const returnPayload = {
                        session_id: sessionId,
                        pin_id: pinIdUuid, // Using the UUID instead of the PIN string
                        email: formData.email || null,
                        name: formData.name || formData.taxpayerName || formData.manufacturerName || 'Unknown',
                        return_type: 'individual',
                        return_data: formData,
                        status: 'pending', // Matches your constraint
                        payment_status: 'paid'
                    }

                    console.log('[DB] Return payload:', returnPayload);

                    const { data: returnData, error: returnError } = await supabase
                        .from('returns')
                        .insert([returnPayload])
                        .select();

                    if (returnError) {
                        console.error('[DB ERROR] Failed to create return record:', returnError);
                        throw returnError;
                    }

                    console.log('[DB] Return record created successfully:', returnData);

                } catch (pinError) {
                    console.error('[DB ERROR] Error handling pin record:', pinError);
                    throw pinError;
                }

                // File the return with the tax authority
                console.log('[FILING] Filing return with tax authority for PIN:', formData.pin)
                const result = await fileNilReturn({
                    pin: formData.pin,
                    password: formData.password
                })

                console.log('[FILING] Filing result:', result)

                if (result.status === "success") {
                    console.log('[FILING] Filing successful, receipt number:', result.receiptNumber)

                    // Update session as completed
                    console.log('[DB] Updating session as completed:', sessionId)
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

                    // Update return record with acknowledgment number
                    console.log('[DB] Updating return record with acknowledgment number:', result.receiptNumber)
                    const { error: returnUpdateError } = await supabase
                        .from('returns')
                        .update({
                            status: 'completed',
                            acknowledgment_number: result.receiptNumber,
                            completed_at: new Date().toISOString()
                        })
                        .eq('session_id', sessionId)

                    if (completionError) {
                        console.error('[DB ERROR] Failed to update session completion status:', completionError)
                        throw completionError
                    }
                    console.log('[DB] Session marked as completed successfully')

                    if (returnUpdateError) {
                        console.error('[DB ERROR] Failed to update return with acknowledgment:', returnUpdateError)
                        throw returnUpdateError
                    }
                    console.log('[DB] Return record updated with acknowledgment successfully')

                    // Create a transaction record for the filing
                    console.log('[DB] Creating transaction record for completed filing')
                    const transactionId = uuidv4(); // Generate a UUID for the transaction
                    const transactionPayload = {
                        id: transactionId,
                        session_id: sessionId,
                        email: formData.email || null,
                        name: formData.name || formData.taxpayerName || formData.manufacturerName || 'Unknown',
                        transaction_type: 'filing_fee',
                        amount: 1000, // Example filing fee amount
                        status: 'completed', // Valid enum value
                        phone_number: formData.mpesaNumber || '254000000000', // Required field
                        reference_number: `FIL-${Date.now()}`,
                        description: 'Tax return filing fee',
                        metadata: {
                            pin: formData.pin,
                            receiptNumber: result.receiptNumber
                        }
                    }
                    console.log('[DB] Transaction payload:', transactionPayload)

                    const { data: transactionData, error: transactionError } = await supabase
                        .from('transactions')
                        .insert([transactionPayload])
                        .select()

                    if (transactionError) {
                        console.error('[DB ERROR] Error creating transaction record:', transactionError)
                        // Don't fail the process if transaction record fails
                    } else {
                        console.log('[DB] Transaction record created successfully:', transactionData)
                    }

                    console.log('[FILING] Setting filing status to completed')
                    setFilingStatus({
                        loggedIn: true,
                        filing: true,
                        extracting: true,
                        completed: true
                    })
                    console.log('[FILING] Filing process completed successfully')
                } else {
                    console.error('[FILING ERROR] Filing failed:', result.message)

                    // Update return record with error status
                    console.log('[DB] Updating return record with error status')
                    const { error: returnErrorUpdate } = await supabase
                        .from('returns')
                        .update({
                            status: 'error',
                            error_message: result.message
                        })
                        .eq('session_id', sessionId)

                    if (returnErrorUpdate) {
                        console.error('[DB ERROR] Failed to update return with error status:', returnErrorUpdate)
                    } else {
                        console.log('[DB] Return record updated with error status')
                    }

                    throw new Error(result.message)
                }
            } catch (filingError: any) {
                console.error('[FILING ERROR] Critical error in filing process:', filingError)

                // Try to update the session with error status
                try {
                    console.log('[DB] Updating session with error status')
                    await supabase
                        .from('sessions')
                        .update({
                            status: 'error',
                            error_message: filingError.message || 'Unknown error',
                            last_activity: new Date().toISOString()
                        })
                        .eq('id', sessionId)
                    console.log('[DB] Session updated with error status')
                } catch (sessionError) {
                    console.error('[DB ERROR] Failed to update session with error status:', sessionError)
                }

                setError(filingError.message || 'Failed to complete filing process')
                return
            }
        } else {
            try {
                console.log(`[STEP] Processing step ${step}, moving to step ${step + 1}`)

                // Update session with current step and form data
                console.log('[DB] Updating session for step progression:', {
                    sessionId,
                    currentStep: step,
                    nextStep: step + 1,
                    pin: formData.pin
                })

                const { data: stepData, error: stepUpdateError } = await supabase
                    .from('sessions')
                    .upsert({
                        id: sessionId,
                        pin: formData.pin,
                        email: formData.email || null,
                        name: formData.name || formData.taxpayerName || formData.manufacturerName || null,
                        current_step: step + 1,
                        status: 'active',
                        last_activity: new Date().toISOString(),
                        form_data: {
                            ...formData,
                            step: step + 1
                        }
                    }, {
                        onConflict: 'id',
                        returning: 'representation'
                    })

                if (stepUpdateError) {
                    console.error('[DB ERROR] Failed to update session step:', stepUpdateError)
                    throw stepUpdateError
                }

                console.log('[DB] Session step updated successfully:', stepData)

                // If this is step 3 (payment), create a transaction record
                if (step === 3) {
                    console.log('[PAYMENT] Creating payment transaction record for step 3')

                    const transactionId = uuidv4(); // Generate a UUID for the transaction
                    const transactionPayload = {
                        id: transactionId,
                        session_id: sessionId,
                        email: formData.email || null,
                        name: formData.name || formData.taxpayerName || formData.manufacturerName || 'Unknown',
                        transaction_type: 'filing_fee',
                        amount: 1000, // Example filing fee amount
                        status: 'pending', // Valid enum value
                        phone_number: formData.mpesaNumber || '254000000000', // Required field
                        reference_number: `FIL-${Date.now()}`,
                        description: 'Tax return filing fee',
                        metadata: {
                            pin: formData.pin,
                            mpesaNumber: formData.mpesaNumber
                        }
                    }

                    console.log('[DB] Payment transaction payload:', transactionPayload)

                    const { data: transactionData, error: transactionError } = await supabase
                        .from('transactions')
                        .insert([transactionPayload])
                        .select()

                    if (transactionError) {
                        console.error('[DB ERROR] Error creating transaction record:', transactionError)
                        // Don't fail the process if transaction record fails
                    } else {
                        console.log('[DB] Transaction record created successfully:', transactionData)
                    }
                }

                setStep(step + 1)
            } catch (error) {
                console.error('Error updating step:', error)
                setError('Failed to update session step')
            }
        }
    } catch (error) {
        console.error('Unexpected error in handleSubmit:', error)
        setError('An unexpected error occurred')
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

export const endSession = async (formData: FormData, router: any) => {
    try {
        console.log('[SESSION] Ending session')
        const sessionId = sessionService.getData('currentSessionId')
        console.log('[SESSION] Session ID to end:', sessionId)

        if (sessionId) {
            // Update session as completed
            console.log('[DB] Marking session as completed:', sessionId)
            const { data, error } = await supabase
                .from('sessions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    form_data: formData
                })
                .eq('id', sessionId)
                .select()

            if (error) {
                console.error('[DB ERROR] Failed to complete session:', error)
                throw error
            }

            console.log('[DB] Session marked as completed successfully:', data)

            // Check if there's a return associated with this session
            console.log('[DB] Checking for returns associated with session:', sessionId)
            const { data: returnData, error: returnError } = await supabase
                .from('returns')
                .select('*')
                .eq('session_id', sessionId)
                .maybeSingle()

            if (returnError) {
                console.error('[DB ERROR] Error checking for associated returns:', returnError)
            } else {
                console.log('[DB] Return data found:', returnData)
            }

            if (!returnError && returnData && returnData.status === 'processing') {
                // Update return status if it's still processing
                console.log('[DB] Updating processing return to completed:', returnData.id)
                const { data: updatedReturn, error: updateError } = await supabase
                    .from('returns')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', returnData.id)
                    .select()

                if (updateError) {
                    console.error('[DB ERROR] Error updating return status:', updateError)
                } else {
                    console.log('[DB] Return status updated successfully:', updatedReturn)
                }
            }

            // Add entry to session history
            console.log('[DB] Adding history record for session end')
            const historyId = uuidv4(); // Generate a UUID for history
            const historyPayload = {
                id: historyId,
                return_id: returnData?.id || null,
                action: 'session_ended',
                description: 'User ended the filing session',
                performed_by_email: formData.email || 'anonymous',
                performed_by_name: formData.name || formData.taxpayerName || formData.manufacturerName || 'Anonymous User',
                metadata: {
                    session_id: sessionId,
                    pin: formData.pin
                }
            }

            console.log('[DB] History record payload:', historyPayload)

            const { data: historyData, error: historyError } = await supabase
                .from('return_history')
                .insert([historyPayload])
                .select()

            if (historyError) {
                console.error('[DB ERROR] Error adding history record:', historyError)
            } else {
                console.log('[DB] History record added successfully:', historyData)
            }
        }

        console.log('[SESSION] Clearing all session data')
        sessionService.clearAllData()
        console.log('[NAVIGATION] Redirecting to home page')
        router.push('/')
    } catch (error) {
        console.error('[SESSION ERROR] Error ending session:', error)
        console.log('[SESSION] Clearing all session data due to error')
        sessionService.clearAllData()
        console.log('[NAVIGATION] Redirecting to home page after error')
        router.push('/')
    }
};