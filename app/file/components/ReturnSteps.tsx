// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import {
    FilingStatus,
    ManufacturerDetails,
    FormData,
    PaymentStatus as PaymentStatusType,
    ValidationStatus
} from "../lib/types"
import {
    validatePassword,
    resetPassword,
    resetPasswordAndEmail,
    validatePIN,
    extractManufacturerDetails,
    fileNilReturn,
    debouncedValidatePassword
} from '../lib/returnHelpers'

// Import step components
import Step1PINComponent from "./Step1PIN"
import Step2DetailsComponent from "./Step2Details"
import Step3PaymentComponent from "./Step3Payment"
import Step4FilingComponent from "./Step4Filing"

// Export the step components
export const Step1PIN = Step1PINComponent
export const Step2Details = Step2DetailsComponent
export const Step3Payment = Step3PaymentComponent
export const Step4Filing = Step4FilingComponent

// Initialize session service
const sessionService = new SessionManagementService()

// Re-export types from types.ts for convenience
export type {
    FilingStatus,
    ManufacturerDetails,
    FormData,
    ValidationStatus,
    PaymentStatusType
}

export function ReturnSteps() {
    const router = useRouter()

    // State management
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<FormData>({
        pin: "",
        manufacturerName: "",
        email: "",
        mobileNumber: "",
        mpesaNumber: "",
        password: "",
        fileType: "individual",
        activeTab: 'pin'
    })

    const [manufacturerDetails, setManufacturerDetails] = useState<ManufacturerDetails | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>("Not Paid")
    const [filingStatus, setFilingStatus] = useState<FilingStatus>({
        loggedIn: false,
        filing: false,
        extracting: false,
        completed: false
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [pinValidationStatus, setPinValidationStatus] = useState<ValidationStatus>("idle")
    const [passwordValidationStatus, setPasswordValidationStatus] = useState<ValidationStatus>("idle")
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
    const [receiptNumber, setReceiptNumber] = useState<string | null>(null)

    // Initialize session on component mount
    useEffect(() => {
        const initializeSession = async () => {
            try {
                console.log('[APP] Initializing prospect session...');
                const sessionId = await sessionService.createProspectSession();
                console.log('[APP] Prospect session created with ID:', sessionId);

                // Record page view in analytics
                await supabase
                    .from('session_activities')
                    .insert([{
                        session_id: sessionId,
                        activity_type: 'user_action',
                        description: 'Viewed filing page',
                        metadata: {
                            page: 'file',
                            component: 'ReturnSteps'
                        }
                    }]);

                console.log('[DB] Recorded page view in database');
            } catch (error) {
                console.error('[APP ERROR] Error creating prospect session:', error);
            }
        };

        initializeSession();
    }, []);

    // Handler functions
    const handlePINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPin = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, pin: newPin }));

        if (newPin.length === 11) {
            setPinValidationStatus("checking");

            try {
                // Record PIN validation attempt in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'PIN validation attempted',
                                metadata: {
                                    pin: newPin
                                }
                            }]);
                        console.log('[DB] Recorded PIN validation attempt');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording PIN validation attempt:', dbError);
                    }
                }

                // Validate PIN
                const { isValid, details, error: validationError } = await validatePIN(newPin);

                if (isValid) {
                    setPinValidationStatus("valid");
                    setError(null);

                    // Extract manufacturer details
                    const manufacturerInfo = extractManufacturerDetails(details);
                    setManufacturerDetails(manufacturerInfo);
                    setFormData(prev => ({
                        ...prev,
                        manufacturerName: manufacturerInfo.name,
                        email: manufacturerInfo.contactDetails?.email || '',
                        mobileNumber: manufacturerInfo.contactDetails?.mobile || ''
                    }));

                    // Record successful PIN validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'user_action',
                                    description: 'PIN validated successfully',
                                    metadata: {
                                        pin: newPin,
                                        name: manufacturerInfo.name
                                    }
                                }]);
                            console.log('[DB] Recorded successful PIN validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording successful PIN validation:', dbError);
                        }
                    }
                } else {
                    setPinValidationStatus("invalid");
                    setError(validationError || "Invalid PIN. Please check and try again.");

                    // Record failed PIN validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'user_action',
                                    description: 'PIN validation failed',
                                    metadata: {
                                        pin: newPin,
                                        error: validationError || "Invalid PIN"
                                    }
                                }]);
                            console.log('[DB] Recorded failed PIN validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording failed PIN validation:', dbError);
                        }
                    }
                }
            } catch (error) {
                setPinValidationStatus("invalid");
                setError("Error validating PIN. Please try again.");
                console.error('[APP ERROR] PIN validation error:', error);

                // Record PIN validation error in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'error',
                                description: 'PIN validation error',
                                metadata: {
                                    pin: newPin,
                                    error: error.message || "Unknown error"
                                }
                            }]);
                        console.log('[DB] Recorded PIN validation error');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording PIN validation error:', dbError);
                    }
                }
            }
        } else {
            setPinValidationStatus("idle");
            setError(null);
        }
    };

    const handlePasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setFormData(prev => ({ ...prev, password: newPassword }));

        if (newPassword.length > 0) {
            setPasswordValidationStatus("checking");

            try {
                // Record password validation attempt in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password validation attempted',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);
                        console.log('[DB] Recorded password validation attempt');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording password validation attempt:', dbError);
                    }
                }

                // Validate password using debounced function
                const { isValid, error: validationError } = await debouncedValidatePassword(
                    formData.pin, 
                    newPassword,
                    setPasswordValidationStatus,
                    setPasswordError,
                    formData.company_name
                );

                if (isValid) {
                    setPasswordValidationStatus("valid");
                    setPasswordError(null);

                    // Record successful password validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'user_action',
                                    description: 'Password validated successfully',
                                    metadata: {
                                        pin: formData.pin
                                    }
                                }]);
                            console.log('[DB] Recorded successful password validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording successful password validation:', dbError);
                        }
                    }
                } else {
                    setPasswordValidationStatus("invalid");
                    setPasswordError(validationError || "Invalid password. Please check and try again.");

                    // Record failed password validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'user_action',
                                    description: 'Password validation failed',
                                    metadata: {
                                        pin: formData.pin,
                                        error: validationError || "Invalid password"
                                    }
                                }]);
                            console.log('[DB] Recorded failed password validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording failed password validation:', dbError);
                        }
                    }
                }
            } catch (error) {
                setPasswordValidationStatus("invalid");
                setPasswordError("Error validating password. Please try again.");
                console.error('[APP ERROR] Password validation error:', error);

                // Record password validation error in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'error',
                                description: 'Password validation error',
                                metadata: {
                                    pin: formData.pin,
                                    error: error.message || "Unknown error"
                                }
                            }]);
                        console.log('[DB] Recorded password validation error');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording password validation error:', dbError);
                    }
                }
            }
        } else {
            setPasswordValidationStatus("idle");
            setPasswordError(null);
        }
    };

    const handlePasswordReset = async () => {
        setLoading(true);
        setError(null);

        try {
            // Record password reset attempt in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password reset attempted',
                            metadata: {
                                pin: formData.pin
                            }
                        }]);
                    console.log('[DB] Recorded password reset attempt');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password reset attempt:', dbError);
                }
            }

            // Reset password
            const { success, error: resetError } = await resetPassword(formData.pin);

            if (success) {
                setError("Password reset instructions sent to your registered email.");

                // Record successful password reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password reset successful',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);
                        console.log('[DB] Recorded successful password reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording successful password reset:', dbError);
                    }
                }
            } else {
                setError(resetError || "Failed to reset password. Please try again.");

                // Record failed password reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password reset failed',
                                metadata: {
                                    pin: formData.pin,
                                    error: resetError || "Failed to reset password"
                                }
                            }]);
                        console.log('[DB] Recorded failed password reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording failed password reset:', dbError);
                    }
                }
            }
        } catch (error) {
            setError("An error occurred while resetting password. Please try again.");
            console.error('[APP ERROR] Password reset error:', error);

            // Record password reset error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'error',
                            description: 'Password reset error',
                            metadata: {
                                pin: formData.pin,
                                error: error.message || "Unknown error"
                            }
                        }]);
                    console.log('[DB] Recorded password reset error');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password reset error:', dbError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordEmailReset = async () => {
        setLoading(true);
        setError(null);

        try {
            // Record password and email reset attempt in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password and email reset attempted',
                            metadata: {
                                pin: formData.pin
                            }
                        }]);
                    console.log('[DB] Recorded password and email reset attempt');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password and email reset attempt:', dbError);
                }
            }

            // Reset password and email
            const { success, error: resetError } = await resetPasswordAndEmail(formData.pin);

            if (success) {
                setError("Password and email reset instructions sent to your registered mobile number.");

                // Record successful password and email reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password and email reset successful',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);
                        console.log('[DB] Recorded successful password and email reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording successful password and email reset:', dbError);
                    }
                }
            } else {
                setError(resetError || "Failed to reset password and email. Please try again.");

                // Record failed password and email reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password and email reset failed',
                                metadata: {
                                    pin: formData.pin,
                                    error: resetError || "Failed to reset password and email"
                                }
                            }]);
                        console.log('[DB] Recorded failed password and email reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording failed password and email reset:', dbError);
                    }
                }
            }
        } catch (error) {
            setError("An error occurred while resetting password and email. Please try again.");
            console.error('[APP ERROR] Password and email reset error:', error);

            // Record password and email reset error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'error',
                            description: 'Password and email reset error',
                            metadata: {
                                pin: formData.pin,
                                error: error.message || "Unknown error"
                            }
                        }]);
                    console.log('[DB] Recorded password and email reset error');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password and email reset error:', dbError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleActiveTabChange = (tab: 'id' | 'pin') => {
        setFormData(prev => ({ ...prev, activeTab: tab }));

        // Record tab change in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: 'Changed active tab',
                        metadata: {
                            previous_tab: formData.activeTab,
                            new_tab: tab
                        }
                    }])
                    .then(() => console.log('[DB] Recorded tab change'))
                    .catch(error => console.error('[DB ERROR] Failed to record tab change:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording tab change:', dbError);
            }
        }
    };

    const handleMpesaNumberChange = (value: string) => {
        setFormData(prev => ({ ...prev, mpesaNumber: value }));

        // Record Mpesa number change in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: 'Updated Mpesa number',
                        metadata: {
                            mpesa_number: value
                        }
                    }])
                    .then(() => console.log('[DB] Recorded Mpesa number update'))
                    .catch(error => console.error('[DB ERROR] Failed to record Mpesa number update:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording Mpesa number update:', dbError);
            }
        }
    };

    const handleSimulatePayment = (status: PaymentStatusType) => {
        setPaymentStatus(status);

        // Record payment status change in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'payment_status_changed',
                        description: `Payment status changed to ${status}`,
                        metadata: {
                            payment_status: status,
                            mpesa_number: formData.mpesaNumber
                        }
                    }])
                    .then(() => console.log('[DB] Recorded payment status change'))
                    .catch(error => console.error('[DB ERROR] Failed to record payment status change:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording payment status change:', dbError);
            }
        }
    };

    const handleDownloadReceipt = (type: string) => {
        console.log(`Downloading ${type} receipt...`);

        // Record receipt download in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: `Downloaded ${type} receipt`,
                        metadata: {
                            receipt_type: type,
                            pin: formData.pin
                        }
                    }])
                    .then(() => console.log('[DB] Recorded receipt download'))
                    .catch(error => console.error('[DB ERROR] Failed to record receipt download:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording receipt download:', dbError);
            }
        }
    };

    const handleEndSession = () => {
        console.log('Ending session...');

        // Record session end in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: 'Ended session',
                        metadata: {
                            pin: formData.pin
                        }
                    }])
                    .then(() => console.log('[DB] Recorded session end'))
                    .catch(error => console.error('[DB ERROR] Failed to record session end:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording session end:', dbError);
            }
        }

        // Redirect to home page
        router.push('/');
    };

    const handleNextStep = () => {
        setCurrentStep(prev => {
            const newStep = Math.min(4, prev + 1);

            // If moving to step 4, set filing status to logged in
            if (newStep === 4) {
                setSessionStartTime(new Date());
                setFilingStatus({
                    loggedIn: true,
                    filing: true,
                    extracting: false,
                    completed: false
                });
            }

            // Record step change in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    supabase
                        .from('sessions')
                        .update({
                            current_step: newStep,
                            last_activity: new Date().toISOString()
                        })
                        .eq('id', currentSessionId)
                        .then(() => console.log(`[DB] Updated session to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to update session step:`, error));

                    supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'step_changed',
                            description: `Moved to step ${newStep}`,
                            metadata: {
                                previous_step: prev,
                                new_step: newStep,
                                timestamp: new Date().toISOString()
                            }
                        }])
                        .then(() => console.log(`[DB] Recorded navigation to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to record navigation:`, error));
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording step change:', dbError);
                }
            }

            return newStep;
        });
    };

    const handlePreviousStep = () => {
        setCurrentStep(prev => {
            const newStep = Math.max(1, prev - 1);

            // Record step change in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    supabase
                        .from('sessions')
                        .update({
                            current_step: newStep,
                            last_activity: new Date().toISOString()
                        })
                        .eq('id', currentSessionId)
                        .then(() => console.log(`[DB] Updated session to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to update session step:`, error));

                    supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'step_changed',
                            description: `Moved back to step ${newStep}`,
                            metadata: {
                                previous_step: prev,
                                new_step: newStep,
                                timestamp: new Date().toISOString()
                            }
                        }])
                        .then(() => console.log(`[DB] Recorded navigation to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to record navigation:`, error));
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording step change:', dbError);
                }
            }

            return newStep;
        });
    };

    // Render the current step
    return (
        <div className="space-y-6">
            {/* Current step content */}
            {currentStep === 1 && (
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
                    onNext={handleNextStep}
                    onActiveTabChange={handleActiveTabChange}
                    onManufacturerDetailsFound={setManufacturerDetails}
                />
            )}

            {currentStep === 2 && (
                <Step2Details
                    loading={loading}
                    manufacturerDetails={manufacturerDetails}
                    onBack={handlePreviousStep}
                    onNext={handleNextStep}
                />
            )}

            {currentStep === 3 && (
                <Step3Payment
                    mpesaNumber={formData.mpesaNumber}
                    paymentStatus={paymentStatus}
                    onMpesaNumberChange={handleMpesaNumberChange}
                    onSimulatePayment={handleSimulatePayment}
                    pin={formData.pin}
                    manufacturerDetails={manufacturerDetails}
                />
            )}

            {currentStep === 4 && (
                <Step4Filing
                    pin={formData.pin}
                    password={formData.password}
                    error={error}
                    filingStatus={filingStatus}
                    sessionStartTime={sessionStartTime}
                    formData={formData}
                    onPasswordChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                    onDownloadReceipt={handleDownloadReceipt}
                    onEndSession={handleEndSession}
                    onError={setError}
                />
            )}

            {/* Navigation buttons - Only show for steps 1-3, not for step 4 */}
            {currentStep < 4 && (
                <div className="flex justify-between mt-4">
                    {currentStep > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePreviousStep}
                        >
                            Back
                        </Button>
                    )}

                    {currentStep < 4 && (
                        <Button
                            type="button"
                            onClick={handleNextStep}
                            disabled={
                                (currentStep === 1 && (pinValidationStatus !== "valid" || passwordValidationStatus !== "valid")) ||
                                (currentStep === 3 && paymentStatus !== "Paid")
                            }
                            className="bg-gradient-to-r from-purple-500 to-purple-700 ml-auto"
                        >
                            {currentStep === 3 ? "Proceed to Filing" : "Next Step"}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}