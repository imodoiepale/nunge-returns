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
  Download, 
  DollarSign, 
  Users,
  Users2,
  Search,
  Building
} from 'lucide-react'
import { PieChart, Pie, XAxis, YAxis, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock partners data
const partnerBreakdown = [
  { name: 'Cyber', value: 12, color: '#8884d8' },
  { name: 'University', value: 8, color: '#82ca9d' },
  { name: 'Business', value: 8, color: '#ffc658' }
]

const partners = [
  {
    id: "p-1",
    companyName: "TechHub Cyber",
    contactName: "John Kamau",
    email: "john@techhub.co.ke",
    partnerType: "cyber",
    commissionRate: 10,
    totalRevenue: 25600,
    commissionPaid: 2560,
    status: "active",
    startedAt: "2025-02-10T09:24:18.123Z"
  },
  {
    id: "p-2",
    companyName: "Strathmore University",
    contactName: "Mary Wambui",
    email: "mary@strathmore.edu",
    partnerType: "university",
    commissionRate: 15,
    totalRevenue: 18200,
    commissionPaid: 2730,
    status: "active",
    startedAt: "2025-02-15T14:32:10.982Z"
  },
  {
    id: "p-3",
    companyName: "Nexus Cyber Cafe",
    contactName: "Peter Odhiambo",
    email: "peter@nexus.co.ke",
    partnerType: "cyber",
    commissionRate: 10,
    totalRevenue: 12400,
    commissionPaid: 1240,
    status: "pending",
    startedAt: "2025-03-05T08:15:47.325Z"
  },
  {
    id: "p-4",
    companyName: "KCA University",
    contactName: "Jane Njeri",
    email: "jane@kca.ac.ke",
    partnerType: "university",
    commissionRate: 15,
    totalRevenue: 9800,
    commissionPaid: 1470,
    status: "active",
    startedAt: "2025-03-10T16:08:35.190Z"
  },
  {
    id: "p-5",
    companyName: "Safari Accounting",
    contactName: "David Kariuki",
    email: "david@safariaccounting.co.ke",
    partnerType: "business",
    commissionRate: 12,
    totalRevenue: 7600,
    commissionPaid: 912,
    status: "active",
    startedAt: "2025-03-17T10:42:53.687Z"
  },
  {
    id: "p-6",
    companyName: "Digital Path Cyber",
    contactName: "Sarah Nyambura",
    email: "sarah@digitalpath.co.ke",
    partnerType: "cyber",
    commissionRate: 10,
    totalRevenue: 6200,
    commissionPaid: 620,
    status: "inactive",
    startedAt: "2025-03-22T12:19:08.456Z"
  },
  {
    id: "p-7",
    companyName: "Mount Kenya University",
    contactName: "Michael Kimani",
    email: "michael@mku.ac.ke",
    partnerType: "university",
    commissionRate: 15,
    totalRevenue: 5800,
    commissionPaid: 870,
    status: "active",
    startedAt: "2025-03-28T15:51:24.213Z"
  },
  {
    id: "p-8",
    companyName: "TaxPro Consultants",
    contactName: "Esther Wangari",
    email: "esther@taxpro.co.ke",
    partnerType: "business",
    commissionRate: 12,
    totalRevenue: 4600,
    commissionPaid: 552,
    status: "pending",
    startedAt: "2025-04-05T09:30:16.874Z"
  }
]

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredPartners = partners.filter(partner => 
    partner.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.partnerType.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Format date to display in a more friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }
  
  // Calculate values for statistics
  const totalPartners = partners.length
  const activePartners = partners.filter(p => p.status === 'active').length
  const totalPartnerRevenue = partners.reduce((sum, p) => sum + p.totalRevenue, 0)
  const totalCommissionPaid = partners.reduce((sum, p) => sum + p.commissionPaid, 0)
  
  // Get status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
    }
  }

  // Get partner type icon
  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'cyber':
        return <Users className="h-4 w-4 text-primary" />
      case 'university':
        return <Building className="h-4 w-4 text-primary" />
      case 'business':
        return <DollarSign className="h-4 w-4 text-primary" />
      default:
        return <Users2 className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">

      
      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartners}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePartners}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">8.3%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalPartnerRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">22.7%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalCommissionPaid.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">20.1%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Partners distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={partnerBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({name, percent}: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {partnerBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#333', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Partners table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Partner Accounts</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
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
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.companyName}</TableCell>
                  <TableCell>
                    <div>{partner.contactName}</div>
                    <div className="text-xs text-muted-foreground">{partner.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPartnerTypeIcon(partner.partnerType)}
                      <span className="capitalize">{partner.partnerType}</span>
                    </div>
                  </TableCell>
                  <TableCell>{partner.commissionRate}%</TableCell>
                  <TableCell className="text-right">KES {partner.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">KES {partner.commissionPaid.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyles(partner.status)}`}>
                      {partner.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(partner.startedAt)}
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
