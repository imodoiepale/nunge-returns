'use client'

import React from 'react'
import { Save, CreditCard, DollarSign, Check, Plus, Trash2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'

export function PaymentSettings() {
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    console.log('Saving payment settings...')
  }
  
  return (
    <Tabs defaultValue="general">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="general" className="text-sm">General</TabsTrigger>
          <TabsTrigger value="gateways" className="text-sm">Payment Gateways</TabsTrigger>
          <TabsTrigger value="fees" className="text-sm">Fees & Pricing</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment General Settings</CardTitle>
            <CardDescription>
              Configure global payment settings and options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Default Currency</Label>
                <p className="text-sm text-muted-foreground">
                  Primary currency for transactions
                </p>
              </div>
              <Select defaultValue="kes">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kes">Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="usd">US Dollar (USD)</SelectItem>
                  <SelectItem value="eur">Euro (EUR)</SelectItem>
                  <SelectItem value="gbp">British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
              <Input 
                id="invoice-prefix" 
                placeholder="NR-INV-"
                defaultValue="NR-INV-"
              />
              <p className="text-xs text-muted-foreground">
                Prefix added to all invoice numbers (e.g. NR-INV-00001)
              </p>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="payment-expiry">Payment Expiry (hours)</Label>
              <Input 
                id="payment-expiry" 
                type="number" 
                defaultValue="24"
              />
              <p className="text-xs text-muted-foreground">
                Time before unpaid invoices expire and require regeneration
              </p>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="min-transaction">Minimum Transaction Amount (KES)</Label>
              <Input 
                id="min-transaction" 
                type="number" 
                defaultValue="10"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="allow-partial" defaultChecked />
                <Label htmlFor="allow-partial">Allow partial payments</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                Allow users to make partial payments towards invoices
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="auto-receipts" defaultChecked />
                <Label htmlFor="auto-receipts">Automatic receipts</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                Automatically generate and email receipts for successful payments
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="require-phone" defaultChecked />
                <Label htmlFor="require-phone">Require phone number</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                Require users to provide a phone number for mobile payments
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="test-mode" />
                <Label htmlFor="test-mode">Test mode</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                Process payments in test/sandbox mode without real transactions
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline">Reset to Defaults</Button>
            <Button onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="gateways" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Gateways</CardTitle>
                <CardDescription>
                  Configure payment processing methods
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Gateway
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">M-Pesa</CardTitle>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-0">
                        Active
                      </Badge>
                    </div>
                    <Switch id="mpesa-enabled" defaultChecked />
                  </div>
                  <CardDescription>
                    Mobile money payments via Safaricom
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="mpesa-key">API Key</Label>
                      <Input 
                        id="mpesa-key" 
                        type="password" 
                        value="●●●●●●●●●●●●●●●●●●●●"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mpesa-secret">API Secret</Label>
                      <Input 
                        id="mpesa-secret" 
                        type="password" 
                        value="●●●●●●●●●●●●●●●●●●●●"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mpesa-shortcode">Shortcode</Label>
                      <Input 
                        id="mpesa-shortcode" 
                        defaultValue="123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mpesa-passkey">Passkey</Label>
                      <Input 
                        id="mpesa-passkey" 
                        type="password" 
                        value="●●●●●●●●●●●●"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4 space-x-2">
                    <Switch id="mpesa-stk" defaultChecked />
                    <Label htmlFor="mpesa-stk">Enable STK Push</Label>
                    <p className="text-xs text-muted-foreground ml-2">
                      Send payment requests directly to user's phone
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-3 flex justify-end">
                  <Button variant="outline" size="sm">Test Connection</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">Credit Card</CardTitle>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-0">
                        Active
                      </Badge>
                    </div>
                    <Switch id="card-enabled" defaultChecked />
                  </div>
                  <CardDescription>
                    Credit and debit card processing via Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stripe-key">Publishable Key</Label>
                      <Input 
                        id="stripe-key" 
                        defaultValue="pk_test_51Hb6..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripe-secret">Secret Key</Label>
                      <Input 
                        id="stripe-secret" 
                        type="password" 
                        value="●●●●●●●●●●●●●●●●●●●●"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Label>Accepted Cards</Label>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-2 border rounded-md px-3 py-1.5">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-sm">Visa</span>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md px-3 py-1.5">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-sm">Mastercard</span>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md px-3 py-1.5">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-sm">American Express</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-3 flex justify-end">
                  <Button variant="outline" size="sm">Test Connection</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">PayPal</CardTitle>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 border-0">
                        Inactive
                      </Badge>
                    </div>
                    <Switch id="paypal-enabled" />
                  </div>
                  <CardDescription>
                    International payments via PayPal
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="paypal-client">Client ID</Label>
                      <Input 
                        id="paypal-client" 
                        placeholder="Enter client ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paypal-secret">Client Secret</Label>
                      <Input 
                        id="paypal-secret" 
                        type="password" 
                        placeholder="Enter client secret"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-3 flex justify-end">
                  <Button variant="outline" size="sm">Configure</Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="fees" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fees & Pricing</CardTitle>
            <CardDescription>
              Configure payment processing fees and pricing structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Fee Structure</Label>
                <p className="text-sm text-muted-foreground">
                  Configure how payment processing fees are handled
                </p>
              </div>
              <Select defaultValue="absorb">
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select fee structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absorb">Absorb fees (platform pays)</SelectItem>
                  <SelectItem value="pass">Pass to customer</SelectItem>
                  <SelectItem value="split">Split fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Gateway Fees</Label>
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Fee Rule
                </Button>
              </div>
              
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Rate/Amount</TableHead>
                      <TableHead>Min Fee</TableHead>
                      <TableHead>Max Fee</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>M-Pesa</TableCell>
                      <TableCell>Percentage</TableCell>
                      <TableCell>1.5%</TableCell>
                      <TableCell>KES 10</TableCell>
                      <TableCell>KES 1,000</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Credit Card</TableCell>
                      <TableCell>Percentage + Fixed</TableCell>
                      <TableCell>3.5% + KES 30</TableCell>
                      <TableCell>KES 50</TableCell>
                      <TableCell>KES 2,500</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>PayPal</TableCell>
                      <TableCell>Percentage + Fixed</TableCell>
                      <TableCell>4.5% + KES 50</TableCell>
                      <TableCell>KES 100</TableCell>
                      <TableCell>KES 5,000</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <Label htmlFor="platform-fee">Platform Fee</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-fee-type">Fee Type</Label>
                  <Select defaultValue="percentage">
                    <SelectTrigger id="platform-fee-type">
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="hybrid">Percentage + Fixed</SelectItem>
                      <SelectItem value="tiered">Tiered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform-fee-rate">Fee Rate (%)</Label>
                  <Input 
                    id="platform-fee-rate" 
                    type="number" 
                    defaultValue="5"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Fee charged by the platform for processing tax returns
              </p>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="tax-rate">Tax Rate Settings</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax-type">Tax Type</Label>
                  <Select defaultValue="vat">
                    <SelectTrigger id="tax-type">
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vat">VAT</SelectItem>
                      <SelectItem value="gst">GST</SelectItem>
                      <SelectItem value="sales">Sales Tax</SelectItem>
                      <SelectItem value="none">No Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input 
                    id="tax-rate" 
                    type="number" 
                    defaultValue="16"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="tax-inclusive" />
                <Label htmlFor="tax-inclusive">Tax inclusive pricing</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                Display prices with tax included
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="discount-before-tax" defaultChecked />
                <Label htmlFor="discount-before-tax">Apply discounts before tax</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-7">
                Calculate tax after discounts have been applied
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline">Reset to Defaults</Button>
            <Button onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
