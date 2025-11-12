import { z } from 'zod'

// Enum schemas matching Prisma enums
export const shopTypeSchema = z.enum([
  'RESTAURANT',
  'BAKERY',
  'SWEET_SHOP',
  'GROCERY_STORE',
  'MEAT_SHOP',
  'DAIRY_SHOP',
  'BEVERAGE_SHOP',
  'FOOD_PROCESSING_UNIT',
  'CATERING_SERVICE',
  'OTHER',
])

export const yesNoSchema = z.enum(['YES', 'NO'])

export const licenseTypeSchema = z.enum([
  'BASIC_REGISTRATION',
  'STATE_LICENSE',
  'CENTRAL_LICENSE',
  'TEMPORARY_LICENSE',
  'OTHER',
])

// Survey Form Schema
export const surveyFormSchema = z.object({
  district: z.string().min(1, 'District is required'),
  taluk: z.string().optional(),
  village: z.string().optional(),
})

export type SurveyFormInput = z.infer<typeof surveyFormSchema>

// Shop Entry Schema
export const shopEntrySchema = z
  .object({
    surveyFormId: z.string().min(1, 'Survey form is required'),
    surveyDate: z.coerce.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: 'Invalid date format',
    }),
    shopName: z.string().min(1, 'Shop name is required'),
    shopAddress: z.string().min(1, 'Shop address is required'),
    phoneNumber: z.string().optional(),
    shopType: shopTypeSchema,
    hasLicense: yesNoSchema,
    licenseNumber: z.string().optional(),
    licenseExpiryDate: z.coerce.date().optional().nullable(),
    fostacTraining: yesNoSchema,
    licenseType: licenseTypeSchema.optional().nullable(),
    remarks: z.string().optional(),
    surveyorId: z.string().optional(),
  })
  .refine(
    (data) => {
      // If hasLicense is YES, licenseNumber should be provided
      if (data.hasLicense === 'YES' && !data.licenseNumber) {
        return false
      }
      return true
    },
    {
      message: 'License number is required when license is present',
      path: ['licenseNumber'],
    }
  )
  .refine(
    (data) => {
      // If hasLicense is YES, licenseType should be provided
      if (data.hasLicense === 'YES' && !data.licenseType) {
        return false
      }
      return true
    },
    {
      message: 'License type is required when license is present',
      path: ['licenseType'],
    }
  )

export type ShopEntryInput = z.infer<typeof shopEntrySchema>

// Surveyor Schema
export const surveyorSchema = z.object({
  name: z.string().min(1, 'Surveyor name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isAdmin: z.boolean().default(false),
})

export type SurveyorInput = z.infer<typeof surveyorSchema>

// Surveyor Login Schema
export const surveyorLoginSchema = z.object({
  name: z.string().min(1, 'Surveyor name is required'),
  password: z.string().min(1, 'Password is required'),
})

export type SurveyorLoginInput = z.infer<typeof surveyorLoginSchema>

