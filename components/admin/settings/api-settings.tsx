'use client'

import React from 'react'
import { Save, Plus, Trash2, Code, Copy, CheckCircle2, ExternalLink } from 'lucide-react'

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

export function ApiSettings() {
  const [copied, setCopied] = React.useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText('https://api.nungereturns.com/v1')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    console.log('Saving API settings...')
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Manage external API integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">API Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable API access
              </p>
            </div>
            <Switch id="api-enabled" defaultChecked />
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="api-url">API Base URL</Label>
            <div className="flex gap-2">
              <Input 
                id="api-url" 
                defaultValue="https://api.nungereturns.com/v1"
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
            <Input 
              id="rate-limit" 
              type="number" 
              defaultValue="100"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of API requests allowed per minute per client
            </p>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="timeout">Request Timeout (seconds)</Label>
            <Input 
              id="timeout" 
              type="number" 
              defaultValue="30"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="log-requests" defaultChecked />
              <Label htmlFor="log-requests">Log all API requests</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Store detailed logs of all API requests (may impact performance)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="require-https" defaultChecked />
              <Label htmlFor="require-https">Require HTTPS</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Reject any API requests not using HTTPS
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="cors-enabled" defaultChecked />
              <Label htmlFor="cors-enabled">Enable CORS</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Allow cross-origin requests to the API
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
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Manage third-party service integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Kenya Revenue Authority (KRA)</div>
                    <div className="text-xs text-muted-foreground">Tax authority integration</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-0">
                      Connected
                    </Badge>
                  </TableCell>
                  <TableCell>10 minutes ago</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">M-Pesa</div>
                    <div className="text-xs text-muted-foreground">Payment processing</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-0">
                      Connected
                    </Badge>
                  </TableCell>
                  <TableCell>1 hour ago</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">NTSA Database</div>
                    <div className="text-xs text-muted-foreground">Vehicle registration lookup</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-0">
                      Needs attention
                    </Badge>
                  </TableCell>
                  <TableCell>2 days ago</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Configure</Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">eCitizen</div>
                    <div className="text-xs text-muted-foreground">Government services integration</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 border-0">
                      Disconnected
                    </Badge>
                  </TableCell>
                  <TableCell>Never</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Connect</Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <Button className="mt-4" variant="outline">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New Integration
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Configure webhooks to notify external systems of events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook-url">Webhook Endpoints</Label>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Endpoint
              </Button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">https://example.com/webhooks/tax-return</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">return.created</Badge>
                        <Badge variant="secondary" className="text-xs">return.updated</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-0">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Code className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">https://dashboard.company.com/api/nunge-data</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">user.created</Badge>
                        <Badge variant="secondary" className="text-xs">transaction.completed</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-0">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Code className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label htmlFor="webhook-secret">Webhook Secret</Label>
            <div className="flex gap-2">
              <Input 
                id="webhook-secret" 
                type="password" 
                value="●●●●●●●●●●●●●●●●●●●●"
                className="flex-1"
                readOnly
              />
              <Button variant="outline">Show</Button>
              <Button variant="outline">Regenerate</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This secret is used to sign webhook payloads for verification
            </p>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="retry-attempts">Retry Attempts</Label>
            <Select defaultValue="3">
              <SelectTrigger id="retry-attempts">
                <SelectValue placeholder="Select number of retries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No retries</SelectItem>
                <SelectItem value="3">3 attempts</SelectItem>
                <SelectItem value="5">5 attempts</SelectItem>
                <SelectItem value="10">10 attempts</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Number of times to retry failed webhook deliveries
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="webhook-logs" defaultChecked />
              <Label htmlFor="webhook-logs">Enable webhook delivery logs</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              Store detailed logs of webhook requests and responses
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <Button variant="outline">Test Webhook</Button>
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
