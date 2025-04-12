'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  Activity,
  CalendarDays
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import AnalyticsService from '@/lib/analyticsService'

// Mock data - replace with actual data fetching
const mockData = {
  userMetrics: [
    { name: 'Apr 6', users: 400 },
    { name: 'Apr 7', users: 450 },
    { name: 'Apr 8', users: 550 },
    { name: 'Apr 9', users: 700 },
    { name: 'Apr 10', users: 900 },
    { name: 'Apr 11', users: 1200 },
  ],
  pinBreakdown: [
    { name: 'Business', value: 430 },
    { name: 'Individual', value: 720 }
  ],
  transactionData: [
    { name: 'Apr 6', amount: 24000 },
    { name: 'Apr 7', amount: 31000 },
    { name: 'Apr 8', amount: 28000 },
    { name: 'Apr 9', amount: 45000 },
    { name: 'Apr 10', amount: 52000 },
    { name: 'Apr 11', amount: 68000 },
  ],
  returnsData: [
    { name: 'Apr 6', completed: 230, pending: 45, failed: 12 },
    { name: 'Apr 7', completed: 280, pending: 50, failed: 15 },
    { name: 'Apr 8', completed: 310, pending: 60, failed: 20 },
    { name: 'Apr 9', completed: 350, pending: 70, failed: 15 },
    { name: 'Apr 10', completed: 390, pending: 65, failed: 10 },
    { name: 'Apr 11', completed: 450, pending: 80, failed: 25 },
  ],
  recentActivity: [
    { id: 1, type: 'return', user: 'John Doe', time: '10 minutes ago', status: 'completed' },
    { id: 2, type: 'payment', user: 'Mary Smith', time: '25 minutes ago', status: 'completed' },
    { id: 3, type: 'return', user: 'Peter Kamau', time: '45 minutes ago', status: 'pending' },
    { id: 4, type: 'registration', user: 'Jane Wanjiku', time: '1 hour ago', status: 'completed' },
    { id: 5, type: 'payment', user: 'David Omondi', time: '2 hours ago', status: 'failed' },
  ]
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(mockData)
  const [errors, setErrors] = useState<any>(null)
  
  // In a real implementation, use useEffect to fetch actual data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        const analyticsService = new AnalyticsService()
        const response = await analyticsService.getDashboardMetrics()
        
        // Check if we received an error response
        if (response && 'error' in response && response.success === false) {
          console.error('Error in analytics service:', response.error)
          return // Keep using mock data
        }
        
        // Make sure we have valid data before proceeding
        const data = response as {
          userMetrics?: any[],
          transactionMetrics?: any[],
          pinBreakdown?: any[],
          returnsData?: any[],
          errors?: Record<string, any>
        }
        
        if (data) {
          // Merge with mock data for any missing properties
          const mergedData = {
            ...mockData,
            userMetrics: data.userMetrics || mockData.userMetrics,
            pinBreakdown: data.pinBreakdown || mockData.pinBreakdown,
            transactionData: data.transactionMetrics || mockData.transactionData,
            returnsData: data.returnsData || mockData.returnsData,
            // Keep mock activity data since it's not provided by the service
            recentActivity: mockData.recentActivity
          }
          
          setDashboardData(mergedData)
          
          // Only set errors if they exist in the response
          if (data.errors) {
            setErrors(data.errors)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }
    
    fetchData()
    
    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds for testing, change back to 300000 for production
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">

      {/* Top stats row */}
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
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 68,000</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">30.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns Filed</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">450</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">15.3%</span>
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
            <div className="text-2xl font-bold">94.2%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">2.4%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts section */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* User growth chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData?.userMetrics || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* PIN distribution pie chart */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>PIN Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData?.pinBreakdown || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}: {name: string, percent: number}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {errors?.pinMetrics && (
              <div className="mt-2 text-xs text-red-500">
                Table not ready: {errors.pinMetrics}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent activity and table data */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent activity feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(dashboardData?.recentActivity || []).map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-3">
                  <div className="rounded-full p-2 bg-primary/10">
                    {activity.type === 'return' && <FileText className="h-4 w-4 text-primary" />}
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-primary" />}
                    {activity.type === 'registration' && <Users className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === 'return' && 'Filed a tax return'}
                      {activity.type === 'payment' && 'Made a payment'}
                      {activity.type === 'registration' && 'Registered an account'}
                    </p>
                    <div className="flex items-center pt-1">
                      <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground opacity-70" />
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" 
                        style={{
                          backgroundColor: activity.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
                                        activity.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 
                                        'rgba(239, 68, 68, 0.1)',
                          color: activity.status === 'completed' ? 'rgb(16, 185, 129)' : 
                                activity.status === 'pending' ? 'rgb(245, 158, 11)' : 
                                'rgb(239, 68, 68)'
                        }}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Returns chart */}
        <Card>
          <CardHeader>
            <CardTitle>Returns Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData?.returnsData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#8884d8" />
                <Bar dataKey="pending" stackId="a" fill="#82ca9d" />
                <Bar dataKey="failed" stackId="a" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
            {errors?.returnMetrics && (
              <div className="mt-2 text-xs text-red-500">
                Table not ready: {errors.returnMetrics}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
