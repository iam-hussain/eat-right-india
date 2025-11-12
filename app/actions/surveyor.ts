'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/db'
import { requireSuperAdmin, getSession } from '@/lib/auth'
import { surveyorSchema, type SurveyorInput } from '@/lib/zod-schemas'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createSurveyor(
  formData: SurveyorInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin()

    const validatedData = surveyorSchema.parse(formData)

    // Check if surveyor already exists
    const existingSurveyor = await prisma.surveyor.findUnique({
      where: { username: validatedData.username },
    })

    if (existingSurveyor) {
      return {
        success: false,
        error: 'Surveyor with this username already exists',
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const surveyor = await prisma.surveyor.create({
      data: {
        username: validatedData.username,
        displayName: validatedData.displayName,
        password: hashedPassword,
        isAdmin: validatedData.isAdmin || false,
        isSuperAdmin: false, // Only existing super admin can create, but not new super admins
        isActive: true,
      },
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      data: { id: surveyor.id },
    }
  } catch (error) {
    console.error('Error creating surveyor:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return {
          success: false,
          error: 'Unauthorized: Super admin access required',
        }
      }
      return {
        success: false,
        error: error.message || 'Failed to create surveyor',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function updateSurveyor(
  id: string,
  updates: {
    password?: string
    isAdmin?: boolean
    isActive?: boolean
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession()
    if (!session) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const surveyor = await prisma.surveyor.findUnique({
      where: { id },
    })

    if (!surveyor) {
      return {
        success: false,
        error: 'Surveyor not found',
      }
    }

    // Only super admin can update others, or users can update their own password
    const isUpdatingSelf = session.userId === id
    const canUpdate = session.isSuperAdmin || isUpdatingSelf

    if (!canUpdate) {
      return {
        success: false,
        error: 'Unauthorized: You can only update your own password',
      }
    }

    // Super admin can update anything, users can only update their password
    const updateData: {
      password?: string
      isAdmin?: boolean
      isActive?: boolean
    } = {}

    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10)
    }

    if (session.isSuperAdmin) {
      if (updates.isAdmin !== undefined) {
        updateData.isAdmin = updates.isAdmin
      }
      if (updates.isActive !== undefined) {
        // Prevent deactivating the last super admin
        if (!updates.isActive && surveyor.isSuperAdmin) {
          const otherSuperAdmins = await prisma.surveyor.count({
            where: {
              isSuperAdmin: true,
              isActive: true,
              id: { not: id },
            },
          })

          if (otherSuperAdmins === 0) {
            return {
              success: false,
              error: 'Cannot deactivate the last super admin',
            }
          }
        }
        updateData.isActive = updates.isActive
      }
    }

    await prisma.surveyor.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    console.error('Error updating surveyor:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || 'Failed to update surveyor',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function getSurveyors() {
  try {
    const session = await getSession()
    if (!session || !session.isSuperAdmin) {
      return { success: false, error: 'Unauthorized' }
    }

    const surveyors = await prisma.surveyor.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        isAdmin: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
      },
    })

    return { success: true, data: surveyors }
  } catch (error) {
    console.error('Error fetching surveyors:', error)
    return { success: false, error: 'Failed to fetch surveyors' }
  }
}

export async function authenticateSurveyor(
  username: string,
  password: string
): Promise<ActionResult<{ id: string; displayName: string }>> {
  try {
    const surveyor = await prisma.surveyor.findUnique({
      where: { username },
    })

    if (!surveyor || !surveyor.isActive) {
      return {
        success: false,
        error: 'Invalid username or password',
      }
    }

    const isValidPassword = await bcrypt.compare(password, surveyor.password)

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid username or password',
      }
    }

    return {
      success: true,
      data: { id: surveyor.id, displayName: surveyor.displayName },
    }
  } catch (error) {
    console.error('Error authenticating surveyor:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || 'Failed to authenticate surveyor',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
