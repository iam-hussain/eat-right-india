'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/db'
import { requireAuth, getSession } from '@/lib/auth'
import { shopEntrySchema, type ShopEntryInput } from '@/lib/zod-schemas'
import {
  compareShopEntryFields,
  generateChangeSummary,
  type ShopEntryChanges,
} from '@/lib/history-utils'

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

    // Create initial history record for CREATE
    const allFields: ShopEntryChanges = {}
    const entryData = {
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
      surveyDate: validatedData.surveyDate,
      surveyFormId: validatedData.surveyFormId,
      surveyorId: validatedData.surveyorId,
    }

    // For CREATE, all fields are "after" values (no "before")
    Object.keys(entryData).forEach((key) => {
      allFields[key] = {
        before: null,
        after: entryData[key as keyof typeof entryData],
      }
    })

    await prisma.shopEntryHistory.create({
      data: {
        shopEntryId: shopEntry.id,
        changedBy: session.userId,
        changeType: 'CREATE',
        changes: allFields as unknown as object,
        changeSummary: 'Shop entry created',
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

    // Prepare new entry data for comparison
    const newEntryData = {
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
      surveyDate: validatedData.surveyDate,
      surveyFormId: validatedData.surveyFormId,
      surveyorId: validatedData.surveyorId || session.userId,
    }

    // Compare old vs new to find changes
    const changes = compareShopEntryFields(existingEntry, newEntryData)

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

    // Create history record if there are changes
    if (Object.keys(changes).length > 0) {
      await prisma.shopEntryHistory.create({
        data: {
          shopEntryId: shopEntry.id,
          changedBy: session.userId,
          changeType: 'UPDATE',
          changes: changes as unknown as object,
          changeSummary: generateChangeSummary(changes),
        },
      })
    }

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

export async function getShopEntryHistory(shopEntryId: string) {
  try {
    await requireAuth()

    const history = await prisma.shopEntryHistory.findMany({
      where: { shopEntryId },
      orderBy: {
        changedAt: 'desc',
      },
      include: {
        surveyor: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    return { success: true, data: history }
  } catch (error) {
    console.error('Error fetching shop entry history:', error)
    return { success: false, error: 'Failed to fetch shop entry history' }
  }
}

export async function deleteShopEntry(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth()

    // Get entry before deletion for history
    const existingEntry = await prisma.shopEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return {
        success: false,
        error: 'Shop entry not found',
      }
    }

    // Create DELETE history record before deletion
    const allFields: ShopEntryChanges = {}
    const entryData = {
      shopName: existingEntry.shopName,
      shopAddress: existingEntry.shopAddress,
      phoneNumber: existingEntry.phoneNumber,
      shopType: existingEntry.shopType,
      hasLicense: existingEntry.hasLicense,
      licenseNumber: existingEntry.licenseNumber,
      licenseExpiryDate: existingEntry.licenseExpiryDate,
      fostacTraining: existingEntry.fostacTraining,
      licenseType: existingEntry.licenseType,
      remarks: existingEntry.remarks,
      surveyDate: existingEntry.surveyDate,
      surveyFormId: existingEntry.surveyFormId,
      surveyorId: existingEntry.surveyorId,
    }

    // For DELETE, all fields are "before" values (no "after")
    Object.keys(entryData).forEach((key) => {
      allFields[key] = {
        before: entryData[key as keyof typeof entryData],
        after: null,
      }
    })

    await prisma.shopEntryHistory.create({
      data: {
        shopEntryId: id,
        changedBy: session.userId,
        changeType: 'DELETE',
        changes: allFields as unknown as object,
        changeSummary: 'Shop entry deleted',
      },
    })

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
      // Handle Prisma not found errors (race conditions)
      if (
        error.message.includes('Record to delete does not exist') ||
        error.message.includes('No record was found') ||
        error.message.includes('depends on one or more records that were required but not found')
      ) {
        return {
          success: false,
          error: 'Shop entry not found or already deleted',
        }
      }

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

