'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { surveyFormSchema, type SurveyFormInput } from '@/lib/zod-schemas'
import { createSurveyForm } from '@/app/actions/survey-form'
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

export function SurveyFormForm() {
  const form = useForm<SurveyFormInput>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      district: '',
      taluk: '',
      village: '',
    },
  })

  const onSubmit = async (data: SurveyFormInput) => {
    const result = await createSurveyForm(data)

    if (result.success) {
      toast.success('Survey form created successfully!')
      form.reset()
      // Optionally redirect to a success page or survey list
      // router.push(`/survey/${result.data.id}`)
    } else {
      toast.error(result.error || 'Failed to create survey form')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Survey Form</CardTitle>
        <CardDescription>
          Fill in the details to create a new survey form for food safety administration.
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
                {form.formState.isSubmitting ? 'Creating...' : 'Create Survey Form'}
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

