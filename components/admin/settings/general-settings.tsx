'use client'

import React from 'react'
import { Save } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function GeneralSettings() {
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    console.log('Saving general settings...')
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure global application settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="site-name">Platform Name</Label>
          <Input 
            id="site-name" 
            placeholder="Nunge Returns" 
            defaultValue="Nunge Returns"
          />
          <p className="text-sm text-muted-foreground">
            Name displayed throughout the platform and in emails
          </p>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="site-description">Platform Description</Label>
          <Textarea 
            id="site-description" 
            placeholder="Simplified tax filing for individuals and businesses in Kenya"
            defaultValue="Simplified tax filing for individuals and businesses in Kenya"
          />
          <p className="text-sm text-muted-foreground">
            Brief description used for SEO and platform introduction
          </p>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input 
            id="contact-email" 
            type="email" 
            placeholder="contact@nungereturns.com" 
            defaultValue="contact@nungereturns.com"
          />
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="support-phone">Support Phone</Label>
          <Input 
            id="support-phone" 
            placeholder="+254 XXX XXX XXX" 
            defaultValue="+254 712 345 678"
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Admin Dashboard Configuration</Label>
            <p className="text-sm text-muted-foreground">
              Customize the admin dashboard experience
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="dashboard-theme">Dashboard Theme</Label>
          <Select defaultValue="system">
            <SelectTrigger id="dashboard-theme">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="dashboard-theme">Default Dashboard View</Label>
          <Select defaultValue="overview">
            <SelectTrigger id="dashboard-view">
              <SelectValue placeholder="Select default view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="returns">Returns</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
              <SelectItem value="users">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pagination-count">Items Per Page</Label>
            <Input 
              id="pagination-count" 
              type="number" 
              defaultValue="20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="refresh-interval">Auto-refresh Interval (seconds)</Label>
            <Input 
              id="refresh-interval" 
              type="number" 
              defaultValue="60"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="enable-analytics" defaultChecked />
            <Label htmlFor="enable-analytics">Enable Usage Analytics</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Track admin dashboard usage for performance optimization
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="enable-animations" defaultChecked />
            <Label htmlFor="enable-animations">Enable UI Animations</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Display smooth transitions and animations in the dashboard
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="compact-view" />
            <Label htmlFor="compact-view">Compact UI Mode</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Display more content in less space (reduced padding and margins)
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch id="auto-save" defaultChecked />
            <Label htmlFor="auto-save">Auto-save Form Data</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            Automatically save drafts when editing forms
          </p>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              Take the platform offline for maintenance
            </p>
          </div>
          <Switch id="maintenance-mode" />
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea 
            id="maintenance-message" 
            placeholder="We're currently performing scheduled maintenance. Please check back later."
            defaultValue="We're currently performing scheduled maintenance. Please check back later."
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
