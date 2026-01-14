// @ts-nocheck
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, AlertCircle, User, Lock, Mail, Phone } from "lucide-react"
import { FadeIn } from "@/components/core/fade-in"
import { ScaleIn } from "@/components/core/scale-in"
import { TextRoll } from "@/components/core/text-roll"

interface Step1IDProps {
    idNumber: string
    setIdNumber: (value: string) => void
    onNext: () => void
    loading: boolean
    error: string | null
}

export function Step1ID({ idNumber, setIdNumber, onNext, loading, error }: Step1IDProps) {
    return (
        <FadeIn>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <ScaleIn delay={0.2}>
                        <User className="w-16 h-16 mx-auto mb-4 text-primary" />
                    </ScaleIn>
                    <CardTitle className="text-3xl">
                        <TextRoll className="text-3xl font-bold">Individual Returns</TextRoll>
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        Enter your ID number to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FadeIn delay={0.3}>
                        <div className="space-y-2">
                            <Label htmlFor="idNumber" className="text-base">
                                National ID Number
                            </Label>
                            <Input
                                id="idNumber"
                                type="text"
                                placeholder="e.g., 12345678"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                                maxLength={8}
                                className="text-lg h-12"
                                disabled={loading}
                            />
                            <p className="text-sm text-muted-foreground">
                                Enter your 8-digit national ID number
                            </p>
                        </div>
                    </FadeIn>

                    {error && (
                        <ScaleIn>
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </ScaleIn>
                    )}

                    <FadeIn delay={0.4}>
                        <Button
                            onClick={onNext}
                            disabled={idNumber.length !== 8 || loading}
                            className="w-full h-12 text-lg"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Fetching your details...
                                </>
                            ) : (
                                "Continue"
                            )}
                        </Button>
                    </FadeIn>
                </CardContent>
            </Card>
        </FadeIn>
    )
}

interface ManufacturerDetails {
    basic: {
        fullName: string
        firstName: string
        middleName: string
        lastName: string
        manufacturerName: string
        registrationNumber: string
        idNumber: string
        idType: string
        pin: string
    }
    business: {
        businessName: string
        registrationDate: string
        commencementDate: string
        businessType: string
        tradingName: string
    }
    contact: {
        mainEmail: string
        secondaryEmail: string
        mobileNumber: string
        telephoneNumber: string
        faxNumber: string
    }
    address: {
        descriptive: string
        buildingNumber: string
        streetRoad: string
        cityTown: string
        county: string
        district: string
        town: string
        lrNumber: string
        postalCode: string
        poBox: string
        taxArea: string
        jurisdictionStationId: string
        locationId: string
    }
}

interface Step2VerifyProps {
    pin: string
    name: string
    email: string
    mobileNumber: string
    manufacturerDetails: ManufacturerDetails
    onBack: () => void
    onNext: () => void
}

export function Step2Verify({ pin, name, email, mobileNumber, manufacturerDetails, onBack, onNext }: Step2VerifyProps) {
    return (
        <FadeIn>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <ScaleIn delay={0.2}>
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    </ScaleIn>
                    <CardTitle className="text-3xl">
                        <TextRoll className="text-3xl font-bold">Verify Your Details</TextRoll>
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        Please confirm your information is correct
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FadeIn delay={0.3}>
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
                                <h3 className="font-semibold text-base mb-3">Personal Information</h3>

                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <Label className="text-sm text-muted-foreground">Full Name</Label>
                                        <p className="text-lg font-medium">{manufacturerDetails?.basic?.fullName || name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="w-5 h-5 text-muted-foreground mt-0.5 font-mono text-sm">PIN</span>
                                    <div className="flex-1">
                                        <Label className="text-sm text-muted-foreground">KRA PIN</Label>
                                        <p className="text-lg font-medium font-mono">{pin}</p>
                                    </div>
                                </div>

                                {manufacturerDetails?.basic?.idNumber && (
                                    <div className="flex items-start gap-3">
                                        <span className="w-5 h-5 text-muted-foreground mt-0.5 font-mono text-sm">ID</span>
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">ID Number</Label>
                                            <p className="text-lg font-medium">{manufacturerDetails.basic.idNumber}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
                                <h3 className="font-semibold text-base mb-3">Contact Information</h3>

                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <Label className="text-sm text-muted-foreground">Email Address</Label>
                                        <p className="text-lg font-medium">{manufacturerDetails?.contact?.mainEmail || email || "Not provided"}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <Label className="text-sm text-muted-foreground">Mobile Number</Label>
                                        <p className="text-lg font-medium">{manufacturerDetails?.contact?.mobileNumber || mobileNumber || "Not provided"}</p>
                                    </div>
                                </div>

                                {manufacturerDetails?.contact?.telephoneNumber && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <Label className="text-sm text-muted-foreground">Telephone Number</Label>
                                            <p className="text-lg font-medium">{manufacturerDetails.contact.telephoneNumber}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Address Information */}
                            {(manufacturerDetails?.address?.descriptive || manufacturerDetails?.address?.county) && (
                                <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
                                    <h3 className="font-semibold text-base mb-3">Address Information</h3>

                                    {manufacturerDetails?.address?.descriptive && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-muted-foreground mt-0.5">📍</span>
                                            <div className="flex-1">
                                                <Label className="text-sm text-muted-foreground">Address</Label>
                                                <p className="text-base">{manufacturerDetails.address.descriptive}</p>
                                            </div>
                                        </div>
                                    )}

                                    {manufacturerDetails?.address?.county && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-muted-foreground mt-0.5">🏘️</span>
                                            <div className="flex-1">
                                                <Label className="text-sm text-muted-foreground">County</Label>
                                                <p className="text-base">{manufacturerDetails.address.county}</p>
                                            </div>
                                        </div>
                                    )}

                                    {manufacturerDetails?.address?.town && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-muted-foreground mt-0.5">🏙️</span>
                                            <div className="flex-1">
                                                <Label className="text-sm text-muted-foreground">Town</Label>
                                                <p className="text-base">{manufacturerDetails.address.town}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.4}>
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                If any information is incorrect, please contact KRA to update your details.
                            </AlertDescription>
                        </Alert>
                    </FadeIn>

                    <FadeIn delay={0.5} className="flex gap-3">
                        <Button
                            onClick={onBack}
                            variant="outline"
                            className="flex-1 h-12 text-lg"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={onNext}
                            className="flex-1 h-12 text-lg"
                        >
                            Continue
                        </Button>
                    </FadeIn>
                </CardContent>
            </Card>
        </FadeIn>
    )
}

interface Step3PasswordProps {
    password: string
    setPassword: (value: string) => void
    newPassword: string
    setNewPassword: (value: string) => void
    confirmPassword: string
    setConfirmPassword: (value: string) => void
    showPassword: boolean
    setShowPassword: (value: boolean) => void
    residentType: string
    setResidentType: (value: string) => void
    onBack: () => void
    onValidate: () => void
    loading: boolean
    error: string | null
    requiresReset: boolean
}

export function Step3Password({
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    residentType,
    setResidentType,
    onBack,
    onValidate,
    loading,
    error,
    requiresReset
}: Step3PasswordProps) {
    return (
        <FadeIn>
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <ScaleIn delay={0.2}>
                        <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
                    </ScaleIn>
                    <CardTitle className="text-3xl">
                        <TextRoll className="text-3xl font-bold">
                            {requiresReset ? "Reset Password" : "Verify Password"}
                        </TextRoll>
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {requiresReset
                            ? "Your password has expired. Please set a new password."
                            : "Enter your KRA iTax password to continue"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FadeIn delay={0.3}>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-base">
                                Current Password
                            </Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="text-lg h-12"
                                disabled={loading}
                            />
                        </div>
                    </FadeIn>

                    {requiresReset && (
                        <>
                            <FadeIn delay={0.4}>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-base">
                                        New Password
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="text-lg h-12"
                                        disabled={loading}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Password must be at least 8 characters
                                    </p>
                                </div>
                            </FadeIn>

                            <FadeIn delay={0.5}>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-base">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="text-lg h-12"
                                        disabled={loading}
                                    />
                                </div>
                            </FadeIn>
                        </>
                    )}

                    <FadeIn delay={0.6}>
                        <div className="space-y-2">
                            <Label htmlFor="residentType" className="text-base">
                                Tax Obligation Type
                            </Label>
                            <Select value={residentType} onValueChange={setResidentType}>
                                <SelectTrigger id="residentType" className="h-12 text-lg">
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
                    </FadeIn>

                    <FadeIn delay={0.65}>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="showPassword"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="showPassword" className="text-sm cursor-pointer">
                                Show password
                            </Label>
                        </div>
                    </FadeIn>

                    {error && (
                        <ScaleIn>
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </ScaleIn>
                    )}

                    <FadeIn delay={0.7} className="flex gap-3">
                        <Button
                            onClick={onBack}
                            variant="outline"
                            className="flex-1 h-12 text-lg"
                            disabled={loading}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={onValidate}
                            disabled={
                                loading ||
                                !password ||
                                (requiresReset && (!newPassword || newPassword !== confirmPassword))
                            }
                            className="flex-1 h-12 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Validating...
                                </>
                            ) : (
                                requiresReset ? "Reset & Continue" : "Validate & Continue"
                            )}
                        </Button>
                    </FadeIn>
                </CardContent>
            </Card>
        </FadeIn>
    )
}
