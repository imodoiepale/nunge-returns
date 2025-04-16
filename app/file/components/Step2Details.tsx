// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ArrowDown, Flag, Eye, EyeOff, Loader2, ArrowRight, User, Mail, Building2, MapPin, LogIn, FileText, FileDown, CheckCircle, PhoneIcon, CreditCard, CheckCircleIcon, ExclamationTriangleIcon, X } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { ManufacturerDetails, Step2Props } from "../lib/types"

const sessionService = new SessionManagementService()

export default function Step2Details({
    loading,
    manufacturerDetails,
    onBack,
    onNext
}: Step2Props) {
    // Record view in database
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId')
        if (currentSessionId && manufacturerDetails) {
            supabase
                .from('session_activities')
                .insert([{
                    session_id: currentSessionId,
                    activity_type: 'user_action',
                    description: 'Viewed manufacturer details',
                    metadata: {
                        pin: manufacturerDetails.pin,
                        name: manufacturerDetails.name
                    }
                }])
                .then(() => console.log('[DB] Recorded details view'))
                .catch(error => console.error('[DB ERROR] Failed to record details view:', error))
        }
    }, [manufacturerDetails])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Loading manufacturer details...</p>
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

    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight mb-4 flex items-center">
                        <Building2 className="mr-2 h-5 w-5 text-primary" />
                        Taxpayer Details
                    </h3>

                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">KRA PIN</TableCell>
                                <TableCell>{manufacturerDetails.pin}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Name</TableCell>
                                <TableCell>{manufacturerDetails.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Email</TableCell>
                                <TableCell>{manufacturerDetails.contactDetails?.email || 'N/A'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Mobile</TableCell>
                                <TableCell>{manufacturerDetails.contactDetails?.mobile || 'N/A'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Registration Number</TableCell>
                                <TableCell>{manufacturerDetails.businessDetails?.registrationNumber || 'N/A'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Registration Date</TableCell>
                                <TableCell>{manufacturerDetails.businessDetails?.registrationDate || 'N/A'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Postal Address</TableCell>
                                <TableCell>
                                    {manufacturerDetails.postalAddress ? 
                                        `P.O. Box ${manufacturerDetails.postalAddress.poBox}, ${manufacturerDetails.postalAddress.town}, ${manufacturerDetails.postalAddress.postalCode}` 
                                        : 'N/A'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Physical Address</TableCell>
                                <TableCell>{manufacturerDetails.physicalAddress?.descriptive || 'N/A'}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
