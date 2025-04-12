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
  DollarSign, 
  Activity,
  AlertTriangle,
  Search,
  Calendar
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock transaction data
const transactionData = [
  { name: 'Apr 6', amount: 24000 },
  { name: 'Apr 7', amount: 31000 },
  { name: 'Apr 8', amount: 28000 },
  { name: 'Apr 9', amount: 45000 },
  { name: 'Apr 10', amount: 52000 },
  { name: 'Apr 11', amount: 68000 },
]

const transactions = [
  {
    id: "t-1",
    userName: "John Doe",
    amount: 250,
    paymentMethod: "mpesa",
    mpesaCode: "QWE12345RT",
    status: "completed",
    createdAt: "2025-04-11T09:24:18.123Z",
  },
  {
    id: "t-2",
    userName: "Mary Smith",
    amount: 250,
    paymentMethod: "mpesa",
    mpesaCode: "ASD67890YU",
    status: "completed",
    createdAt: "2025-04-11T14:32:10.982Z",
  },
  {
    id: "t-3",
    userName: "Peter Kamau",
    amount: 250,
    paymentMethod: "mpesa",
    mpesaCode: "ZXC24680IO",
    status: "pending",
    createdAt: "2025-04-11T08:15:47.325Z",
  },
  {
    id: "t-4",
    userName: "Jane Wanjiku",
    amount: 500,
    paymentMethod: "card",
    mpesaCode: null,
    status: "completed",
    createdAt: "2025-04-10T16:08:35.190Z",
  },
  {
    id: "t-5",
    userName: "David Omondi",
    amount: 250,
    paymentMethod: "mpesa",
    mpesaCode: "QAZ13579WS",
    status: "failed",
    createdAt: "2025-04-11T10:42:53.687Z",
  },
  {
    id: "t-6",
    userName: "Sarah Njeri",
    amount: 250,
    paymentMethod: "mpesa",
    mpesaCode: "PLM97531KJ",
    status: "completed",
    createdAt: "2025-04-09T12:19:08.456Z",
  },
  {
    id: "t-7",
    userName: "Michael Mwangi",
    amount: 500,
    paymentMethod: "card",
    mpesaCode: null,
    status: "completed",
    createdAt: "2025-04-11T15:51:24.213Z",
  },
  {
    id: "t-8",
    userName: "Esther Akinyi",
    amount: 250,
    paymentMethod: "mpesa",
    mpesaCode: "OKN86420BV",
    status: "pending",
    createdAt: "2025-04-11T09:30:16.874Z",
  }
]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTransactions = transactions.filter(tx => 
    tx.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tx.mpesaCode && tx.mpesaCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    tx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 248,000</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">30.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,845</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">24.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 134</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">5.3%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.8%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">1.4%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#333', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="amount" name="Revenue (KES)" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Transactions table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
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
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.userName}</TableCell>
                  <TableCell className="text-right">KES {tx.amount.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{tx.paymentMethod}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.mpesaCode || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyles(tx.status)}`}>
                      {tx.status}
                    </span>
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
