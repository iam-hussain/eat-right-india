'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getShopEntry } from '@/app/actions/shop-entry'
import { ShopEntryForm } from '@/components/forms/shop-entry-form'
import type { ShopEntryInput } from '@/lib/zod-schemas'
import { utcToBrowserTime } from '@/lib/date-utils'

type ShopEntryData = ShopEntryInput & {
  id: string
}

export default function EditShopEntryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<ShopEntryData | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getShopEntry(id)
        if (result.success && 'data' in result) {
          const entry = result.data as ShopEntryData
          setFormData({
            id: entry.id,
            surveyFormId: entry.surveyFormId,
            // Convert UTC dates from database to browser local time
            surveyDate: utcToBrowserTime(entry.surveyDate),
            shopName: entry.shopName,
            shopAddress: entry.shopAddress,
            phoneNumber: entry.phoneNumber || undefined,
            shopType: entry.shopType as any,
            hasLicense: entry.hasLicense as any,
            licenseNumber: entry.licenseNumber || undefined,
            licenseExpiryDate: entry.licenseExpiryDate
              ? utcToBrowserTime(entry.licenseExpiryDate)
              : undefined,
            fostacTraining: entry.fostacTraining as any,
            licenseType: entry.licenseType as any,
            remarks: entry.remarks || undefined,
            surveyorId: entry.surveyorId || undefined,
          })
        } else {
          toast.error(result.error || 'Failed to load shop entry')
          router.push('/entries')
        }
      } catch (error) {
        toast.error('Error loading shop entry')
        router.push('/entries')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadData()
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto sm:py-8 sm:px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!formData) {
    return null
  }

  return (
    <div className="w-full max-w-7xl mx-auto sm:py-8 sm:px-4">
      <ShopEntryForm initialData={formData} mode="edit" />
    </div>
  )
}

