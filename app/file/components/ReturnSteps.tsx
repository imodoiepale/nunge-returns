// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ArrowDown, Flag, Eye, EyeOff, Loader2, ArrowRight, User, Mail, Building2, MapPin, LogIn, FileText, FileDown, CheckCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface FilingStatus {
    loggedIn: boolean
    filing: boolean
    extracting: boolean
    completed: boolean
}

interface ManufacturerDetails {
    pin: string
    name: string
    contactDetails: {
        mobile: string
        email: string
        secondaryEmail: string
    }
    businessDetails: {
        name: string
        registrationNumber: string
        registrationDate: string
        commencedDate: string
    }
    postalAddress: {
        postalCode: string
        town: string
        poBox: string
    }
    physicalAddress: {
        descriptive: string
    }
}

interface TaxpayerData {
    pin: string;
    password: string;
    taxpayerName: string;
    mainEmailId: string;
    mobileNumber: string;
    businessInfo: {
        registrationNumber: string;
        registrationDate: string;
        commencementDate: string;
    };
    postalAddress: Record<string, any>;
    descriptiveAddress: string;
    secondaryEmail: string;
    status: string;
    type: string;
}

interface Step1Props {
    pin: string;
    password: string;
    error: string | null;
    passwordError: string | null;
    passwordValidationStatus: "idle" | "checking" | "invalid" | "valid";
    pinValidationStatus: "idle" | "checking" | "invalid" | "valid";
    onPINChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordReset: () => void;
    onPasswordEmailReset: () => void;
    onNext: () => void;
    onActiveTabChange: (tab: 'id' | 'pin') => void;
    onManufacturerDetailsFound?: (manufacturerDetails: ManufacturerDetails) => void;
}

interface Step2Props {
    loading: boolean
    manufacturerDetails: ManufacturerDetails | null
    onBack: () => void
    onNext: () => void
}

interface Step3Props {
    mpesaNumber: string
    paymentStatus: "Not Paid" | "Processing" | "Paid"
    onMpesaNumberChange: (value: string) => void
    onSimulatePayment: () => void
}

interface Step4Props {
    pin: string
    password: string
    error: string | null
    filingStatus: FilingStatus
    sessionStartTime: Date | null
    onPasswordChange: (value: string) => void
    onDownloadReceipt: (type: string) => void
    onEndSession: () => void
}



export function Step1PIN({
    pin,
    password,
    error,
    passwordError,
    pinValidationStatus,
    passwordValidationStatus,
    onPINChange,
    onPasswordChange,
    onPasswordReset,
    onPasswordEmailReset,
    onNext,
    onActiveTabChange,
    onManufacturerDetailsFound
}: Step1Props) {
    const [showPassword, setShowPassword] = useState(false)
    const [hasClicked, setHasClicked] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(true)
    const [activeTab, setActiveTab] = useState<'id' | 'pin'>('id')
    const [idNumber, setIdNumber] = useState('')
    const [firstName, setFirstName] = useState('')
    const [idSearchStatus, setIdSearchStatus] = useState<'idle' | 'searching' | 'found' | 'not-found'>('idle')
    const [taxpayerData, setTaxpayerData] = useState<TaxpayerData | null>(null)

    const handleIdSearch = async () => {
        if (!idNumber || !firstName) return;

        setIdSearchStatus('searching');
        try {
            const response = await fetch(
                `/api/manufacturer/brs?id=${encodeURIComponent(idNumber)}&firstName=${encodeURIComponent(firstName)}`,
                { method: 'GET' }
            );
            const data = await response.json();

            if (data.success && data.data) {
                setIdSearchStatus('found');
                setTaxpayerData({
                    ...data.data,
                    password: data.data.password || '1234'
                });
            } else {
                setIdSearchStatus('not-found');
            }
        } catch (error) {
            setIdSearchStatus('not-found');
        }
    };

    const handleProceedWithPin = () => {
        if (taxpayerData) {
            // First update the PIN and password
            onPINChange({ target: { value: taxpayerData.pin } } as React.ChangeEvent<HTMLInputElement>);
            onPasswordChange({ target: { value: taxpayerData.password || '1234' } } as React.ChangeEvent<HTMLInputElement>);

            // Convert taxpayer data to manufacturer details format
            const manufacturerDetails = {
                pin: taxpayerData.pin,
                name: taxpayerData.taxpayerName,
                contactDetails: {
                    mobile: taxpayerData.mobileNumber,
                    email: taxpayerData.mainEmailId,
                    secondaryEmail: taxpayerData.secondaryEmail
                },
                businessDetails: taxpayerData.businessInfo ? {
                    name: taxpayerData.businessInfo.name || taxpayerData.taxpayerName,
                    registrationNumber: taxpayerData.businessInfo.registrationNumber,
                    registrationDate: taxpayerData.businessInfo.registrationDate,
                    commencedDate: taxpayerData.businessInfo.commencementDate
                } : undefined,
                postalAddress: taxpayerData.postalAddress,
                physicalAddress: {
                    descriptive: taxpayerData.descriptiveAddress
                }
            };

            // Pass the manufacturer details to parent
            onManufacturerDetailsFound?.(manufacturerDetails);

            // Then switch to PIN tab after a short delay to allow state updates
            setTimeout(() => {
                handleTabChange('pin');
            }, 0);

            // Reset search states
            setIdSearchStatus('idle');
            setIdNumber('');
            setFirstName('');
            setTaxpayerData(null);
        }
    };

    const handleTabChange = (tab: 'id' | 'pin') => {
        if (onActiveTabChange) {
            onActiveTabChange(tab);
        }
        setActiveTab(tab);
    };

    const handlePINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPin = e.target.value.toUpperCase();
        // First update the PIN value
        onPINChange({ ...e, target: { ...e.target, value: newPin } });
        
        if (newPin.length === 11) {
            // Set status to checking through parent
            onPINChange({ 
                ...e, 
                target: { ...e.target, value: newPin },
                validationStatus: "checking" 
            });

            try {
                const response = await fetch(`/api/manufacturer/kra?pin=${encodeURIComponent(newPin)}`, {
                    method: 'GET'
                });
                const data = await response.json();
                
                if (data.success) {
                    // Set status to valid through parent
                    onPINChange({ 
                        ...e, 
                        target: { ...e.target, value: newPin },
                        validationStatus: "valid" 
                    });
                    // Pass the manufacturer details up
                    onManufacturerDetailsFound?.(data.data);
                } else {
                    // Set status to invalid through parent
                    onPINChange({ 
                        ...e, 
                        target: { ...e.target, value: newPin },
                        validationStatus: "invalid" 
                    });
                }
            } catch (error) {
                // Set status to invalid through parent
                onPINChange({ 
                    ...e, 
                    target: { ...e.target, value: newPin },
                    validationStatus: "invalid" 
                });
            }
        } else {
            // Set status to idle through parent
            onPINChange({ 
                ...e, 
                target: { ...e.target, value: newPin },
                validationStatus: "idle" 
            });
        }
    };

    return (
        <div className="space-y-4">
            {(error || passwordError) && (
                <div className="mb-4 p-2 border border-red-200 rounded-md bg-red-50">
                    <p className="text-red-600 text-sm">{error || passwordError}</p>
                </div>
            )}

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-2">
                    <button
                        onClick={() => handleTabChange('id')}
                        className={cn(
                            'py-2 px-4 text-sm font-medium rounded-t-lg',
                            activeTab === 'id'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )}
                    >
                        Find PIN using ID
                    </button>
                    <button
                        onClick={() => handleTabChange('pin')}
                        className={cn(
                            'py-2 px-4 text-sm font-medium rounded-t-lg',
                            activeTab === 'pin'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )}
                    >
                        KRA PIN Login
                    </button>
                </nav>
            </div>

            {activeTab === 'id' ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="idNumber">ID Number</Label>
                            <Input
                                id="idNumber"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                placeholder="Enter your ID number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Enter your first name"
                            />
                        </div>
                    </div>
                    {idSearchStatus !== 'found' && (
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={handleIdSearch}
                                disabled={!idNumber || !firstName || idSearchStatus === 'searching'}
                                className="w-auto px-4 bg-primary hover:bg-primary/90"
                            >
                                {idSearchStatus === 'searching' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    'Find KRA PIN'
                                )}
                            </Button>
                        </div>
                    )}

                    {idSearchStatus === 'found' && taxpayerData && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-600" />
                                    <p className="text-green-700 font-medium">PIN found!</p>
                                </div>
                                <Badge variant="default" className="text-xs bg-primary/20 text-primary">
                                    PIN: {taxpayerData.pin}
                                </Badge>
                            </div>

                            <Button
                                onClick={handleProceedWithPin}
                                className="w-full bg-primary hover:bg-primary/90"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span>Proceed to Login</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </Button>
                        </div>
                    )}

                    {idSearchStatus === 'not-found' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-red-700">No matching records found. Please verify your details.</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pin">KRA PIN</Label>
                                {pinValidationStatus === "checking" && (
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 animate-bounce">
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                                        Verifying PIN
                                    </Badge>
                                )}
                                {pinValidationStatus === "invalid" && (
                                    <Badge variant="destructive" className="text-xs">
                                        Invalid PIN
                                    </Badge>
                                )}
                                {pinValidationStatus === "valid" && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                        Valid PIN
                                    </Badge>
                                )}
                            </div>
                            <Input
                                id="pin"
                                value={pin}
                                onChange={handlePINChange}
                                className={cn(
                                    "uppercase",
                                    pinValidationStatus === "invalid" && "border-red-500",
                                    pinValidationStatus === "valid" && "border-green-500"
                                )}
                                maxLength={11}
                                pattern="[AP]\d{10}"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                {passwordValidationStatus === "checking" && (
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 animate-bounce">
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                                        Verifying Password
                                    </Badge>
                                )}
                                {passwordValidationStatus === "invalid" && (
                                    <Badge variant="destructive" className="text-xs">
                                        Invalid Password
                                    </Badge>
                                )}
                                {passwordValidationStatus === "valid" && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                        Valid Password
                                    </Badge>
                                )}
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={onPasswordChange}
                                    className={cn(
                                        passwordValidationStatus === "invalid" && "border-red-500",
                                        passwordValidationStatus === "valid" && "border-green-500"
                                    )}
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
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                        />
                        <label htmlFor="terms" className="text-sm inline-flex items-center gap-1">
                            I accept the Terms and Conditions
                            <Link href="/terms" className="text-primary hover:underline inline-flex items-center gap-1">
                                Click here to read
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </label>
                    </div>

                    {pinValidationStatus === "invalid" && (
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                type="button"
                                className="bg-primary hover:bg-primary/90"
                                onClick={onPasswordReset}
                            >
                                Recover PIN using ID
                            </Button>
                            <Button
                                type="button"
                                className="bg-primary hover:bg-primary/90"
                                onClick={onPasswordReset}
                            >
                                Reset Password
                            </Button>
                            <Button
                                type="button"
                                className="bg-primary hover:bg-primary/90"
                                onClick={onPasswordEmailReset}
                            >
                                Reset Email + Password
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function Step2Details({ loading, manufacturerDetails, onBack, onNext }: Step2Props) {
    const [hasConfirmed, setHasConfirmed] = useState(true)

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-black">Fetching manufacturer details...</p>
                </div>
            </div>
        )
    }

    if (!manufacturerDetails) return null

    const isIndividual = manufacturerDetails.pin.startsWith('A')

    return (
        <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-white/80 relative scale-95">
                {/* PIN Badge */}
                <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1 border border-primary/20">
                        <Badge variant="outline" className="text-xs text-black flex items-center gap-1">
                            {isIndividual ? (
                                <>
                                    <User className="w-3 h-3" />
                                    Individual
                                </>
                            ) : (
                                <>
                                    <Building2 className="w-3 h-3" />
                                    Company
                                </>
                            )}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">PIN</span>
                                <p className="text-sm text-black font-medium">{manufacturerDetails.pin}</p>
                            </div>
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">Name</span>
                                <p className="text-sm text-black font-medium">{manufacturerDetails.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">Mobile</span>
                                <p className="text-sm text-black font-medium">{manufacturerDetails.contactDetails.mobile}</p>
                            </div>
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">Email</span>
                                <p className="text-sm text-black font-medium">{manufacturerDetails.contactDetails.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    {!isIndividual && (
                        <div>
                            <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                Business Information
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Business Name</span>
                                    <p className="text-sm text-black font-medium">{manufacturerDetails.businessDetails?.name}</p>
                                </div>
                                <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Registration Number</span>
                                    <p className="text-sm text-black font-medium">{manufacturerDetails.businessDetails?.registrationNumber}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Address Information */}
                    <div>
                        <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Address Information
                        </h3>
                        <div className="space-y-2">
                            {!isIndividual && (
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Postal Address</span>
                                    <p className="text-sm text-black font-medium">
                                        P.O. Box {manufacturerDetails.postalAddress.poBox}-
                                        {manufacturerDetails.postalAddress.postalCode},
                                        {manufacturerDetails.postalAddress.town}
                                    </p>
                                </div>
                            )}
                            <div className="p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">Physical Address</span>
                                <p className="text-sm text-black font-medium">{manufacturerDetails.physicalAddress.descriptive}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Step3Payment({
    mpesaNumber,
    paymentStatus,
    onMpesaNumberChange,
    onSimulatePayment
}: Step3Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [merchantRequestId, setMerchantRequestId] = useState<string | null>(null)
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

    const handlePayment = async () => {
        try {
            setLoading(true)
            setError(null)

            // Format phone number to include country code if not present
            const formattedPhone = mpesaNumber.replace(/[^0-9]/g, '').replace(/^0/, '254')

            // Initiate payment
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: formattedPhone,
                    amount: '50' // Fixed amount for now
                })
            })

            const data = await response.json()

            if (data.success) {
                setMerchantRequestId(data.data.MerchantRequestID)
                onSimulatePayment() // Set status to "Processing"
                startPolling(data.data.MerchantRequestID)
            } else {
                throw new Error(data.message || 'Payment initiation failed')
            }
        } catch (error: any) {
            setError(error.message || 'Failed to initiate payment')
            console.error('Payment error:', error)
        } finally {
            setLoading(false)
        }
    }

    const startPolling = (merchantRequestId: string) => {
        // Clear any existing polling
        if (pollInterval) {
            clearInterval(pollInterval)
        }

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/transactions?merchantRequestId=${merchantRequestId}`)
                const data = await response.json()

                if (data.success && data.data) {
                    switch (data.data.status) {
                        case 'completed':
                            clearInterval(interval)
                            onSimulatePayment() // Set status to "Paid"
                            break
                        case 'failed':
                        case 'cancelled_by_user':
                        case 'timeout':
                        case 'insufficient_balance':
                            clearInterval(interval)
                            setError(data.data.result_description || 'Payment failed')
                            break
                    }
                }
            } catch (error) {
                console.error('Error checking payment status:', error)
            }
        }, 2000)

        setPollInterval(interval)
    }

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval)
            }
        }
    }, [pollInterval])

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="mpesa-number">M-Pesa Number</Label>
                <div className="mt-2">
                    <Input
                        id="mpesa-number"
                        type="tel"
                        placeholder="Enter M-Pesa number e.g., 0702047436"
                        value={mpesaNumber}
                        onChange={(e) => onMpesaNumberChange(e.target.value)}
                        className="w-full"
                        disabled={paymentStatus !== "Not Paid"}
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm mt-2">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Payment Status:</span>
                    <Badge className={cn(
                        "text-white font-medium",
                        paymentStatus === "Paid"
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : paymentStatus === "Processing"
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-red-500 to-red-600"
                    )}>
                        {paymentStatus}
                    </Badge>
                </div>

                {paymentStatus === "Not Paid" && (
                    <Button
                        type="button"
                        onClick={handlePayment}
                        disabled={!mpesaNumber || loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Pay Now'
                        )}
                    </Button>
                )}

                {paymentStatus === "Processing" && (
                    <div className="text-center text-sm text-muted-foreground">
                        Please check your phone for the M-Pesa prompt
                    </div>
                )}

                {paymentStatus === "Paid" && (
                    <div className="text-center text-sm text-green-600 font-medium">
                        Payment completed successfully!
                    </div>
                )}
            </div>
        </div>
    )
}

export function Step4Filing({
    pin,
    password,
    error,
    filingStatus,
    onPasswordChange,
    onDownloadReceipt,
    onEndSession,
    sessionStartTime
}: Step4Props) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)

    useEffect(() => {
        const steps = [0, 1, 2, 3]
        let currentIndex = 0

        const interval = setInterval(() => {
            if (currentIndex < steps.length) {
                setCurrentStep(steps[currentIndex])
                if (currentIndex === steps.length - 1) {
                    setIsCompleted(true)
                }
                currentIndex++
            } else {
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const steps = [
        { label: 'Logging In', icon: <LogIn className="w-4 h-4" /> },
        { label: 'Filing Returns', icon: <FileText className="w-4 h-4" /> },
        { label: 'Extracting Receipt', icon: <FileDown className="w-4 h-4" /> },
        { label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> }
    ]

    return (
        <div className="space-y-4">


            {/* <div className="space-y-2">
                <Label htmlFor="pin">KRA PIN (Displayed)</Label>
                <Input id="pin" value={pin} disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">KRA Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    required
                />
            </div> */}
            {/* {error && (
                <div className="p-4 border border-red-200 rounded-md bg-red-50">
                    <p className="text-red-600">{error}</p>
                </div>
            )} */}

            {filingStatus.loggedIn && (
                <div className="mt-2 ">
                    <h3 className="text-lg font-semibold mb-4">Filing Progress</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {steps.map((step, index) => (
                            <Badge
                                key={step.label}
                                variant="outline"
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2",
                                    index <= currentStep ? "bg-primary/20 border-primary text-primary" : "bg-gray-100 border-gray-200 text-gray-400"
                                )}
                            >
                                {step.icon}
                                <span className="text-xs">{step.label}</span>
                            </Badge>
                        ))}
                    </div>
                    {filingStatus.completed && (
                        <div className="mt-4 p-2 border rounded-lg">
                            <h4 className="font-semibold text-sm mb-1">Filing Receipt</h4>
                            <p className="text-xs text-muted-foreground">
                                Your nil returns have been successfully filed. Receipt number: NR{Math.random().toString().slice(2, 10)}
                            </p>
                            <div className="flex space-x-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                    onClick={() => onDownloadReceipt("acknowledgement")}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    Acknowledgement Receipt
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                    onClick={() => onDownloadReceipt("purchase")}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    Purchase Receipt
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                    onClick={() => onDownloadReceipt("all")}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    All Receipts
                                </Button>
                            </div>
                            <div className="mt-4 space-y-4">
                                {filingStatus.completed && (
                                    <div className="p-2 bg-green-50 border border-green-100 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className=" text-sm font-semibold text-green-800">Filing Completed Successfully</p>
                                                <p className="text-xs text-green-600">
                                                    Time taken: {Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000)} seconds
                                                </p>
                                            </div>
                                            <div className="flex justify-end pt-2 border-t border-green-100">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="bg-gradient-to-r from-purple-900 to-black hover:from-purple-800 hover:to-black text-white"
                                                    onClick={onEndSession}
                                                >
                                                    End Session
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}