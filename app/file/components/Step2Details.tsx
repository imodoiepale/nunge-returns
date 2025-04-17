// @ts-nocheck
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Building2, MapPin, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { Step2Props } from "../lib/types"

const sessionService = new SessionManagementService()

export function Step2Details({ loading, manufacturerDetails, onBack, onNext }: Step2Props) {
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

            {/* Single navigation section with personalized buttons */}

        </div>
    )
}

export default Step2Details;
