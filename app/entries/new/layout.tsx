import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'

export default async function EntriesNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAuth()
    return <>{children}</>
  } catch {
    redirect('/')
  }
}

