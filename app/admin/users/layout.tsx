import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/auth'

export default async function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireSuperAdmin()
    return <>{children}</>
  } catch {
    redirect('/')
  }
}

