'use client'

import React, { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, FileText, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Obligation {
    id: string
    name: string
    status: string
    effectiveFrom: string
    effectiveTo: string
}

export type ActionMode = 'file' | 'terminate'

const TERMINATION_REASONS = [
    'Business Closed',
    'Business Dormant',
    'Merged with Another Entity',
    'Obligation Not Applicable',
    'Duplicate Registration',
    'Other',
]

interface CompanyObligationSelectorProps {
    pin: string
    onObligationsSelected: (selectedIds: string[]) => void
    selectedObligations: string[]
    actionMode?: ActionMode
    onActionModeChange?: (mode: ActionMode) => void
    terminationReason?: string
    onTerminationReasonChange?: (reason: string) => void
}

export default function CompanyObligationSelector({
    pin,
    onObligationsSelected,
    selectedObligations,
    actionMode = 'file',
    onActionModeChange,
    terminationReason = '',
    onTerminationReasonChange,
}: CompanyObligationSelectorProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [obligations, setObligations] = useState<Obligation[]>([])
    const [taxpayerName, setTaxpayerName] = useState<string>('')
    const [pinStatus, setPinStatus] = useState<string>('')
    const [obligationsChecked, setObligationsChecked] = useState(false)

    const fetchObligations = async () => {
        if (!pin || !pin.toUpperCase().startsWith('P')) {
            setError('This feature is only available for company PINs (starting with P)')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/company/check-obligations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch obligations')
            }

            if (data.success) {
                setObligations(data.obligations || [])
                setTaxpayerName(data.taxpayerName || '')
                setPinStatus(data.pinStatus || '')
                setObligationsChecked(true)

                // Auto-select all active obligations by default
                if (data.obligations && data.obligations.length > 0) {
                    const allIds = data.obligations.map((obl: Obligation) => obl.id)
                    onObligationsSelected(allIds)
                }
            }
        } catch (err: any) {
            console.error('Error fetching obligations:', err)
            setError(err.message || 'Failed to fetch obligations')
            setObligations([])
        } finally {
            setLoading(false)
        }
    }

    const handleObligationToggle = (obligationId: string) => {
        const newSelected = selectedObligations.includes(obligationId)
            ? selectedObligations.filter(id => id !== obligationId)
            : [...selectedObligations, obligationId]

        onObligationsSelected(newSelected)
    }

    const handleSelectAll = () => {
        const allIds = obligations.map(obl => obl.id)
        onObligationsSelected(allIds)
    }

    const handleDeselectAll = () => {
        onObligationsSelected([])
    }

    return (
        <div className="space-y-4">
            {/* Check Obligations Button */}
            {!obligationsChecked && (
                <div className="p-4 rounded-lg border border-gray-200 bg-white/80">
                    <div className="space-y-3">
                        <Label className="text-base font-medium">
                            Company Tax Obligations
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Click below to check which tax obligations are registered for this company PIN
                        </p>
                        <Button
                            onClick={fetchObligations}
                            disabled={loading || !pin || !pin.toUpperCase().startsWith('P')}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Checking Obligations...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Check Tax Obligations
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Obligations Display */}
            {obligationsChecked && !loading && (
                <div className="p-4 rounded-lg border border-gray-200 bg-white/80 space-y-4">
                    {/* Company Info */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">
                                Tax Obligations for {taxpayerName || pin}
                            </Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchObligations}
                                disabled={loading}
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Refresh
                            </Button>
                        </div>
                        {pinStatus && (
                            <p className="text-sm text-muted-foreground">
                                PIN Status: <span className="font-medium">{pinStatus}</span>
                            </p>
                        )}
                    </div>

                    {/* Obligations List */}
                    {obligations.length > 0 ? (
                        <div className="space-y-3">
                            {/* Action Mode Toggle */}
                            {onActionModeChange && (
                                <div className="flex gap-2 mb-3">
                                    <Button
                                        variant={actionMode === 'file' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => onActionModeChange('file')}
                                        className="flex-1"
                                    >
                                        <FileText className="h-3 w-3 mr-1" />
                                        File Nil Returns
                                    </Button>
                                    <Button
                                        variant={actionMode === 'terminate' ? 'destructive' : 'outline'}
                                        size="sm"
                                        onClick={() => onActionModeChange('terminate')}
                                        className="flex-1"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Terminate Obligations
                                    </Button>
                                </div>
                            )}

                            {/* Termination Reason (only in terminate mode) */}
                            {actionMode === 'terminate' && onTerminationReasonChange && (
                                <div className="mb-3 p-3 rounded-md border border-red-200 bg-red-50">
                                    <Label className="text-sm font-medium text-red-700 mb-2 block">
                                        Termination Reason
                                    </Label>
                                    <Select value={terminationReason} onValueChange={onTerminationReasonChange}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Select a reason..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TERMINATION_REASONS.map(reason => (
                                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    {actionMode === 'terminate'
                                        ? 'Select obligations to terminate:'
                                        : 'Select obligations to file nil returns for:'}
                                </Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAll}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeselectAll}
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {obligations.map((obligation) => (
                                    <div
                                        key={obligation.id}
                                        className="flex items-start space-x-3 p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <Checkbox
                                            id={`obligation-${obligation.id}`}
                                            checked={selectedObligations.includes(obligation.id)}
                                            onCheckedChange={() => handleObligationToggle(obligation.id)}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <Label
                                                htmlFor={`obligation-${obligation.id}`}
                                                className="text-sm font-medium cursor-pointer"
                                            >
                                                {obligation.name}
                                            </Label>
                                            <div className="text-xs text-muted-foreground">
                                                <p>Status: {obligation.status}</p>
                                                <p>Effective: {obligation.effectiveFrom} - {obligation.effectiveTo}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedObligations.length > 0 && (
                                <Alert variant={actionMode === 'terminate' ? 'destructive' : 'default'}>
                                    {actionMode === 'terminate' ? <Trash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    <AlertDescription>
                                        {selectedObligations.length} obligation{selectedObligations.length > 1 ? 's' : ''} selected
                                        {actionMode === 'terminate'
                                            ? ' for termination'
                                            : ` for nil return filing — Total: KES ${selectedObligations.length * 50}`}
                                        {actionMode === 'terminate' && !terminationReason && (
                                            <span className="block text-xs mt-1 text-red-600">Please select a termination reason above</span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No active tax obligations found for this PIN
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    )
}
