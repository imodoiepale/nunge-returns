'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Maximize2,
  ArrowDownIcon,
  ArrowUpIcon,
  MoreHorizontal
} from 'lucide-react'

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'stacked-bar'

export interface MetricsChartProps {
  title: string
  description?: string
  data: any[]
  type: ChartType
  categories?: string[]
  series: {
    name: string
    dataKey: string
    color?: string
  }[]
  labels?: {
    x?: string
    y?: string
  }
  height?: number
  width?: string
  dateRanges?: string[]
  selectedRange?: string
  onRangeChange?: (range: string) => void
  isLoading?: boolean
  showLegend?: boolean
  className?: string
  tooltipFormatter?: (value: number, name: string) => [string, string]
  emptyState?: React.ReactNode
  actions?: {
    label: string
    action: () => void
  }[]
  compact?: boolean
  showGrid?: boolean
  compareData?: any[]
  compareLabel?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label: string
  }
}

export function MetricsChart({
  title,
  description,
  data,
  type,
  categories,
  series,
  labels,
  height = 300,
  width = "100%",
  dateRanges,
  selectedRange,
  onRangeChange,
  isLoading = false,
  showLegend = true,
  className,
  tooltipFormatter,
  emptyState,
  actions,
  compact = false,
  showGrid = true,
  compareData,
  compareLabel,
  trend
}: MetricsChartProps) {
  
  const hasData = data && data.length > 0
  const chartHeight = compact ? Math.min(height, 200) : height
  
  const COLORS = series.map(s => s.color || 
    ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#d884d8'][series.indexOf(s) % 5])
  
  const renderChart = () => {
    if (!hasData) {
      return emptyState || (
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </div>
      )
    }
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin">
            <RefreshCw className="h-6 w-6 text-muted-foreground/50" />
          </div>
        </div>
      )
    }
    
    const tooltipContentStyle = { 
      backgroundColor: 'var(--background)', 
      border: '1px solid var(--border)', 
      borderRadius: '6px', 
      fontSize: '12px',
      padding: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
    
    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
      if (active && payload && payload.length) {
        return (
          <div className="custom-tooltip bg-background border p-2 rounded-md text-xs shadow-md">
            <p className="text-xs font-medium mb-1">{label}</p>
            {payload.map((entry, index) => {
              const formattedValue = tooltipFormatter 
                ? tooltipFormatter(entry.value as number, entry.name as string)[0]
                : entry.value
              
              return (
                <div key={`item-${index}`} className="flex items-center gap-2 py-0.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <p className="text-xs font-medium">
                    {entry.name}: <span className="font-bold">{formattedValue}</span>
                  </p>
                </div>
              )
            })}
            {compareLabel && compareData && (
              <div className="border-t mt-1 pt-1 text-xs text-muted-foreground">{compareLabel}</div>
            )}
          </div>
        )
      }
      
      return null
    }
    
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <LineChart 
              data={data} 
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  horizontal={true}
                  stroke="var(--border)"
                  opacity={0.2}
                />
              )}
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              )}
              {series.map((s, index) => (
                <Line 
                  key={s.dataKey}
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name}
                  stroke={s.color || COLORS[index]} 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4, strokeWidth: 1 }}
                />
              ))}
              {compareData && (
                <Line 
                  data={compareData}
                  type="monotone" 
                  dataKey={series[0].dataKey}
                  name={compareLabel || 'Previous'}
                  stroke={series[0].color || COLORS[0]}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )
        
      case 'area':
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <AreaChart 
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="var(--border)"
                  opacity={0.2}
                />
              )}
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              )}
              {series.map((s, index) => (
                <Area 
                  key={s.dataKey}
                  type="monotone" 
                  dataKey={s.dataKey} 
                  name={s.name}
                  fill={s.color || COLORS[index]} 
                  stroke={s.color || COLORS[index]}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )
        
      case 'bar':
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <BarChart 
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="var(--border)"
                  opacity={0.2}
                />
              )}
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              )}
              {series.map((s, index) => (
                <Bar 
                  key={s.dataKey}
                  dataKey={s.dataKey} 
                  name={s.name}
                  fill={s.color || COLORS[index]} 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={compact ? 30 : 40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
        
      case 'stacked-bar':
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <BarChart 
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="var(--border)"
                  opacity={0.2}
                />
              )}
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              )}
              {series.map((s, index) => (
                <Bar 
                  key={s.dataKey}
                  dataKey={s.dataKey} 
                  name={s.name}
                  stackId="a"
                  fill={s.color || COLORS[index]} 
                  radius={index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={compact ? 30 : 40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
        
      case 'pie':
        return (
          <ResponsiveContainer width={width} height={chartHeight}>
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                innerRadius={compact ? 30 : 50}
                outerRadius={compact ? 60 : 80}
                paddingAngle={2}
                dataKey={series[0].dataKey}
                nameKey="name"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {showLegend && (
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )
        
      default:
        return null
    }
  }
  
  return (
    <Card className={cn("bg-card relative overflow-hidden", className)}>
      <CardHeader className={cn("flex flex-row items-center justify-between pb-2", compact && "p-3")}>
        <div className="space-y-0">
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            {title}
            {trend && (
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-2 text-xs font-normal py-0 px-1 border-0", 
                  trend.direction === 'up' 
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500" 
                    : trend.direction === 'down' 
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500"
                )}
              >
                <span className="flex items-center gap-0.5">
                  {trend.direction === 'up' ? (
                    <ArrowUpIcon className="h-3 w-3" />
                  ) : trend.direction === 'down' ? (
                    <ArrowDownIcon className="h-3 w-3" />
                  ) : null}
                  {trend.value}% {trend.label}
                </span>
              </Badge>
            )}
          </CardTitle>
          {description && (
            <CardDescription className={compact ? "text-xs" : "text-sm"}>
              {description}
            </CardDescription>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {dateRanges && dateRanges.length > 0 && (
            <Select 
              value={selectedRange} 
              onValueChange={onRangeChange}
            >
              <SelectTrigger className="h-7 w-auto gap-1 text-xs bg-background">
                <Calendar className="h-3 w-3" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map(range => (
                  <SelectItem key={range} value={range} className="text-xs">
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {actions && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem 
                    key={index} 
                    onClick={action.action}
                    className="text-xs"
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={cn("px-2 pt-3", compact && "p-2 pt-0")}>
        {renderChart()}
      </CardContent>
    </Card>
  )
}
