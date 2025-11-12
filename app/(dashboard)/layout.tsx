import { Header } from '@/components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="w-full overflow-x-hidden">{children}</main>
    </>
  )
}

