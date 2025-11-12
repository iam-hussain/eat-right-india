'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
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

