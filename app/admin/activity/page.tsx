'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  User, 
  CreditCard, 
  Settings, 
  Calendar 
} from 'lucide-react'

// Import our ActivityLog component
import { ActivityLog, ActivityItem, ActivityType, ActivityStatus } from '@/components/admin/activity-log'

// Import mock data
import { mockActivityData, getActivityLogData } from '@/lib/data/activity-log-data'

// Convert mock data to ActivityItem format
const activityData = [
  {
    id: 1,
    type: 'auth' as ActivityType,
    title: 'User logged in successfully',
    description: 'Login from IP 192.168.1.1',
    timestamp: new Date('2025-04-12T08:30:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  },
  {
    id: 2,
    type: 'return' as ActivityType,
    title: 'Filed tax return',
    description: 'Tax return KRA-234556 submitted successfully',
    timestamp: new Date('2025-04-12T07:45:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'Mary Smith',
      email: 'mary.smith@example.com'
    }
  },
  {
    id: 3,
    type: 'transaction' as ActivityType,
    title: 'Payment failed',
    description: 'Payment of KES 3,500 failed - Insufficient funds',
    timestamp: new Date('2025-04-12T06:20:00'),
    status: 'error' as ActivityStatus,
    user: {
      name: 'David Omondi',
      email: 'david.o@example.com'
    }
  },
  {
    id: 4,
    type: 'user' as ActivityType,
    title: 'New user account created',
    description: 'User registration completed successfully',
    timestamp: new Date('2025-04-11T16:30:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'Jane Wanjiku',
      email: 'jane.wanjiku@example.com'
    }
  },
  {
    id: 5,
    type: 'system' as ActivityType,
    title: 'System settings updated',
    description: 'Tax rate changed to 16%',
    timestamp: new Date('2025-04-11T15:15:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'Admin User',
      email: 'admin@nungereturns.com'
    }
  },
  {
    id: 6,
    type: 'return' as ActivityType,
    title: 'Tax return submission failed',
    description: 'Invalid KRA PIN provided',
    timestamp: new Date('2025-04-11T14:30:00'),
    status: 'error' as ActivityStatus,
    user: {
      name: 'Peter Kamau',
      email: 'peter.k@example.com'
    }
  },
  {
    id: 7,
    type: 'auth' as ActivityType,
    title: 'Failed login attempt',
    description: 'Invalid password used',
    timestamp: new Date('2025-04-11T12:10:00'),
    status: 'warning' as ActivityStatus,
    user: {
      name: 'Sarah Mwangi',
      email: 'sarah.m@example.com'
    }
  },
  {
    id: 8,
    type: 'transaction' as ActivityType,
    title: 'Payment successful',
    description: 'Payment of KES 8,200 processed',
    timestamp: new Date('2025-04-11T10:45:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'Robert Njoroge',
      email: 'robert.n@example.com'
    }
  },
  {
    id: 9,
    type: 'document' as ActivityType,
    title: 'ID document uploaded',
    description: 'Document verification in progress',
    timestamp: new Date('2025-04-10T16:20:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'Lucy Akinyi',
      email: 'lucy.a@example.com'
    }
  },
  {
    id: 10,
    type: 'return' as ActivityType,
    title: 'Tax return processed',
    description: 'Return KRA-234123 accepted and processed',
    timestamp: new Date('2025-04-10T14:35:00'),
    status: 'success' as ActivityStatus,
    user: {
      name: 'Tom Wanyama',
      email: 'tom.w@example.com'
    }
  }
] as ActivityItem[]

export default function ActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activityType, setActivityType] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState('7days')
  const [activeTab, setActiveTab] = useState('all')

  // Handle activity item click
  const handleActivityClick = (activity: ActivityItem) => {
    console.log('Activity clicked:', activity)
    // Here you would typically show a modal with details or navigate to a detail page
  }

  // Handle refresh
  const handleRefresh = () => {
    console.log('Refreshing activity data...')
    // Here you would typically fetch fresh data from the server
  }

  // Handle view all
  const handleViewAll = () => {
    console.log('View all activities')
    // Here you would typically navigate to a full activity log page or show more items
  }

  // Handle filter change
  const handleFilterChange = (filters: string[]) => {
    console.log('Filters changed:', filters)
    // Update your filter state here
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>  </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Activity</TabsTrigger>
              <TabsTrigger value="user">User Activity</TabsTrigger>
              <TabsTrigger value="return">Returns</TabsTrigger>
              <TabsTrigger value="transaction">Transactions</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">Export</Button>
              </div>
              
              {/* Main Activity Log Component */}
              <ActivityLog 
                activities={activityData}
                title="Recent Activity"
                description="All system activity across the platform"
                maxItems={10}
                height={500}
                showFilters={true}
                showSearch={false} // We're using our own search above
                onItemClick={handleActivityClick}
                onRefresh={handleRefresh}
                onViewAll={handleViewAll}
                onFilterChange={handleFilterChange}
              />
            </TabsContent>
            
            <TabsContent value="user">
              <ActivityLog 
                activities={activityData.filter(a => a.type === 'user' || a.type === 'auth')}
                title="User Activity"
                description="User registrations, logins, and account changes"
                maxItems={10}
                height={500}
                onItemClick={handleActivityClick}
              />
            </TabsContent>
            
            <TabsContent value="return">
              <ActivityLog 
                activities={activityData.filter(a => a.type === 'return')}
                title="Returns Activity"
                description="Tax return submissions and processing"
                maxItems={10}
                height={500}
                onItemClick={handleActivityClick}
              />
            </TabsContent>
            
            <TabsContent value="transaction">
              <ActivityLog 
                activities={activityData.filter(a => a.type === 'transaction')}
                title="Transaction Activity"
                description="Payment processing and financial transactions"
                maxItems={10}
                height={500}
                onItemClick={handleActivityClick}
              />
            </TabsContent>
            
            <TabsContent value="system">
              <ActivityLog 
                activities={activityData.filter(a => a.type === 'system')}
                title="System Activity"
                description="System maintenance and configuration changes"
                maxItems={10}
                height={500}
                onItemClick={handleActivityClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
