'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { getSurveyForms, deleteSurveyForm } from '@/app/actions/survey-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, MoreVertical, Filter, Download, ArrowUpDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { exportToCSV, exportToExcel } from '@/lib/export-utils'
import { Label } from '@/components/ui/label'

type SurveyForm = {
  id: string
  district: string
  taluk: string | null
  village: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    shopEntries: number
  }
}

export default function SurveyFormsPage() {
  const router = useRouter()
  const [data, setData] = useState<SurveyForm[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    taluk: false,
    village: false,
    createdAt: false,
    updatedAt: false,
  })
  const [globalFilter, setGlobalFilter] = useState('')
  const [dateFilterFrom, setDateFilterFrom] = useState('')
  const [dateFilterTo, setDateFilterTo] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getSurveyForms()
      if (result.success && 'data' in result) {
        setData(result.data as SurveyForm[])
      } else {
        toast.error(result.error || 'Failed to load survey forms')
      }
    } catch (error) {
      toast.error('Error loading survey forms')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId || deleting) return

    try {
      setDeleting(true)
      const result = await deleteSurveyForm(deleteId)
      if (result.success) {
        toast.success('Survey form deleted successfully')
        setDeleteDialogOpen(false)
        setDeleteId(null)
        loadData()
      } else {
        toast.error(result.error || 'Failed to delete survey form')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the survey form')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<SurveyForm>[]>(
    () => [
      {
        accessorKey: 'district',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              District
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="pl-[15px] font-medium">{row.getValue('district')}</div>,
      },
      {
        accessorKey: 'taluk',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Taluk
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="pl-[15px]">{row.getValue('taluk') || '-'}</div>,
      },
      {
        accessorKey: 'village',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Village
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="pl-[15px]">{row.getValue('village') || '-'}</div>,
      },
      {
        accessorKey: '_count.shopEntries',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Shop Entries
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const count = row.original._count.shopEntries
          return <div className="pl-[15px]">{count}</div>
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Created
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'))
          return <div className="pl-[15px]">{date.toLocaleDateString()}</div>
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue('createdAt') as Date)
          const dateB = new Date(rowB.getValue('createdAt') as Date)
          return dateA.getTime() - dateB.getTime()
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Updated
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue('updatedAt'))
          return <div className="pl-[15px]">{date.toLocaleDateString()}</div>
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue('updatedAt') as Date)
          const dateB = new Date(rowB.getValue('updatedAt') as Date)
          return dateA.getTime() - dateB.getTime()
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const form = row.original
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/survey/${form.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteId(form.id)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  // Filter data based on date ranges
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Filter by created date range
    if (dateFilterFrom || dateFilterTo) {
      filtered = filtered.filter((form) => {
        const entryDate = new Date(form.createdAt)
        const fromDate = dateFilterFrom ? new Date(dateFilterFrom) : null
        const toDate = dateFilterTo ? new Date(dateFilterTo + 'T23:59:59') : null

        if (fromDate && entryDate < fromDate) return false
        if (toDate && entryDate > toDate) return false
        return true
      })
    }

    return filtered
  }, [data, dateFilterFrom, dateFilterTo])

  const handleExportCSV = () => {
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'actions')
      .map((col) => {
        const def = col.columnDef
        return {
          key: col.id,
          header: typeof def.header === 'string' ? def.header : col.id,
          accessor: (row: SurveyForm) => {
            if (col.id === '_count.shopEntries') return row._count.shopEntries
            const value = (row as any)[col.id]
            if (value instanceof Date) return value.toLocaleString()
            return value ?? ''
          },
        }
      })

    const rowsToExport = table.getRowModel().rows.map((row) => row.original)
    exportToCSV(rowsToExport, visibleColumns, 'survey-forms')
    toast.success('Exported to CSV successfully')
  }

  const handleExportExcel = () => {
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'actions')
      .map((col) => {
        const def = col.columnDef
        return {
          key: col.id,
          header: typeof def.header === 'string' ? def.header : col.id,
          accessor: (row: SurveyForm) => {
            if (col.id === '_count.shopEntries') return row._count.shopEntries
            const value = (row as any)[col.id]
            if (value instanceof Date) return value.toLocaleString()
            return value ?? ''
          },
        }
      })

    const rowsToExport = table.getRowModel().rows.map((row) => row.original)
    exportToExcel(rowsToExport, visibleColumns, 'survey-forms')
    toast.success('Exported to Excel successfully')
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto sm:py-8 sm:px-4 overflow-x-hidden">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto sm:py-8 sm:px-4 overflow-x-hidden">
      <Card className="border-0 sm:border shadow-none sm:shadow">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Survey Forms</CardTitle>
              <CardDescription className="text-sm">Manage survey forms and their entries</CardDescription>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/survey/new">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Survey Form</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4 mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="flex-1 min-w-[150px] sm:max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Columns</span>
                    <span className="sm:hidden">Cols</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id === '_count.shopEntries' ? 'Shop Entries' : column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem onClick={handleExportCSV}>
                    Export as CSV
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem onClick={handleExportExcel}>
                    Export as Excel
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="whitespace-nowrap"
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Hide Filters</span>
                    <span className="sm:hidden">Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Show Filters</span>
                    <span className="sm:hidden">Filters</span>
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Filters Section */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-2 sm:p-4 border rounded-md bg-muted/50">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="date-from" className="text-sm">Created Date From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFilterFrom}
                    onChange={(e) => setDateFilterFrom(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="date-to" className="text-sm">Created Date To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateFilterTo}
                    onChange={(e) => setDateFilterTo(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of {filteredData.length} entries
              {filteredData.length !== data.length && (
                <span className="hidden sm:inline"> (filtered from {data.length} total)</span>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex-1 sm:flex-initial"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex-1 sm:flex-initial"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteDialogOpen(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Survey Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this survey form? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

