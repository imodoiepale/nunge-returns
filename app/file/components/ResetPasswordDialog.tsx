// @ts-nocheck
"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle, Mail, Phone, Lock, Eye, EyeOff, CreditCard, Monitor } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface ResetPasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pin: string
    email?: string
    taxpayerName?: string
    mobileNumber?: string
    resetType: 'password' | 'email_password' | 'recover_pin'
    onResetComplete: (newPassword: string) => void
}

type ResetStep = 'payment' | 'triggering' | 'waiting_code' | 'completing' | 'success' | 'error'

export default function ResetPasswordDialog({
    open,
    onOpenChange,
    pin,
    email,
    taxpayerName,
    mobileNumber,
    resetType,
    onResetComplete
}: ResetPasswordDialogProps) {
    const [step, setStep] = useState<ResetStep>('payment')
    const [mpesaNumber, setMpesaNumber] = useState('')
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'paid'>('idle')
    const [recoveryPassword, setRecoveryPassword] = useState('')
    const [showRecoveryPassword, setShowRecoveryPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState('')
    const [progressSteps, setProgressSteps] = useState<{text: string, done: boolean}[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [countdown, setCountdown] = useState(3)

    const resetTitle = {
        'password': 'Reset KRA Password',
        'email_password': 'Reset Email & Password',
        'recover_pin': 'Recover PIN using ID'
    }

    // Auto-generate new password from first name + last 4 digits of mobile
    const generatedPassword = useMemo(() => {
        const firstName = (taxpayerName || '').split(' ')[0] || 'User'
        const cleanName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        const last4 = (mobileNumber || '').replace(/\D/g, '').slice(-4) || new Date().getFullYear().toString()
        return `${cleanName}${last4}`
    }, [taxpayerName, mobileNumber])

    // Set auto-generated password as default when dialog opens
    useEffect(() => {
        if (open && !newPassword) {
            setNewPassword(generatedPassword)
        }
    }, [open, generatedPassword])

    // Mask email for display: ja***@gmail.com
    const maskedEmail = useMemo(() => {
        if (!email) return null
        const [local, domain] = email.split('@')
        if (!local || !domain) return email
        const visible = local.slice(0, 2)
        return `${visible}***@${domain}`
    }, [email])

    const handleSimulatePayment = () => {
        if (!mpesaNumber || mpesaNumber.length < 10) {
            setError('Please enter a valid M-Pesa number')
            return
        }
        setError(null)
        setPaymentStatus('processing')
        setStatusMessage('Sending STK push to your phone...')

        // Simulate STK push and payment
        setTimeout(() => {
            setPaymentStatus('paid')
            setStatusMessage('Payment of KES 10 confirmed!')
            setTimeout(() => {
                handleTriggerReset()
            }, 1000)
        }, 3000)
    }

    const handleTriggerReset = async () => {
        setStep('triggering')
        setError(null)
        setIsLoading(true)
        setProgressSteps([
            { text: 'Opening KRA iTax portal...', done: false },
            { text: 'Navigating to Forgot Password page...', done: false },
            { text: 'Solving CAPTCHA...', done: false },
            { text: 'Submitting reset request...', done: false },
        ])
        setStatusMessage('Requesting password reset from KRA...')

        // Simulate progress updates
        const updateProgress = (index: number) => {
            setProgressSteps(prev => prev.map((s, i) => i <= index ? { ...s, done: true } : s))
        }

        setTimeout(() => updateProgress(0), 1000)
        setTimeout(() => {
            updateProgress(1)
            setStatusMessage('Solving CAPTCHA...')
        }, 2000)
        setTimeout(() => {
            updateProgress(2)
            setStatusMessage('Submitting request...')
        }, 4000)

        try {
            const response = await fetch('/api/kra/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin, step: 'trigger' })
            })

            const data = await response.json()

            updateProgress(3)

            if (data.success) {
                setStep('waiting_code')
                setStatusMessage('')
            } else {
                setError(data.error || data.message || 'Failed to trigger password reset')
                setStep('error')
            }
        } catch (err) {
            setError(err.message || 'Failed to connect to reset service')
            setStep('error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCompleteReset = async () => {
        if (!recoveryPassword) {
            setError('Please enter the recovery password from your email')
            return
        }

        setStep('completing')
        setIsLoading(true)
        setError(null)
        setProgressSteps([
            { text: 'Opening KRA iTax portal...', done: false },
            { text: 'Logging in with recovery password...', done: false },
            { text: 'Solving CAPTCHA...', done: false },
            { text: `Setting new password...`, done: false },
            { text: 'Configuring security question...', done: false },
            { text: 'Finalizing password reset...', done: false },
        ])
        setStatusMessage('Logging in with recovery password and setting your new password...')

        const updateProgress = (index: number) => {
            setProgressSteps(prev => prev.map((s, i) => i <= index ? { ...s, done: true } : s))
        }

        setTimeout(() => updateProgress(0), 2000)
        setTimeout(() => {
            updateProgress(1)
            setStatusMessage('Communicating with KRA portal...')
        }, 5000)
        setTimeout(() => updateProgress(2), 10000)
        setTimeout(() => updateProgress(3), 18000)
        setTimeout(() => updateProgress(4), 22000)

        try {
            const response = await fetch('/api/kra/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    step: 'complete',
                    recoveryPassword,
                    newPassword: newPassword || generatedPassword
                })
            })

            const data = await response.json()

            updateProgress(5)

            if (data.success) {
                setStep('success')
                setStatusMessage(`Your new KRA password is: ${newPassword || generatedPassword}`)
                
                // Start countdown and auto-close after 3 seconds
                setCountdown(3)
                const countdownInterval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval)
                            handleUseNewPassword()
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)
            } else {
                setError(data.error || data.message || 'Failed to complete password reset')
                setStep('waiting_code')
            }
        } catch (err) {
            setError(err.message || 'Failed to connect to reset service')
            setStep('waiting_code')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUseNewPassword = () => {
        onResetComplete(newPassword || generatedPassword)
        handleClose()
    }

    const handleClose = () => {
        setStep('payment')
        setMpesaNumber('')
        setPaymentStatus('idle')
        setRecoveryPassword('')
        setNewPassword('')
        setError(null)
        setStatusMessage('')
        setProgressSteps([])
        setIsLoading(false)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[95%] max-w-[520px] rounded-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Lock className="h-5 w-5 text-purple-500" />
                        {resetTitle[resetType]}
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-sm space-y-1 pt-1">
                            <div>PIN: <strong>{pin}</strong></div>
                            {email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                                    Recovery email: <strong className="text-blue-700">{email}</strong>
                                </div>
                            )}
                            {taxpayerName && (
                                <div>Name: <strong>{taxpayerName}</strong></div>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Step 1: Payment */}
                    {step === 'payment' && (
                        <div className="space-y-4">
                            <Alert className="bg-blue-50 border-blue-200">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">How it works</AlertTitle>
                                <AlertDescription className="text-blue-700 text-sm">
                                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                                        <li>Pay KES 10 service fee</li>
                                        <li>We request KRA to send a recovery password to <strong>{email || 'your email'}</strong></li>
                                        <li>Enter the recovery password you receive in your email</li>
                                        <li>Set your new password (auto-generated or custom)</li>
                                    </ol>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password (editable)</Label>
                                <Input
                                    id="new-password"
                                    type="text"
                                    value={newPassword || generatedPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="font-mono text-base"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Auto-generated: {generatedPassword} (First name + {mobileNumber ? 'last 4 digits of mobile' : 'current year'})
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mpesa-number" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    M-Pesa Number (for payment)
                                </Label>
                                <Input
                                    id="mpesa-number"
                                    value={mpesaNumber}
                                    onChange={(e) => setMpesaNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 0712345678"
                                    maxLength={12}
                                    className="text-lg h-12"
                                />
                            </div>

                            {paymentStatus === 'processing' && (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                                    <span className="text-sm text-yellow-800">{statusMessage}</span>
                                </div>
                            )}

                            {paymentStatus === 'paid' && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-green-800">{statusMessage}</span>
                                </div>
                            )}

                            <Button
                                onClick={handleSimulatePayment}
                                disabled={paymentStatus !== 'idle' || !mpesaNumber || mpesaNumber.length < 10}
                                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white"
                            >
                                <CreditCard className="h-5 w-5 mr-2" />
                                {paymentStatus === 'idle' ? 'Pay KES 10 via M-Pesa' :
                                 paymentStatus === 'processing' ? 'Processing...' : 'Paid ✓'}
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Triggering reset — show live progress */}
                    {step === 'triggering' && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Monitor className="h-6 w-6 text-purple-500" />
                                <div>
                                    <p className="font-semibold text-sm">Requesting password reset from KRA...</p>
                                    <p className="text-xs text-muted-foreground">Watch the browser window for live progress</p>
                                </div>
                            </div>

                            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                                {progressSteps.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {s.done ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <Loader2 className="h-4 w-4 animate-spin text-purple-500 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${s.done ? 'text-green-700' : 'text-muted-foreground'}`}>
                                            {s.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Badge variant="secondary" className="animate-pulse w-full justify-center py-2">
                                Communicating with KRA portal...
                            </Badge>
                        </div>
                    )}

                    {/* Step 3: Waiting for recovery code from email */}
                    {step === 'waiting_code' && (
                        <div className="space-y-4">
                            <Alert className="bg-green-50 border-green-200">
                                <Mail className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Check Your Email</AlertTitle>
                                <AlertDescription className="text-green-700 text-sm">
                                    KRA has sent a recovery password to <strong>{email || 'your registered email'}</strong>.
                                    Open your email and copy the password, then paste it below.
                                </AlertDescription>
                            </Alert>

                            {email && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-blue-600">Recovery password sent to:</p>
                                        <p className="font-semibold text-blue-800">{email}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="recovery-password" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Recovery Password (from KRA email)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="recovery-password"
                                        type={showRecoveryPassword ? "text" : "password"}
                                        value={recoveryPassword}
                                        onChange={(e) => setRecoveryPassword(e.target.value)}
                                        placeholder="Paste the recovery password here"
                                        className="text-lg h-12 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {showRecoveryPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-xs text-purple-600 font-medium mb-1">Your new password will be set to:</p>
                                <p className="text-lg font-mono font-bold text-purple-800">{generatedPassword}</p>
                            </div>

                            <Button
                                onClick={handleCompleteReset}
                                disabled={!recoveryPassword || isLoading}
                                className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Setting new password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-5 w-5 mr-2" />
                                        Set New Password
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Completing — show live progress */}
                    {step === 'completing' && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Monitor className="h-6 w-6 text-purple-500" />
                                <div>
                                    <p className="font-semibold text-sm">Setting your new password on KRA...</p>
                                    <p className="text-xs text-muted-foreground">Watch the browser window for live progress</p>
                                </div>
                            </div>

                            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                                {progressSteps.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {s.done ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        ) : i === progressSteps.findIndex(x => !x.done) ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-purple-500 flex-shrink-0" />
                                        ) : (
                                            <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${s.done ? 'text-green-700' : i === progressSteps.findIndex(x => !x.done) ? 'text-purple-700 font-medium' : 'text-muted-foreground'}`}>
                                            {s.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Badge variant="secondary" className="animate-pulse w-full justify-center py-2">
                                Automating KRA portal... This may take up to 60 seconds
                            </Badge>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 'success' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="bg-green-100 rounded-full p-3">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-green-800">Password Reset Successful!</h3>
                                <p className="text-sm text-muted-foreground">Closing in {countdown} seconds...</p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <p className="text-sm text-green-600 font-medium mb-1">Your new KRA password:</p>
                                <p className="text-2xl font-mono font-bold text-green-800">{newPassword || generatedPassword}</p>
                                <p className="text-xs text-green-500 mt-2">Password has been set and validated</p>
                            </div>

                            <Button
                                onClick={handleUseNewPassword}
                                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white"
                            >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Continue Now
                            </Button>
                        </div>
                    )}

                    {/* Error state */}
                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-3 py-4">
                                <div className="bg-red-100 rounded-full p-3">
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-red-800">Reset Failed</h3>
                            </div>

                            <Button
                                onClick={() => { setStep('payment'); setError(null); setPaymentStatus('paid'); handleTriggerReset(); }}
                                variant="outline"
                                className="w-full"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step !== 'triggering' && step !== 'completing' && (
                        <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
