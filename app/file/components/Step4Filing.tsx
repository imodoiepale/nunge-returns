// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, Download, AlertCircle, Eye, EyeOff } from 'lucide-react'
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

export default function Step4Filing({
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
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [receiptNumber, setReceiptNumber] = useState<string | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [localError, setLocalError] = useState<string | null>(null)
    
    // Record view in database
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId')
        if (currentSessionId) {
            supabase
                .from('session_activities')
                .insert([{
                    session_id: currentSessionId,
                    activity_type: 'user_action',
                    description: 'Viewed filing page',
                    metadata: {
                        pin: pin,
                        filing_status: filingStatus
                    }
                }])
                .then(() => console.log('[DB] Recorded filing page view'))
                .catch(error => console.error('[DB ERROR] Failed to record filing page view:', error))
        }
    }, [pin, filingStatus])
    
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
    
    // Set receipt number when filing is completed
    useEffect(() => {
        if (filingStatus.completed && !receiptNumber) {
            setReceiptNumber(`NR${Math.floor(Math.random() * 1000000)}`)
            
            // Record completion in database
            const currentSessionId = sessionService.getData('currentSessionId')
            if (currentSessionId) {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'filing_completed',
                        description: 'Filing completed successfully',
                        metadata: {
                            pin: pin,
                            receipt_number: `NR${Math.floor(Math.random() * 1000000)}`,
                            elapsed_time: elapsedTime
                        }
                    }])
                    .then(() => console.log('[DB] Recorded filing completion'))
                    .catch(error => console.error('[DB ERROR] Failed to record filing completion:', error))
                
                // Update session status
                supabase
                    .from('sessions')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        form_data: {
                            ...formData,
                            filing_completed: true,
                            receipt_number: `NR${Math.floor(Math.random() * 1000000)}`
                        }
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Updated session to completed status'))
                    .catch(error => console.error('[DB ERROR] Failed to update session status:', error))
            }
        }
    }, [filingStatus.completed, receiptNumber, pin, elapsedTime, formData])
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onPasswordChange(e.target.value)
    }
    
    const handleFileReturns = async () => {
        setLoading(true)
        setLocalError(null)
        
        // Record filing attempt in database
        const currentSessionId = sessionService.getData('currentSessionId')
        if (currentSessionId) {
            try {
                await supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'filing_initiated',
                        description: 'Filing initiated',
                        metadata: {
                            pin: pin,
                            start_time: new Date().toISOString()
                        }
                    }])
                console.log('[DB] Recorded filing initiation')
            } catch (error) {
                console.error('[DB ERROR] Failed to record filing initiation:', error)
            }
        }
        
        try {
            // Call the API to file returns
            const response = await fetch('/api/file-returns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pin,
                    password,
                    sessionId: currentSessionId
                }),
            })
            
            const data = await response.json()
            
            if (data.success) {
                // Update filing status on success
                onFilingStatusChange({
                    loggedIn: true,
                    filing: true,
                    extracting: true,
                    completed: true,
                })
                
                // Record successful filing in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'filing_success',
                                description: 'Filing completed successfully',
                                metadata: {
                                    pin: pin,
                                    receipt_number: data.receiptNumber,
                                    completion_time: new Date().toISOString()
                                }
                            }])
                        console.log('[DB] Recorded successful filing')
                    } catch (error) {
                        console.error('[DB ERROR] Failed to record successful filing:', error)
                    }
                }
            } else {
                // Handle error
                const errorMessage = data.message || 'Failed to file returns'
                setLocalError(errorMessage)
                if (onError) onError(errorMessage)
                
                // Record error in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'filing_error',
                                description: 'Filing failed',
                                metadata: {
                                    pin: pin,
                                    error: data.message || 'Failed to file returns'
                                }
                            }])
                        console.log('[DB] Recorded filing error')
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record filing error:', dbError)
                    }
                }
            }
        } catch (error) {
            // Handle exception
            const errorMessage = 'An error occurred while filing returns'
            setLocalError(errorMessage)
            if (onError) onError(errorMessage)
            
            // Record exception in database
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'filing_error',
                            description: 'Filing exception',
                            metadata: {
                                pin: pin,
                                error: error.message
                            }
                        }])
                    console.log('[DB] Recorded filing exception')
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record filing exception:', dbError)
                }
            }
        } finally {
            setLoading(false)
        }
    }
    
    const onFilingStatusChange = (newStatus: FilingStatus) => {
        // This function would be called by the parent component
        console.log('Filing status changed:', newStatus)
    }
    
    // Render the filing completion view if filing is completed
    if (filingStatus.completed) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border bg-card p-6">
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="mb-4 rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold">Filing Completed Successfully!</h3>
                        <p className="text-muted-foreground mt-2 mb-6">
                            Your nil return has been filed successfully with KRA.
                        </p>
                        
                        <div className="w-full max-w-md rounded-lg bg-gray-50 p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-muted-foreground">KRA PIN:</div>
                                <div className="font-medium text-right">{pin}</div>
                                
                                <div className="text-muted-foreground">Receipt Number:</div>
                                <div className="font-medium text-right">{receiptNumber}</div>
                                
                                <div className="text-muted-foreground">Filing Date:</div>
                                <div className="font-medium text-right">{new Date().toLocaleDateString()}</div>
                                
                                <div className="text-muted-foreground">Filing Time:</div>
                                <div className="font-medium text-right">{new Date().toLocaleTimeString()}</div>
                                
                                <div className="text-muted-foreground">Processing Time:</div>
                                <div className="font-medium text-right">{elapsedTime} seconds</div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full max-w-md">
                            <Button
                                onClick={() => onDownloadReceipt('acknowledgement')}
                                variant="outline"
                                className="flex items-center justify-center"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Acknowledgement Receipt
                            </Button>
                            
                            <Button
                                onClick={() => onDownloadReceipt('payment')}
                                variant="outline"
                                className="flex items-center justify-center"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Payment Receipt
                            </Button>
                            
                            <Button
                                onClick={() => onDownloadReceipt('all')}
                                className="bg-gradient-to-r from-purple-500 to-purple-700 mt-2"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download All Receipts & Finish
                            </Button>
                            
                            <Button
                                onClick={onEndSession}
                                variant="ghost"
                                className="mt-2"
                            >
                                Return to Home
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="space-y-6">
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
                        className="w-full bg-gradient-to-r from-green-500 to-green-700"
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
