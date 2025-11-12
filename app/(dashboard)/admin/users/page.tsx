'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSurveyors, createSurveyor, updateSurveyor } from '@/app/actions/surveyor'
import { logout } from '@/app/actions/auth'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type Surveyor = {
  id: string
  name: string
  isAdmin: boolean
  isSuperAdmin: boolean
  isActive: boolean
  createdAt: Date
}

export default function UsersPage() {
  const router = useRouter()
  const [surveyors, setSurveyors] = useState<Surveyor[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<{ [key: string]: boolean }>({})
  const [passwordOpen, setPasswordOpen] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    loadSurveyors()
  }, [])

  const loadSurveyors = async () => {
    try {
      const result = await getSurveyors()
      if (result.success && 'data' in result) {
        setSurveyors(result.data as Surveyor[])
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
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const isAdmin = formData.get('isAdmin') === 'on'

    const result = await createSurveyor({
      name,
      password,
      isAdmin,
    })

    if (result.success) {
      toast.success('User created successfully')
      setCreateOpen(false)
      loadSurveyors()
      e.currentTarget.reset()
    } else {
      toast.error(result.error || 'Failed to create user')
    }
  }

  const handleUpdateStatus = async (id: string, isAdmin: boolean, isActive: boolean) => {
    const result = await updateSurveyor(id, { isAdmin, isActive })

    if (result.success) {
      toast.success('User updated successfully')
      loadSurveyors()
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

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 px-4 overflow-x-hidden">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create User</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new surveyor account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage surveyors and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveyors.map((surveyor) => (
                <TableRow key={surveyor.id}>
                  <TableCell className="font-medium">{surveyor.name}</TableCell>
                  <TableCell>
                    {surveyor.isSuperAdmin ? (
                      <span className="text-primary font-semibold">Super Admin</span>
                    ) : surveyor.isAdmin ? (
                      <span className="text-muted-foreground">Admin</span>
                    ) : (
                      <span>User</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={surveyor.isActive ? 'text-success' : 'text-destructive'}
                    >
                      {surveyor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(surveyor.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
                                Enter new password for {surveyor.name}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

