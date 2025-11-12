import type { ShopEntry, ShopType, YesNo, LicenseType } from '@prisma/client'
import { formatDateForDisplay, formatDateTimeForDisplay } from './date-utils'

export type FieldChange = {
  field: string
  fieldLabel: string
  before: string | null
  after: string | null
}

export type ShopEntryChanges = {
  [key: string]: {
    before: unknown
    after: unknown
  }
}

const shopTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  BAKERY: 'Bakery',
  SWEET_SHOP: 'Sweet Shop',
  GROCERY_STORE: 'Grocery Store',
  MEAT_SHOP: 'Meat Shop',
  DAIRY_SHOP: 'Dairy Shop',
  BEVERAGE_SHOP: 'Beverage Shop',
  FOOD_PROCESSING_UNIT: 'Food Processing Unit',
  CATERING_SERVICE: 'Catering Service',
  OTHER: 'Other',
}

const licenseTypeLabels: Record<string, string> = {
  BASIC_REGISTRATION: 'Basic Registration',
  STATE_LICENSE: 'State License',
  CENTRAL_LICENSE: 'Central License',
  TEMPORARY_LICENSE: 'Temporary License',
  OTHER: 'Other',
}

const fieldLabels: Record<string, string> = {
  shopName: 'Shop Name',
  shopAddress: 'Address',
  phoneNumber: 'Phone Number',
  shopType: 'Shop Type',
  hasLicense: 'Has License',
  licenseNumber: 'License Number',
  licenseExpiryDate: 'License Expiry Date',
  fostacTraining: 'FOSTAC Training',
  licenseType: 'License Type',
  remarks: 'Remarks',
  surveyDate: 'Survey Date',
  surveyFormId: 'Survey Form',
  surveyorId: 'Surveyor',
}

function formatValue(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    if (field === 'surveyDate') {
      return formatDateTimeForDisplay(value)
    }
    return formatDateForDisplay(value)
  }

  if (typeof value === 'string') {
    if (field === 'shopType') {
      return shopTypeLabels[value] || value
    }
    if (field === 'licenseType') {
      return licenseTypeLabels[value] || value
    }
    if (field === 'hasLicense' || field === 'fostacTraining') {
      return value === 'YES' ? 'Yes' : 'No'
    }
    return value
  }

  return String(value)
}

export function compareShopEntryFields(
  oldEntry: Partial<ShopEntry>,
  newEntry: Partial<ShopEntry>
): ShopEntryChanges {
  const changes: ShopEntryChanges = {}
  const fieldsToCompare: (keyof ShopEntry)[] = [
    'shopName',
    'shopAddress',
    'phoneNumber',
    'shopType',
    'hasLicense',
    'licenseNumber',
    'licenseExpiryDate',
    'fostacTraining',
    'licenseType',
    'remarks',
    'surveyDate',
    'surveyFormId',
    'surveyorId',
  ]

  for (const field of fieldsToCompare) {
    const oldValue = oldEntry[field]
    const newValue = newEntry[field]

    // Handle date comparison
    if (oldValue instanceof Date && newValue instanceof Date) {
      if (oldValue.getTime() !== newValue.getTime()) {
        changes[field] = { before: oldValue, after: newValue }
      }
    } else if (oldValue !== newValue) {
      // Handle null/undefined comparison
      if ((oldValue === null || oldValue === undefined) && (newValue === null || newValue === undefined)) {
        continue
      }
      changes[field] = { before: oldValue ?? null, after: newValue ?? null }
    }
  }

  return changes
}

export function formatFieldChange(field: string, before: unknown, after: unknown): FieldChange {
  return {
    field,
    fieldLabel: fieldLabels[field] || field,
    before: formatValue(before, field),
    after: formatValue(after, field),
  }
}

export function generateChangeSummary(changes: ShopEntryChanges): string {
  const changedFields = Object.keys(changes)
  
  if (changedFields.length === 0) {
    return 'No changes detected'
  }

  if (changedFields.length === 1) {
    const field = changedFields[0]
    const fieldLabel = fieldLabels[field] || field
    return `${fieldLabel} updated`
  }

  if (changedFields.length <= 3) {
    const labels = changedFields.map(f => fieldLabels[f] || f)
    return `${labels.join(', ')} updated`
  }

  return `${changedFields.length} fields updated`
}

export function formatChangesForDisplay(changes: ShopEntryChanges): FieldChange[] {
  return Object.entries(changes).map(([field, { before, after }]) =>
    formatFieldChange(field, before, after)
  )
}

