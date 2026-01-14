// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ArrowDown, Flag, Eye, EyeOff, Loader2, ArrowRight, User, Mail, Building2, MapPin, LogIn, FileText, FileDown, CheckCircle, PhoneIcon, CreditCard, AlertTriangle, X } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { FilingStatus, ManufacturerDetails, TaxpayerData, Step1Props, Step2Props, Step3Props, Step4Props, PaymentStatus, ValidationStatus } from "../lib/types"

const sessionService = new SessionManagementService()

export default function Step1PIN({
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
    onPasswordValidate,
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
        if (!idNumber || idNumber.length !== 8) return;

        setIdSearchStatus('searching');
        setIdSearchError(null);

        try {
            console.log('[ID SEARCH] Starting search for ID:', idNumber);

            // Record search attempt in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'ID number search attempted',
                            metadata: {
                                id_number: idNumber,
                                timestamp: new Date().toISOString()
                            }
                        }]);

                    console.log('[DB] Recorded ID search attempt in database');
                } catch (dbError) {
                    console.error('[DB ERROR] Failed to record search attempt:', dbError);
                }
            }

            // Use new KRA API endpoint
            const response = await fetch('/api/kra/fetch-by-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idNumber })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Failed to fetch details from KRA');
            }

            const data = await response.json();
            console.log('[ID SEARCH] API response:', data);

            if (data.success && data.manufacturerDetails) {
                const fullName = data.manufacturerDetails.basic?.fullName ||
                    data.manufacturerDetails.basic?.manufacturerName ||
                    'Unknown';

                // Format data for Step1PIN component
                const enrichedData = {
                    pin: data.pin,
                    taxpayerName: fullName,
                    mainEmailId: data.manufacturerDetails.contact?.mainEmail || '',
                    mobileNumber: data.manufacturerDetails.contact?.mobileNumber || '',
                    secondaryEmail: data.manufacturerDetails.contact?.secondaryEmail || '',
                    descriptiveAddress: data.manufacturerDetails.address?.descriptive || '',
                    postalAddress: {
                        postalCode: data.manufacturerDetails.address?.postalCode || '',
                        town: data.manufacturerDetails.address?.town || '',
                        poBox: data.manufacturerDetails.address?.poBox || ''
                    },
                    businessInfo: {
                        name: data.manufacturerDetails.business?.businessName || fullName,
                        registrationNumber: data.manufacturerDetails.basic?.registrationNumber || '',
                        registrationDate: data.manufacturerDetails.business?.registrationDate || '',
                        commencementDate: data.manufacturerDetails.business?.commencementDate || ''
                    }
                };

                setTaxpayerData(enrichedData);
                setIdSearchStatus('found');

                // Record successful search in database
                const currentSessionId = sessionService.getData('currentSessionId');
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
                                    pin: data.pin,
                                    taxpayer_name: fullName
                                }
                            }]);

                        console.log('[DB] Recorded successful ID search in database');
                    } catch (dbError) {
                        console.error('[DB ERROR] Failed to record successful search:', dbError);
                    }
                }

                // Update the PIN in the parent component
                onPINChange({ target: { value: data.pin } } as React.ChangeEvent<HTMLInputElement>);

                // Switch to PIN tab after successful ID search
                handleTabChange('pin');

            } else {
                console.log('No matching records found or invalid response format');
                setIdSearchStatus('not-found');
                setIdSearchError('No matching records found. Please verify your details.');

                // Record failed search in database
                const currentSessionId = sessionService.getData('currentSessionId');
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

            // Update the password if it's not already set
            if (!password) {
                onPasswordChange({ target: { value: taxpayerData.password || '1234' } } as React.ChangeEvent<HTMLInputElement>);
            }

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
                                id_number: idNumber
                            })
                            .select()
                            .single();

                        if (userError) {
                            console.error('[DB ERROR] Failed to create user data:', userError);
                        } else {
                            console.log('[DB] User data created:', userData);
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
                                taxpayer_name: taxpayerData.taxpayerName,
                                email: taxpayerData.mainEmailId,
                                id_number: idNumber
                            }
                        })
                        .eq('id', currentSessionId);

                    if (sessionError) {
                        console.error('[DB ERROR] Failed to update session data:', sessionError);
                    } else {
                        console.log('[DB] Session data updated:', sessionData);
                    }

                    // Record step completion
                    const { data: stepData, error: stepError } = await supabase
                        .from('session_steps')
                        .insert([{
                            session_id: currentSessionId,
                            step_name: 'pin_verification',
                            step_data: {
                                pin: taxpayerData.pin,
                                taxpayer_name: taxpayerData.taxpayerName,
                                email: taxpayerData.mainEmailId,
                                id_number: idNumber,
                                first_name: firstName
                            },
                            is_completed: true
                        }]);

                    if (stepError) {
                        console.error('[DB ERROR] Failed to record step completion:', stepError);
                    } else {
                        console.log('[DB] Step completion recorded:', stepData);
                    }

                    // Record activity
                    const { data: activityData, error: activityError } = await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'form_submit',
                            description: 'Proceeded with PIN from ID search',
                            metadata: {
                                pin: taxpayerData.pin,
                                taxpayer_name: taxpayerData.taxpayerName,
                                id_number: idNumber,
                                first_name: firstName
                            }
                        }]);

                    if (activityError) {
                        console.error('[DB ERROR] Failed to record activity:', activityError);
                    } else {
                        console.log('[DB] Activity recorded:', activityData);
                    }
                } catch (dbError) {
                    console.error('[DB ERROR] Error updating database:', dbError);
                }
            }

            // Pass manufacturer details to parent
            onManufacturerDetailsFound(manufacturerDetails);
        }
    };

    const handleTabChange = (tab: 'id' | 'pin') => {
        setActiveTab(tab);

        // Call the parent component's handler
        onActiveTabChange(tab);

        // Record tab change in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: `Switched to ${tab === 'id' ? 'ID' : 'PIN'} tab`,
                        metadata: {
                            tab: tab
                        }
                    }])
                    .then(() => console.log(`[DB] Recorded tab change to ${tab}`))
                    .catch(error => console.error(`[DB ERROR] Failed to record tab change:`, error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording tab change:', dbError);
            }
        }
    };

    const handlePINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const enteredPin = e.target.value;

        // Pass the event to the parent component's handler
        onPINChange(e);

        // If PIN came from ID search (taxpayerData exists), skip validation - it's already valid
        if (taxpayerData && taxpayerData.pin === enteredPin) {
            console.log('[PIN] PIN from ID search - already validated, skipping check');
            return;
        }

        // For manually entered PINs, validate by fetching manufacturer details
        if (enteredPin.length >= 10) {
            try {
                console.log('[PIN] Validating manually entered PIN:', enteredPin);

                const response = await fetch('/api/kra/validate-pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: enteredPin })
                });

                const data = await response.json();

                if (data.success && data.manufacturerDetails) {
                    console.log('[PIN] Valid PIN - manufacturer details found');
                    // Store the fetched data
                    const fullName = data.manufacturerDetails.basic?.fullName ||
                        data.manufacturerDetails.basic?.manufacturerName ||
                        'Unknown';

                    setTaxpayerData({
                        pin: enteredPin,
                        taxpayerName: fullName,
                        mainEmailId: data.manufacturerDetails.contact?.mainEmail || '',
                        mobileNumber: data.manufacturerDetails.contact?.mobileNumber || '',
                        secondaryEmail: data.manufacturerDetails.contact?.secondaryEmail || '',
                        descriptiveAddress: data.manufacturerDetails.address?.descriptive || '',
                        postalAddress: {
                            postalCode: data.manufacturerDetails.address?.postalCode || '',
                            town: data.manufacturerDetails.address?.town || '',
                            poBox: data.manufacturerDetails.address?.poBox || ''
                        },
                        businessInfo: {
                            name: data.manufacturerDetails.business?.businessName || fullName,
                            registrationNumber: data.manufacturerDetails.basic?.registrationNumber || '',
                            registrationDate: data.manufacturerDetails.business?.registrationDate || '',
                            commencementDate: data.manufacturerDetails.business?.commencementDate || ''
                        }
                    });
                } else {
                    console.log('[PIN] Invalid PIN - no manufacturer details found');
                    setTaxpayerData(null);
                }
            } catch (error) {
                console.error('[PIN] Error validating PIN:', error);
                setTaxpayerData(null);
            }
        }
    };

    // Effect to automatically switch to PIN tab if PIN is already set
    useEffect(() => {
        if (pin && pin.length > 0 && activeTab === 'id') {
            handleTabChange('pin');
        }
    }, [pin]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">
                    Verify Your KRA PIN
                </h3>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex border-b mb-4">
                    <button
                        type="button"
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1",
                            activeTab === 'id'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                        )}
                        onClick={() => handleTabChange('id')}
                    >
                        <User className="h-4 w-4" />
                        Search by ID
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1",
                            activeTab === 'pin'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                        )}
                        onClick={() => handleTabChange('pin')}
                    >
                        <Building2 className="h-4 w-4" />
                        Enter KRA PIN
                    </button>
                </div>

                {activeTab === 'id' && (
                    <div className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="id-number">National ID Number</Label>
                                <Input
                                    id="id-number"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter your 8-digit ID number"
                                    maxLength={8}
                                    required
                                    className="text-lg h-12"
                                />
                                <p className="text-sm text-muted-foreground">
                                    We'll automatically fetch your name and PIN from KRA
                                </p>
                            </div>
                        </div>

                        {idSearchError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                                <span>{idSearchError}</span>
                            </div>
                        )}

                        <Button
                            type="button"
                            onClick={handleIdSearch}
                            disabled={idNumber.length !== 8 || idSearchStatus === 'searching'}
                            className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
                        >
                            {idSearchStatus === 'searching' ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Fetching your details...
                                </>
                            ) : (
                                "Search for KRA PIN"
                            )}
                        </Button>

                        {idSearchStatus === 'found' && taxpayerData && (
                            <div className="mt-4 p-4 border rounded-lg bg-green-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <h4 className="font-semibold">KRA PIN Found</h4>
                                </div>

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">KRA PIN</TableCell>
                                            <TableCell>{taxpayerData.pin}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">Taxpayer Name</TableCell>
                                            <TableCell>{taxpayerData.taxpayerName}</TableCell>
                                        </TableRow>
                                        {taxpayerData.mainEmailId && (
                                            <TableRow>
                                                <TableCell className="font-medium">Email</TableCell>
                                                <TableCell>{taxpayerData.mainEmailId}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                <Button
                                    type="button"
                                    onClick={handleProceedWithPin}
                                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white"
                                >
                                    Continue to Password Entry
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pin' && (
                    <div className="space-y-4">
                        {/* User Info Badge - shown when coming from ID search */}
                        {taxpayerData && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-900">Account Found:</span>
                                <span className="text-sm font-semibold text-green-900">{taxpayerData.taxpayerName}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="pin">KRA PIN</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="pin"
                                        value={pin}
                                        onChange={handlePINChange}
                                        placeholder="Enter your KRA PIN"
                                        className={cn(
                                            pinValidationStatus === "invalid" && "border-red-500",
                                            pinValidationStatus === "valid" && "border-green-500"
                                        )}
                                        required
                                    />
                                    {pinValidationStatus === "checking" && (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    {pinValidationStatus === "invalid" && (
                                        <X className="h-5 w-5 text-red-500" />
                                    )}
                                    {pinValidationStatus === "valid" && (
                                        <Check className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {pinValidationStatus === "checking" && (
                                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 animate-pulse">
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                                            Checking PIN...
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
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">KRA Password</Label>
                                    <div className="flex items-center gap-2 text-xs">
                                        {passwordValidationStatus === "checking" && (
                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 animate-pulse">
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                                                Checking Password...
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
                                </div>
                                <InputGroup className={cn(
                                    passwordValidationStatus === "invalid" && "border-red-500",
                                    passwordValidationStatus === "valid" && "border-green-500"
                                )}>
                                    <InputGroupInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={onPasswordChange}
                                        placeholder="Enter your KRA password"
                                        required
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupButton
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </InputGroupButton>
                                        {passwordValidationStatus !== "valid" && password.length > 0 && (
                                            <InputGroupButton
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                disabled={passwordValidationStatus === "checking" || !pin}
                                                onClick={async () => {
                                                    if (onPasswordValidate) {
                                                        await onPasswordValidate()
                                                    }
                                                }}
                                                className="ml-1 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                                            >
                                                {passwordValidationStatus === "checking" ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        Validating
                                                    </>
                                                ) : (
                                                    "Validate"
                                                )}
                                            </InputGroupButton>
                                        )}
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
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
                            <div className="grid grid-cols-3 gap-2 mt-4">
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
        </div>
    )
}
