// @ts-nocheck
"use client"

import { useState } from "react"
import { Upload, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

// Step 1: ID Upload
export function Step1IDUpload({ formData, setFormData, extractionStatus, extractionError, onExtract, onNext }) {
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (side === 'front') {
          setFrontPreview(reader.result)
          setFormData(prev => ({ ...prev, idFrontImage: file, idFrontPreview: reader.result }))
        } else {
          setBackPreview(reader.result)
          setFormData(prev => ({ ...prev, idBackImage: file, idBackPreview: reader.result }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExtract = () => {
    if (formData.idFrontImage) {
      onExtract(formData.idFrontImage, formData.idBackImage)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>ID Upload Instructions</AlertTitle>
        <AlertDescription>
          Upload clear photos of your National ID or Passport. We'll automatically extract your information using AI.
        </AlertDescription>
      </Alert>

      {/* Front of ID */}
      <div className="space-y-2">
        <Label htmlFor="id-front">National ID / Passport (Front) *</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          {frontPreview ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto">
                <img src={frontPreview} alt="ID Front" className="rounded-lg w-full" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFrontPreview(null)
                  setFormData(prev => ({ ...prev, idFrontImage: null, idFrontPreview: null }))
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <Label htmlFor="id-front" className="cursor-pointer text-primary hover:underline">
                  Click to upload
                </Label>
                <Input
                  id="id-front"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'front')}
                />
                <p className="text-sm text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back of ID (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="id-back">National ID / Passport (Back) - Optional</Label>
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          {backPreview ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto">
                <img src={backPreview} alt="ID Back" className="rounded-lg w-full" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBackPreview(null)
                  setFormData(prev => ({ ...prev, idBackImage: null, idBackPreview: null }))
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <Label htmlFor="id-back" className="cursor-pointer text-primary hover:underline">
                  Click to upload
                </Label>
                <Input
                  id="id-back"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'back')}
                />
                <p className="text-sm text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extraction Status */}
      {extractionStatus === "extracting" && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Extracting Information</AlertTitle>
          <AlertDescription>
            Please wait while we extract your information from the ID...
          </AlertDescription>
        </Alert>
      )}

      {extractionStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Extraction Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Your ID information has been extracted. Please review and proceed to the next step.
          </AlertDescription>
        </Alert>
      )}

      {extractionStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Extraction Failed</AlertTitle>
          <AlertDescription>{extractionError}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <div></div>
        {extractionStatus === "success" ? (
          <Button type="button" onClick={onNext}>
            Next Step
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleExtract}
            disabled={!formData.idFrontImage || extractionStatus === "extracting"}
          >
            {extractionStatus === "extracting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract Information"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// Step 2: Personal Information
export function Step2PersonalInfo({ formData, setFormData, onBack, onNext }) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Personal Information</AlertTitle>
        <AlertDescription>
          Review and complete your personal information extracted from your ID.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="idNumber">ID Number *</Label>
          <Input
            id="idNumber"
            value={formData.idNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="text"
            placeholder="DD/MM/YYYY"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname">Surname *</Label>
          <Input
            id="surname"
            value={formData.surname}
            onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="givenName">Given Name *</Label>
          <Input
            id="givenName"
            value={formData.givenName}
            onChange={(e) => setFormData(prev => ({ ...prev, givenName: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sex *</Label>
          <Select value={formData.sex} onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeOfBirth">Place of Birth *</Label>
          <Input
            id="placeOfBirth"
            value={formData.placeOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, placeOfBirth: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profession">Profession *</Label>
          <Select value={formData.profession || "11"} onValueChange={(value) => setFormData(prev => ({ ...prev, profession: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Senior government officials</SelectItem>
              <SelectItem value="2">Professionals</SelectItem>
              <SelectItem value="3">Service Workers</SelectItem>
              <SelectItem value="4">Transport</SelectItem>
              <SelectItem value="5">Craft and related trades workers</SelectItem>
              <SelectItem value="6">Plant and machine operators and fishery workers</SelectItem>
              <SelectItem value="7">Agriculture</SelectItem>
              <SelectItem value="8">Mining</SelectItem>
              <SelectItem value="9">Construction</SelectItem>
              <SelectItem value="10">Manufacturing</SelectItem>
              <SelectItem value="11">Students</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Next Step
        </Button>
      </div>
    </div>
  )
}

// Step 3: Contact Information
export function Step3ContactInfo({ formData, setFormData, otpSent, setOtpSent, otp, setOtp, onBack, onNext }) {
  // Auto-set secondary email to match main email
  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, mainEmail: email, secondaryEmail: email }))
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Contact Information</AlertTitle>
        <AlertDescription>
          Provide your mobile number and email address.
        </AlertDescription>
      </Alert>

      {/* Contact Information */}
      <div className="space-y-3">
        
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number *</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="0740000000"
              value={formData.mobileNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainEmail">Email *</Label>
            <Input
              id="mainEmail"
              type="email"
              placeholder="your.email@example.com"
              value={formData.mainEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Review & Submit
        </Button>
      </div>
    </div>
  )
}

// Step 4: Payment
export function Step4Payment({ paymentStatus, onPayment, mpesaNumber, setMpesaNumber, onBack, onNext }) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment</AlertTitle>
        <AlertDescription>
          Complete payment to proceed with KRA PIN registration.
        </AlertDescription>
      </Alert>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Service Fee: KES 30</AlertTitle>
        <AlertDescription className="text-blue-700">
          Pay via M-Pesa to continue with your registration.
        </AlertDescription>
      </Alert>

      {paymentStatus === "idle" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="mpesaNumber">M-Pesa Number *</Label>
            <Input
              id="mpesaNumber"
              type="tel"
              placeholder="254712345678"
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value.replace(/\D/g, ''))}
              maxLength={12}
            />
          </div>
          <Button
            type="button"
            onClick={onPayment}
            disabled={!mpesaNumber || mpesaNumber.length < 10}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Pay KES 30 via M-Pesa
          </Button>
        </div>
      )}

      {paymentStatus === "processing" && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing Payment</AlertTitle>
          <AlertDescription>
            Please check your phone and enter your M-Pesa PIN...
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "paid" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Payment Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            KES 30 paid successfully. You can now proceed to review your information.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={paymentStatus === "processing"}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={paymentStatus !== "paid"}
          className="bg-primary"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  )
}

// Step 5: Tax Obligations (Hidden - for backend only)
export function Step4Obligations({ formData, setFormData, onBack, onNext }) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Tax Obligations</AlertTitle>
        <AlertDescription>
          Select your tax obligations and source of income.
        </AlertDescription>
      </Alert>

      {/* Tax Obligations */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="incomeTax"
            checked={formData.incomeTax}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, incomeTax: checked }))}
          />
          <Label htmlFor="incomeTax">Income Tax (Resident Individual)</Label>
        </div>
      </div>

      {/* Source of Income */}
      <div className="space-y-4">
        <h3 className="font-semibold">Source of Income</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employmentIncome">Employment Income</Label>
            <Select value={formData.employmentIncome} onValueChange={(value) => setFormData(prev => ({ ...prev, employmentIncome: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessIncome">Business Income</Label>
            <Select value={formData.businessIncome} onValueChange={(value) => setFormData(prev => ({ ...prev, businessIncome: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentalIncome">Rental Income</Label>
            <Select value={formData.rentalIncome} onValueChange={(value) => setFormData(prev => ({ ...prev, rentalIncome: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Additional Questions */}
      <div className="space-y-4">
        <h3 className="font-semibold">Additional Information</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hasAlternativeAddress">Do you have an Alternative Address?</Label>
            <Select value={formData.hasAlternativeAddress} onValueChange={(value) => setFormData(prev => ({ ...prev, hasAlternativeAddress: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="declareBankAccounts">Do you wish to declare your Bank Accounts?</Label>
            <Select value={formData.declareBankAccounts} onValueChange={(value) => setFormData(prev => ({ ...prev, declareBankAccounts: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Review & Submit
        </Button>
      </div>
    </div>
  )
}

// Step 5: Review & Submit
export function Step5Review({ formData, registrationStatus, registrationError, onBack, onSubmit }) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Review Your Information</AlertTitle>
        <AlertDescription>
          Please review all information before submitting your KRA PIN registration.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <div className="space-y-2">
          <h3 className="font-semibold">Personal Information</h3>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p><strong>ID Number:</strong> {formData.idNumber}</p>
            <p><strong>Name:</strong> {formData.givenName} {formData.surname}</p>
            <p><strong>Date of Birth:</strong> {formData.dateOfBirth}</p>
            <p><strong>Sex:</strong> {formData.sex}</p>
            <p><strong>Place of Birth:</strong> {formData.placeOfBirth}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <h3 className="font-semibold">Contact Information</h3>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Mobile:</strong> {formData.mobileNumber}</p>
            <p><strong>Email:</strong> {formData.mainEmail}</p>
          </div>
        </div>
      </div>

      {/* Registration Status */}
      {registrationStatus === "processing" && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing Registration</AlertTitle>
          <AlertDescription>
            Please wait while we submit your KRA PIN registration...
          </AlertDescription>
        </Alert>
      )}

      {registrationStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription>{registrationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={registrationStatus === "processing"}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={registrationStatus === "processing"}
          className="bg-gradient-to-r from-green-500 to-green-700"
        >
          {registrationStatus === "processing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Registration"
          )}
        </Button>
      </div>
    </div>
  )
}
