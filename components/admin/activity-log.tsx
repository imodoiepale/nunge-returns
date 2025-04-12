'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Check,
  X,
  AlertTriangle, 
  Info, 
  Clock, 
  RefreshCw, 
  User, 
  FileText, 
  Download,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type ActivityType = 
  | 'import' 
  | 'export' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'report' 
  | 'filter' 
  | 'schedule'
  | 'auth'
  | 'user'
  | 'return'
  | 'transaction'
  | 'document'
  | 'partner'
  | 'system'

export type ActivityStatus = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'pending'

export interface ActivityItem {
  id: string | number
  type: ActivityType
  title: string
  description?: string
  timestamp: string | Date
  status: ActivityStatus
  user?: {
    name: string
    email: string
  }
  metadata?: Record<string, any>
  read?: boolean
}

interface ActivityLogProps {
  activities: ActivityItem[]
  title?: string
  description?: string
  isLoading?: boolean
  maxItems?: number
  showFilters?: boolean
  showSearch?: boolean
  className?: string
  onRefresh?: () => void
  onViewAll?: () => void
  onItemClick?: (activity: ActivityItem) => void
  onFilterChange?: (filters: string[]) => void
  emptyState?: React.ReactNode
  compact?: boolean
  height?: number
  actionsSlot?: React.ReactNode
}

export function ActivityLog({
  activities,
  title = "Recent Activity",
  description,
  isLoading = false,
  maxItems = 8,
  showFilters = true,
  showSearch = true,
  className,
  onRefresh,
  onViewAll,
  onItemClick,
  onFilterChange,
  emptyState,
  compact = false,
  height = 400,
  actionsSlot
}: ActivityLogProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<ActivityType[]>([]);

  // Filter to show only up to maxItems
  const displayActivities = React.useMemo(() => {
    // Apply filter if needed
    let filteredActivities = activities;

    if (selectedFilters.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        selectedFilters.includes(activity.type)
      );
    }

    // Apply search if needed
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredActivities = filteredActivities.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        (activity.description?.toLowerCase().includes(query) ?? false) ||
        (activity.user?.name.toLowerCase().includes(query) ?? false)
      );
    }

    // Apply limit
    return filteredActivities.slice(0, maxItems);
  }, [activities, selectedFilters, searchQuery, maxItems]);
  
  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-slate-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };
  
  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'import':
        return <Download className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'create':
        return <FileText className="h-4 w-4" />;
      case 'update':
        return <RefreshCw className="h-4 w-4" />;
      case 'delete':
        return <X className="h-4 w-4" />;
      case 'report':
        return <FileText className="h-4 w-4" />;
      case 'filter':
        return <Filter className="h-4 w-4" />;
      case 'schedule':
        return <Clock className="h-4 w-4" />;
      case 'auth':
        return <User className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'return':
        return <FileText className="h-4 w-4" />;
      case 'transaction':
        return <Download className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'partner':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  const formatTime = (timestamp: Date | string) => {
    if (!(timestamp instanceof Date) && typeof timestamp === 'string') {
      timestamp = new Date(timestamp);
    }
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterToggle = (type: ActivityType) => {
    setSelectedFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    
    if (onFilterChange) {
      const newFilters = selectedFilters.includes(type)
        ? selectedFilters.filter(t => t !== type)
        : [...selectedFilters, type];
      onFilterChange(newFilters);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
            )}
            {actionsSlot}
          </div>
        </div>
        {showSearch && (
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        )}
        {showFilters && selectedFilters.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedFilters.map(filter => (
              <Badge 
                key={filter} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filter}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleFilterToggle(filter)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {filter} filter</span>
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(var(--activity-height))]" style={{ '--activity-height': `${height}px` } as React.CSSProperties}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayActivities.length > 0 ? (
            <div className={cn('space-y-1 p-1', compact ? 'py-0' : 'py-1')}>
              {displayActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 rounded-md p-3 cursor-pointer',
                    compact ? 'hover:bg-muted/30' : 'hover:bg-muted/50'
                  )}
                  onClick={() => onItemClick && onItemClick(activity)}
                >
                  <div className="mt-0.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getTypeIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <div className="flex gap-1 items-center">
                        {getStatusIcon(activity.status)}
                        <span className="text-xs capitalize">{activity.status}</span>
                      </div>
                    </div>
                    {activity.description && !compact && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.user && (
                        <span className="truncate max-w-[100px]">{activity.user.name}</span>
                      )}
                      <span>•</span>
                      <span>{formatTime(activity.timestamp)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="h-5 px-1.5 text-xs capitalize">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              {emptyState || (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {onViewAll && (
        <CardFooter className="pb-3 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={onViewAll}
          >
            View All Activity
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}