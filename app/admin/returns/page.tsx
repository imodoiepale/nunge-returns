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
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  AlertTriangle,
  Search
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock returns data
const returnsMetrics = [
  { name: 'Apr 6', completed: 230, pending: 45, failed: 12 },
  { name: 'Apr 7', completed: 280, pending: 50, failed: 15 },
  { name: 'Apr 8', completed: 310, pending: 60, failed: 20 },
  { name: 'Apr 9', completed: 350, pending: 70, failed: 15 },
  { name: 'Apr 10', completed: 390, pending: 65, failed: 10 },
  { name: 'Apr 11', completed: 450, pending: 80, failed: 25 },
]

const returns = [
  {
    id: "r-1",
    pinNumber: "A123456789B",
    userName: "John Doe",
    status: "completed",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-11T09:24:18.123Z",
    amount: 0
  },
  {
    id: "r-2",
    pinNumber: "A987654321C",
    userName: "Mary Smith",
    status: "completed",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-11T14:32:10.982Z",
    amount: 0
  },
  {
    id: "r-3",
    pinNumber: "A567891234D",
    userName: "Peter Kamau",
    status: "pending",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-11T08:15:47.325Z",
    amount: 0
  },
  {
    id: "r-4",
    pinNumber: "A234567891E",
    userName: "Jane Wanjiku",
    status: "completed",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-10T16:08:35.190Z",
    amount: 0
  },
  {
    id: "r-5",
    pinNumber: "A345678912F",
    userName: "David Omondi",
    status: "failed",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-11T10:42:53.687Z",
    amount: 0
  },
  {
    id: "r-6",
    pinNumber: "A456789123G",
    userName: "Sarah Njeri",
    status: "completed",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-09T12:19:08.456Z",
    amount: 0
  },
  {
    id: "r-7",
    pinNumber: "A789123456H",
    userName: "Michael Mwangi",
    status: "completed",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-11T15:51:24.213Z",
    amount: 0
  },
  {
    id: "r-8",
    pinNumber: "A891234567I",
    userName: "Esther Akinyi",
    status: "pending",
    returnPeriod: "2025-03",
    submissionDate: "2025-04-11T09:30:16.874Z",
    amount: 0
  }
]

export default function ReturnsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredReturns = returns.filter(ret => 
    ret.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.pinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.returnPeriod.toLowerCase().includes(searchQuery.toLowerCase())
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
  
  // Get status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">

      
      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,780</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">22.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,655</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">20.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">80</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">12.1%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-red-500 font-medium">-15.3%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Returns chart */}
      <Card>
        <CardHeader>
          <CardTitle>Returns Status Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={returnsMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#333', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#8884d8" />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#82ca9d" />
              <Bar dataKey="failed" name="Failed" stackId="a" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Returns table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Returns</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
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
                <TableHead>User</TableHead>
                <TableHead>KRA PIN</TableHead>
                <TableHead>Return Period</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((ret) => (
                <TableRow key={ret.id}>
                  <TableCell className="font-medium">{ret.userName}</TableCell>
                  <TableCell className="font-mono text-xs">{ret.pinNumber}</TableCell>
                  <TableCell>{ret.returnPeriod}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(ret.submissionDate)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyles(ret.status)}`}>
                      {ret.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">KES {ret.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
