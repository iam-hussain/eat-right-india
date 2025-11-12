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
import { Plus, Edit, Trash2, Filter } from 'lucide-react'

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
    name: string
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
  })
  const [globalFilter, setGlobalFilter] = useState('')

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
    () => [
      {
        accessorKey: 'shopName',
        header: 'Shop Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('shopName')}</div>,
      },
      {
        accessorKey: 'shopType',
        header: 'Shop Type',
        cell: ({ row }) => {
          const type = row.getValue('shopType') as string
          return <div>{shopTypeLabels[type] || type}</div>
        },
      },
      {
        id: 'surveyForm',
        header: 'Survey Form',
        cell: ({ row }) => {
          const form = row.original.surveyForm
          return (
            <div className="min-w-[200px]">
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
      },
      {
        accessorKey: 'shopAddress',
        header: 'Address',
        cell: ({ row }) => {
          const address = row.getValue('shopAddress') as string
          return <div className="max-w-xs truncate">{address}</div>
        },
      },
      {
        accessorKey: 'phoneNumber',
        header: 'Phone',
        cell: ({ row }) => {
          const phone = row.getValue('phoneNumber') as string | null
          return <div>{phone || '-'}</div>
        },
      },
      {
        accessorKey: 'hasLicense',
        header: 'Has License',
        cell: ({ row }) => {
          const hasLicense = row.getValue('hasLicense') as string
          return (
            <div className={hasLicense === 'YES' ? 'text-green-600' : 'text-gray-500'}>
              {hasLicense}
            </div>
          )
        },
      },
      {
        accessorKey: 'licenseNumber',
        header: 'License Number',
        cell: ({ row }) => {
          const license = row.getValue('licenseNumber') as string | null
          return <div>{license || '-'}</div>
        },
      },
      {
        accessorKey: 'licenseExpiryDate',
        header: 'License Expiry',
        cell: ({ row }) => {
          const date = row.getValue('licenseExpiryDate') as Date | null
          return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>
        },
      },
      {
        accessorKey: 'licenseType',
        header: 'License Type',
        cell: ({ row }) => {
          const type = row.getValue('licenseType') as string | null
          return <div>{type || '-'}</div>
        },
      },
      {
        accessorKey: 'fostacTraining',
        header: 'FOSTAC',
        cell: ({ row }) => {
          const training = row.getValue('fostacTraining') as string
          return (
            <div className={training === 'YES' ? 'text-green-600' : 'text-gray-500'}>
              {training}
            </div>
          )
        },
      },
      {
        accessorKey: 'surveyDate',
        header: 'Survey Date',
        cell: ({ row }) => {
          const date = new Date(row.getValue('surveyDate'))
          return <div>{date.toLocaleDateString()}</div>
        },
      },
      {
        accessorKey: 'surveyor.name',
        header: 'Surveyor',
        cell: ({ row }) => {
          const surveyor = row.original.surveyor
          return <div>{surveyor?.name || '-'}</div>
        },
      },
      {
        accessorKey: 'remarks',
        header: 'Remarks',
        cell: ({ row }) => {
          const remarks = row.getValue('remarks') as string | null
          return <div className="max-w-xs truncate">{remarks || '-'}</div>
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'))
          return <div>{date.toLocaleDateString()}</div>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const entry = row.original
          return (
            <div className="flex gap-2">
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
      },
    ],
    []
  )

  const table = useReactTable({
    data,
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
      <div className="w-full max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 overflow-x-hidden">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Shop Entries</CardTitle>
              <CardDescription>Manage shop entries and their details</CardDescription>
            </div>
            <Button asChild>
              <Link href="/entries/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Shop Entry
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Columns
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
                          : column.id === 'surveyor.name'
                            ? 'Surveyor'
                            : column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
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

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of {data.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
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

