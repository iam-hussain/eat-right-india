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
import { getShopEntries, deleteShopEntry } from '@/app/actions/shop-entry'
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
import { Plus, Edit, Trash2, Filter, Download, ArrowUpDown, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { exportToCSV, exportToExcel } from '@/lib/export-utils'
import { Label } from '@/components/ui/label'

type ShopEntry = {
  id: string
  surveyDate: Date
  shopName: string
  shopAddress: string
  phoneNumber: string | null
  shopType: string
  hasLicense: string
  licenseNumber: string | null
  licenseExpiryDate: Date | null
  fostacTraining: string
  licenseType: string | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  surveyForm: {
    id: string
    district: string
    taluk: string | null
    village: string | null
  }
  surveyor: {
    id: string
    displayName: string
  } | null
}

const shopTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  BAKERY: 'Bakery',
  SWEET_SHOP: 'Sweet Shop',
  GROCERY_STORE: 'Grocery Store',
  MEAT_SHOP: 'Meat Shop',
  DAIRY_SHOP: 'Dairy Shop',
  BEVERAGE_SHOP: 'Beverage Shop',
  FOOD_PROCESSING_UNIT: 'Food Processing Unit',
  CATERING_SERVICE: 'Catering Service',
  OTHER: 'Other',
}

export default function ShopEntriesPage() {
  const router = useRouter()
  const [data, setData] = useState<ShopEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    phoneNumber: false,
    licenseExpiryDate: false,
    licenseType: false,
    remarks: false,
    surveyor: false,
    createdAt: false,
    district: false,
    taluk: false,
    village: false,
  })
  const [globalFilter, setGlobalFilter] = useState('')
  const [surveyFormView, setSurveyFormView] = useState<'combined' | 'separate'>('combined')
  const [dateFilterFrom, setDateFilterFrom] = useState('')
  const [dateFilterTo, setDateFilterTo] = useState('')
  const [licenseExpiryFrom, setLicenseExpiryFrom] = useState('')
  const [licenseExpiryTo, setLicenseExpiryTo] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getShopEntries()
      if (result.success && 'data' in result) {
        setData(result.data as ShopEntry[])
      } else {
        toast.error(result.error || 'Failed to load shop entries')
      }
    } catch (error) {
      toast.error('Error loading shop entries')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const result = await deleteShopEntry(deleteId)
    if (result.success) {
      toast.success('Shop entry deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteId(null)
      loadData()
    } else {
      toast.error(result.error || 'Failed to delete shop entry')
    }
  }

  const columns = useMemo<ColumnDef<ShopEntry>[]>(
    () => {
      const baseColumns: ColumnDef<ShopEntry>[] = [
        {
          accessorKey: 'shopName',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 px-0"
              >
                Shop Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          cell: ({ row }) => (
            <Link
              href={`/entries/${row.original.id}`}
              className="pl-[15px] font-medium min-w-[120px] sm:min-w-[150px] text-primary hover:underline"
            >
              {row.getValue('shopName')}
            </Link>
          ),
          size: 150,
          minSize: 120,
        },
        {
          accessorKey: 'shopType',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 px-0"
              >
                Shop Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          cell: ({ row }) => {
            const type = row.getValue('shopType') as string
            return <div className="pl-[15px] min-w-[100px] sm:min-w-[120px] whitespace-nowrap">{shopTypeLabels[type] || type}</div>
          },
          size: 120,
          minSize: 100,
        },
      ]

      // Add Survey Form columns based on view mode
      if (surveyFormView === 'combined') {
        baseColumns.push(        {
          id: 'surveyForm',
          header: 'Survey Form',
          cell: ({ row }) => {
            const form = row.original.surveyForm
            return (
              <div className="min-w-[180px] sm:min-w-[220px]">
                <div className="font-medium">{form.district}</div>
                {form.taluk && (
                  <div className="text-sm text-muted-foreground">Taluk: {form.taluk}</div>
                )}
                {form.village && (
                  <div className="text-sm text-muted-foreground">Village: {form.village}</div>
                )}
              </div>
            )
          },
          size: 220,
          minSize: 180,
        })
      } else {
        baseColumns.push(
          {
            accessorFn: (row) => row.surveyForm.district,
            id: 'district',
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
            cell: ({ row }) => <div className="pl-[15px] min-w-[100px] sm:min-w-[120px]">{row.original.surveyForm.district}</div>,
            size: 120,
            minSize: 100,
          },
          {
            accessorFn: (row) => row.surveyForm.taluk,
            id: 'taluk',
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
            cell: ({ row }) => <div className="pl-[15px] min-w-[100px] sm:min-w-[120px]">{row.original.surveyForm.taluk || '-'}</div>,
            size: 120,
            minSize: 100,
          },
          {
            accessorFn: (row) => row.surveyForm.village,
            id: 'village',
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
            cell: ({ row }) => <div className="pl-[15px] min-w-[100px] sm:min-w-[120px]">{row.original.surveyForm.village || '-'}</div>,
            size: 120,
            minSize: 100,
          }
        )
      }

      // Add remaining columns
      baseColumns.push(
        {
          accessorKey: 'shopAddress',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 px-0"
              >
                Address
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          cell: ({ row }) => {
            const address = row.getValue('shopAddress') as string
            return <div className="pl-[15px] min-w-[150px] sm:min-w-[200px] max-w-xs truncate">{address}</div>
          },
          size: 200,
          minSize: 150,
      },
        {
          accessorKey: 'phoneNumber',
          header: 'Phone',
          cell: ({ row }) => {
            const phone = row.getValue('phoneNumber') as string | null
            return <div className="min-w-[100px] sm:min-w-[120px] whitespace-nowrap">{phone || '-'}</div>
          },
          size: 120,
          minSize: 100,
        },
      {
        accessorKey: 'hasLicense',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Has License
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
          cell: ({ row }) => {
            const hasLicense = row.getValue('hasLicense') as string
            return (
              <div className={`pl-[15px] min-w-[80px] sm:min-w-[100px] whitespace-nowrap ${hasLicense === 'YES' ? 'text-green-600' : 'text-gray-500'}`}>
                {hasLicense}
              </div>
            )
          },
          size: 100,
          minSize: 80,
      },
      {
        accessorKey: 'licenseNumber',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              License Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
          cell: ({ row }) => {
            const license = row.getValue('licenseNumber') as string | null
            return <div className="pl-[15px] min-w-[120px] sm:min-w-[150px] whitespace-nowrap">{license || '-'}</div>
          },
          size: 150,
          minSize: 120,
      },
      {
        accessorKey: 'licenseExpiryDate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              License Expiry
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
          cell: ({ row }) => {
            const date = row.getValue('licenseExpiryDate') as Date | null
            return <div className="pl-[15px] min-w-[110px] sm:min-w-[130px] whitespace-nowrap">{date ? new Date(date).toLocaleDateString() : '-'}</div>
          },
          size: 130,
          minSize: 110,
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.getValue('licenseExpiryDate') as Date | null
          const dateB = rowB.getValue('licenseExpiryDate') as Date | null
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return dateA.getTime() - dateB.getTime()
        },
      },
      {
        accessorKey: 'licenseType',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              License Type
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
          cell: ({ row }) => {
            const type = row.getValue('licenseType') as string | null
            return <div className="pl-[15px] min-w-[120px] sm:min-w-[150px] whitespace-nowrap">{type || '-'}</div>
          },
          size: 150,
          minSize: 120,
      },
      {
        accessorKey: 'fostacTraining',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              FOSTAC
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
          cell: ({ row }) => {
            const training = row.getValue('fostacTraining') as string
            return (
              <div className={`pl-[15px] min-w-[80px] sm:min-w-[100px] whitespace-nowrap ${training === 'YES' ? 'text-green-600' : 'text-gray-500'}`}>
                {training}
              </div>
            )
          },
          size: 100,
          minSize: 80,
      },
      {
        accessorKey: 'surveyDate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Survey Date & Time
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue('surveyDate'))
          return (
            <div className="pl-[15px] min-w-[140px] sm:min-w-[160px]">
              <div className="whitespace-nowrap">{date.toLocaleDateString()}</div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">{date.toLocaleTimeString()}</div>
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue('surveyDate') as Date)
          const dateB = new Date(rowB.getValue('surveyDate') as Date)
          return dateA.getTime() - dateB.getTime()
        },
        size: 160,
        minSize: 140,
      },
      {
        accessorFn: (row) => row.surveyor?.displayName || '',
        id: 'surveyor',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-0"
            >
              Surveyor
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
          cell: ({ row }) => {
            const surveyor = row.original.surveyor
            return <div className="pl-[15px] min-w-[100px] sm:min-w-[120px] whitespace-nowrap">{surveyor?.displayName || '-'}</div>
          },
          size: 120,
          minSize: 100,
      },
      {
        accessorKey: 'remarks',
        header: 'Remarks',
          cell: ({ row }) => {
            const remarks = row.getValue('remarks') as string | null
            return <div className="min-w-[120px] sm:min-w-[150px] max-w-xs truncate">{remarks || '-'}</div>
          },
          size: 150,
          minSize: 120,
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
            return <div className="pl-[15px] min-w-[110px] sm:min-w-[130px] whitespace-nowrap">{date.toLocaleDateString()}</div>
          },
          size: 130,
          minSize: 110,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue('createdAt') as Date)
          const dateB = new Date(rowB.getValue('createdAt') as Date)
          return dateA.getTime() - dateB.getTime()
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const entry = row.original
          return (
            <div className="flex gap-2 min-w-[140px] sm:min-w-[160px]">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/entries/${entry.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/entries/${entry.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteId(entry.id)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
        size: 160,
        minSize: 140,
      }
      )

      return baseColumns
    },
    [surveyFormView]
  )

  // Filter data based on date ranges
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Filter by survey date range
    if (dateFilterFrom || dateFilterTo) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.surveyDate)
        const fromDate = dateFilterFrom ? new Date(dateFilterFrom) : null
        const toDate = dateFilterTo ? new Date(dateFilterTo + 'T23:59:59') : null

        if (fromDate && entryDate < fromDate) return false
        if (toDate && entryDate > toDate) return false
        return true
      })
    }

    // Filter by license expiry date range
    if (licenseExpiryFrom || licenseExpiryTo) {
      filtered = filtered.filter((entry) => {
        if (!entry.licenseExpiryDate) return false
        const entryDate = new Date(entry.licenseExpiryDate)
        const fromDate = licenseExpiryFrom ? new Date(licenseExpiryFrom) : null
        const toDate = licenseExpiryTo ? new Date(licenseExpiryTo + 'T23:59:59') : null

        if (fromDate && entryDate < fromDate) return false
        if (toDate && entryDate > toDate) return false
        return true
      })
    }

    return filtered
  }, [data, dateFilterFrom, dateFilterTo, licenseExpiryFrom, licenseExpiryTo])

  const handleExportCSV = () => {
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'actions')
      .map((col) => {
        const def = col.columnDef
        return {
          key: col.id,
          header: typeof def.header === 'string' ? def.header : col.id,
          accessor: (row: ShopEntry) => {
            if (col.id === 'surveyForm') {
              const form = row.surveyForm
              return `${form.district}${form.taluk ? `, ${form.taluk}` : ''}${form.village ? `, ${form.village}` : ''}`
            }
            if (col.id === 'district') return row.surveyForm.district
            if (col.id === 'taluk') return row.surveyForm.taluk || ''
            if (col.id === 'village') return row.surveyForm.village || ''
            if (col.id === 'surveyor') return row.surveyor?.displayName || ''
            if (col.id === 'shopType') return shopTypeLabels[row.shopType] || row.shopType
            const value = (row as any)[col.id]
            if (value instanceof Date) return value.toLocaleString()
            return value ?? ''
          },
        }
      })

    const rowsToExport = table.getRowModel().rows.map((row) => row.original)
    exportToCSV(rowsToExport, visibleColumns, 'shop-entries')
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
          accessor: (row: ShopEntry) => {
            if (col.id === 'surveyForm') {
              const form = row.surveyForm
              return `${form.district}${form.taluk ? `, ${form.taluk}` : ''}${form.village ? `, ${form.village}` : ''}`
            }
            if (col.id === 'district') return row.surveyForm.district
            if (col.id === 'taluk') return row.surveyForm.taluk || ''
            if (col.id === 'village') return row.surveyForm.village || ''
            if (col.id === 'surveyor') return row.surveyor?.displayName || ''
            if (col.id === 'shopType') return shopTypeLabels[row.shopType] || row.shopType
            const value = (row as any)[col.id]
            if (value instanceof Date) return value.toLocaleString()
            return value ?? ''
          },
        }
      })

    const rowsToExport = table.getRowModel().rows.map((row) => row.original)
    exportToExcel(rowsToExport, visibleColumns, 'shop-entries')
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto sm:py-8 sm:px-4">
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
              <CardTitle className="text-lg sm:text-xl">Shop Entries</CardTitle>
              <CardDescription className="text-sm">Manage shop entries and their details</CardDescription>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/entries/new">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Shop Entry</span>
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
                          {column.id === 'surveyForm'
                            ? 'Survey Form'
                            : column.id === 'surveyor'
                              ? 'Surveyor'
                              : column.id}
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
              <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-4 border rounded-md bg-muted/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="survey-form-view" className="whitespace-nowrap text-sm">
                  Survey Form View:
                </Label>
                <select
                  id="survey-form-view"
                  value={surveyFormView}
                  onChange={(e) => setSurveyFormView(e.target.value as 'combined' | 'separate')}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border rounded-md bg-background"
                >
                  <option value="combined">Combined</option>
                  <option value="separate">Separate Columns</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 border rounded-md bg-muted/50">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="date-from" className="text-sm">Survey Date From</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFilterFrom}
                      onChange={(e) => setDateFilterFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="date-to" className="text-sm">Survey Date To</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateFilterTo}
                      onChange={(e) => setDateFilterTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="license-from" className="text-sm">License Expiry From</Label>
                    <Input
                      id="license-from"
                      type="date"
                      value={licenseExpiryFrom}
                      onChange={(e) => setLicenseExpiryFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="license-to" className="text-sm">License Expiry To</Label>
                    <Input
                      id="license-to"
                      type="date"
                      value={licenseExpiryTo}
                      onChange={(e) => setLicenseExpiryTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shop Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shop entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

