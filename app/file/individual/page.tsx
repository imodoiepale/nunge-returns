// @ts-nocheck
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
    const [residentType, setResidentType] = useState("1") // Default to resident

    // Step 3: Password
    const [password, setPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [requiresPasswordReset, setRequiresPasswordReset] = useState(false)

    // Payment dialog state
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [paymentInfo, setPaymentInfo] = useState<any>(null)

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

    // Step 3: Validate password and file return
    const handleValidatePassword = async () => {
        setLoading(true)
        setError(null)

        try {
            if (!userDetails) {
                throw new Error("User details not found")
            }

            console.log('[UI] Filing individual return...')
            const response = await fetch("/api/individual", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: userDetails.name,
                    kra_pin: userDetails.pin,
                    kra_password: password,
                    email: userDetails.email,
                    resident_type: residentType
                })
            })

            const data = await response.json()

            console.log('[UI] Filing response:', data)
            console.log('[UI] Response status:', response.status)
            console.log('[UI] Response ok:', response.ok)
            console.log('[UI] Data requiresPayment:', data.requiresPayment)

            // Check if employment income detected (requires payment) - BEFORE checking response.ok
            if (data && data.requiresPayment === true) {
                console.log('[UI] Employment income detected, showing payment dialog')
                console.log('[UI] Payment info:', data)
                setPaymentInfo(data)
                setShowPaymentDialog(true)
                console.log('[UI] Dialog state set to true')
                return
            }

            if (!response.ok) {
                throw new Error(data.error || "Failed to file return")
            }

            // Success - return filed
            toast.success("Return filed successfully!")
            router.push("/file/success")

        } catch (err: any) {
            console.error("Error filing return:", err)
            setError(err.message || "Failed to file return. Please try again.")
            toast.error(err.message || "Failed to file return")
        } finally {
            setLoading(false)
        }
    }

    // Handle payment confirmation
    const handlePaymentConfirm = async () => {
        setShowPaymentDialog(false)
        toast.info("Please proceed to file your regular return with the File Return option.")
        // TODO: Redirect to regular return filing or payment page
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
                                residentType={residentType}
                                setResidentType={setResidentType}
                                onBack={() => {
                                    setStep(2)
                                    setError(null)
                                }}
                                onValidate={handleValidatePassword}
                                loading={loading}
                                error={error}
                                requiresReset={requiresPasswordReset}
                            />
                        )}
                    </div>

                    {/* Payment Dialog */}
                    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                        <DialogContent className="w-[90%] max-w-[500px] rounded-lg p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                    Employment Income Detected
                                </DialogTitle>
                                <DialogDescription className="text-base space-y-3 pt-4">
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Cannot File NIL Return</AlertTitle>
                                        <AlertDescription>
                                            {paymentInfo?.message}
                                        </AlertDescription>
                                    </Alert>

                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <p className="font-semibold">Return Period:</p>
                                        <p className="text-sm">{paymentInfo?.periodFrom} to {paymentInfo?.periodTo}</p>

                                        {paymentInfo?.pendingYears > 0 && (
                                            <>
                                                <p className="font-semibold mt-3">Pending Years:</p>
                                                <p className="text-sm">{paymentInfo?.pendingYears} year(s)</p>

                                                <p className="font-semibold mt-3">Extra Charge:</p>
                                                <p className="text-lg font-bold text-primary">KES {paymentInfo?.extraCharge}</p>
                                            </>
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        You need to file a regular return instead of a NIL return. Please use the "File Return" option.
                                    </p>
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPaymentDialog(false)}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePaymentConfirm}
                                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-700"
                                >
                                    Proceed to File Return
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </PageBackground>
    )
}
