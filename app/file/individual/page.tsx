// @ts-nocheck
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBackground } from "@/components/ui/page-background"
import { Step1ID, Step2Verify, Step3Password } from "../components/IndividualFileSteps"
import { FadeIn } from "@/components/core/fade-in"
import { TextRoll } from "@/components/core/text-roll"
import toast from "react-hot-toast"

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

interface UserDetails {
    pin: string
    name: string
    email: string
    mobileNumber: string
    idNumber: string
    manufacturerDetails: ManufacturerDetails
}

export default function IndividualFilePage() {
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Step 1: ID Number
    const [idNumber, setIdNumber] = useState("")

    // Step 2: User Details
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null)

    // Step 3: Password
    const [password, setPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [requiresPasswordReset, setRequiresPasswordReset] = useState(false)

    // Step 1: Fetch user details by ID
    const handleFetchByID = async () => {
        setLoading(true)
        setError(null)

        try {
            console.log('[UI] Fetching details for ID:', idNumber)

            const response = await fetch("/api/kra/fetch-by-id", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idNumber })
            })

            const data = await response.json()

            console.log('[UI] API response:', { status: response.status, success: data.success })

            if (!response.ok) {
                const errorMessage = data.message || data.error || "Failed to fetch details from KRA"
                console.error('[UI] API error:', errorMessage, data)
                throw new Error(errorMessage)
            }

            if (!data.success) {
                throw new Error("Could not find details for this ID number")
            }

            if (!data.manufacturerDetails) {
                throw new Error("No details found for this ID number")
            }

            // Extract user details with complete manufacturer details
            const details: UserDetails = {
                pin: data.pin,
                name: data.manufacturerDetails?.basic?.fullName || data.manufacturerDetails?.basic?.manufacturerName || "Unknown",
                email: data.manufacturerDetails?.contact?.mainEmail || "",
                mobileNumber: data.manufacturerDetails?.contact?.mobileNumber || "",
                idNumber: idNumber,
                manufacturerDetails: data.manufacturerDetails
            }

            console.log('[UI] User details extracted:', { pin: details.pin, name: details.name })

            setUserDetails(details)
            setStep(2)
            toast.success("Details fetched successfully!")

        } catch (err: any) {
            console.error("[UI] Error fetching details:", err)
            const errorMessage = err.message || "Failed to fetch details. Please check your ID number and try again."
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Validate password
    const handleValidatePassword = async () => {
        setLoading(true)
        setError(null)

        try {
            if (!userDetails) {
                throw new Error("User details not found")
            }

            const response = await fetch("/api/auth/validate-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pin: userDetails.pin,
                    password: password,
                    newPassword: requiresPasswordReset ? newPassword : null
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to validate password")
            }

            // Handle different statuses
            if (data.status === "valid") {
                toast.success("Password validated successfully!")
                // TODO: Proceed to next step (payment/filing)
                router.push("/file/payment?type=individual")

            } else if (data.status === "password_expired") {
                setRequiresPasswordReset(true)
                setError("Your password has expired. Please set a new password below.")
                toast.error("Password expired - please reset it")

            } else if (data.status === "invalid") {
                throw new Error("Invalid password. Please check and try again.")

            } else if (data.status === "locked") {
                throw new Error("Your account has been locked. Please contact KRA.")

            } else if (data.status === "cancelled") {
                throw new Error("Your account has been cancelled. Please contact KRA.")

            } else {
                throw new Error(data.message || "Unable to validate password")
            }

        } catch (err: any) {
            console.error("Error validating password:", err)
            setError(err.message || "Failed to validate password. Please try again.")
            toast.error(err.message || "Failed to validate password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageBackground>
            <div className="min-h-screen py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <FadeIn className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Home
                                </Button>
                            </Link>
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold mb-2">
                                <TextRoll>File Your Returns</TextRoll>
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Simple, fast, and secure individual tax returns
                            </p>
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    1
                                </div>
                                <span className="text-sm font-medium hidden sm:inline">ID Number</span>
                            </div>

                            <div className={`h-px w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />

                            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    2
                                </div>
                                <span className="text-sm font-medium hidden sm:inline">Verify</span>
                            </div>

                            <div className={`h-px w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />

                            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    3
                                </div>
                                <span className="text-sm font-medium hidden sm:inline">Password</span>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Step Content */}
                    <div className="flex justify-center">
                        {step === 1 && (
                            <Step1ID
                                idNumber={idNumber}
                                setIdNumber={setIdNumber}
                                onNext={handleFetchByID}
                                loading={loading}
                                error={error}
                            />
                        )}

                        {step === 2 && userDetails && (
                            <Step2Verify
                                pin={userDetails.pin}
                                name={userDetails.name}
                                email={userDetails.email}
                                mobileNumber={userDetails.mobileNumber}
                                manufacturerDetails={userDetails.manufacturerDetails}
                                onBack={() => {
                                    setStep(1)
                                    setUserDetails(null)
                                    setError(null)
                                }}
                                onNext={() => {
                                    setStep(3)
                                    setError(null)
                                }}
                            />
                        )}

                        {step === 3 && userDetails && (
                            <Step3Password
                                password={password}
                                setPassword={setPassword}
                                newPassword={newPassword}
                                setNewPassword={setNewPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                onBack={() => {
                                    setStep(2)
                                    setError(null)
                                    setRequiresPasswordReset(false)
                                }}
                                onValidate={handleValidatePassword}
                                loading={loading}
                                error={error}
                                requiresReset={requiresPasswordReset}
                            />
                        )}
                    </div>
                </div>
            </div>
        </PageBackground>
    )
}
