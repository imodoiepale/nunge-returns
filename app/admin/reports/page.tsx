'use client'

import React, { useState } from 'react'
import {
  BarChart,
  FileText,
  Users,
  CreditCard,
  CalendarDays,
  ArrowUpRight,
  Download,
  FileDown,
  Filter,
  RefreshCw,
  ExternalLink,
  PieChart,
  TrendingUp
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { StatCard } from '@/components/admin/stat-card'
import { MetricsChart } from '@/components/admin/metrics-chart'
import { DataTable } from '@/components/admin/data-table'
import { ActivityLog, type ActivityItem, ActivityType, ActivityStatus } from '@/components/admin/activity-log'

import { getReportingData } from '@/lib/data/reporting-data'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeReportTab, setActiveReportTab] = useState('overview')

  // Fetch data from our reporting data source
  const {
    overviewData,
    returnsTrendData,
    transactionsTrendData,
    userTrendData,
    documentsTrendData,
    recentActivities,
    reportColumns,
    reportData,
    returnsByTypeData
  } = getReportingData() || {}

  // Format activities for the activity log component
  const formattedActivities = recentActivities?.map(activity => ({
    id: activity.id,
    type: activity.type as ActivityType,
    title: activity.title,
    description: activity.description,
    timestamp: activity.timestamp,
    status: activity.status === 'completed' ? 'success' as ActivityStatus :
      activity.status === 'pending' ? 'pending' as ActivityStatus : 'info' as ActivityStatus,
    user: activity.user
  })) || []

  const handleGenerateReport = () => {
    // In a real app, this would trigger a report generation
    console.log('Generating report...')
  }

  const handleRefreshData = () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleExportData = () => {
    // In a real app, this would download a CSV/Excel file
    console.log('Exporting data...')
  }

  const handleActivityClick = (activity: ActivityItem) => {
    console.log('Activity clicked:', activity)
    // Here you would typically show a modal with details
  }

  const dateRanges = [
    'Today',
    'Yesterday',
    'Last 7 days',
    'Last 30 days',
    'This month',
    'Last month',
    'This quarter',
    'Last quarter',
    'This year',
    'Last year',
    'Custom'
  ]

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">
      <div className="flex items-center justify-between">


      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="returns" className="text-xs">Returns</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs">Scheduled Reports</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <CalendarDays className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map(range => (
                    <SelectItem key={range} value={range} className="text-xs">
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button onClick={handleGenerateReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {overviewData?.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={typeof stat.icon === 'function' ? React.createElement(stat.icon) : stat.icon}
                  change={stat.change}
                  trend={stat.trend}
                  tooltip={stat.tooltip}
                />
              ))}
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <MetricsChart
                title="Returns Trend"
                description="Number of returns filed over time"
                data={returnsTrendData}
                type="line"
                series={[
                  { name: 'Returns', dataKey: 'value', color: '#8884d8' }
                ]}
                dateRanges={dateRanges}
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                showLegend={false}
                height={280}
                trend={{
                  value: 12.5,
                  direction: 'up',
                  label: 'increase'
                }}
                actions={[
                  { label: 'Download Data', action: handleExportData },
                  { label: 'View Full Report', action: () => { } }
                ]}
              />

              <MetricsChart
                title="Transaction Volume"
                description="Total transaction volume over time"
                data={transactionsTrendData}
                type="area"
                series={[
                  { name: 'Transactions', dataKey: 'value', color: '#82ca9d' }
                ]}
                dateRanges={dateRanges}
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                showLegend={false}
                height={280}
                trend={{
                  value: 8.3,
                  direction: 'up',
                  label: 'increase'
                }}
                actions={[
                  { label: 'Download Data', action: handleExportData },
                  { label: 'View Full Report', action: () => { } }
                ]}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DataTable
                  columns={reportColumns}
                  data={reportData}
                  searchColumn="name"
                  searchPlaceholder="Search reports..."
                  onExportData={handleExportData}
                  pageSize={5}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Recent Report Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLog
                    activities={formattedActivities}
                    maxItems={5}
                    height={300}
                    showFilters={false}
                    showSearch={false}
                    compact={true}
                    onItemClick={handleActivityClick}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="returns" className="space-y-4 mt-0">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <MetricsChart
                title="Returns Trend"
                description="Number of returns filed over time"
                data={returnsTrendData}
                type="line"
                series={[
                  { name: 'Returns', dataKey: 'value', color: '#8884d8' },
                  { name: 'Processing Time', dataKey: 'processingTime', color: '#82ca9d' }
                ]}
                dateRanges={dateRanges}
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                showLegend={true}
                height={350}
                trend={{
                  value: 12.5,
                  direction: 'up',
                  label: 'increase'
                }}
                actions={[
                  { label: 'Download Data', action: handleExportData },
                  { label: 'View Full Report', action: () => { } }
                ]}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Returns by Type</CardTitle>
                  <CardDescription>Distribution of tax returns by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="mx-auto h-12 w-12 mb-2" />
                      <p>Pie chart visualization would be displayed here</p>
                      <p className="text-sm">
                        Individual: 7,843 | Business: 4,235 | Corporate: 2,508
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Returns Report Data</CardTitle>
                <CardDescription>Detailed information about tax returns</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { accessorKey: 'id', header: 'Return ID' },
                    { accessorKey: 'taxpayer', header: 'Taxpayer' },
                    { accessorKey: 'type', header: 'Type' },
                    { accessorKey: 'submissionDate', header: 'Submitted' },
                    { accessorKey: 'status', header: 'Status' },
                    { accessorKey: 'amount', header: 'Amount' },
                  ]}
                  data={[
                    { id: 'RTN-2025-001', taxpayer: 'John Doe', type: 'Individual', submissionDate: '2025-04-01', status: 'Processed', amount: 'KES 45,000' },
                    { id: 'RTN-2025-002', taxpayer: 'ABC Company', type: 'Corporate', submissionDate: '2025-04-02', status: 'Processed', amount: 'KES 120,000' },
                    { id: 'RTN-2025-003', taxpayer: 'Jane Smith', type: 'Individual', submissionDate: '2025-04-03', status: 'Pending', amount: 'KES 28,500' },
                    { id: 'RTN-2025-004', taxpayer: 'XYZ Ltd', type: 'Business', submissionDate: '2025-04-05', status: 'Processed', amount: 'KES 78,200' },
                    { id: 'RTN-2025-005', taxpayer: 'Mary Johnson', type: 'Individual', submissionDate: '2025-04-06', status: 'Processed', amount: 'KES 32,400' },
                  ]}
                  searchColumn="taxpayer"
                  searchPlaceholder="Search by taxpayer..."
                  onExportData={handleExportData}
                  pageSize={5}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-0">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <MetricsChart
                title="Transaction Volume"
                description="Total transaction volume over time"
                data={transactionsTrendData}
                type="area"
                series={[
                  { name: 'Transactions', dataKey: 'value', color: '#82ca9d' }
                ]}
                dateRanges={dateRanges}
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                showLegend={false}
                height={350}
                trend={{
                  value: 8.3,
                  direction: 'up',
                  label: 'increase'
                }}
                actions={[
                  { label: 'Download Data', action: handleExportData },
                  { label: 'View Full Report', action: () => { } }
                ]}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Summary</CardTitle>
                  <CardDescription>Key transaction metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-2">
                    <StatCard
                      title="Total Volume"
                      value="KES 2.4M"
                      icon={<CreditCard className="h-5 w-5 text-primary" />}
                      change={8.3}
                      trend="positive"
                    />
                    <StatCard
                      title="Avg. Transaction"
                      value="KES 4,250"
                      icon={<TrendingUp className="h-5 w-5 text-primary" />}
                      change={2.1}
                      trend="positive"
                    />
                    <StatCard
                      title="Success Rate"
                      value="98.2%"
                      icon={<BarChart className="h-5 w-5 text-primary" />}
                      change={0.5}
                      trend="positive"
                    />
                    <StatCard
                      title="Processing Time"
                      value="1.2s"
                      icon={<RefreshCw className="h-5 w-5 text-primary" />}
                      change={-5.3}
                      trend="positive"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Report Data</CardTitle>
                <CardDescription>Detailed information about financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { accessorKey: 'id', header: 'Transaction ID' },
                    { accessorKey: 'date', header: 'Date' },
                    { accessorKey: 'customer', header: 'Customer' },
                    { accessorKey: 'type', header: 'Type' },
                    { accessorKey: 'amount', header: 'Amount' },
                    { accessorKey: 'status', header: 'Status' },
                  ]}
                  data={[
                    { id: 'TRX-2025-001', date: '2025-04-10', customer: 'John Doe', type: 'Payment', amount: 'KES 12,500', status: 'Completed' },
                    { id: 'TRX-2025-002', date: '2025-04-09', customer: 'ABC Company', type: 'Refund', amount: 'KES 4,200', status: 'Completed' },
                    { id: 'TRX-2025-003', date: '2025-04-08', customer: 'Jane Smith', type: 'Payment', amount: 'KES 8,750', status: 'Completed' },
                    { id: 'TRX-2025-004', date: '2025-04-07', customer: 'XYZ Ltd', type: 'Payment', amount: 'KES 22,000', status: 'Failed' },
                    { id: 'TRX-2025-005', date: '2025-04-06', customer: 'Mary Johnson', type: 'Payment', amount: 'KES 5,800', status: 'Completed' },
                  ]}
                  searchColumn="customer"
                  searchPlaceholder="Search by customer..."
                  onExportData={handleExportData}
                  pageSize={5}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-0">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <MetricsChart
                title="User Growth"
                description="User growth over time"
                data={userTrendData}
                type="line"
                series={[
                  { name: 'Users', dataKey: 'value', color: '#8884d8' }
                ]}
                dateRanges={dateRanges}
                selectedRange={dateRange}
                onRangeChange={setDateRange}
                showLegend={false}
                height={350}
                trend={{
                  value: 4.1,
                  direction: 'up',
                  label: 'increase'
                }}
                actions={[
                  { label: 'Download Data', action: handleExportData },
                  { label: 'View Full Report', action: () => { } }
                ]}
              />

              <Card>
                <CardHeader>
                  <CardTitle>User Activity Summary</CardTitle>
                  <CardDescription>Key user metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 grid-cols-2">
                    <StatCard
                      title="Active Users"
                      value="6,248"
                      icon={<Users className="h-5 w-5 text-primary" />}
                      change={4.1}
                      trend="positive"
                    />
                    <StatCard
                      title="New Registrations"
                      value="245"
                      icon={<Users className="h-5 w-5 text-primary" />}
                      change={12.3}
                      trend="positive"
                    />
                    <StatCard
                      title="Avg. Session Time"
                      value="18m 42s"
                      icon={<RefreshCw className="h-5 w-5 text-primary" />}
                      change={2.5}
                      trend="positive"
                    />
                    <StatCard
                      title="Return Rate"
                      value="76.4%"
                      icon={<BarChart className="h-5 w-5 text-primary" />}
                      change={1.8}
                      trend="positive"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Report Data</CardTitle>
                <CardDescription>Detailed information about system users</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    { accessorKey: 'id', header: 'User ID' },
                    { accessorKey: 'name', header: 'Name' },
                    { accessorKey: 'email', header: 'Email' },
                    { accessorKey: 'role', header: 'Role' },
                    { accessorKey: 'lastActive', header: 'Last Active' },
                    { accessorKey: 'status', header: 'Status' },
                  ]}
                  data={[
                    { id: 'USR-2025-001', name: 'John Doe', email: 'john.doe@example.com', role: 'Taxpayer', lastActive: '2025-04-12', status: 'Active' },
                    { id: 'USR-2025-002', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Accountant', lastActive: '2025-04-11', status: 'Active' },
                    { id: 'USR-2025-003', name: 'Robert Johnson', email: 'robert.j@example.com', role: 'Taxpayer', lastActive: '2025-04-10', status: 'Active' },
                    { id: 'USR-2025-004', name: 'Mary Williams', email: 'mary.w@example.com', role: 'Administrator', lastActive: '2025-04-12', status: 'Active' },
                    { id: 'USR-2025-005', name: 'David Brown', email: 'david.b@example.com', role: 'Taxpayer', lastActive: '2025-04-05', status: 'Inactive' },
                  ]}
                  searchColumn="name"
                  searchPlaceholder="Search by name..."
                  onExportData={handleExportData}
                  pageSize={5}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>Reports scheduled for automatic generation</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={reportColumns}
                  data={reportData}
                  searchColumn="name"
                  searchPlaceholder="Search reports..."
                  onExportData={handleExportData}
                  pageSize={10}
                />
              </CardContent>
              <CardFooter>
                <Button onClick={handleGenerateReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Schedule New Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
