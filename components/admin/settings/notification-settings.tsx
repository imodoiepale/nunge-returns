'use client'

import React from 'react'
import { Save, BellRing, Mail, MessageSquare, Smartphone, Plus } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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

export function NotificationSettings() {
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    console.log('Saving notification settings...')
  }
  
  return (
    <Tabs defaultValue="admin">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="admin" className="text-sm">Admin Notifications</TabsTrigger>
          <TabsTrigger value="user" className="text-sm">User Notifications</TabsTrigger>
          <TabsTrigger value="system" className="text-sm">System Alerts</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="admin" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Notification Settings</CardTitle>
            <CardDescription>
              Configure how and when admin users receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notification Channels</Label>
                <p className="text-sm text-muted-foreground">
                  Select how you want to receive notifications
                </p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-notifications">Email</Label>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BellRing className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="browser-notifications">Browser</Label>
                </div>
                <Switch id="browser-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sms-notifications">SMS</Label>
                </div>
                <Switch id="sms-notifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="slack-notifications">Slack</Label>
                </div>
                <Switch id="slack-notifications" />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Event Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which events trigger notifications
                </p>
              </div>
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Checkbox id="notify-new-returns" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="notify-new-returns">New Returns</Label>
                  <p className="text-sm text-muted-foreground">Notify when users submit new tax returns</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="notify-new-users" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="notify-new-users">New Users</Label>
                  <p className="text-sm text-muted-foreground">Notify when new users register</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="notify-transactions" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="notify-transactions">Large Transactions</Label>
                  <p className="text-sm text-muted-foreground">Notify for transactions above a certain amount</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="notify-errors" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="notify-errors">System Errors</Label>
                  <p className="text-sm text-muted-foreground">Notify for critical system errors</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="notify-suspicious" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="notify-suspicious">Suspicious Activity</Label>
                  <p className="text-sm text-muted-foreground">Notify for suspicious user activity</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notification-threshold">Transaction Threshold (KES)</Label>
                <Input 
                  id="notification-threshold" 
                  type="number" 
                  defaultValue="50000"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum transaction amount to trigger notification
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notification-limit">Daily Notification Limit</Label>
                <Input 
                  id="notification-limit" 
                  type="number" 
                  defaultValue="25"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum notifications per day (0 for unlimited)
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="quiet-hours">Quiet Hours</Label>
              <Select defaultValue="never">
                <SelectTrigger id="quiet-hours">
                  <SelectValue placeholder="Select quiet hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">None (receive at any time)</SelectItem>
                  <SelectItem value="night">Night (10PM - 7AM)</SelectItem>
                  <SelectItem value="weekend">Weekends</SelectItem>
                  <SelectItem value="custom">Custom Schedule</SelectItem>
                </SelectContent>
              </Select>
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
      
      <TabsContent value="user" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Notification Settings</CardTitle>
            <CardDescription>
              Configure notifications sent to platform users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">User Notification Types</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable categories of user notifications
                </p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="return-status">Return Status Updates</Label>
                </div>
                <Switch id="return-status" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="payment-reminders">Payment Reminders</Label>
                </div>
                <Switch id="payment-reminders" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="document-notifications">Document Notifications</Label>
                </div>
                <Switch id="document-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="marketing-notifications">Marketing & Announcements</Label>
                </div>
                <Switch id="marketing-notifications" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="deadline-reminders">Filing Deadline Reminders</Label>
                </div>
                <Switch id="deadline-reminders" defaultChecked />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <Label htmlFor="reminder-days">Deadline Reminder Days</Label>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="h-8">3 days</Button>
                <Button variant="outline" size="sm" className="h-8">1 week</Button>
                <Button variant="outline" size="sm" className="h-8">2 weeks</Button>
                <Button variant="outline" size="sm" className="h-8">1 month</Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                When to send reminders before filing deadlines
              </p>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="max-emails">Maximum Emails Per Week</Label>
              <Input 
                id="max-emails" 
                type="number" 
                defaultValue="5"
              />
              <p className="text-xs text-muted-foreground">
                Limit the total number of emails sent to a user per week
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
      
      <TabsContent value="system" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Alert Settings</CardTitle>
            <CardDescription>
              Configure automatic system alerts and monitoring notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Alert Destinations</Label>
                <p className="text-sm text-muted-foreground">
                  Where to send system alerts and monitoring notifications
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="alert-email">Alert Email Addresses</Label>
              <Textarea 
                id="alert-email" 
                placeholder="admin@example.com, support@example.com"
                defaultValue="admin@nungereturns.com, tech@nungereturns.com"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of email addresses to receive system alerts
              </p>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="webhook-url">Alert Webhook URL</Label>
              <Input 
                id="webhook-url" 
                placeholder="https://example.com/webhooks/alerts"
                defaultValue="https://monitors.nungereturns.com/webhooks/system-alerts"
              />
              <p className="text-xs text-muted-foreground">
                URL to send webhook notifications for system events
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alert Types</Label>
                <p className="text-sm text-muted-foreground">
                  Configure which system events trigger alerts
                </p>
              </div>
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Checkbox id="alert-errors" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="alert-errors">Critical Errors</Label>
                  <p className="text-sm text-muted-foreground">Server errors, database issues, API failures</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="alert-performance" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="alert-performance">Performance Issues</Label>
                  <p className="text-sm text-muted-foreground">Slow response times, high CPU/memory usage</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="alert-security" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="alert-security">Security Incidents</Label>
                  <p className="text-sm text-muted-foreground">Login failures, suspicious access attempts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="alert-capacity" defaultChecked />
                <div className="grid gap-1.5">
                  <Label htmlFor="alert-capacity">Capacity Warnings</Label>
                  <p className="text-sm text-muted-foreground">Storage limits, rate limiting, quota usage</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox id="alert-updates" />
                <div className="grid gap-1.5">
                  <Label htmlFor="alert-updates">System Updates</Label>
                  <p className="text-sm text-muted-foreground">Updates to system dependencies and services</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="min-severity">Minimum Alert Severity</Label>
              <Select defaultValue="warning">
                <SelectTrigger id="min-severity">
                  <SelectValue placeholder="Select severity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (All alerts)</SelectItem>
                  <SelectItem value="warning">Warning (Moderate and above)</SelectItem>
                  <SelectItem value="error">Error (Serious issues only)</SelectItem>
                  <SelectItem value="critical">Critical (Emergencies only)</SelectItem>
                </SelectContent>
              </Select>
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
