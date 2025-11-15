'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/db'
import { requireAdmin } from '@/lib/auth'
import { surveyFormSchema, type SurveyFormInput } from '@/lib/zod-schemas'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createSurveyForm(
  formData: SurveyFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Require admin access
    await requireAdmin()

    const validatedData = surveyFormSchema.parse(formData)

    const surveyForm = await prisma.surveyForm.create({
      data: {
        district: validatedData.district,
        taluk: validatedData.taluk,
        village: validatedData.village,
      },
    })

    revalidatePath('/survey')
    revalidatePath('/entries')

    return {
      success: true,
      data: { id: surveyForm.id },
    }
  } catch (error) {
    console.error('Error creating survey form:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || 'Failed to create survey form',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function getSurveyForms() {
  try {
    const surveyForms = await prisma.surveyForm.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        district: true,
        taluk: true,
        village: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            shopEntries: true,
          },
        },
      },
    })

    return { success: true, data: surveyForms }
  } catch (error) {
    console.error('Error fetching survey forms:', error)
    return { success: false, error: 'Failed to fetch survey forms' }
  }
}

export async function getSurveyForm(id: string) {
  try {
    await requireAdmin()

    const surveyForm = await prisma.surveyForm.findUnique({
      where: { id },
      select: {
        id: true,
        district: true,
        taluk: true,
        village: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!surveyForm) {
      return { success: false, error: 'Survey form not found' }
    }

    return { success: true, data: surveyForm }
  } catch (error) {
    console.error('Error fetching survey form:', error)
    return { success: false, error: 'Failed to fetch survey form' }
  }
}

export async function updateSurveyForm(
  id: string,
  formData: SurveyFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin()

    const validatedData = surveyFormSchema.parse(formData)

    const surveyForm = await prisma.surveyForm.update({
      where: { id },
      data: {
        district: validatedData.district,
        taluk: validatedData.taluk,
        village: validatedData.village,
      },
    })

    revalidatePath('/survey')
    revalidatePath(`/survey/${id}`)
    revalidatePath('/entries')

    return {
      success: true,
      data: { id: surveyForm.id },
    }
  } catch (error) {
    console.error('Error updating survey form:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message || 'Failed to update survey form',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function deleteSurveyForm(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin()

    // Check if the survey form exists
    const surveyForm = await prisma.surveyForm.findUnique({
      where: { id },
    })

    if (!surveyForm) {
      return {
        success: false,
        error: 'Survey form not found',
      }
    }

    // Check if there are shop entries associated with this form
    const shopEntriesCount = await prisma.shopEntry.count({
      where: { surveyFormId: id },
    })

    if (shopEntriesCount > 0) {
      return {
        success: false,
        error: `Cannot delete survey form. It has ${shopEntriesCount} associated shop entries.`,
      }
    }

    await prisma.surveyForm.delete({
      where: { id },
    })

    revalidatePath('/survey')
    revalidatePath('/entries')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Error deleting survey form:', error)

    if (error instanceof Error) {
      // Handle Prisma not found errors (race conditions)
      if (
        error.message.includes('Record to delete does not exist') ||
        error.message.includes('No record was found') ||
        error.message.includes('depends on one or more records that were required but not found')
      ) {
        return {
          success: false,
          error: 'Survey form not found or already deleted',
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to delete survey form',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

