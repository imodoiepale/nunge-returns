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
                
                // Update the PIN in the parent component
                onPINChange({ target: { value: data.data.pin } } as React.ChangeEvent<HTMLInputElement>);
                
                // Switch to PIN tab after successful ID search
                handleTabChange('pin');
                
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
                                taxpayer_name: taxpayerData.taxpayerName,
                                email: taxpayerData.mainEmailId,
                                id_number: idNumber,
                                first_name: firstName
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

    const handlePINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Pass the event to the parent component's handler
        onPINChange(e);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="id-number">ID Number</Label>
                                <Input
                                    id="id-number"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    placeholder="Enter your ID number"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="first-name">First Name</Label>
                                <Input
                                    id="first-name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter your first name"
                                    required
                                />
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
                            disabled={!idNumber || !firstName || idSearchStatus === 'searching'}
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
                        >
                            {idSearchStatus === 'searching' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
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
