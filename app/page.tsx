import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, FileText, Users, ShoppingBag, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

async function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </form>
  )
}

export default async function Home() {
  const session = await getSession()

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 sm:py-8 overflow-x-hidden">
      <div className="flex flex-col items-center space-y-4 sm:space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center space-y-4">
        <Image
            src="/eat-right-india.svg"
            alt="Eat Right India"
            width={600}
            height={300}
          priority
            className="w-full max-w-2xl"
          />
        </div>

        {/* Welcome Message */}
        {session ? (
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome, {session.name}!</h1>
            <p className="text-muted-foreground">
              {session.isSuperAdmin
                ? 'Super Admin Dashboard'
                : session.isAdmin
                  ? 'Admin Dashboard'
                  : 'Surveyor Dashboard'}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Eat Right India</h1>
            <p className="text-muted-foreground">
              Food Safety and Drug Administration Department
            </p>
          </div>
        )}

        {/* Login Action - Centered (only when not logged in) */}
        {!session && (
          <div className="flex justify-center w-full">
            <Card className="hover:shadow-lg transition-shadow w-full max-w-md">
              <CardDescription className="text-center">
                Access the system with your credentials
              </CardDescription>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Cards */}
        {session && (
          <>
            <div className="flex justify-center w-full">
              {(() => {
                const actionCards = []
                
                if (session.isAdmin || session.isSuperAdmin) {
                  actionCards.push('survey')
                }
                if (session) {
                  actionCards.push('shop')
                }
                if (session.isSuperAdmin) {
                  actionCards.push('users')
                }
                
                const cardCount = actionCards.length
                const gridCols = cardCount === 1 ? 'max-w-md' : cardCount === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-2 lg:grid-cols-2 max-w-5xl'
                
                return (
                  <div className={`grid grid-cols-1 ${gridCols} gap-6 w-full`}>
                    {/* Survey Form Card - Show if admin or super admin */}
                    {(session.isAdmin || session.isSuperAdmin) && (
                      <Card className="hover:shadow-lg transition-shadow w-full">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle>Survey Forms</CardTitle>
                          </div>
                          <CardDescription>
                            Create and manage survey forms
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 flex flex-col gap-2">
                            <Link href="/survey">
                              <Button className="w-full" variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                View All Survey Forms
                              </Button>
                            </Link>
                            <Link href="/survey/new">
                              <Button className="w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                Create Survey Form
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Shop Entry Card - Show if logged in */}
                    {session && (
                      <Card className="hover:shadow-lg transition-shadow w-full">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                            <CardTitle>Shop Entries</CardTitle>
                          </div>
                          <CardDescription>
                            Add and manage shop entries
                          </CardDescription>
                        </CardHeader>
                      <CardContent>
                        <div className="space-y-2 flex flex-col gap-2">
                          <Link href="/entries">
                            <Button className="w-full" variant="outline">
                              <ShoppingBag className="mr-2 h-4 w-4" />
                              View All Shop Entries
                            </Button>
                          </Link>
                          <Link href="/entries/new">
                            <Button className="w-full">
                              <ShoppingBag className="mr-2 h-4 w-4" />
                              Create Shop Entry
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                      </Card>
                    )}

                    {/* User Management Card - Show if super admin */}
                    {session.isSuperAdmin && (
                      <div className='w-full md:col-span-2'>
                        <Card className="hover:shadow-lg transition-shadow w-full max-w-xl mx-auto">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle>User Management</CardTitle>
                          </div>
                          <CardDescription>
                            Manage users, permissions, and access
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Link href="/admin/users">
                            <Button className="w-full">
                              <Users className="mr-2 h-4 w-4" />
                              Manage Users
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Logout Card - Below other actions */}
            <div className="flex justify-center w-full">
              <Card className="hover:shadow-lg transition-shadow w-full max-w-md">
                <CardHeader>
                  <div className="flex items-center justify-center gap-2">
                    <LogOut className="h-5 w-5 text-primary" />
                    <CardTitle>Account</CardTitle>
                  </div>
                  <CardDescription className="text-center">
                    Logout from your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LogoutButton />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Additional Info */}
        {!session && (
          <div className="text-center text-sm text-muted-foreground max-w-2xl">
            <p>
              Please login to access the Food Safety Administration system.
              Contact your administrator if you need access.
            </p>
          </div>
        )}
        </div>
    </div>
  )
}
