'use client'

import React from 'react'
import { Save, EyeOff, Eye, Plus, Trash2, Copy, Shield, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SecuritySettings() {
  const [showPassword, setShowPassword] = React.useState(false)
  
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    console.log('Saving security settings...')
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Settings</CardTitle>
          <CardDescription>
            Configure authentication methods and security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Authentication Methods</Label>
              <p className="text-sm text-muted-foreground">
                Select which methods users can use to authenticate
              </p>
            </div>
          </div>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Checkbox id="email-auth" defaultChecked />
              <div className="grid gap-1.5">
                <Label htmlFor="email-auth">Email/Password</Label>
                <p className="text-sm text-muted-foreground">Traditional login with email and password</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="google-auth" defaultChecked />
              <div className="grid gap-1.5">
                <Label htmlFor="google-auth">Google</Label>
                <p className="text-sm text-muted-foreground">Sign in with Google account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="apple-auth" />
              <div className="grid gap-1.5">
                <Label htmlFor="apple-auth">Apple</Label>
                <p className="text-sm text-muted-foreground">Sign in with Apple ID</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="phone-auth" defaultChecked />
              <div className="grid gap-1.5">
                <Label htmlFor="phone-auth">Phone Number</Label>
                <p className="text-sm text-muted-foreground">Login or verify with SMS code</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require additional verification for admin users
              </p>
            </div>
            <Switch id="require-2fa" defaultChecked />
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="2fa-method">Default 2FA Method</Label>
            <Select defaultValue="sms">
              <SelectTrigger id="2fa-method">
                <SelectValue placeholder="Select 2FA method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS Code</SelectItem>
                <SelectItem value="totp">Authenticator App</SelectItem>
                <SelectItem value="email">Email Code</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Password Policy</Label>
              <p className="text-sm text-muted-foreground">
                Set password requirements for all users
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min-length">Minimum Length</Label>
              <Input 
                id="min-length" 
                type="number" 
                defaultValue="8"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-age">Maximum Age (days)</Label>
              <Input 
                id="max-age" 
                type="number" 
                defaultValue="90"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="require-uppercase" defaultChecked />
              <Label htmlFor="require-uppercase">Require uppercase letters</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="require-numbers" defaultChecked />
              <Label htmlFor="require-numbers">Require numbers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="require-symbols" defaultChecked />
              <Label htmlFor="require-symbols">Require special characters</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="prevent-reuse" defaultChecked />
              <Label htmlFor="prevent-reuse">Prevent password reuse (last 5 passwords)</Label>
            </div>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Configure session timeout and security controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input 
                id="session-timeout" 
                type="number" 
                defaultValue="60"
              />
              <p className="text-xs text-muted-foreground">
                Inactive users will be automatically logged out
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-sessions">Maximum Concurrent Sessions</Label>
              <Input 
                id="max-sessions" 
                type="number" 
                defaultValue="3"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of active sessions per user
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="force-logout-on-password-change" defaultChecked />
              <Label htmlFor="force-logout-on-password-change">Force logout on password change</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Ends all active sessions when a user changes their password
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="track-ip" defaultChecked />
              <Label htmlFor="track-ip">Track login IP addresses</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Records IP addresses for all login attempts
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="notify-new-device" defaultChecked />
              <Label htmlFor="notify-new-device">Notify on new device login</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Sends email notifications for logins from new devices
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
      
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for admin dashboard access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Handle with care</AlertTitle>
            <AlertDescription>
              API keys grant full administrative access. Never share keys or commit them to source control.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-key">Active API Key</Label>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Generate New Key
              </Button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  id="api-key" 
                  type={showPassword ? "text" : "password"} 
                  value="sk_admin_12345678901234567890123456789012"
                  className="pr-10"
                  readOnly
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <Label>API Key Usage</Label>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Admin Dashboard</TableCell>
                  <TableCell>Oct 12, 2023</TableCell>
                  <TableCell>Today</TableCell>
                  <TableCell>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 text-xs px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Reporting Integration</TableCell>
                  <TableCell>Aug 23, 2023</TableCell>
                  <TableCell>3 days ago</TableCell>
                  <TableCell>
                    <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 text-xs px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Testing Environment</TableCell>
                  <TableCell>May 05, 2023</TableCell>
                  <TableCell>1 month ago</TableCell>
                  <TableCell>
                    <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 text-xs px-2 py-0.5 rounded-full">
                      Revoked
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline">View Access Logs</Button>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
