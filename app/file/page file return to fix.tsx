"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Flag } from 'lucide-react'
import { createWorker } from "tesseract.js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  } catch (error) {
    console.error('Error extracting manufacturer details:', error);
    throw error;
  }
};

const fileNilReturn = async (credentials) => {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto("https://itax.kra.go.ke/KRA-Portal/")
    await page.locator("#logid").click()
    await page.locator("#logid").fill(credentials.pin)
    await page.locator('input[name="xxZTT9p2wQ"]').fill(credentials.password)

    // Handle captcha
    const image = await page.waitForSelector("#captcha_img")
    const imagePath = "./captcha.png"
    await image.screenshot({ path: imagePath })

    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(imagePath)
    await worker.terminate()

    const captchaText = text.trim()
    await page.locator("#captcahText").fill(captchaText)
    await page.click("#loginButton")

    // Wait for successful login
    await page.waitForSelector('#ddtopmenubar', { timeout: 10000 })

    // Navigate to nil return filing
    await page.hover('#ddtopmenubar > ul > li > a[rel="Returns"]')
    await page.waitForTimeout(500)
    await page.evaluate(() => showNilReturn())
    await page.waitForLoadState("networkidle")

    // File the return
    await page.locator('#regType').selectOption('7')
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Submit' }).click()
    await page.getByRole('button', { name: 'Submit' }).click()

    // Handle receipt download
    const download = await page.waitForEvent('download')
    await download.saveAs(`./receipts/${credentials.pin}_receipt.pdf`)

    return { status: "success", message: "Return filed successfully" }
  } catch (error) {
    return { status: "error", message: error.message }
  } finally {
    await context.close()
    await browser.close()
  }
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userCount, setUserCount] = useState(12345)

  useEffect(() => {
    if (step === 2 && formData.pin) {
      fetchManufacturerDetails(formData.pin)
    }
  }, [step, formData.pin])

  const fetchManufacturerDetails = async (pin) => {
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
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 5) {
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
      } catch (error) {
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

  const steps = [
    "Enter PIN",
    "Confirm Details",
    "Payment",
    "Filing Summary",
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
                      {error && (
                        <div className="p-4 border border-red-200 rounded-md bg-red-50">
                          <p className="text-red-600">{error}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between">
                    {step > 1 && (
                      <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                        Back
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={step === 3 && paymentStatus !== "Paid"}
                    >
                      {step < 5 ? "Next" : "File Returns"}
                    </Button>
                  </div>
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
                      <Button className="mt-2" variant="outline">
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