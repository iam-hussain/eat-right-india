import { cookies } from 'next/headers'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { prisma } from '@/db'

const secretKey = process.env.AUTH_SECRET || 'your-secret-key-change-in-production'
const key = new TextEncoder().encode(secretKey)

export interface SessionData extends JWTPayload {
  userId: string
  displayName: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export async function encrypt(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function decrypt(session: string | undefined = undefined) {
  try {
    if (!session) return null
    const { payload } = await jwtVerify(session, key)
    return payload as SessionData
  } catch {
    return null
  }
}

export async function createSession(userId: string, displayName: string, isAdmin: boolean, isSuperAdmin: boolean) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const session = await encrypt({ userId, displayName, isAdmin, isSuperAdmin })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  return await decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireSuperAdmin(): Promise<SessionData> {
  const session = await requireAuth()
  if (!session.isSuperAdmin) {
    throw new Error('Forbidden: Super admin access required')
  }
  return session
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireAuth()
  if (!session.isAdmin && !session.isSuperAdmin) {
    throw new Error('Forbidden: Admin access required')
  }
  return session
}

export async function ensureSuperAdmin() {
  try {
    // Check if prisma client is properly initialized
    if (!prisma || !prisma.surveyor) {
      console.error('Prisma client not properly initialized')
      return
    }

    const superAdmin = await prisma.surveyor.findFirst({
      where: { isSuperAdmin: true, isActive: true },
    })

    if (!superAdmin) {
      // Create default super admin if none exists
      const bcrypt = await import('bcryptjs')
      const defaultPassword = await bcrypt.hash('admin123', 10)
      
      await prisma.surveyor.create({
        data: {
          username: 'superadmin',
          displayName: 'Super Admin',
          password: defaultPassword,
          isSuperAdmin: true,
          isAdmin: true,
          isActive: true,
        },
      })
    }
  } catch (error) {
    console.error('Error ensuring super admin:', error)
    // Don't throw - allow login to continue even if super admin creation fails
  }
}

