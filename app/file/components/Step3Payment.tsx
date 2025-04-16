// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { ManufacturerDetails, PaymentStatus as PaymentStatusType, Step3Props } from "../lib/types"

const sessionService = new SessionManagementService()

export default function Step3Payment({
    mpesaNumber,
    paymentStatus,
    onMpesaNumberChange,
    onSimulatePayment,
    pin,
    manufacturerDetails
}: Step3Props) {
    const [loading, setLoading] = useState(false)
    
    // Record view in database
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId')
        if (currentSessionId) {
            supabase
                .from('session_activities')
                .insert([{
                    session_id: currentSessionId,
                    activity_type: 'user_action',
                    description: 'Viewed payment page',
                    metadata: {
                        pin: pin,
                        payment_status: paymentStatus
                    }
                }])
                .then(() => console.log('[DB] Recorded payment page view'))
                .catch(error => console.error('[DB ERROR] Failed to record payment page view:', error))
        }
    }, [pin, paymentStatus])
    
    const handleMpesaNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onMpesaNumberChange(e.target.value)
    }
    
    const handlePayment = () => {
        setLoading(true)
        
        // Record payment attempt in database
        const currentSessionId = sessionService.getData('currentSessionId')
        if (currentSessionId) {
            supabase
                .from('session_activities')
                .insert([{
                    session_id: currentSessionId,
                    activity_type: 'payment_initiated',
                    description: 'Payment initiated',
                    metadata: {
                        pin: pin,
                        mpesa_number: mpesaNumber,
                        amount: 50 // Example amount
                    }
                }])
                .then(() => console.log('[DB] Recorded payment initiation'))
                .catch(error => console.error('[DB ERROR] Failed to record payment initiation:', error))
        }
        
        // Simulate payment processing
        onSimulatePayment("Processing")
        
        setTimeout(() => {
            setLoading(false)
            onSimulatePayment("Paid")
            
            // Record successful payment in database
            if (currentSessionId) {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'payment_completed',
                        description: 'Payment completed',
                        metadata: {
                            pin: pin,
                            mpesa_number: mpesaNumber,
                            amount: 50,
                            transaction_id: `MPESA-${Date.now()}`
                        }
                    }])
                    .then(() => console.log('[DB] Recorded payment completion'))
                    .catch(error => console.error('[DB ERROR] Failed to record payment completion:', error))
            }
        }, 2000)
    }
    
    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight mb-4 flex items-center">
                        <CreditCard className="mr-2 h-5 w-5 text-primary" />
                        Payment Details
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="mpesaNumber">M-Pesa Number</Label>
                            <Input
                                id="mpesaNumber"
                                placeholder="254XXXXXXXXX"
                                value={mpesaNumber}
                                onChange={handleMpesaNumberChange}
                                disabled={paymentStatus !== "Not Paid"}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the M-Pesa number you wish to use for payment
                            </p>
                        </div>
                        
                        <div className="rounded-md bg-muted p-4">
                            <div className="font-medium">Payment Summary</div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">Service</div>
                                <div>Nil Returns Filing</div>
                                <div className="text-muted-foreground">KRA PIN</div>
                                <div>{pin}</div>
                                <div className="text-muted-foreground">Taxpayer Name</div>
                                <div>{manufacturerDetails?.name || 'N/A'}</div>
                                <div className="text-muted-foreground">Amount</div>
                                <div className="font-medium">KES 50.00</div>
                            </div>
                        </div>
                        
                        {paymentStatus === "Not Paid" && (
                            <Button 
                                onClick={handlePayment} 
                                disabled={!mpesaNumber || mpesaNumber.length < 10 || loading}
                                className="w-full bg-gradient-to-r from-green-500 to-green-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing Payment...
                                    </>
                                ) : (
                                    "Pay Now"
                                )}
                            </Button>
                        )}
                        
                        {paymentStatus === "Processing" && (
                            <div className="rounded-md bg-yellow-50 p-4 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-yellow-600 mb-2" />
                                <p className="text-yellow-800 font-medium">Processing your payment...</p>
                                <p className="text-yellow-700 text-sm mt-1">Please wait while we confirm your payment</p>
                            </div>
                        )}
                        
                        {paymentStatus === "Paid" && (
                            <div className="rounded-md bg-green-50 p-4 text-center">
                                <CheckCircle className="mx-auto h-6 w-6 text-green-600 mb-2" />
                                <p className="text-green-800 font-medium">Payment Successful!</p>
                                <p className="text-green-700 text-sm mt-1">
                                    Your payment of KES 50.00 has been received. You can now proceed to file your returns.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
