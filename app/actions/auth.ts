'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession, ensureSuperAdmin } from '@/lib/auth'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function login(name: string, password: string): Promise<ActionResult<{ name: string }>> {
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
      where: { name },
    })

    if (!surveyor) {
      return {
        success: false,
        error: 'Invalid name or password',
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
        error: 'Invalid name or password',
      }
    }

    await createSession(surveyor.id, surveyor.name, surveyor.isAdmin, surveyor.isSuperAdmin)

    return {
      success: true,
      data: { name: surveyor.name },
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

