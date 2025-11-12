import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'

export default async function LoginPage() {
  const session = await getSession()

  // Redirect to home if user is already logged in
  if (session) {
    redirect('/')
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/eat-right-india.svg"
              alt="Eat Right India"
              width={400}
              height={200}
              priority
              className="w-full max-w-xs sm:max-w-md"
            />
          </Link>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
