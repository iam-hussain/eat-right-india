'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { surveyFormSchema, type SurveyFormInput } from '@/lib/zod-schemas'
import { createSurveyForm, updateSurveyForm } from '@/app/actions/survey-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type SurveyFormFormProps = {
  initialData?: SurveyFormInput & { id?: string }
  mode?: 'create' | 'edit'
}

export function SurveyFormForm({ initialData, mode = 'create' }: SurveyFormFormProps) {
  const router = useRouter()
  const form = useForm<SurveyFormInput>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: initialData || {
      district: '',
      taluk: '',
      village: '',
    },
  })

  const onSubmit = async (data: SurveyFormInput) => {
    if (mode === 'edit' && initialData?.id) {
      const result = await updateSurveyForm(initialData.id, data)
      if (result.success) {
        toast.success('Survey form updated successfully!')
        router.push('/survey')
      } else {
        toast.error(result.error || 'Failed to update survey form')
      }
    } else {
      const result = await createSurveyForm(data)
      if (result.success) {
        toast.success('Survey form created successfully!')
        form.reset()
        router.push('/survey')
      } else {
        toast.error(result.error || 'Failed to create survey form')
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Survey Form' : 'Create New Survey Form'}</CardTitle>
        <CardDescription>
          {mode === 'edit'
            ? 'Update the details of the survey form.'
            : 'Fill in the details to create a new survey form for food safety administration.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District (மாவட்டம்) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter district name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taluk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taluk/Block (வட்டம்)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter taluk/block name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="village"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Village (கிராமம்)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter village name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? mode === 'edit'
                    ? 'Updating...'
                    : 'Creating...'
                  : mode === 'edit'
                    ? 'Update Survey Form'
                    : 'Create Survey Form'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={form.formState.isSubmitting}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

