'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Activity, 
  ArrowUpRight, 
  CheckCircle, 
  Download, 
  Search, 
  Users 
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock user data
const userMetrics = [
  { name: 'Apr 6', users: 400, active: 320 },
  { name: 'Apr 7', users: 450, active: 350 },
  { name: 'Apr 8', users: 550, active: 420 },
  { name: 'Apr 9', users: 700, active: 550 },
  { name: 'Apr 10', users: 900, active: 750 },
  { name: 'Apr 11', users: 1200, active: 980 },
]

const users = [
  {
    id: "u-1",
    name: "John Doe",
    email: "john@example.com",
    pin: "A123456789B",
    status: "active",
    registeredAt: "2025-03-15T09:24:18.123Z",
    lastActive: "2025-04-11T15:45:30.067Z"
  },
  {
    id: "u-2",
    name: "Mary Smith",
    email: "mary@example.com",
    pin: "A987654321C",
    status: "active",
    registeredAt: "2025-03-17T14:32:10.982Z",
    lastActive: "2025-04-11T17:12:05.421Z"
  },
  {
    id: "u-3",
    name: "Peter Kamau",
    email: "peter@example.com",
    pin: "A567891234D",
    status: "inactive",
    registeredAt: "2025-03-20T08:15:47.325Z",
    lastActive: "2025-04-10T11:30:15.873Z"
  },
  {
    id: "u-4",
    name: "Jane Wanjiku",
    email: "jane@example.com",
    pin: "A234567891E",
    status: "active",
    registeredAt: "2025-03-22T16:08:35.190Z",
    lastActive: "2025-04-11T16:38:20.965Z"
  },
  {
    id: "u-5",
    name: "David Omondi",
    email: "david@example.com",
    pin: "A345678912F",
    status: "active",
    registeredAt: "2025-03-25T10:42:53.687Z",
    lastActive: "2025-04-11T13:22:45.732Z"
  },
  {
    id: "u-6",
    name: "Sarah Njeri",
    email: "sarah@example.com",
    pin: "A456789123G",
    status: "inactive",
    registeredAt: "2025-03-27T12:19:08.456Z",
    lastActive: "2025-04-09T09:05:19.328Z"
  },
  {
    id: "u-7",
    name: "Michael Mwangi",
    email: "michael@example.com",
    pin: "A789123456H",
    status: "active",
    registeredAt: "2025-03-30T15:51:24.213Z",
    lastActive: "2025-04-11T18:09:37.641Z"
  },
  {
    id: "u-8",
    name: "Esther Akinyi",
    email: "esther@example.com",
    pin: "A891234567I",
    status: "active",
    registeredAt: "2025-04-02T09:30:16.874Z",
    lastActive: "2025-04-11T14:47:53.129Z"
  }
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.pin.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Format date to display in a more friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Calculate time elapsed since last active
  const getTimeElapsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const elapsed = now.getTime() - date.getTime()
    
    const minutes = Math.floor(elapsed / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">
      
      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">18.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">785</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (30d)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">229</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">28.7%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.4%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">3.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* User growth chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth & Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#333', borderRadius: '8px' }} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Total Users"
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="active" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Active Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* User table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Accounts</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 max-w-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download CSV</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>KRA PIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="font-mono text-xs">{user.pin}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                    }`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(user.registeredAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {getTimeElapsed(user.lastActive)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
