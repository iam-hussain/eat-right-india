'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/db'
import { requireAuth, getSession } from '@/lib/auth'
import { shopEntrySchema, type ShopEntryInput } from '@/lib/zod-schemas'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createShopEntry(
  formData: ShopEntryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Require authentication
    const session = await requireAuth()

    // Validate the data
    const validatedData = shopEntrySchema.parse(formData)
    
    // Set surveyorId from session if not provided
    if (!validatedData.surveyorId) {
      validatedData.surveyorId = session.userId
    }

    // Check if survey form exists
    const surveyForm = await prisma.surveyForm.findUnique({
      where: { id: validatedData.surveyFormId },
    })

    if (!surveyForm) {
      return {
        success: false,
        error: 'Selected survey form not found',
      }
    }

    // Check if license number already exists (if provided)
    if (validatedData.licenseNumber) {
      const existingEntry = await prisma.shopEntry.findUnique({
        where: { licenseNumber: validatedData.licenseNumber },
      })

      if (existingEntry) {
        return {
          success: false,
          error: 'License number already exists',
        }
      }
    }

    const shopEntry = await prisma.shopEntry.create({
      data: {
        surveyFormId: validatedData.surveyFormId,
        surveyorId: validatedData.surveyorId,
        surveyDate: validatedData.surveyDate,
        shopName: validatedData.shopName,
        shopAddress: validatedData.shopAddress,
        phoneNumber: validatedData.phoneNumber,
        shopType: validatedData.shopType,
        hasLicense: validatedData.hasLicense,
        licenseNumber: validatedData.licenseNumber,
        licenseExpiryDate: validatedData.licenseExpiryDate,
        fostacTraining: validatedData.fostacTraining,
        licenseType: validatedData.licenseType,
        remarks: validatedData.remarks,
      },
    })

    revalidatePath('/entries')
    revalidatePath(`/survey/${validatedData.surveyFormId}`)

    return {
      success: true,
      data: { id: shopEntry.id },
    }
  } catch (error) {
    console.error('Error creating shop entry:', error)

    if (error instanceof Error) {
      // Handle Prisma unique constraint errors
      if (error.message.includes('Unique constraint')) {
        return {
          success: false,
          error: 'License number already exists',
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to create shop entry',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function getShopEntries() {
  try {
    const session = await getSession()

    const shopEntries = await prisma.shopEntry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        surveyForm: {
          select: {
            id: true,
            district: true,
            taluk: true,
            village: true,
          },
        },
        surveyor: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    return { success: true, data: shopEntries }
  } catch (error) {
    console.error('Error fetching shop entries:', error)
    return { success: false, error: 'Failed to fetch shop entries' }
  }
}

export async function getShopEntry(id: string) {
  try {
    await requireAuth()

    const shopEntry = await prisma.shopEntry.findUnique({
      where: { id },
      include: {
        surveyForm: {
          select: {
            id: true,
            district: true,
            taluk: true,
            village: true,
          },
        },
        surveyor: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    if (!shopEntry) {
      return { success: false, error: 'Shop entry not found' }
    }

    return { success: true, data: shopEntry }
  } catch (error) {
    console.error('Error fetching shop entry:', error)
    return { success: false, error: 'Failed to fetch shop entry' }
  }
}

export async function updateShopEntry(
  id: string,
  formData: ShopEntryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth()

    const validatedData = shopEntrySchema.parse(formData)

    // Check if shop entry exists
    const existingEntry = await prisma.shopEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return {
        success: false,
        error: 'Shop entry not found',
      }
    }

    // Check if license number already exists (if provided and changed)
    if (validatedData.licenseNumber && validatedData.licenseNumber !== existingEntry.licenseNumber) {
      const duplicateEntry = await prisma.shopEntry.findUnique({
        where: { licenseNumber: validatedData.licenseNumber },
      })

      if (duplicateEntry) {
        return {
          success: false,
          error: 'License number already exists',
        }
      }
    }

    const shopEntry = await prisma.shopEntry.update({
      where: { id },
      data: {
        surveyFormId: validatedData.surveyFormId,
        surveyorId: validatedData.surveyorId || session.userId,
        surveyDate: validatedData.surveyDate,
        shopName: validatedData.shopName,
        shopAddress: validatedData.shopAddress,
        phoneNumber: validatedData.phoneNumber,
        shopType: validatedData.shopType,
        hasLicense: validatedData.hasLicense,
        licenseNumber: validatedData.licenseNumber,
        licenseExpiryDate: validatedData.licenseExpiryDate,
        fostacTraining: validatedData.fostacTraining,
        licenseType: validatedData.licenseType,
        remarks: validatedData.remarks,
      },
    })

    revalidatePath('/entries')
    revalidatePath(`/entries/${id}`)
    revalidatePath(`/survey/${validatedData.surveyFormId}`)

    return {
      success: true,
      data: { id: shopEntry.id },
    }
  } catch (error) {
    console.error('Error updating shop entry:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return {
          success: false,
          error: 'License number already exists',
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to update shop entry',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function deleteShopEntry(id: string): Promise<ActionResult<void>> {
  try {
    await requireAuth()

    await prisma.shopEntry.delete({
      where: { id },
    })

    revalidatePath('/entries')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Error deleting shop entry:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || 'Failed to delete shop entry',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

