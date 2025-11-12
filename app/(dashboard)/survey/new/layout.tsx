import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'

export default async function SurveyNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
    return <>{children}</>
  } catch {
    redirect('/')
  }
}

