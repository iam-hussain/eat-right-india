'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSurveyForm } from '@/app/actions/survey-form'
import { SurveyFormForm } from '@/components/forms/survey-form-form'

export default function EditSurveyFormPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<{ id: string; district: string; taluk?: string; village?: string } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getSurveyForm(id) as { success: boolean; data: { id: string; district: string; taluk?: string; village?: string } | undefined; error: string | undefined }
        if (result.success && 'data' in result) {
          setFormData(result.data as { id: string; district: string; taluk?: string; village?: string } | null)
        } else {
          toast.error(result.error || 'Failed to load survey form')
          router.push('/survey')
        }
      } catch (error) {
        toast.error('Error loading survey form')
        router.push('/survey')
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
      <div className="w-full max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!formData) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SurveyFormForm initialData={formData} mode="edit" />
    </div>
  )
}

