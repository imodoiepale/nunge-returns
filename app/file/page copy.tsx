"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Flag } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function FilePage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    pin: "",
    manufacturerName: "",
    email: "",
    mobileNumber: "",
    mpesaNumber: "",
    password: "",
  })
  const [manufacturerDetails, setManufacturerDetails] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState("Not Paid")
  const [filingStatus, setFilingStatus] = useState({
    loggedIn: false,
    filing: false,
    extracting: false,
    completed: false,
  })
  const [userCount, setUserCount] = useState(12345) // This would be fetched from your backend

  useEffect(() => {
    // Simulating fetching manufacturer details
    if (step === 2) {
      setTimeout(() => {
        setManufacturerDetails({
          pin: "P051619980A",
          name: "Akash Distributors (k) Limited",
          physicalAddress: {
            lrNo: "LR. 209/136/68",
            building: "CBD",
            street: "CROSS RD",
            city: "NAIROBI",
            county: "Nairobi",
            district: "Starehe District",
            taxArea: "As Habito",
            descriptive: "LR. 209/136/68, CBD, CROSS RD, NAIROBI, Kakuma,Turkana West District,Turkana"
          },
          postalAddress: {
            postalCode: "100",
            town: "NAIROBI",
            poBox: "40878"
          },
          contactDetails: {
            telephone: "",
            mobile: "0710863980",
            email: "AKASHDISTRIBUTORSLTDITAX@GMAIL.COM",
            secondaryEmail: "AKASHDISTRIBUTORSLTDITAX@GMAIL.COM",
            website: ""
          },
          businessDetails: {
            name: "Akash Distributors (k) Limited",
            registrationNumber: "PVT/2016/029166",
            registrationDate: "21/10/2016",
            commencedDate: "01/11/2016"
          }
        })
      }, 1000)
    }
  }, [step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 5) {
      setStep(step + 1)
    } else {
      // Simulate filing process
      setFilingStatus({ ...filingStatus, loggedIn: true })
      await new Promise(resolve => setTimeout(resolve, 5000))
      setFilingStatus({ ...filingStatus, loggedIn: true, filing: true })
      await new Promise(resolve => setTimeout(resolve, 5000))
      setFilingStatus({ ...filingStatus, loggedIn: true, filing: true, extracting: true })
      await new Promise(resolve => setTimeout(resolve, 5000))
      setFilingStatus({ ...filingStatus, loggedIn: true, filing: true, extracting: true, completed: true })
    }
  }

  const simulatePayment = () => {
    setTimeout(() => {
      setPaymentStatus("Paid")
    }, 2000)
  }

  const steps = [
    "Enter PIN",
    "Confirm Details",
    "Payment",
    "Filing Summary",
    "File Returns"
  ]

  return (
    <div className=" flex min-h-screen flex-col items-center py-8">
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
            Step {step} of 5: {steps[step - 1]}
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
                      <TableRow>
                        <TableCell className="font-medium">M-Pesa Number</TableCell>
                        <TableCell>{formData.mpesaNumber}</TableCell>
                      </TableRow>
                    )}
                    {step > 3 && (
                      <TableRow>
                        <TableCell className="font-medium">Payment Status</TableCell>
                        <TableCell>{paymentStatus}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="w-1/2">
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
                {step === 2 && manufacturerDetails && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">User Details</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">User PIN</TableCell>
                          <TableCell>{manufacturerDetails.pin}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">User Name</TableCell>
                          <TableCell>{manufacturerDetails.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium"> Physical Address</TableCell>
                          <TableCell>{manufacturerDetails.physicalAddress.descriptive}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium"> Postal Address</TableCell>
                          <TableCell>{`P.O. Box ${manufacturerDetails.postalAddress.poBox}-${manufacturerDetails.postalAddress.postalCode}, ${manufacturerDetails.postalAddress.town}`}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Contact Details</TableCell>
                          <TableCell>
                            <div>Mobile: {manufacturerDetails.contactDetails.mobile}</div>
                            <div>Email: {manufacturerDetails.contactDetails.email}</div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Business Registration Details</TableCell>
                          <TableCell>
                            <div>Name: {manufacturerDetails.businessDetails.name}</div>
                            <div>Reg. No: {manufacturerDetails.businessDetails.registrationNumber}</div>
                            <div>Reg. Date: {manufacturerDetails.businessDetails.registrationDate}</div>
                            <div>Commenced Date: {manufacturerDetails.businessDetails.commencedDate}</div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
                            {/* Add more country options here */}
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
                    <Button type="button" onClick={simulatePayment}>Pay KSH 50</Button>
                    {paymentStatus === "Paid" && (
                      <p className="text-green-500">Payment confirmed!</p>
                    )}
                  </div>
                )}
                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Filing Summary</h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">PIN</TableCell>
                          <TableCell>{formData.pin}</TableCell>
                        </TableRow>
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
                        <TableRow>
                          <TableCell className="font-medium">M-Pesa Number</TableCell>
                          <TableCell>{formData.mpesaNumber}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Payment Status</TableCell>
                          <TableCell>{paymentStatus}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
                {step === 5 && (
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
                  </div>
                )}
                <div className="flex justify-between">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                      Back
                    </Button>
                  )}
                  <Button type="submit" disabled={step === 3 && paymentStatus !== "Paid"}>
                    {step < 5 ? "Next" : "File Returns"}
                  </Button>
                </div>
              </form>
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
                      <p className="text-sm text-muted-foreground">Your nil returns have been successfully filed. Receipt number: NR12345678</p>
                      <Button className="mt-2" variant="outline">Download Receipt</Button>
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

