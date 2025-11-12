'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
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
      },
    })

    return { success: true, data: surveyForms }
  } catch (error) {
    console.error('Error fetching survey forms:', error)
    return { success: false, error: 'Failed to fetch survey forms' }
  }
}

