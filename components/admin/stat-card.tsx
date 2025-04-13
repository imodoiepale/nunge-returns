                                                                                                                                                                                                                                                                                  'use client'

import React from 'react'
import { ArrowDown, ArrowUp, HelpCircle, MoreHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: number
  trend?: 'positive' | 'negative' | 'neutral'
  timeFrame?: string
  tooltip?: string
  isLoading?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'compact'
  actions?: {
    label: string
    action: () => void
  }[]
}

export function StatCard({
  title,
  value,
  icon,
  change,
  trend = 'neutral',
  timeFrame = 'from last month',
  tooltip,
  isLoading = false,
  className,
  variant = 'default',
  actions
}: StatCardProps) {
  
  const renderChange = () => {
    if (change === undefined) return null
    
    const trendColor = trend === 'positive' 
      ? 'text-emerald-500' 
      : trend === 'negative' 
        ? 'text-red-500' 
        : 'text-gray-500'
    
    const TrendIcon = trend === 'positive' 
      ? ArrowUp 
      : trend === 'negative' 
        ? ArrowDown 
        : null
    
    return (
      <div className={`flex items-center text-xs ${trendColor}`}>
        {TrendIcon && <TrendIcon className="mr-1 h-3 w-3" />}
        <span className="font-medium">{change}%</span>
        <span className="ml-1 text-muted-foreground">{timeFrame}</span>
      </div>
    )
  }
  
  const variants = {
    default: {
      container: "p-4 relative bg-card hover:bg-card/80 transition-colors",
      iconContainer: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10",
      valueContainer: "mt-2",
      titleText: "text-sm font-medium text-muted-foreground",
      valueText: "text-2xl font-bold tracking-tight"
    },
    outline: {
      container: "p-4 relative bg-background border border-primary/20 hover:border-primary/40 transition-colors",
      iconContainer: "flex h-8 w-8 items-center justify-center rounded-full bg-primary/10",
      valueContainer: "mt-2",
      titleText: "text-sm font-medium text-muted-foreground",
      valueText: "text-2xl font-bold tracking-tight"
    },
    compact: {
      container: "p-2 relative bg-card hover:bg-card/80 transition-colors",
      iconContainer: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10",
      valueContainer: "mt-1",
      titleText: "text-xs font-medium text-muted-foreground",
      valueText: "text-lg font-bold tracking-tight"
    }
  }
  
  const variantStyles = variants[variant]
  
  return (
    <Card className={cn(variantStyles.container, className)}>
      {actions && (
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md border border-input bg-background text-sm text-muted-foreground shadow-sm">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => (
                <DropdownMenuItem 
                  key={index} 
                  onClick={(e) => {
                    e.preventDefault()
                    action.action()
                  }}
                  className="text-xs"
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <p className={variantStyles.titleText}>{title}</p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-60 text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className={variantStyles.valueContainer}>
            {isLoading ? (
              <div className={cn(variantStyles.valueText, "h-6 w-24 animate-pulse rounded-md bg-muted")} />
            ) : (
              <p className={variantStyles.valueText}>{value}</p>
            )}
            {!isLoading && renderChange()}
          </div>
        </div>
        <div className={variantStyles.iconContainer}>
          {React.cloneElement(icon as React.ReactElement, { 
            className: 'h-4 w-4 text-primary' 
          })}
        </div>
      </div>
    </Card>
  )
}
