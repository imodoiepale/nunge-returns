import { BarChart, FileText, Users, CreditCard, CalendarDays, BarChartIcon, Layers, PieChart } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { ActivityItem } from '@/components/admin/activity-log'
import { StatusBadge } from '@/components/admin/data-table'
import { Button } from '@/components/ui/button'

export function getReportingData() {
  // Overview stat cards data
  const overviewData = [
    {
      title: 'Total Returns',
      value: '14,586',
      icon: FileText,
      change: 12.5,
      trend: 'positive' as const,
      tooltip: 'Total tax returns filed through the platform'
    },
    {
      title: 'Total Users',
      value: '8,942',
      icon: Users,
      change: 8.3,
      trend: 'positive' as const,
      tooltip: 'Total registered users on the platform'
    },
    {
      title: 'Transaction Volume',
      value: 'KES 12.8M',
      icon: CreditCard,
      change: -2.7,
      trend: 'negative' as const,
      tooltip: 'Total transaction volume processed'
    },
    {
      title: 'Avg. Completion Time',
      value: '2.4 days',
      icon: CalendarDays,
      change: 5.1,
      trend: 'positive' as const,
      tooltip: 'Average time to complete a tax return'
    }
  ]

  // Returns trend data
  const returnsTrendData = [
    { name: 'Jan', value: 452, processingTime: 54 },
    { name: 'Feb', value: 478, processingTime: 48 },
    { name: 'Mar', value: 512, processingTime: 42 },
    { name: 'Apr', value: 534, processingTime: 38 },
    { name: 'May', value: 586, processingTime: 35 },
    { name: 'Jun', value: 628, processingTime: 28 },
    { name: 'Jul', value: 712, processingTime: 24 },
    { name: 'Aug', value: 756, processingTime: 20 },
    { name: 'Sep', value: 824, processingTime: 18 },
    { name: 'Oct', value: 912, processingTime: 16 },
    { name: 'Nov', value: 978, processingTime: 15 },
    { name: 'Dec', value: 1024, processingTime: 16 }
  ]

  // Transactions trend data
  const transactionsTrendData = [
    { name: 'Jan', value: 452000 },
    { name: 'Feb', value: 478000 },
    { name: 'Mar', value: 512000 },
    { name: 'Apr', value: 534000 },
    { name: 'May', value: 586000 },
    { name: 'Jun', value: 628000 },
    { name: 'Jul', value: 712000 },
    { name: 'Aug', value: 756000 },
    { name: 'Sep', value: 824000 },
    { name: 'Oct', value: 912000 },
    { name: 'Nov', value: 978000 },
    { name: 'Dec', value: 1024000 }
  ]

  // User trend data
  const userTrendData = [
    { name: 'Jan', value: 324 },
    { name: 'Feb', value: 386 },
    { name: 'Mar', value: 412 },
    { name: 'Apr', value: 456 },
    { name: 'May', value: 512 },
    { name: 'Jun', value: 578 },
    { name: 'Jul', value: 612 },
    { name: 'Aug', value: 656 },
    { name: 'Sep', value: 712 },
    { name: 'Oct', value: 756 },
    { name: 'Nov', value: 798 },
    { name: 'Dec', value: 854 }
  ]

  // Documents trend data
  const documentsTrendData = [
    { name: 'Jan', value: 1254 },
    { name: 'Feb', value: 1356 },
    { name: 'Mar', value: 1478 },
    { name: 'Apr', value: 1524 },
    { name: 'May', value: 1612 },
    { name: 'Jun', value: 1756 },
    { name: 'Jul', value: 1823 },
    { name: 'Aug', value: 1942 },
    { name: 'Sep', value: 2034 },
    { name: 'Oct', value: 2156 },
    { name: 'Nov', value: 2278 },
    { name: 'Dec', value: 2354 }
  ]

  // Returns by type data
  const returnsByTypeData = [
    { name: 'Individual', value: 8546, color: '#8884d8' },
    { name: 'Business', value: 3721, color: '#82ca9d' },
    { name: 'Corporate', value: 1592, color: '#ffc658' },
    { name: 'Partnership', value: 727, color: '#ff8042' }
  ]

  // Report data and other data elements
  // Rest of the function...

  // Make sure we return the complete object with all data
  return {
    overviewData,
    returnsTrendData,
    transactionsTrendData,
    userTrendData,
    documentsTrendData,
    recentActivities: [],
    reportColumns: [],
    reportData: [],
    returnsByTypeData
  }
}
