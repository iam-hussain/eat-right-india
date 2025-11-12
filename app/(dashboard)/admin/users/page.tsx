'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { getSurveyors, createSurveyor, updateSurveyor } from '@/app/actions/surveyor'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Filter } from 'lucide-react'

type Surveyor = {
  id: string
  username: string
  displayName: string
  isAdmin: boolean
  isSuperAdmin: boolean
  isActive: boolean
  createdAt: Date
}

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<Surveyor[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState<{ [key: string]: boolean }>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await getSurveyors()
      if (result.success && 'data' in result) {
        setData(result.data as Surveyor[])
      } else {
        toast.error(result.error || 'Failed to load users')
        if (result.error?.includes('Unauthorized')) {
          router.push('/')
        }
      }
    } catch (error) {
      toast.error('Error loading users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const displayName = formData.get('displayName') as string
    const password = formData.get('password') as string
    const isAdmin = formData.get('isAdmin') === 'on'

    const result = await createSurveyor({
      username,
      displayName,
      password,
      isAdmin,
    })

    if (result.success) {
      toast.success('User created successfully')
      setCreateOpen(false)
      loadData()
      e.currentTarget.reset()
    } else {
      toast.error(result.error || 'Failed to create user')
    }
  }

  const handleUpdateStatus = async (id: string, isAdmin: boolean, isActive: boolean) => {
    const result = await updateSurveyor(id, { isAdmin, isActive })

    if (result.success) {
      toast.success('User updated successfully')
      loadData()
    } else {
      toast.error(result.error || 'Failed to update user')
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    const result = await updateSurveyor(id, { password })

    if (result.success) {
      toast.success('Password updated successfully')
      setPasswordOpen({ ...passwordOpen, [id]: false })
      e.currentTarget.reset()
    } else {
      toast.error(result.error || 'Failed to update password')
    }
  }

  const columns = useMemo<ColumnDef<Surveyor>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => <div className="font-medium">{row.getValue('username')}</div>,
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: ({ row }) => <div>{row.getValue('displayName')}</div>,
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const surveyor = row.original
          return (
            <div>
              {surveyor.isSuperAdmin ? (
                <span className="text-primary font-semibold">Super Admin</span>
              ) : surveyor.isAdmin ? (
                <span className="text-muted-foreground">Admin</span>
              ) : (
                <span>User</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean
          return (
            <span className={isActive ? 'text-success' : 'text-destructive'}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
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
          const surveyor = row.original
          return (
            <div className="flex gap-2">
              <Dialog
                open={passwordOpen[surveyor.id] || false}
                onOpenChange={(open) =>
                  setPasswordOpen({ ...passwordOpen, [surveyor.id]: open })
                }
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => handleChangePassword(e, surveyor.id)}>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter new password for {surveyor.displayName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor={`password-${surveyor.id}`}>New Password</Label>
                        <Input
                          id={`password-${surveyor.id}`}
                          name="password"
                          type="password"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setPasswordOpen({ ...passwordOpen, [surveyor.id]: false })
                        }
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Update Password</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              {!surveyor.isSuperAdmin && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`admin-${surveyor.id}`} className="text-sm">
                      Admin
                    </Label>
                    <Switch
                      id={`admin-${surveyor.id}`}
                      checked={surveyor.isAdmin}
                      onCheckedChange={(checked) =>
                        handleUpdateStatus(surveyor.id, checked, surveyor.isActive)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${surveyor.id}`} className="text-sm">
                      Active
                    </Label>
                    <Switch
                      id={`active-${surveyor.id}`}
                      checked={surveyor.isActive}
                      onCheckedChange={(checked) =>
                        handleUpdateStatus(surveyor.id, surveyor.isAdmin, checked)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )
        },
      },
    ],
    [passwordOpen]
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
      <div className="w-full max-w-7xl mx-auto py-8 px-4 overflow-x-hidden">
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
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage surveyors and their permissions</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Create a new surveyor account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" required />
                    </div>
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input id="displayName" name="displayName" required />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" required minLength={6} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="isAdmin" name="isAdmin" />
                      <Label htmlFor="isAdmin">Admin (can create/update Survey Forms)</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                        {column.id}
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
    </div>
  )
}
