// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ArrowDown, Flag, Eye, EyeOff, Loader2, ArrowRight, User, Mail, Building2, MapPin, LogIn, FileText, FileDown, CheckCircle, PhoneIcon, CreditCard, CheckCircleIcon, ExclamationTriangleIcon, } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"

const sessionService = new SessionManagementService()

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
    onSimulatePayment: (status: "NotStarted" | "Processing" | "Paid") => void
    pin: string
    manufacturerDetails: ManufacturerDetails | null
}

interface Step4Props {
    pin: string
    password: string
    error: string | null
    filingStatus: FilingStatus
    sessionStartTime: Date | null
    formData: any
    onPasswordChange: (value: string) => void
    onDownloadReceipt: (type: string) => void
    onEndSession: () => void
}

interface PaymentStatus {
    status: 'completed' | 'insufficient_balance' | 'cancelled_by_user' | 'timeout' | 'failed' | 'pending';
    transaction_code?: string;
    result_description?: string;
    result_code?: string | null;
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
    const [idSearchError, setIdSearchError] = useState<string | null>(null)

    const handleIdSearch = async () => {
        if (!idNumber || !firstName) return;

        setIdSearchStatus('searching');
        setIdSearchError(null);
        setTaxpayerData(null);

        try {
            console.log(`Searching with ID: ${idNumber}, Name: ${firstName}`);

            // Create or update database record for the search attempt
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'ID search attempted',
                            metadata: {
                                id_number: idNumber,
                                first_name: firstName,
                                search_method: 'id'
                            }
                        }]);

                    console.log('[DB] Recorded ID search attempt in database');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record search attempt:', dbError);
                }
            }

            const response = await fetch(
                `/api/manufacturer/brs?id=${encodeURIComponent(idNumber)}&firstName=${encodeURIComponent(firstName)}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Raw API response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                throw new Error('Invalid response format from server');
            }

            console.log('Parsed API response:', data);

            if (data.success && data.data) {
                console.log('Found taxpayer data:', data.data);

                // Check if the data has required fields
                if (!data.data.pin || !data.data.taxpayerName) {
                    throw new Error('Incomplete taxpayer data returned');
                }

                // Add default password if not provided
                const enrichedData = {
                    ...data.data,
                    password: data.data.password || '1234'
                };

                setTaxpayerData(enrichedData);
                setIdSearchStatus('found');

                // Record successful search in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'ID search successful',
                                metadata: {
                                    id_number: idNumber,
                                    first_name: firstName,
                                    pin: data.data.pin,
                                    taxpayer_name: data.data.taxpayerName
                                }
                            }]);

                        console.log('[DB] Recorded successful ID search in database');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record successful search:', dbError);
                    }
                }
            } else {
                console.log('No matching records found or invalid response format');
                setIdSearchStatus('not-found');
                setIdSearchError('No matching records found. Please verify your details.');

                // Record failed search in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'ID search failed',
                                metadata: {
                                    id_number: idNumber,
                                    first_name: firstName,
                                    reason: 'No matching records'
                                }
                            }]);

                        console.log('[DB] Recorded failed ID search in database');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record failed search:', dbError);
                    }
                }
            }
        } catch (error) {
            console.error('Error during ID search:', error);
            setIdSearchStatus('not-found');
            setIdSearchError(error.message || 'An error occurred while searching. Please try again.');

            // Record error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'ID search error',
                            metadata: {
                                id_number: idNumber,
                                first_name: firstName,
                                error: error.message
                            }
                        }]);

                    console.log('[DB] Recorded ID search error in database');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record search error:', dbError);
                }
            }
        }
    };

    const handleProceedWithPin = async () => {
        if (taxpayerData) {
            console.log('[PROCEED] Proceeding with PIN from taxpayer data:', taxpayerData.pin);

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
                businessDetails: {
                    name: taxpayerData.businessInfo?.name || taxpayerData.taxpayerName,
                    registrationNumber: taxpayerData.businessInfo?.registrationNumber || '',
                    registrationDate: taxpayerData.businessInfo?.registrationDate || '',
                    commencedDate: taxpayerData.businessInfo?.commencementDate || ''
                },
                postalAddress: taxpayerData.postalAddress || {
                    postalCode: '',
                    town: '',
                    poBox: ''
                },
                physicalAddress: {
                    descriptive: taxpayerData.descriptiveAddress || ''
                }
            };

            console.log('[PROCEED] Constructed manufacturer details:', manufacturerDetails);

            // Record authenticated user in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    console.log('[DB] Updating session with user data');

                    // Generate UUID for user
                    const userId = crypto.randomUUID();

                    // First check if user already exists
                    const { data: existingUser, error: userCheckError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('email', taxpayerData.mainEmailId)
                        .single();

                    // If user exists, update instead of insert
                    if (existingUser) {
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .update({
                                pin: taxpayerData.pin,
                                name: taxpayerData.taxpayerName,
                                phone: taxpayerData.mobileNumber,
                                id_number: idNumber,
                                first_name: firstName,
                                updated_at: new Date().toISOString()
                            })
                            .eq('email', taxpayerData.mainEmailId)
                            .select()
                            .single();

                        if (userError) {
                            console.error('[DB ERROR] Failed to update user data:', userError);
                        } else {
                            console.log('[DB] User data updated:', userData);
                        }
                    } else {
                        // Create new user with a generated ID
                        const userId = crypto.randomUUID();
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .insert({
                                id: userId,
                                pin: taxpayerData.pin,
                                name: taxpayerData.taxpayerName,
                                email: taxpayerData.mainEmailId,
                                phone: taxpayerData.mobileNumber,
                                id_number: idNumber,
                                first_name: firstName
                            })
                            .select()
                            .single();

                        if (userError) {
                            console.error('[DB ERROR] Failed to update user data:', userError);
                        } else {
                            console.log('[DB] User data updated:', userData);
                        }
                    }

                    // Then update session with user data
                    const { data: sessionData, error: sessionError } = await supabase
                        .from('sessions')
                        .update({
                            pin: taxpayerData.pin,
                            email: taxpayerData.mainEmailId,
                            name: taxpayerData.taxpayerName,
                            current_step: 1,
                            form_data: {
                                pin: taxpayerData.pin,
                                email: taxpayerData.mainEmailId,
                                manufacturerName: taxpayerData.taxpayerName,
                                mobileNumber: taxpayerData.mobileNumber,
                                password: taxpayerData.password || '1234',
                                mpesaNumber: taxpayerData.mobileNumber,
                                authentication_method: 'id_search',
                                id_number: idNumber,
                                first_name: firstName
                            }
                        })
                        .eq('id', currentSessionId)
                        .select();

                    if (sessionError) {
                        console.error('[DB ERROR] Failed to update session data:', sessionError);
                    } else {
                        console.log('[DB] Session data updated:', sessionData);
                    }

                    // Record authentication in activity log
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'pin_validated',
                            description: 'User authenticated via ID search',
                            metadata: {
                                id_number: idNumber,
                                first_name: firstName,
                                pin: taxpayerData.pin,
                                taxpayer_name: taxpayerData.taxpayerName,
                                authentication_method: 'id_search'
                            }
                        }]);

                    console.log('[DB] Recorded authentication in activity log');

                } catch (dbError) {
                    console.error('[DB ERROR] Database error during authentication:', dbError);
                }
            }

            // Pass the manufacturer details to parent
            onManufacturerDetailsFound?.(manufacturerDetails);

            // Then switch to PIN tab after a short delay to allow state updates
            setTimeout(() => {
                handleTabChange('pin');
            }, 100);

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
                            previous_tab: activeTab,
                            new_tab: tab
                        }
                    }])
                    .then(() => console.log('[DB] Recorded tab change in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record tab change:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing tab change record:', dbError);
            }
        }
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

                        console.log('[DB] Recorded PIN validation attempt in database');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record PIN validation attempt:', dbError);
                    }
                }

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
                                        taxpayer_name: data.data.name,
                                        authentication_method: 'pin'
                                    }
                                }]);

                            console.log('[DB] Recorded successful PIN validation in database');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record successful PIN validation:', dbError);
                        }
                    }
                } else {
                    // Set status to invalid through parent
                    onPINChange({
                        ...e,
                        target: { ...e.target, value: newPin },
                        validationStatus: "invalid"
                    });

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

                            console.log('[DB] Recorded failed PIN validation in database');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record failed PIN validation:', dbError);
                        }
                    }
                }
            } catch (error) {
                // Set status to invalid through parent
                onPINChange({
                    ...e,
                    target: { ...e.target, value: newPin },
                    validationStatus: "invalid"
                });

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

                        console.log('[DB] Recorded PIN validation error in database');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record PIN validation error:', dbError);
                    }
                }
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

                            <div className="space-y-2 mt-2">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Name:</span>
                                    <span className="font-medium">{taxpayerData.taxpayerName}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Email:</span>
                                    <span>{taxpayerData.mainEmailId}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Mobile:</span>
                                    <span>{taxpayerData.mobileNumber}</span>
                                </div>
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
                                <p className="text-red-700">{idSearchError || "No matching records found. Please verify your details."}</p>
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
                                autoComplete="off"
                                autoCapitalize="on"
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

    // Record step view in database
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId && manufacturerDetails) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Viewed manufacturer details',
                        metadata: {
                            pin: manufacturerDetails.pin,
                            name: manufacturerDetails.name,
                            step: 2
                        }
                    }])
                    .then(() => console.log('[DB] Recorded step 2 view in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record step 2 view:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing step 2 record:', dbError);
            }
        }
    }, [manufacturerDetails]);

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

    const handleConfirm = () => {
        // Record step completion in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_steps')
                    .insert([{
                        session_id: currentSessionId,
                        step_name: 'details_confirmation',
                        step_data: manufacturerDetails,
                        is_completed: true,
                        completed_at: new Date().toISOString()
                    }])
                    .then(() => console.log('[DB] Recorded step 2 completion in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record step 2 completion:', error));

                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Confirmed manufacturer details',
                        metadata: {
                            pin: manufacturerDetails.pin,
                            name: manufacturerDetails.name,
                            step: 2
                        }
                    }])
                    .then(() => console.log('[DB] Recorded confirmation activity in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record confirmation activity:', error));

                // Update session step
                supabase
                    .from('sessions')
                    .update({
                        current_step: 3,
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Updated session to step 3'))
                    .catch(error => console.error('[DB ERROR] Failed to update session step:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing step 2 completion records:', dbError);
            }
        }

        onNext();
    };

    // Changed from form to div
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
                    {/* Content remains the same... */}
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
                            {!isIndividual && manufacturerDetails.postalAddress && (
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Postal Address</span>
                                    <p className="text-sm text-black font-medium">
                                        P.O. Box {manufacturerDetails.postalAddress.poBox || ''}-
                                        {manufacturerDetails.postalAddress.postalCode || ''},
                                        {manufacturerDetails.postalAddress.town || ''}
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

            {/* Add a button for form submission outside the main content area */}
            <div className="flex justify-end mt-4">
                <Button
                    type="button"
                    onClick={handleConfirm}
                    className="bg-gradient-to-r from-purple-500 to-purple-700"
                >
                    Confirm & Continue
                </Button>
            </div>
        </div>
    )
}

export function Step3Payment({
    mpesaNumber,
    paymentStatus,
    onMpesaNumberChange,
    onSimulatePayment,
    pin,
    manufacturerDetails
}: Step3Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [merchantRequestId, setMerchantRequestId] = useState<string | null>(null)
    const [transactionCode, setTransactionCode] = useState<string | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)

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
                        description: 'Viewed payment page',
                        metadata: {
                            step: 3,
                            pin_number: pin,
                            mpesaNumber: mpesaNumber
                        }
                    }])
                    .then(() => console.log('[DB] Recorded step 3 view in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record step 3 view:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing step 3 record:', dbError);
            }
        }
    }, [mpesaNumber, pin]);

    const resetPaymentState = () => {
        setError(null);
        setTransactionCode(null);
        setShowPrompt(false);
        onSimulatePayment('NotStarted');
    };

    const initiatePayment = async () => {
        setLoading(true)
        setError(null)
        setTransactionCode(null)
        setShowPrompt(false)

        try {
            // Record payment initiation in database
            const currentSessionId = sessionService.getData('currentSessionId');
            // Retrieve taxpayer data from session
            const taxpayerData = sessionService.getData('taxpayerData') || {};
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'payment_initiated',
                            description: 'Payment initiated',
                            metadata: {
                                mpesaNumber: mpesaNumber,
                                amount: 50, // Fixed amount for filing
                                step: 3,
                                taxpayerData: taxpayerData
                            }
                        }]);

                    console.log('[DB] Recorded payment initiation in database');

                    // Create a transaction record
                    const { data: transactionData, error: transactionError } = await supabase
                        .from('transactions')
                        .insert([{
                            session_id: currentSessionId,
                            email: manufacturerDetails?.contactDetails?.email || taxpayerData?.mainEmailId || 'unknown@example.com',
                            name: manufacturerDetails?.name || taxpayerData?.taxpayerName || 'Unknown User',
                            transaction_type: 'filing_fee',
                            amount: 50,
                            status: 'pending', // Changed from 'processing' to valid enum value
                            reference_number: `FIL-${Date.now()}`,
                            description: 'Tax return filing fee',
                            phone_number: mpesaNumber && mpesaNumber.trim() !== '' ? mpesaNumber : '254000000000', // Ensure phone_number is never null
                            metadata: {
                                mpesaNumber: mpesaNumber,
                                payment_method: 'mpesa',
                                pin_number: pin // Add pin_number for consistency
                            }
                        }])
                        .select();

                    if (transactionError) {
                        console.error('[DB ERROR] Failed to create transaction record:', transactionError);
                    } else {
                        console.log('[DB] Created transaction record:', transactionData);
                    }

                    // Update session with payment initiation
                    const { error: sessionError } = await supabase
                        .from('sessions')
                        .update({
                            email: manufacturerDetails?.contactDetails?.email || null,
                            name: manufacturerDetails?.name || null,
                            form_data: {
                                mpesaNumber: mpesaNumber,
                                paymentStatus: 'initiated',
                                payment_initiated_at: new Date().toISOString()
                            },
                            last_activity: new Date().toISOString()
                        })
                        .eq('id', currentSessionId);

                    if (sessionError) {
                        console.error('[DB ERROR] Failed to update session with payment initiation:', sessionError);
                    } else {
                        console.log('[DB] Updated session with payment initiation');
                    }
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording payment initiation:', dbError);
                }
            }

            // For the sake of simplification, we'll simulate a successful payment immediately
            // instead of calling the payment API and waiting for response

            setShowPrompt(true);
            onSimulatePayment('Processing'); // Update UI to "Processing"

            // Simulate successful payment after 2 seconds
            setTimeout(async () => {
                // Generate a random transaction code
                const simulatedTransactionCode = `STK${Math.random().toString().slice(2, 10)}`;

                setTransactionCode(simulatedTransactionCode);
                setShowPrompt(false);
                onSimulatePayment('Paid');

                // Record payment completion
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'payment_complete',
                                description: 'Payment completed successfully',
                                metadata: {
                                    transaction_code: simulatedTransactionCode,
                                    pin_number: pin // Add pin_number
                                }
                            }]);

                        console.log('[DB] Recorded payment completion');

                        // Update transaction to completed
                        await supabase
                            .from('transactions')
                            .update({
                                status: 'completed', // Changed from 'completed' to valid enum value
                                transaction_code: simulatedTransactionCode,
                                updated_at: new Date().toISOString(),
                                metadata: {
                                    transaction_code: simulatedTransactionCode,
                                    pin_number: pin // Add pin_number
                                }
                            })
                            .eq('session_id', currentSessionId)
                            .eq('transaction_type', 'filing_fee');

                        console.log('[DB] Updated transaction to completed status');

                        // Update session with completed payment
                        await supabase
                            .from('sessions')
                            .update({
                                form_data: {
                                    mpesaNumber: mpesaNumber,
                                    paymentStatus: 'Paid',
                                    transaction_code: simulatedTransactionCode,
                                    payment_completed_at: new Date().toISOString()
                                },
                                current_step: 3 // Keep at step 3 until user proceeds
                            })
                            .eq('id', currentSessionId);

                        console.log('[DB] Updated session with completed payment');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording payment completion:', dbError);
                    }
                }
            }, 2000);

        } catch (error) {
            setError('Failed to connect to payment service');
            resetPaymentState();

            // Record payment error
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'session_error',
                            description: 'Payment service connection failed',
                            metadata: {
                                mpesaNumber: mpesaNumber,
                                error: error.message,
                                pin_number: pin // Add pin_number
                            }
                        }]);

                    console.log('[DB] Recorded payment service error');

                    // Update transaction to failed
                    await supabase
                        .from('transactions')
                        .update({
                            status: 'failed',
                            metadata: {
                                error: error.message,
                                pin_number: pin // Add pin_number
                            }
                        })
                        .eq('session_id', currentSessionId)
                        .eq('transaction_type', 'filing_fee');

                    console.log('[DB] Updated transaction to failed status');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record payment error:', dbError);
                }
            }
        } finally {
            setLoading(false)
        }
    }

    const checkPaymentStatus = async (merchantRequestId: string): Promise<PaymentStatus | null> => {
        try {
            const response = await fetch(`/api/transactions?merchantRequestId=${merchantRequestId}`);

            if (!response.ok && response.status !== 202) {
                if (response.status === 408) {
                    return { status: 'timeout', result_description: 'Payment request timed out' };
                }
                throw new Error('Status check failed');
            }

            const data = await response.json();

            // Validate transaction code
            if (data.data.status === 'completed' && (!data.data.transaction_code || data.data.transaction_code.length === 0)) {
                console.error('Received completed status but no transaction code');
                return {
                    status: 'pending',
                    result_description: 'Waiting for transaction confirmation'
                };
            }

            return data.data;
        } catch (error) {
            console.error('Error checking status:', error);
            return null;
        }
    }

    const startPolling = (merchantRequestId: string) => {
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds maximum

        const pollInterval = setInterval(async () => {
            attempts++;

            const status = await checkPaymentStatus(merchantRequestId);

            if (status) {
                const currentSessionId = sessionService.getData('currentSessionId');

                if (status.result_code === '1') {
                    clearInterval(pollInterval);
                    setError('Payment failed: ' + (status.result_description || 'Transaction unsuccessful'));
                    resetPaymentState();

                    // Record payment failure
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'session_error',
                                    description: 'Payment failed',
                                    metadata: {
                                        merchantRequestId,
                                        result_code: status.result_code,
                                        result_description: status.result_description,
                                        pin_number: pin // Add pin_number
                                    }
                                }]);

                            console.log('[DB] Recorded payment failure');

                            // Update transaction to failed
                            await supabase
                                .from('transactions')
                                .update({
                                    status: 'failed',
                                    metadata: {
                                        result_code: status.result_code,
                                        result_description: status.result_description,
                                        pin_number: pin // Add pin_number
                                    }
                                })
                                .eq('session_id', currentSessionId)
                                .eq('transaction_type', 'filing_fee');

                            console.log('[DB] Updated transaction to failed status');
                        } catch (dbError) {
                            console.error('[DB ERROR] Failed to record payment failure:', dbError);
                        }
                    }
                    return;
                }

                switch (status.status) {
                    case 'completed':
                        if (status.transaction_code && status.transaction_code.length > 0) {
                            clearInterval(pollInterval);
                            setTransactionCode(status.transaction_code);
                            setShowPrompt(false);
                            onSimulatePayment('Paid');

                            // Record payment completion
                            if (currentSessionId) {
                                try {
                                    await supabase
                                        .from('session_activities')
                                        .insert([{
                                            session_id: currentSessionId,
                                            activity_type: 'payment_complete',
                                            description: 'Payment completed successfully',
                                            metadata: {
                                                merchantRequestId,
                                                transaction_code: status.transaction_code,
                                                pin_number: pin // Add pin_number
                                            }
                                        }]);

                                    console.log('[DB] Recorded payment completion');

                                    // Update transaction to completed
                                    await supabase
                                        .from('transactions')
                                        .update({
                                            status: 'completed', // Changed to valid enum value
                                            updated_at: new Date().toISOString(),
                                            metadata: {
                                                transaction_code: status.transaction_code,
                                                pin_number: pin // Add pin_number
                                            }
                                        })
                                        .eq('session_id', currentSessionId)
                                        .eq('transaction_type', 'filing_fee');

                                    console.log('[DB] Updated transaction to completed status');

                                    // Update session with completed payment
                                    await supabase
                                        .from('sessions')
                                        .update({
                                            form_data: {
                                                mpesaNumber: mpesaNumber,
                                                paymentStatus: 'Paid',
                                                transaction_code: status.transaction_code,
                                                payment_completed_at: new Date().toISOString()
                                            },
                                            current_step: 3 // Keep at step 3 until user proceeds
                                        })
                                        .eq('id', currentSessionId);

                                    console.log('[DB] Updated session with completed payment');
                                } catch (dbError) {
                                    console.error('[DB ERROR] Error recording payment completion:', dbError);
                                }
                            }
                        } else {
                            console.log('Waiting for transaction code...');
                        }
                        break;

                    case 'insufficient_balance':
                        clearInterval(pollInterval);
                        setError('Insufficient balance in your M-Pesa account');
                        resetPaymentState();

                        // Record payment failure
                        if (currentSessionId) {
                            try {
                                await supabase
                                    .from('session_activities')
                                    .insert([{
                                        session_id: currentSessionId,
                                        activity_type: 'session_error',
                                        description: 'Payment failed: Insufficient balance',
                                        metadata: {
                                            merchantRequestId,
                                            reason: 'insufficient_balance',
                                            pin_number: pin // Add pin_number
                                        }
                                    }]);

                                console.log('[DB] Recorded insufficient balance error');

                                // Update transaction to failed
                                await supabase
                                    .from('transactions')
                                    .update({
                                        status: 'failed',
                                        updated_at: new Date().toISOString(),
                                        metadata: {
                                            reason: 'insufficient_balance',
                                            pin_number: pin // Add pin_number
                                        }
                                    })
                                    .eq('session_id', currentSessionId)
                                    .eq('transaction_type', 'filing_fee');

                                console.log('[DB] Updated transaction to failed status');
                            } catch (dbError) {
                                console.error('[DB ERROR] Failed to record insufficient balance:', dbError);
                            }
                        }
                        break;

                    case 'cancelled_by_user':
                        clearInterval(pollInterval);
                        setError('Payment was cancelled');
                        resetPaymentState();

                        // Record payment cancellation
                        if (currentSessionId) {
                            try {
                                await supabase
                                    .from('session_activities')
                                    .insert([{
                                        session_id: currentSessionId,
                                        activity_type: 'session_error',
                                        description: 'Payment cancelled by user',
                                        metadata: {
                                            merchantRequestId,
                                            reason: 'cancelled_by_user',
                                            pin_number: pin // Add pin_number
                                        }
                                    }]);

                                console.log('[DB] Recorded payment cancellation');

                                // Update transaction to cancelled
                                await supabase
                                    .from('transactions')
                                    .update({
                                        status: 'cancelled_by_user',
                                        updated_at: new Date().toISOString(),
                                        metadata: {
                                            reason: 'cancelled_by_user',
                                            pin_number: pin // Add pin_number
                                        }
                                    })
                                    .eq('session_id', currentSessionId)
                                    .eq('transaction_type', 'filing_fee');

                                console.log('[DB] Updated transaction to cancelled status');
                            } catch (dbError) {
                                console.error('[DB ERROR] Failed to record payment cancellation:', dbError);
                            }
                        }
                        break;

                    case 'timeout':
                        clearInterval(pollInterval);
                        setError('Payment request timed out. Please try again');
                        resetPaymentState();

                        // Record payment timeout
                        if (currentSessionId) {
                            try {
                                await supabase
                                    .from('session_activities')
                                    .insert([{
                                        session_id: currentSessionId,
                                        activity_type: 'session_error',
                                        description: 'Payment request timed out',
                                        metadata: {
                                            merchantRequestId,
                                            reason: 'timeout',
                                            pin_number: pin // Add pin_number
                                        }
                                    }]);

                                console.log('[DB] Recorded payment timeout');

                                // Update transaction to failed
                                await supabase
                                    .from('transactions')
                                    .update({
                                        status: 'timeout',
                                        updated_at: new Date().toISOString(),
                                        metadata: {
                                            reason: 'timeout',
                                            pin_number: pin // Add pin_number
                                        }
                                    })
                                    .eq('session_id', currentSessionId)
                                    .eq('transaction_type', 'filing_fee');

                                console.log('[DB] Updated transaction to failed status');
                            } catch (dbError) {
                                console.error('[DB ERROR] Failed to record payment timeout:', dbError);
                            }
                        }
                        break;

                    case 'failed':
                        clearInterval(pollInterval);
                        setError(status.result_description || 'Payment failed');
                        resetPaymentState();

                        // Record payment failure
                        if (currentSessionId) {
                            try {
                                await supabase
                                    .from('session_activities')
                                    .insert([{
                                        session_id: currentSessionId,
                                        activity_type: 'session_error',
                                        description: 'Payment failed',
                                        metadata: {
                                            merchantRequestId,
                                            result_code: status.result_code,
                                            result_description: status.result_description,
                                            pin_number: pin // Add pin_number
                                        }
                                    }]);

                                console.log('[DB] Recorded payment failure');

                                // Update transaction to failed
                                await supabase
                                    .from('transactions')
                                    .update({
                                        status: 'failed',
                                        updated_at: new Date().toISOString(),
                                        metadata: {
                                            result_code: status.result_code,
                                            result_description: status.result_description,
                                            pin_number: pin // Add pin_number
                                        }
                                    })
                                    .eq('session_id', currentSessionId)
                                    .eq('transaction_type', 'filing_fee');

                                console.log('[DB] Updated transaction to failed status');
                            } catch (dbError) {
                                console.error('[DB ERROR] Failed to record payment failure:', dbError);
                            }
                        }
                        break;

                    case 'pending':
                        if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            setError('Payment timeout. Please check your M-Pesa messages.');
                            resetPaymentState();

                            // Record payment timeout
                            if (currentSessionId) {
                                try {
                                    await supabase
                                        .from('session_activities')
                                        .insert([{
                                            session_id: currentSessionId,
                                            activity_type: 'session_error',
                                            description: 'Payment polling timeout',
                                            metadata: {
                                                merchantRequestId,
                                                attempts: maxAttempts,
                                                reason: 'polling_timeout',
                                                pin_number: pin // Add pin_number
                                            }
                                        }]);

                                    console.log('[DB] Recorded payment polling timeout');

                                    // Update transaction to pending
                                    await supabase
                                        .from('transactions')
                                        .update({
                                            status: 'pending',
                                            updated_at: new Date().toISOString(),
                                            metadata: {
                                                reason: 'polling_timeout',
                                                attempts: maxAttempts,
                                                pin_number: pin // Add pin_number
                                            }
                                        })
                                        .eq('session_id', currentSessionId)
                                        .eq('transaction_type', 'filing_fee');

                                    console.log('[DB] Updated transaction to pending status');
                                } catch (dbError) {
                                    console.error('[DB ERROR] Failed to record payment polling timeout:', dbError);
                                }
                            }
                        }
                        // Continue polling if still pending and within attempts limit
                        break;
                }
            } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setError('Could not determine payment status. Please check your M-Pesa messages.');
                resetPaymentState();

                // Record payment status check failure
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'session_error',
                                description: 'Payment status check failed',
                                metadata: {
                                    merchantRequestId,
                                    attempts: maxAttempts,
                                    reason: 'status_check_failure',
                                    pin_number: pin // Add pin_number
                                }
                            }]);

                        console.log('[DB] Recorded payment status check failure');

                        // Update transaction to unknown
                        await supabase
                            .from('transactions')
                            .update({
                                status: 'failed',
                                updated_at: new Date().toISOString(),
                                metadata: {
                                    reason: 'status_check_failure',
                                    attempts: maxAttempts,
                                    pin_number: pin // Add pin_number
                                }
                            })
                            .eq('session_id', currentSessionId)
                            .eq('transaction_type', 'filing_fee');

                        console.log('[DB] Updated transaction to unknown status');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record payment status check failure:', dbError);
                    }
                }
            }
        }, 2000);
    }

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('[STEP3] Form submitted');
        if (transactionCode) {
            // Only proceed if payment is completed
            console.log('[STEP3] Payment completed, proceeding to next step');

            // Record step completion in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    supabase
                        .from('session_steps')
                        .insert([{
                            session_id: currentSessionId,
                            step_name: 'payment',
                            step_data: {
                                mpesaNumber: mpesaNumber,
                                transaction_code: transactionCode,
                                payment_status: 'Paid'
                            },
                            is_completed: true,
                            updated_at: new Date().toISOString() // Changed from completed_at
                        }])
                        .then(() => console.log('[DB] Recorded step 3 completion in database'))
                        .catch(error => console.error('[DB ERROR] Failed to record step 3 completion:', error));

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
                    console.error('[DB ERROR] Error preparing step 3 completion records:', dbError);
                }
            }
        } else {
            console.log('[STEP3] Payment not completed, initiating payment');
            initiatePayment();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="mpesa-number">M-Pesa Number</Label>
                <div className="mt-2">
                    <Input
                        id="mpesa-number"
                        type="tel"
                        placeholder="254XXXXXXXXX"
                        value={mpesaNumber}
                        onChange={(e) => onMpesaNumberChange(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                    <ExclamationTriangleIcon className="inline-block w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            {transactionCode && (
                <div className="text-green-600 text-sm mt-2 p-3 bg-green-50 rounded-md border border-green-200">
                    <CheckCircleIcon className="inline-block w-4 h-4 mr-2" />
                    Payment successful! Transaction code: {transactionCode}
                </div>
            )}

            <div className="flex justify-end">
                <Button
                    type="button"
                    onClick={initiatePayment}
                    disabled={!mpesaNumber || loading || showPrompt || transactionCode !== null}
                    className={cn(
                        "w-auto max-w-sm transition-all duration-200",
                        loading || showPrompt
                            ? "bg-yellow-500 cursor-not-allowed"
                            : transactionCode
                                ? "bg-green-500 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Initiating Payment...
                        </>
                    ) : showPrompt ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Payment...
                        </>
                    ) : transactionCode ? (
                        <>
                            <Check className="mr-2 h-4 w-4" />
                            Payment Completed
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay KES 50
                        </>
                    )}
                </Button>
            </div>

            {showPrompt && !error && !transactionCode && (
                <div className="text-center text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    <PhoneIcon className="inline-block w-4 h-4 mr-2" />
                    Please check your phone for the M-Pesa prompt
                </div>
            )}
        </div>
    )
}

export function Step4Filing({
    pin,
    password,
    error,
    filingStatus,
    sessionStartTime,
    formData, // Add formData parameter
    onPasswordChange,
    onDownloadReceipt,
    onEndSession
}: Step4Props) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
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
                            activity_type: 'form_submit', // Changed from 'return_submitted' to valid enum value
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
                            // Do not use pin directly as pin_id, it's a UUID reference
                            // First get or create the PIN record and use its ID
                            return_type: 'individual',
                            is_nil_return: true,
                            status: 'pending', // Changed to valid enum value 'pending'
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
                                                status: 'completed', // Changed to valid enum value
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
                                            status: 'completed', // Changed to valid enum value
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
                                    activity_type: 'form_submit', // Changed from 'return_progress' to valid enum value
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
                        setIsCompleted(true)

                        // Record filing completion in database
                        if (currentSessionId) {
                            try {
                                supabase
                                    .from('session_activities')
                                    .insert([{
                                        session_id: currentSessionId,
                                        activity_type: 'form_submit', // Changed from 'return_completed' to valid enum value
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
                                        updated_at: new Date().toISOString(), // Changed from completed_at
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
    }, [filingStatus.loggedIn, pin, sessionStartTime])

    const steps = [
        { label: 'Logging In', icon: <LogIn className="w-4 h-4" /> },
        { label: 'Filing Returns', icon: <FileText className="w-4 h-4" /> },
        { label: 'Extracting Receipt', icon: <FileDown className="w-4 h-4" /> },
        { label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> }
    ]

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
                        status: 'completed', // Changed from 'completed' to valid enum value
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

    return (
        <div className="space-y-4">
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
                                Your nil returns have been successfully filed. Receipt number: <strong>{receiptNumber || "NR" + Math.random().toString().slice(2, 10)}</strong>
                                <br />
                                An email has also been sent to you with both acknowledgement and purchase receipts.
                            </p>
                            <div className="flex space-x-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                    onClick={() => handleDownloadReceipt("acknowledgement")}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    Acknowledgement Receipt
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                    onClick={() => handleDownloadReceipt("purchase")}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    Purchase Receipt
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                    onClick={() => handleDownloadReceipt("all")}
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
                                                <p className="text-sm font-semibold text-green-800">Filing Completed Successfully</p>
                                                <p className="text-xs text-green-600">
                                                    Time taken: {sessionStartTime ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000) : 0} seconds
                                                </p>
                                            </div>
                                            <div className="flex justify-end pt-2 border-t border-green-100">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="bg-gradient-to-r from-purple-900 to-black hover:from-purple-800 hover:to-black text-white"
                                                    onClick={handleEndSession}
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