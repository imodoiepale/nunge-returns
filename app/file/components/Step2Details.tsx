// @ts-nocheck
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Building2, MapPin, ArrowRight, ArrowLeft, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { Step2Props } from "../lib/types"
import { Checkbox } from "@/components/ui/checkbox"

const sessionService = new SessionManagementService()

export function Step2Details({ loading, manufacturerDetails, residentType, setResidentType, selectedObligations, setSelectedObligations, onBack, onNext }: Step2Props) {
    // Record step view in database and check for existing data
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId && manufacturerDetails) {
            try {
                // Record the view in the database
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

                // Check if we have previously saved step data
                supabase
                    .from('session_steps')
                    .select('*')
                    .eq('session_id', currentSessionId)
                    .eq('step_name', 'details_confirmation')
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('[DB ERROR] Failed to fetch saved step data:', error);
                            return;
                        }

                        if (data && data.length > 0) {
                            console.log('[DB] Found previously saved step data:', data[0]);
                            // We don't need to do anything here as the parent component already has the manufacturerDetails
                            // This is just for logging purposes
                        }
                    });
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

    if (!manufacturerDetails) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">No manufacturer details available. Please go back and verify your PIN.</p>
                <Button onClick={onBack} className="mt-4">
                    Go Back
                </Button>
            </div>
        )
    }

    const isIndividual = manufacturerDetails.pin.startsWith('A')
    const isCompany = manufacturerDetails.pin.startsWith('P')

    const handleConfirm = () => {
        // Record step completion in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                // Save the manufacturer details to session_steps for persistence
                supabase
                    .from('session_steps')
                    .upsert([{  // Using upsert instead of insert to update if exists
                        session_id: currentSessionId,
                        step_name: 'details_confirmation',
                        step_data: manufacturerDetails,
                        is_completed: true,
                        completed_at: new Date().toISOString()
                    }], {
                        onConflict: 'session_id,step_name'
                    })
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
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">Mobile</span>
                                <p className="text-sm text-black font-medium">
                                    {manufacturerDetails.contactDetails?.mobile || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">Email</span>
                                <p className="text-sm text-black font-medium">
                                    {manufacturerDetails.contactDetails?.email || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    {!isIndividual && manufacturerDetails.businessDetails && (
                        <div>
                            <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                Business Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Business Name</span>
                                    <p className="text-sm text-black font-medium">
                                        {manufacturerDetails.businessDetails?.name || manufacturerDetails.name}
                                    </p>
                                </div>
                                <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Registration Number</span>
                                    <p className="text-sm text-black font-medium">
                                        {manufacturerDetails.businessDetails?.registrationNumber || 'N/A'}
                                    </p>
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
                            {manufacturerDetails.postalAddress && (
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Postal Address</span>
                                    <p className="text-sm text-black font-medium">
                                        {`P.O. Box ${manufacturerDetails.postalAddress.poBox || ''}-${manufacturerDetails.postalAddress.postalCode || ''}, ${manufacturerDetails.postalAddress.town || ''}`}
                                    </p>
                                </div>
                            )}
                            {manufacturerDetails.physicalAddress && (
                                <div className="p-2 bg-gray-50 rounded-md">
                                    <span className="text-xs text-gray-600">Physical Address</span>
                                    <p className="text-sm text-black font-medium">
                                        {manufacturerDetails.physicalAddress.descriptive || 'N/A'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resident/Non-Resident Selection - Only for Individuals */}
            {isIndividual && setResidentType && (
                <div className="p-4 rounded-lg border border-gray-200 bg-white/80">
                    <div className="space-y-3">
                        <Label htmlFor="residentType" className="text-base font-medium">
                            Tax Obligation Type
                        </Label>
                        <Select value={residentType || "1"} onValueChange={setResidentType}>
                            <SelectTrigger id="residentType" className="h-12 text-base">
                                <SelectValue placeholder="Select obligation type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Income Tax - Resident Individual</SelectItem>
                                <SelectItem value="2">Income Tax Non-Resident Individual</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Select whether you are a resident or non-resident taxpayer
                        </p>
                    </div>
                </div>
            )}

            {/* Obligation Details Section - Only for Companies */}
            {isCompany && manufacturerDetails.obligationsData && (
                <div className="p-4 rounded-lg border border-gray-200 bg-white/80">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Obligation Details
                        </h3>

                        {/* Company Tax Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">PIN Status</span>
                                <p className="text-sm text-black font-medium">
                                    {manufacturerDetails.obligationsData.pinStatus || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-0.5 p-2 bg-gray-50 rounded-md">
                                <span className="text-xs text-gray-600">iTax Status</span>
                                <p className="text-sm text-black font-medium">
                                    {manufacturerDetails.obligationsData.itaxStatus || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Obligations Table */}
                        {manufacturerDetails.obligationsData.obligations && manufacturerDetails.obligationsData.obligations.length > 0 ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Tax Obligations (Select to file nil returns)
                                </Label>
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="text-left p-2 font-medium text-gray-700">Select</th>
                                                <th className="text-left p-2 font-medium text-gray-700">Obligation Name</th>
                                                <th className="text-left p-2 font-medium text-gray-700">Status</th>
                                                <th className="text-left p-2 font-medium text-gray-700">Effective Period</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {manufacturerDetails.obligationsData.obligations.map((obligation, index) => (
                                                <tr key={obligation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="p-2">
                                                        <Checkbox
                                                            id={`obligation-${obligation.id}`}
                                                            checked={selectedObligations?.includes(obligation.id) || false}
                                                            onCheckedChange={(checked) => {
                                                                if (setSelectedObligations) {
                                                                    if (checked) {
                                                                        setSelectedObligations([...(selectedObligations || []), obligation.id]);
                                                                    } else {
                                                                        setSelectedObligations((selectedObligations || []).filter(id => id !== obligation.id));
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-2 font-medium text-black">{obligation.name}</td>
                                                    <td className="p-2">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {obligation.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-gray-600">
                                                        {obligation.effectiveFrom} - {obligation.effectiveTo}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {selectedObligations && selectedObligations.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {selectedObligations.length} obligation{selectedObligations.length > 1 ? 's' : ''} selected for nil return filing
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">No active tax obligations found for this PIN</p>
                        )}
                    </div>
                </div>
            )}

            {/* Single navigation section with personalized buttons */}

        </div>
    )
}

export default Step2Details;
