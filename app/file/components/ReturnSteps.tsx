// components/ReturnSteps.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ArrowDown, Flag } from 'lucide-react'

interface FilingStatus {
  loggedIn: boolean
  filing: boolean
  extracting: boolean
  completed: boolean
}

interface ManufacturerDetails {
  pin: string
  name: string
  contactDetails: {
    mobile: string
    email: string
    secondaryEmail: string
  }
  businessDetails: {
    name: string
    registrationNumber: string
    registrationDate: string
    commencedDate: string
  }
  postalAddress: {
    postalCode: string
    town: string
    poBox: string
  }
  physicalAddress: {
    descriptive: string
  }
}

interface Step1Props {
  pin: string
  error: string | null
  onPINChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

interface Step2Props {
  loading: boolean
  manufacturerDetails: ManufacturerDetails | null
  onBack: () => void
  onNext: () => void
}

interface Step3Props {
  mpesaNumber: string
  paymentStatus: "Not Paid" | "Processing" | "Paid"
  onMpesaNumberChange: (value: string) => void
  onSimulatePayment: () => void
}

interface Step4Props {
  pin: string
  password: string
  error: string | null
  filingStatus: FilingStatus
  onPasswordChange: (value: string) => void
  onDownloadReceipt: (type: string) => void
  onEndSession: () => void
}

export function Step1PIN({ pin, error, onPINChange }: Step1Props) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="mb-4 p-2 border border-red-200 rounded-md bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="pin">KRA PIN</Label>
        <Input
          id="pin"
          value={pin}
          onChange={onPINChange}
          required
        />
      </div>
    </div>
  )
}

export function Step2Details({ loading, manufacturerDetails, onBack, onNext }: Step2Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Fetching manufacturer details...</p>
        </div>
      </div>
    )
  }

  if (!manufacturerDetails) return null

  const isIndividual = manufacturerDetails.pin.startsWith('A')

  return (
    <div>
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
            {!isIndividual && (
              <TableRow>
                <TableCell className="font-medium">Business Details</TableCell>
                <TableCell>
                  <div>Name: {manufacturerDetails.businessDetails.name}</div>
                  <div>Reg. No: {manufacturerDetails.businessDetails.registrationNumber}</div>
                  <div>Reg. Date: {manufacturerDetails.businessDetails.registrationDate}</div>
                  <div>Commenced: {manufacturerDetails.businessDetails.commencedDate}</div>
                </TableCell>
              </TableRow>
            )}
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
      {/* <div className="flex justify-between mt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Confirm & Continue
        </Button>
      </div> */}
    </div>
  )
}

export function Step3Payment({ mpesaNumber, paymentStatus, onMpesaNumberChange, onSimulatePayment }: Step3Props) {
  return (
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
            value={mpesaNumber}
            onChange={(e) => onMpesaNumberChange(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="button" onClick={onSimulatePayment}>
        Pay KSH 50
      </Button>
      {paymentStatus === "Processing" && (
        <p className="text-yellow-500">Processing payment...</p>
      )}
      {paymentStatus === "Paid" && (
        <p className="text-green-500">Payment confirmed!</p>
      )}
    </div>
  )
}

export function Step4Filing({ pin, password, error, filingStatus, onPasswordChange, onDownloadReceipt, onEndSession }: Step4Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pin">KRA PIN (Displayed)</Label>
        <Input id="pin" value={pin} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">KRA Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
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
                  onClick={() => onDownloadReceipt("acknowledgement")}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Acknowledgement Receipt
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                  onClick={() => onDownloadReceipt("purchase")}
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Purchase Receipt
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white flex-1"
                  onClick={() => onDownloadReceipt("all")}
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
                  onClick={onEndSession}
                >
                  End Session
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}