'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Download, ChevronDown, Search, Filter, X } from 'lucide-react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchColumn?: string
  searchPlaceholder?: string
  getRowId?: (row: TData) => string
  onExportData?: () => void
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  getRowId,
  onExportData,
  pageSize = 10
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [rowSelection, setRowSelection] = React.useState({})

  // Prepare columns with index column as first column
  const columnsWithIndex = React.useMemo(() => {
    const indexColumn: ColumnDef<TData, TValue> = {
      id: 'index',
      header: '#',
      cell: ({ row }) => {
        const pageIndex = table?.getState()?.pagination?.pageIndex || 0;
        const pageSize = table?.getState()?.pagination?.pageSize || 10;
        return <span className="text-xs text-muted-foreground">{pageIndex * pageSize + row.index + 1}</span>;
      },
      enableSorting: false,
      enableHiding: false,
    };
    
    return [indexColumn, ...columns];
  }, [columns]);

  const table = useReactTable({
    data,
    columns: columnsWithIndex,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize
      },
      columnVisibility: {
        index: true // Always show the index column
      }
    }
  })

  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchColumn) {
      setColumnFilters(prev => {
        const existing = prev.find(filter => filter.id === searchColumn);
        if (!value && existing) {
          return prev.filter(filter => filter.id !== searchColumn);
        } else if (value && !existing) {
          return [...prev, { id: searchColumn, value }];
        } else if (value && existing) {
          return prev.map(filter => 
            filter.id === searchColumn ? { ...filter, value } : filter
          );
        }
        return prev;
      });
    } else {
      setGlobalFilter(value);
    }
  }, [searchColumn]);

  return (
    <Card className="border bg-card shadow-sm">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchColumn 
                ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
                : globalFilter}
              onChange={handleSearchChange}
              className="pl-8 w-full md:w-[300px] h-8 bg-background"
            />
            {(searchColumn 
              ? (table.getColumn(searchColumn)?.getFilterValue() as string)
              : globalFilter) && (
              <X 
                className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => searchColumn 
                  ? table.getColumn(searchColumn)?.setFilterValue("")
                  : setGlobalFilter("")}
              />
            )}
          </div>
          <div className="hidden md:flex items-center space-x-1">
            {table.getColumn("status") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 h-8 border-dashed flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="p-2">
                    {/* This is a simplified example, you can expand with actual filter controls */}
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => table.getColumn("status")?.setFilterValue("active")}
                          className="h-7 text-xs"
                        >
                          Active
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => table.getColumn("status")?.setFilterValue("inactive")}
                          className="h-7 text-xs"
                        >
                          Inactive
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => table.getColumn("status")?.setFilterValue("")}
                        className="h-7 text-xs mt-1"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto h-8">
                <span className="sr-only md:not-sr-only md:inline-block">Columns</span>
                <ChevronDown className="h-3.5 w-3.5 md:ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onExportData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportData} 
              className="hidden md:flex h-8 gap-1 items-center"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>
      <div className="relative w-full overflow-auto">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-b bg-muted/50 hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead 
                    key={header.id}
                    className={cn(
                      "h-9 px-2 text-xs font-medium",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <div className="w-4">
                            {{
                              asc: <span className="text-xs ml-1">↑</span>,
                              desc: <span className="text-xs ml-1">↓</span>,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b hover:bg-muted/50"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="p-2 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-2 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-xs font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-xs font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <span className="text-xs">«</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <span className="text-xs">‹</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <span className="text-xs">›</span>
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <span className="text-xs">»</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function StatusBadge({ status, className }: { status: string, className?: string }) {
  let badgeStyles = '';
  
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'processed':
      badgeStyles = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
      break;
    case 'pending':
      badgeStyles = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      break;
    case 'inactive':
    case 'failed':
      badgeStyles = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
      break;
    default:
      badgeStyles = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500';
  }
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-normal border-0 rounded-full px-2 capitalize py-0.5 text-xs", 
        badgeStyles,
        className
      )}
    >
      {status}
    </Badge>
  );
}
