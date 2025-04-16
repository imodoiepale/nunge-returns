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
    fileNilReturn
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
                    console.error('[DB ERROR] Failed to record PIN validation attempt:', dbError);
                }
            }

            try {
                const response = await fetch(`/api/manufacturer/kra?pin=${encodeURIComponent(newPin)}`, {
                    method: 'GET'
                });
                const data = await response.json();

                if (data.success) {
                    setPinValidationStatus("valid");
                    setManufacturerDetails(data.data);

                    // Record successful validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'pin_validated',
                                    description: 'PIN validated successfully',
                                    metadata: {
                                        pin: newPin,
                                        taxpayer_name: data.data.name
                                    }
                                }]);

                            console.log('[DB] Recorded successful PIN validation');

                            // Update session with PIN and manufacturer details
                            await supabase
                                .from('sessions')
                                .update({
                                    pin: newPin,
                                    name: data.data.name,
                                    email: data.data.contactDetails?.email,
                                    form_data: {
                                        ...formData,
                                        pin: newPin,
                                        manufacturerName: data.data.name,
                                        email: data.data.contactDetails?.email,
                                        mobileNumber: data.data.contactDetails?.mobile,
                                        authentication_method: 'pin'
                                    },
                                    last_activity: new Date().toISOString()
                                })
                                .eq('id', currentSessionId);

                            console.log('[DB] Updated session with PIN and manufacturer details');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record successful PIN validation:', dbError);
                        }
                    }
                } else {
                    setPinValidationStatus("invalid");

                    // Record failed validation in database
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
                                        reason: data.error || 'Invalid PIN'
                                    }
                                }]);

                            console.log('[DB] Recorded failed PIN validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record failed PIN validation:', dbError);
                        }
                    }
                }
            } catch (error) {
                setPinValidationStatus("invalid");

                // Record error in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'PIN validation error',
                                metadata: {
                                    pin: newPin,
                                    error: error.message
                                }
                            }]);

                        console.log('[DB] Recorded PIN validation error');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record PIN validation error:', dbError);
                    }
                }
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
                    console.error('[DB ERROR] Failed to record password validation attempt:', dbError);
                }
            }

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

                    // Record successful validation in database
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

                            // Update session with password validation
                            await supabase
                                .from('sessions')
                                .update({
                                    form_data: {
                                        ...formData,
                                        password: newPassword,
                                        passwordValidated: true
                                    },
                                    last_activity: new Date().toISOString()
                                })
                                .eq('id', currentSessionId);

                            console.log('[DB] Updated session with password validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record successful password validation:', dbError);
                        }
                    }
                } else {
                    setPasswordValidationStatus("invalid");
                    setPasswordError(data.message || "Invalid password");

                    // Record failed validation in database
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
                                        reason: data.message || "Invalid password"
                                    }
                                }]);

                            console.log('[DB] Recorded failed password validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record failed password validation:', dbError);
                        }
                    }
                }
            } catch (error) {
                setPasswordValidationStatus("invalid");
                setPasswordError("Error validating password");

                // Record error in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password validation error',
                                metadata: {
                                    pin: formData.pin,
                                    error: error.message
                                }
                            }]);

                        console.log('[DB] Recorded password validation error');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record password validation error:', dbError);
                    }
                }
            }
        }
    };

    const handlePasswordReset = async () => {
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
                            description: 'Password reset requested',
                            metadata: {
                                pin: formData.pin
                            }
                        }]);

                    console.log('[DB] Recorded password reset request');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record password reset request:', dbError);
                }
            }

            const success = await resetPassword(formData.pin);

            if (success) {
                alert("Password reset instructions have been sent to your registered mobile number.");

                // Record successful reset request in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password reset initiated successfully',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);

                        console.log('[DB] Recorded successful password reset initiation');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record successful password reset initiation:', dbError);
                    }
                }
            } else {
                alert("Failed to initiate password reset. Please try again.");

                // Record failed reset request in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password reset initiation failed',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);

                        console.log('[DB] Recorded failed password reset initiation');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record failed password reset initiation:', dbError);
                    }
                }
            }
        } catch (error) {
            console.error('Error during password reset:', error);
            alert("An error occurred during password reset. Please try again.");

            // Record error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password reset error',
                            metadata: {
                                pin: formData.pin,
                                error: error.message
                            }
                        }]);

                    console.log('[DB] Recorded password reset error');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record password reset error:', dbError);
                }
            }
        }
    };

    const handlePasswordEmailReset = async () => {
        try {
            // Record password+email reset attempt in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password and email reset requested',
                            metadata: {
                                pin: formData.pin
                            }
                        }]);

                    console.log('[DB] Recorded password and email reset request');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record password and email reset request:', dbError);
                }
            }

            const success = await resetPasswordAndEmail(formData.pin);

            if (success) {
                alert("Password and email reset instructions have been sent to your registered mobile number.");

                // Record successful reset request in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password and email reset initiated successfully',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);

                        console.log('[DB] Recorded successful password and email reset initiation');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record successful password and email reset initiation:', dbError);
                    }
                }
            } else {
                alert("Failed to initiate reset. Please try again.");

                // Record failed reset request in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password and email reset initiation failed',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);

                        console.log('[DB] Recorded failed password and email reset initiation');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record failed password and email reset initiation:', dbError);
                    }
                }
            }
        } catch (error) {
            console.error('Error during password and email reset:', error);
            alert("An error occurred during reset. Please try again.");

            // Record error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password and email reset error',
                            metadata: {
                                pin: formData.pin,
                                error: error.message
                            }
                        }]);

                    console.log('[DB] Recorded password and email reset error');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record password and email reset error:', dbError);
                }
            }
        }
    };

    const handleActiveTabChange = (tab: 'id' | 'pin') => {
        setFormData(prev => ({ ...prev, activeTab: tab }));
        // Reset validation states when switching tabs
        setPasswordValidationStatus("idle");
        setPasswordError(null);

        // Record tab change in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: `Tab changed to ${tab}`,
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

        // Record mpesa number change in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('sessions')
                    .update({
                        form_data: {
                            ...formData,
                            mpesaNumber: value
                        },
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Updated session with mpesa number'))
                    .catch(error => console.error('[DB ERROR] Failed to update session with mpesa number:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error updating session with mpesa number:', dbError);
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
                            previous_status: paymentStatus,
                            new_status: status
                        }
                    }])
                    .then(() => console.log('[DB] Recorded payment status change'))
                    .catch(error => console.error('[DB ERROR] Failed to record payment status change:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording payment status change:', dbError);
            }
        }

        if (status === "Paid") {
            setTimeout(() => {
                const newReceiptNumber = `NR${Math.floor(Math.random() * 1000000)}`;
                setReceiptNumber(newReceiptNumber);

                // Record receipt generation in database
                if (currentSessionId) {
                    try {
                        supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'receipt_generated',
                                description: 'Payment receipt generated',
                                metadata: {
                                    receipt_number: newReceiptNumber,
                                    pin: formData.pin
                                }
                            }])
                            .then(() => console.log('[DB] Recorded receipt generation'))
                            .catch(error => console.error('[DB ERROR] Failed to record receipt generation:', error));
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording receipt generation:', dbError);
                    }
                }
            }, 500);
        }
    };

    const handleDownloadReceipt = (type: string) => {
        const link = document.createElement('a');
        link.href = '/sample-receipt.pdf';
        link.download = `${manufacturerDetails?.name || 'UNKNOWN'}_${formData.pin}_${type}_RECEIPT.PDF`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Record download activity in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'document_downloaded',
                        description: `Downloaded ${type} receipt`,
                        metadata: {
                            receipt_type: type,
                            pin: formData.pin
                        }
                    }])
                    .then(() => console.log(`[DB] Recorded ${type} receipt download`))
                    .catch(error => console.error(`[DB ERROR] Failed to record ${type} receipt download:`, error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording receipt download:', dbError);
            }
        }

        console.log(`Downloaded ${type} receipt for PIN: ${formData.pin}`);

        // If downloading "all" receipts, redirect to home after a delay
        if (type === 'all') {
            setTimeout(() => {
                router.push('/');
            }, 2000);
        }
    };

    const handleEndSession = () => {
        // Record session end in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('sessions')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Updated session to completed status'))
                    .catch(error => console.error('[DB ERROR] Failed to update session status:', error));

                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'session_ended',
                        description: 'Session ended by user',
                        metadata: {
                            end_time: new Date().toISOString()
                        }
                    }])
                    .then(() => console.log('[DB] Recorded session end'))
                    .catch(error => console.error('[DB ERROR] Failed to record session end:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording session end:', dbError);
            }
        }

        router.push('/');
    };

    const handleNextStep = () => {
        setCurrentStep(prev => {
            const newStep = prev + 1;

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
                />
            )}

            {/* Navigation buttons */}
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
        </div>
    )
}