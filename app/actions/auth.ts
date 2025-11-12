'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/db'
import { createSession, deleteSession, ensureSuperAdmin } from '@/lib/auth'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function login(username: string, password: string): Promise<ActionResult<{ displayName: string }>> {
  try {
    // Ensure super admin exists
    await ensureSuperAdmin()

    // Check if prisma client is properly initialized
    if (!prisma || !prisma.surveyor) {
      console.error('Prisma client not properly initialized. Please restart the dev server.')
      return {
        success: false,
        error: 'Server error. Please try again or contact administrator.',
      }
    }

    const surveyor = await prisma.surveyor.findUnique({
      where: { username },
    })

    if (!surveyor) {
      return {
        success: false,
        error: 'Invalid username or password',
      }
    }

    if (!surveyor.isActive) {
      return {
        success: false,
        error: 'Account is inactive. Please contact administrator.',
      }
    }

    const isValidPassword = await bcrypt.compare(password, surveyor.password)

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid username or password',
      }
    }

    await createSession(surveyor.id, surveyor.displayName, surveyor.isAdmin, surveyor.isSuperAdmin)

    return {
      success: true,
      data: { displayName: surveyor.displayName },
    }
  } catch (error) {
    console.error('Error logging in:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || 'Failed to login',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function logout() {
  await deleteSession()
  redirect('/')
}

