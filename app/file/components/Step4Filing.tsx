// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, ArrowDown, AlertCircle, Eye, EyeOff, LogIn, FileText, FileDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { FilingStatus } from "../lib/types"

interface Step4Props {
    pin: string
    password: string
    error: string | null
    filingStatus: FilingStatus
    sessionStartTime: Date | null
    formData: any
    onPasswordChange: (value: string) => void
    onDownloadReceipt: (receiptType: string) => void
    onEndSession: () => void
    onError?: (error: string) => void
}

const sessionService = new SessionManagementService()

export function Step4Filing({
    pin,
    password,
    error,
    filingStatus,
    sessionStartTime,
    formData, 
    onPasswordChange,
    onDownloadReceipt,
    onEndSession,
    onError
}: Step4Props) {
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [localError, setLocalError] = useState<string | null>(null)
    const [receiptNumber, setReceiptNumber] = useState<string | null>(null)

    // Record step view in database
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Viewed filing page',
                        metadata: {
                            step: 4,
                            pin: pin
                        }
                    }])
                    .then(() => console.log('[DB] Recorded step 4 view in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record step 4 view:', error));

                // Update session step
                supabase
                    .from('sessions')
                    .update({
                        current_step: 4,
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Updated session to step 4'))
                    .catch(error => console.error('[DB ERROR] Failed to update session step:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing step 4 record:', dbError);
            }
        }
    }, [pin]);

    // Track elapsed time
    useEffect(() => {
        let timer: NodeJS.Timeout
        
        if (filingStatus.filing && !filingStatus.completed) {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1)
            }, 1000)
        }
        
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [filingStatus.filing, filingStatus.completed])

    // Simulate filing process
    useEffect(() => {
        if (filingStatus.loggedIn) {
            const steps = [0, 1, 2, 3]
            let currentIndex = 0

            // Record filing start in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'form_submit',
                            description: 'Filing process started',
                            metadata: {
                                pin: pin,
                                step: 4
                            }
                        }])
                        .then(() => console.log('[DB] Recorded filing start in database'))
                        .catch(error => console.error('[DB ERROR] Failed to record filing start:', error));

                    // Create return record
                    supabase
                        .from('returns')
                        .insert([{
                            session_id: currentSessionId,
                            return_type: 'individual',
                            is_nil_return: true,
                            status: 'pending',
                            payment_status: 'paid',
                            email: formData?.email || null,
                            name: formData?.manufacturerName || null,
                            return_data: {
                                pin: pin,
                                filing_date: new Date().toISOString()
                            }
                        }])
                        .then(result => {
                            console.log('[DB] Created return record:', result);

                            // Get return ID for later updates
                            if (result.data && result.data[0]?.id) {
                                sessionService.saveData('currentReturnId', result.data[0].id);
                            }
                        })
                        .catch(error => console.error('[DB ERROR] Failed to create return record:', error));
                } catch (dbError) {
                    console.error('[DB ERROR] Error preparing filing records:', dbError);
                }
            }

            const interval = setInterval(() => {
                if (currentIndex < steps.length) {
                    setCurrentStep(steps[currentIndex])

                    // Record filing step in database
                    if (currentSessionId) {
                        try {
                            // Determine which filing step this is
                            let stepDescription = '';
                            switch (currentIndex) {
                                case 0:
                                    stepDescription = 'Logging in to KRA';
                                    break;
                                case 1:
                                    stepDescription = 'Filing tax return';
                                    break;
                                case 2:
                                    stepDescription = 'Extracting receipt';
                                    break;
                                case 3:
                                    stepDescription = 'Filing completed';
                                    // Generate receipt number on completion
                                    const newReceiptNumber = `NR${Math.random().toString().slice(2, 10)}`;
                                    setReceiptNumber(newReceiptNumber);

                                    // Update return with receipt number
                                    const returnId = sessionService.getData('currentReturnId');
                                    if (returnId) {
                                        supabase
                                            .from('returns')
                                            .update({
                                                status: 'completed',
                                                updated_at: new Date().toISOString(),
                                                acknowledgment_number: newReceiptNumber
                                            })
                                            .eq('id', returnId)
                                            .then(() => console.log('[DB] Updated return with completion and receipt number'))
                                            .catch(error => console.error('[DB ERROR] Failed to update return with receipt:', error));
                                    }

                                    // Update session with filing completion
                                    supabase
                                        .from('sessions')
                                        .update({
                                            status: 'completed',
                                            updated_at: new Date().toISOString(),
                                            form_data: {
                                                pin_number: pin,
                                                receiptNumber: newReceiptNumber,
                                                filing_completed_at: new Date().toISOString()
                                            }
                                        })
                                        .eq('id', currentSessionId)
                                        .then(() => console.log('[DB] Updated session with filing completion'))
                                        .catch(error => console.error('[DB ERROR] Failed to update session with completion:', error));
                                    break;
                            }

                            supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'form_submit',
                                    description: stepDescription,
                                    metadata: {
                                        step: 4,
                                        filing_step: currentIndex,
                                        pin: pin
                                    }
                                }])
                                .then(() => console.log(`[DB] Recorded filing step ${currentIndex} in database`))
                                .catch(error => console.error(`[DB ERROR] Failed to record filing step ${currentIndex}:`, error));
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording filing step:', dbError);
                        }
                    }

                    if (currentIndex === steps.length - 1) {
                        // Record filing completion in database
                        if (currentSessionId) {
                            try {
                                supabase
                                    .from('session_activities')
                                    .insert([{
                                        session_id: currentSessionId,
                                        activity_type: 'form_submit',
                                        description: 'Filing completed successfully',
                                        metadata: {
                                            pin_number: pin,
                                            step: 4,
                                            elapsed_time: sessionStartTime ?
                                                Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000) : null
                                        }
                                    }])
                                    .then(() => console.log('[DB] Recorded filing completion in database'))
                                    .catch(error => console.error('[DB ERROR] Failed to record filing completion:', error));

                                // Record step completion
                                supabase
                                    .from('session_steps')
                                    .insert([{
                                        session_id: currentSessionId,
                                        step_name: 'filing',
                                        step_data: {
                                            pin_number: pin,
                                            receipt_number: receiptNumber,
                                            filing_date: new Date().toISOString()
                                        },
                                        is_completed: true,
                                        updated_at: new Date().toISOString(),
                                    }])
                                    .then(() => console.log('[DB] Recorded step 4 completion in database'))
                                    .catch(error => console.error('[DB ERROR] Failed to record step 4 completion:', error));
                            } catch (dbError) {
                                console.error('[DB ERROR] Error recording filing completion:', dbError);
                            }
                        }
                    }

                    currentIndex++
                } else {
                    clearInterval(interval)
                }
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [filingStatus.loggedIn, pin, sessionStartTime, formData, receiptNumber]);

    const steps = [
        { label: 'Logging In', icon: <LogIn className="w-4 h-4" /> },
        { label: 'Filing Returns', icon: <FileText className="w-4 h-4" /> },
        { label: 'Extracting Receipt', icon: <FileDown className="w-4 h-4" /> },
        { label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> }
    ]

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onPasswordChange(e.target.value)
    }

    const handleFileReturns = async () => {
        setLoading(true);
        setLocalError(null);

        // Record filing attempt in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                await supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Filing initiated',
                        metadata: {
                            pin: pin,
                            start_time: new Date().toISOString()
                        }
                    }]);
                console.log('[DB] Recorded filing initiation');
            } catch (error) {
                console.error('[DB ERROR] Failed to record filing initiation:', error);
            }
        }

        try {
            // Determine which API endpoint to call based on PIN type
            const isIndividual = pin.startsWith('A');
            const apiEndpoint = isIndividual ? '/api/individual' : '/api/company';

            console.log(`[FILING] Calling ${apiEndpoint} for PIN: ${pin}`);
            
            // Call the API to file returns
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    kra_pin: pin,
                    kra_password: password,
                    name: formData?.manufacturerName || '',
                    email: formData?.email || '',
                    session_id: currentSessionId || '',
                    return_id: sessionService.getData('currentReturnId') || '',
                    company_name: formData?.manufacturerName || ''
                }),
            });

            // Log the complete response for debugging
            const responseText = await response.text();
            console.log('[FILING] Raw API response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('[FILING] Error parsing response:', parseError);
                throw new Error('Invalid response from server');
            }

            if (data.success) {
                console.log('[FILING] Filing successful:', data);
                // Update filing status to trigger the simulation
                setFilingStatus({
                    loggedIn: true,
                    filing: true,
                    extracting: false,
                    completed: false
                });

                // Set receipt number if available
                if (data.receipt_number) {
                    setReceiptNumber(data.receipt_number);
                }
            } else {
                // Handle error
                const errorMessage = data.error || 'Failed to file returns';
                setLocalError(errorMessage);
                if (onError) onError(errorMessage);

                // Record error in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'form_submit',
                                description: 'Filing failed',
                                metadata: {
                                    pin: pin,
                                    error: data.error || 'Failed to file returns'
                                }
                            }]);
                        console.log('[DB] Recorded filing error');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record filing error:', dbError);
                    }
                }
            }
        } catch (error) {
            // Handle exception
            const errorMessage = 'An error occurred while filing returns: ' + error.message;
            setLocalError(errorMessage);
            if (onError) onError(errorMessage);

            // Record exception in database
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'form_submit',
                            description: 'Filing exception',
                            metadata: {
                                pin: pin,
                                error: error.message
                            }
                        }]);
                    console.log('[DB] Recorded filing exception');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record filing exception:', dbError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = (type: string) => {
        // Record receipt download in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'document_uploaded',
                        description: `Downloaded ${type} receipt`,
                        metadata: {
                            receipt_type: type,
                            pin: pin,
                            receipt_number: receiptNumber
                        }
                    }])
                    .then(() => console.log(`[DB] Recorded ${type} receipt download in database`))
                    .catch(error => console.error(`[DB ERROR] Failed to record ${type} receipt download:`, error));

                // Create receipt document record
                const returnId = sessionService.getData('currentReturnId');
                if (returnId) {
                    supabase
                        .from('return_documents')
                        .insert([{
                            return_id: returnId,
                            document_type: `${type}_receipt`,
                            document_name: `${pin}_${type}_receipt.pdf`,
                            document_url: `/receipts/${pin}_${type}_receipt.pdf`,
                            description: `${type} receipt for filing`,
                            is_verified: true,
                            updated_at: new Date().toISOString()
                        }])
                        .then(() => console.log(`[DB] Created ${type} receipt document record`))
                        .catch(error => console.error(`[DB ERROR] Failed to create ${type} receipt document:`, error));
                }
            } catch (dbError) {
                console.error('[DB ERROR] Error recording receipt download:', dbError);
            }
        }

        // Call the receipt download handler
        onDownloadReceipt(type);
    };

    const handleEndSession = () => {
        // Record session end in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'session_complete',
                        description: 'User ended session',
                        metadata: {
                            pin: pin,
                            elapsed_time: sessionStartTime ?
                                Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000) : null
                        }
                    }])
                    .then(() => console.log('[DB] Recorded session end in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record session end:', error));

                // Update session as completed
                supabase
                    .from('sessions')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Marked session as completed'))
                    .catch(error => console.error('[DB ERROR] Failed to mark session as completed:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording session end:', dbError);
            }
        }

        // Call the session end handler
        onEndSession();
    };

    // Render the filing completion view if filing is completed
    if (filingStatus.completed) {
        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="rounded-lg border bg-card p-6">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="mb-4 rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold">Filing Completed Successfully!</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            Your nil return has been filed successfully with KRA.
                        </p>
                        
                        {/* Receipt information - Optimized for desktop with 2 columns */}
                        <div className="w-full max-w-xl rounded-lg bg-gray-50 p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-muted-foreground">KRA PIN:</div>
                                        <div className="font-medium">{pin}</div>
                                    </div>
                                    
                                    <div>
                                        <div className="text-muted-foreground">Receipt Number:</div>
                                        <div className="font-medium">{receiptNumber}</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-muted-foreground">Filing Date:</div>
                                        <div className="font-medium">{new Date().toLocaleDateString()}</div>
                                    </div>
                                    
                                    <div>
                                        <div className="text-muted-foreground">Filing Time:</div>
                                        <div className="font-medium">{new Date().toLocaleTimeString()}</div>
                                    </div>
                                    
                                    <div>
                                        <div className="text-muted-foreground">Processing Time:</div>
                                        <div className="font-medium">
                                            {elapsedTime || (sessionStartTime ? 
                                                Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000) : 0)} seconds
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Download buttons - Grid layout for desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                            <Button
                                onClick={() => handleDownloadReceipt('acknowledgement')}
                                variant="outline"
                                className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white"
                            >
                                <ArrowDown className="mr-2 h-4 w-4" />
                                Acknowledgement Receipt
                            </Button>
                            
                            <Button
                                onClick={() => handleDownloadReceipt('payment')}
                                variant="outline"
                                className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white"
                            >
                                <ArrowDown className="mr-2 h-4 w-4" />
                                Payment Receipt
                            </Button>
                            
                            <Button
                                onClick={() => handleDownloadReceipt('all')}
                                className="md:col-span-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white mt-2"
                            >
                                <ArrowDown className="mr-2 h-4 w-4" />
                                Download All Receipts
                            </Button>
                            
                            <Button
                                onClick={handleEndSession}
                                variant="secondary"
                                className="md:col-span-2 mt-4 bg-gradient-to-r from-purple-900 to-black hover:from-purple-800 hover:to-black text-white"
                            >
                                Return to Home & End Session
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (filingStatus.loggedIn) {
        return (
            <div className="space-y-4 animate-fadeIn">
                <div className="mt-2">
                    <h3 className="text-lg font-semibold mb-4">Filing Progress</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {steps.map((step, index) => (
                            <Badge
                                key={step.label}
                                variant="outline"
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2 transition-all duration-300",
                                    index <= currentStep 
                                        ? "bg-primary/20 border-primary text-primary animate-pulse" 
                                        : "bg-gray-100 border-gray-200 text-gray-400"
                                )}
                            >
                                {step.icon}
                                <span className="text-xs">{step.label}</span>
                                {index === currentStep && (
                                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>
                                )}
                            </Badge>
                        ))}
                    </div>
                    
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">Filing Status</h4>
                            <div className="text-xs text-gray-500">
                                Time Elapsed: <span className="font-medium">{elapsedTime} seconds</span>
                            </div>
                        </div>
                        
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-300"
                                style={{ width: `${Math.min(100, (currentStep + 1) * 25)}%` }}
                            ></div>
                        </div>
                        
                        <p className="text-xs text-center mt-2 text-gray-600">
                            {currentStep === 0 && "Logging in to KRA iTax..."}
                            {currentStep === 1 && "Filing nil returns..."}
                            {currentStep === 2 && "Extracting receipt information..."}
                            {currentStep === 3 && "Filing completed successfully!"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">
                    File Your Nil Returns
                </h3>
                
                {(error || localError) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <span>{error || localError}</span>
                    </div>
                )}
                
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="pin">KRA PIN</Label>
                        <Input
                            id="pin"
                            value={pin}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="password">KRA Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="Enter your KRA iTax password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your password is required to log in to the KRA iTax portal
                        </p>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                        <p className="text-sm font-medium mb-1">Important Information</p>
                        <ul className="text-xs list-disc ml-5 space-y-1">
                            <li>This process will file a nil return on your behalf</li>
                            <li>The system will log in to KRA iTax portal using your credentials</li>
                            <li>Filing may take up to 1 minute to complete</li>
                            <li>You will receive an acknowledgement receipt once completed</li>
                        </ul>
                    </div>
                    
                    <Button
                        onClick={handleFileReturns}
                        disabled={!password || loading}
                        className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white step4-filing-button"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Filing Returns...
                            </>
                        ) : (
                            "File Nil Returns Now"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Step4Filing;
