'use client'

import { 
  BarChart, 
  FileText, 
  Users, 
  CreditCard,
  RefreshCw,
  Download,
  FileDown
} from 'lucide-react'

// Mock data for reporting dashboard
export function getReportingData() {
  // Overview data with stats
  const overviewData = [
    {
      title: 'Total Returns',
      value: '14,586',
      icon: <FileText className="h-5 w-5 text-primary" />,
      change: 12.5,
      trend: 'positive',
      tooltip: 'Total tax returns filed across all categories'
    },
    {
      title: 'Total Transactions',
      value: 'KES 2.4M',
      icon: <CreditCard className="h-5 w-5 text-primary" />,
      change: 8.3,
      trend: 'positive',
      tooltip: 'Total value of transactions processed'
    },
    {
      title: 'Active Users',
      value: '6,248',
      icon: <Users className="h-5 w-5 text-primary" />,
      change: 4.1,
      trend: 'positive',
      tooltip: 'Number of active users in the system'
    },
    {
      title: 'Avg. Processing Time',
      value: '2.4 days',
      icon: <RefreshCw className="h-5 w-5 text-primary" />,
      change: -5.1,
      trend: 'positive',
      tooltip: 'Average time to process a tax return'
    },
  ]

  // Returns trend data for charts
  const returnsTrendData = [
    { name: 'Jan', value: 1250, processingTime: 3.2 },
    { name: 'Feb', value: 1350, processingTime: 3.0 },
    { name: 'Mar', value: 1400, processingTime: 2.8 },
    { name: 'Apr', value: 1600, processingTime: 2.7 },
    { name: 'May', value: 1750, processingTime: 2.6 },
    { name: 'Jun', value: 1850, processingTime: 2.5 },
    { name: 'Jul', value: 2000, processingTime: 2.4 },
    { name: 'Aug', value: 2200, processingTime: 2.3 },
    { name: 'Sep', value: 2400, processingTime: 2.2 },
    { name: 'Oct', value: 2600, processingTime: 2.1 },
    { name: 'Nov', value: 2800, processingTime: 2.0 },
    { name: 'Dec', value: 3000, processingTime: 1.9 },
  ]

  // Transaction trend data for charts
  const transactionsTrendData = [
    { name: 'Jan', value: 120000 },
    { name: 'Feb', value: 140000 },
    { name: 'Mar', value: 160000 },
    { name: 'Apr', value: 180000 },
    { name: 'May', value: 210000 },
    { name: 'Jun', value: 240000 },
    { name: 'Jul', value: 260000 },
    { name: 'Aug', value: 280000 },
    { name: 'Sep', value: 310000 },
    { name: 'Oct', value: 340000 },
    { name: 'Nov', value: 360000 },
    { name: 'Dec', value: 400000 },
  ]

  // User trend data for charts
  const userTrendData = [
    { name: 'Jan', value: 3800 },
    { name: 'Feb', value: 4100 },
    { name: 'Mar', value: 4300 },
    { name: 'Apr', value: 4600 },
    { name: 'May', value: 4800 },
    { name: 'Jun', value: 5000 },
    { name: 'Jul', value: 5200 },
    { name: 'Aug', value: 5400 },
    { name: 'Sep', value: 5600 },
    { name: 'Oct', value: 5800 },
    { name: 'Nov', value: 6000 },
    { name: 'Dec', value: 6200 },
  ]

  // Documents trend data for charts
  const documentsTrendData = [
    { name: 'Jan', value: 2400 },
    { name: 'Feb', value: 2600 },
    { name: 'Mar', value: 2800 },
    { name: 'Apr', value: 3000 },
    { name: 'May', value: 3200 },
    { name: 'Jun', value: 3400 },
    { name: 'Jul', value: 3600 },
    { name: 'Aug', value: 3800 },
    { name: 'Sep', value: 4000 },
    { name: 'Oct', value: 4200 },
    { name: 'Nov', value: 4400 },
    { name: 'Dec', value: 4600 },
  ]

  // Returns by type data for pie chart
  const returnsByTypeData = [
    { name: 'Individual', value: 7843 },
    { name: 'Business', value: 4235 },
    { name: 'Corporate', value: 2508 },
  ]

  // Recent activities data for activity log
  const recentActivities = [
    {
      id: 1,
      type: 'report',
      title: 'Monthly Returns Report Generated',
      description: 'Monthly tax returns summary report was generated and downloaded.',
      timestamp: new Date('2025-04-12T08:30:00'),
      user: {
        name: 'Admin User',
        email: 'admin@nungereturns.com',
      },
      status: 'completed'
    },
    {
      id: 2,
      type: 'export',
      title: 'Transaction Data Exported',
      description: 'Transaction data for Q1 2025 was exported to Excel format.',
      timestamp: new Date('2025-04-11T15:45:00'),
      user: {
        name: 'Finance Manager',
        email: 'finance@nungereturns.com',
      },
      status: 'completed'
    },
    {
      id: 3,
      type: 'filter',
      title: 'Custom Report Parameters Set',
      description: 'Custom report parameters were configured for monthly user activity.',
      timestamp: new Date('2025-04-11T11:20:00'),
      user: {
        name: 'Analytics Team',
        email: 'analytics@nungereturns.com',
      },
      status: 'pending'
    },
    {
      id: 4,
      type: 'refresh',
      title: 'Dashboard Data Refreshed',
      description: 'All reporting dashboard metrics were manually refreshed.',
      timestamp: new Date('2025-04-10T16:10:00'),
      user: {
        name: 'Admin User',
        email: 'admin@nungereturns.com',
      },
      status: 'completed'
    },
    {
      id: 5,
      type: 'schedule',
      title: 'Weekly Report Scheduled',
      description: 'New weekly returns summary report has been scheduled for delivery.',
      timestamp: new Date('2025-04-10T10:30:00'),
      user: {
        name: 'Department Manager',
        email: 'manager@nungereturns.com',
      },
      status: 'completed'
    }
  ]

  // Report table columns configuration
  const reportColumns = [
    {
      accessorKey: 'name',
      header: 'Report Name',
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'lastRun',
      header: 'Last Generated',
    },
    {
      accessorKey: 'frequency',
      header: 'Frequency',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
    },
  ]

  // Report table data
  const reportData = [
    {
      id: 1,
      name: 'Monthly Returns Summary',
      type: 'Returns',
      lastRun: '2025-04-01',
      frequency: 'Monthly',
      status: 'Active',
      actions: [
        { icon: <Download className="h-4 w-4" />, label: 'Download', action: () => {} },
        { icon: <RefreshCw className="h-4 w-4" />, label: 'Run Now', action: () => {} },
      ]
    },
    {
      id: 2,
      name: 'Transaction Volume Report',
      type: 'Finance',
      lastRun: '2025-04-05',
      frequency: 'Weekly',
      status: 'Active',
      actions: [
        { icon: <Download className="h-4 w-4" />, label: 'Download', action: () => {} },
        { icon: <RefreshCw className="h-4 w-4" />, label: 'Run Now', action: () => {} },
      ]
    },
    {
      id: 3,
      name: 'User Activity Log',
      type: 'Users',
      lastRun: '2025-04-11',
      frequency: 'Daily',
      status: 'Active',
      actions: [
        { icon: <Download className="h-4 w-4" />, label: 'Download', action: () => {} },
        { icon: <RefreshCw className="h-4 w-4" />, label: 'Run Now', action: () => {} },
      ]
    },
    {
      id: 4,
      name: 'Processing Time Analysis',
      type: 'Performance',
      lastRun: '2025-04-01',
      frequency: 'Monthly',
      status: 'Inactive',
      actions: [
        { icon: <Download className="h-4 w-4" />, label: 'Download', action: () => {} },
        { icon: <RefreshCw className="h-4 w-4" />, label: 'Run Now', action: () => {} },
      ]
    },
    {
      id: 5,
      name: 'Quarterly Compliance Report',
      type: 'Compliance',
      lastRun: '2025-03-31',
      frequency: 'Quarterly',
      status: 'Active',
      actions: [
        { icon: <Download className="h-4 w-4" />, label: 'Download', action: () => {} },
        { icon: <RefreshCw className="h-4 w-4" />, label: 'Run Now', action: () => {} },
      ]
    },
  ]

  return {
    overviewData,
    returnsTrendData,
    transactionsTrendData,
    userTrendData,
    documentsTrendData,
    returnsByTypeData,
    recentActivities,
    reportColumns,
    reportData
  }
}
