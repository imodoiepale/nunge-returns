// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, Check, Flag } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell,  TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PhysicalAddress {
  descriptive: string;
}

interface PostalAddress {
  postalCode: string;
  town: string;
  poBox: string;
}

interface ContactDetails {
  mobile: string;
  email: string;
  secondaryEmail: string;
}

interface BusinessDetails {
  name: string;
  registrationNumber: string;
  registrationDate: string;
  commencedDate: string;
}

interface ManufacturerDetails {
  pin: string;
  name: string;
  physicalAddress: PhysicalAddress;
  postalAddress: PostalAddress;
  contactDetails: ContactDetails;
  businessDetails: BusinessDetails;
}

interface FormData {
  pin: string;
  manufacturerName: string;
  email: string;
  mobileNumber: string;
  mpesaNumber: string;
  password: string;
}

interface FilingStatus {
  loggedIn: boolean;
  filing: boolean;
  extracting: boolean;
  completed: boolean;
}

interface Credentials {
  pin: string;
  password: string;
}

interface FileReturnResponse {
  status: "success" | "error";
  message: string;
  receiptNumber?: string;
}

const extractManufacturerDetails = async (pin: string) => {
  try {
    const response = await fetch('/api/manufacturer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    return data.data;
  } catch (error: any) {
    console.error('Error extracting manufacturer details:', error);
    throw error;
  }
};

const fileNilReturn = async (credentials: Credentials): Promise<FileReturnResponse> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful filing
    return { 
      status: "success", 
      message: "Return filed successfully",
      receiptNumber: `NR${Math.random().toString().slice(2, 10)}`
    }
  } catch (error: any) {
    return { 
      status: "error", 
      message: "Failed to file return. Please try again." 
    }
  }
}

export default function FilePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    pin: "",
    manufacturerName: "",
    email: "",
    mobileNumber: "",
    mpesaNumber: "",
    password: "",
  })
  const [manufacturerDetails, setManufacturerDetails] = useState<ManufacturerDetails | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"Not Paid" | "Processing" | "Paid">("Not Paid")
  const [filingStatus, setFilingStatus] = useState<FilingStatus>({
    loggedIn: false,
    filing: false,
    extracting: false,
    completed: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userCount, setUserCount] = useState(12345)

  useEffect(() => {
    if (step === 2 && formData.pin) {
      fetchManufacturerDetails(formData.pin)
    }
  }, [step, formData.pin])

  const fetchManufacturerDetails = async (pin: string) => {
    setLoading(true)
    setError(null)
    try {
      const details = await extractManufacturerDetails(pin)
      setManufacturerDetails({
        pin: pin,
        name: details.taxpayerName,
        contactDetails: {
          mobile: details.mobileNumber,
          email: details.mainEmailId,
          secondaryEmail: details.mainEmailId
        },
        businessDetails: {
          name: details.taxpayerName,
          registrationNumber: details.businessRegCertiNo,
          registrationDate: details.busiRegDt,
          commencedDate: details.busiCommencedDt
        },
        postalAddress: {
          postalCode: details.postalAddress.postalCode,
          town: details.postalAddress.town,
          poBox: details.postalAddress.poBox
        },
        physicalAddress: {
          descriptive: details.descriptiveAddress
        }
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step === 4) {
      try {
        setFilingStatus({ ...filingStatus, loggedIn: true })
        const result = await fileNilReturn({
          pin: formData.pin,
          password: formData.password
        })

        if (result.status === "success") {
          setFilingStatus({
            loggedIn: true,
            filing: true,
            extracting: true,
            completed: true
          })
        } else {
          setError(result.message)
        }
      } catch (error: any) {
        setError(error.message)
      }
    } else {
      setStep(step + 1)
    }
  }

  const simulatePayment = () => {
    setPaymentStatus("Processing")
    setTimeout(() => {
      setPaymentStatus("Paid")
    }, 2000)
  }

  const downloadReceipt = () => {
    // Create a link element
    const link = document.createElement('a')
    link.href = '/nunge.pdf'
    // Use manufacturer name in the download filename
    const fileName = `${manufacturerDetails?.name || 'Unknown'} - Acknowledgement Receipt.pdf`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => {
      endSession()
    }, 2000)
  }

  const endSession = () => {
    router.push('/')
  }

  const steps = [
    "Enter PIN",
    "Confirm Details",
    "Payment",
    "File Returns"
  ]

  const renderStep2 = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>Fetching manufacturer details...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => fetchManufacturerDetails(formData.pin)}
          >
            Retry
          </Button>
        </div>
      )
    }

    if (manufacturerDetails) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Manufacturer Details</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">PIN</TableCell>
                <TableCell>{manufacturerDetails.pin}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Name</TableCell>
                <TableCell>{manufacturerDetails.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Contact Details</TableCell>
                <TableCell>
                  <div>Mobile: {manufacturerDetails.contactDetails.mobile}</div>
                  <div>Email: {manufacturerDetails.contactDetails.email}</div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Business Details</TableCell>
                <TableCell>
                  <div>Name: {manufacturerDetails.businessDetails.name}</div>
                  <div>Reg. No: {manufacturerDetails.businessDetails.registrationNumber}</div>
                  <div>Reg. Date: {manufacturerDetails.businessDetails.registrationDate}</div>
                  <div>Commenced: {manufacturerDetails.businessDetails.commencedDate}</div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Postal Address</TableCell>
                <TableCell>
                  P.O. Box {manufacturerDetails.postalAddress.poBox}-
                  {manufacturerDetails.postalAddress.postalCode}, 
                  {manufacturerDetails.postalAddress.town}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Physical Address</TableCell>
                <TableCell>
                  <div>{manufacturerDetails.physicalAddress.descriptive}</div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center py-8">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>
      <div className="text-center mb-4">
        <p className="text-lg font-semibold">You are user number: <span className="text-primary">#{userCount}</span></p>
        <p className="text-sm text-muted-foreground">Thank you for using our service!</p>
      </div>
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>File Your Returns</CardTitle>
          <CardDescription>
            Step {step} of {steps.length}: {steps[step - 1]}
          </CardDescription>
          <div className="flex justify-between mt-4">
            {steps.map((s, index) => (
              <div key={index} className={`flex flex-col items-center ${index < step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index < step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {index < step ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs mt-1">{s}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div className="w-1/2 border-r pr-8">
              <h3 className="text-lg font-semibold mb-4">Filled Details</h3>
              {step > 1 && (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PIN</TableCell>
                      <TableCell>{formData.pin}</TableCell>
                    </TableRow>
                    {step > 2 && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">Name</TableCell>
                          <TableCell>{manufacturerDetails?.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Email</TableCell>
                          <TableCell>{manufacturerDetails?.contactDetails.email}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Mobile</TableCell>
                          <TableCell>{manufacturerDetails?.contactDetails.mobile}</TableCell>
                        </TableRow>
                      </>
                    )}
                    {step > 3 && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">M-Pesa Number</TableCell>
                          <TableCell>{formData.mpesaNumber}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Payment Status</TableCell>
                          <TableCell>{paymentStatus}</TableCell>
                        </TableRow>
                        </>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="w-1/2">
              {step === 2 ? (
                <div>
                  {renderStep2()}
                  {manufacturerDetails && (
                    <div className="flex justify-between mt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                      <Button type="button" onClick={() => setStep(step + 1)}>
                        Confirm & Continue
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {step === 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="pin">KRA PIN</Label>
                      <Input
                        id="pin"
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mpesaNumber">M-Pesa Number</Label>
                        <div className="flex">
                          <Select defaultValue="254">
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="254">
                                <div className="flex items-center">
                                  <Flag className="mr-2 h-4 w-4" />
                                  <span>+254 (Kenya)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            id="mpesaNumber"
                            className="flex-1 ml-2"
                            value={formData.mpesaNumber}
                            onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={simulatePayment}>
                        Pay KSH 50
                      </Button>
                      {paymentStatus === "Processing" && (
                        <p className="text-yellow-500">Processing payment...</p>
                      )}
                      {paymentStatus === "Paid" && (
                        <p className="text-green-500">Payment confirmed!</p>
                      )}
                    </div>
                  )}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pin">KRA PIN (Displayed)</Label>
                        <Input id="pin" value={formData.pin} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">KRA Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                      {error && (
                        <div className="p-4 border border-red-200 rounded-md bg-red-50">
                          <p className="text-red-600">{error}</p>
                        </div>
                      )}

                      {filingStatus.loggedIn && (
                        <div className="mt-8 border-t pt-4">
                          <h3 className="text-lg font-semibold mb-4">Filing Progress</h3>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Check className={`w-5 h-5 mr-2 ${filingStatus.loggedIn ? 'text-green-500' : 'text-gray-300'}`} />
                              <span>Logging In</span>
                            </div>
                            <div className="flex items-center">
                              <Check className={`w-5 h-5 mr-2 ${filingStatus.filing ? 'text-green-500' : 'text-gray-300'}`} />
                              <span>Filing Returns</span>
                            </div>
                            <div className="flex items-center">
                              <Check className={`w-5 h-5 mr-2 ${filingStatus.extracting ? 'text-green-500' : 'text-gray-300'}`} />
                              <span>Extracting Receipt</span>
                            </div>
                            <div className="flex items-center">
                              <Check className={`w-5 h-5 mr-2 ${filingStatus.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              <span>Completed</span>
                            </div>
                          </div>
                          {filingStatus.completed && (
                            <div className="mt-4 p-2 border rounded-lg">
                              <h4 className="font-semibold text-sm mb-1">Filing Receipt</h4>
                              <p className="text-xs text-muted-foreground">
                                Your nil returns have been successfully filed. Receipt number: NR{Math.random().toString().slice(2, 10)}
                              </p>
                              <div className="flex space-x-2 mt-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                  onClick={() => downloadReceipt("acknowledgement")}
                                >
                                  <ArrowDown className="w-4 h-4 mr-2" />
                                  Acknowledgement Receipt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                  onClick={() => downloadReceipt("purchase")}
                                >
                                  <ArrowDown className="w-4 h-4 mr-2" />
                                  Purchase Receipt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                                  onClick={() => downloadReceipt("all")}
                                >
                                  <ArrowDown className="w-4 h-4 mr-2" />
                                  All Receipts
                                </Button>
                              </div>
                              <div className="flex justify-end">
                                <Button 
                                  size="sm"
                                  variant="secondary" 
                                  className="bg-gradient-to-r from-purple-900 to-black hover:from-purple-800 hover:to-black text-white mt-2"
                                  onClick={endSession}
                                >
                                  End Session
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between">
                    {step > 1 && !filingStatus.completed && (
                      <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                    )}
                    {!filingStatus.completed && (
                      <Button 
                        type="submit" 
                        disabled={step === 3 && paymentStatus !== "Paid"}
                      >
                        {step === 4 ? "File Returns" : "Next"}
                      </Button>
                    )}
                  </div>
                  {filingStatus.completed && (
                    <div className="mt-4 text-center">
                      <p className="text-purple-600 text-lg font-semibold">Thank you for using our service!</p>
                    </div>
                  )}
                </form>
              )}

              {step === 5 && filingStatus.loggedIn && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Filing Progress</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Check className={`w-5 h-5 mr-2 ${filingStatus.loggedIn ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Logging In</span>
                    </div>
                    <div className="flex items-center">
                      <Check className={`w-5 h-5 mr-2 ${filingStatus.filing ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Filing Returns</span>
                    </div>
                    <div className="flex items-center">
                      <Check className={`w-5 h-5 mr-2 ${filingStatus.extracting ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Extracting Receipt</span>
                    </div>
                    <div className="flex items-center">
                      <Check className={`w-5 h-5 mr-2 ${filingStatus.completed ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>Completed</span>
                    </div>
                  </div>
                  {filingStatus.completed && (
                    <div className="mt-4 p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Filing Receipt</h4>
                      <p className="text-sm text-muted-foreground">
                        Your nil returns have been successfully filed. Receipt number: NR{Math.random().toString().slice(2, 10)}
                      </p>
                      <Button className="mt-2" variant="outline" onClick={downloadReceipt}>
                        Download Receipt
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}