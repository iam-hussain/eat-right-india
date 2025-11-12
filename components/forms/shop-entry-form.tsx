'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { shopEntrySchema, type ShopEntryInput } from '@/lib/zod-schemas'
import { createShopEntry, updateShopEntry } from '@/app/actions/shop-entry'
import { getSurveyForms } from '@/app/actions/survey-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SurveyFormOption = {
  id: string
  district: string
  taluk: string | null
  village: string | null
  createdAt: Date
}

type ShopEntryFormProps = {
  initialData?: ShopEntryInput & { id?: string }
  mode?: 'create' | 'edit'
}

export function ShopEntryForm({ initialData, mode = 'create' }: ShopEntryFormProps) {
  const router = useRouter()
  const [surveyForms, setSurveyForms] = useState<SurveyFormOption[]>([])
  const [loadingForms, setLoadingForms] = useState(true)

  const form = useForm<ShopEntryInput>({
    resolver: zodResolver(shopEntrySchema) as any,
    defaultValues: initialData || {
      surveyFormId: '',
      surveyDate: new Date(),
      shopName: '',
      shopAddress: '',
      phoneNumber: '',
      shopType: 'RESTAURANT',
      hasLicense: 'NO',
      licenseNumber: '',
      licenseExpiryDate: undefined,
      fostacTraining: 'NO',
      licenseType: undefined,
      remarks: '',
    },
  })

  const hasLicense = form.watch('hasLicense')

  useEffect(() => {
    const fetchSurveyForms = async () => {
      try {
        const result = await getSurveyForms()
        if (result.success && 'data' in result) {
          setSurveyForms(result.data as SurveyFormOption[])
        } else {
          toast.error('Failed to load survey forms')
        }
      } catch (error) {
        toast.error('Error loading survey forms')
      } finally {
        setLoadingForms(false)
      }
    }

    fetchSurveyForms()
  }, [])

  const onSubmit = async (data: ShopEntryInput) => {
    // Clean up optional fields
    const cleanedData: ShopEntryInput = {
      ...data,
      phoneNumber: data.phoneNumber || undefined,
      licenseNumber: data.licenseNumber || undefined,
      licenseExpiryDate: data.licenseExpiryDate || undefined,
      licenseType: data.licenseType || undefined,
      remarks: data.remarks || undefined,
    }

    if (mode === 'edit' && initialData?.id) {
      const result = await updateShopEntry(initialData.id, cleanedData)
      if (result.success) {
        toast.success('Shop entry updated successfully!')
        router.push('/entries')
      } else {
        toast.error(result.error || 'Failed to update shop entry')
      }
    } else {
      const result = await createShopEntry(cleanedData)
      if (result.success) {
        toast.success('Shop entry created successfully!')
        form.reset()
        router.push('/entries')
      } else {
        toast.error(result.error || 'Failed to create shop entry')
      }
    }
  }

  const shopTypeOptions = [
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'BAKERY', label: 'Bakery' },
    { value: 'SWEET_SHOP', label: 'Sweet Shop' },
    { value: 'GROCERY_STORE', label: 'Grocery Store' },
    { value: 'MEAT_SHOP', label: 'Meat Shop' },
    { value: 'DAIRY_SHOP', label: 'Dairy Shop' },
    { value: 'BEVERAGE_SHOP', label: 'Beverage Shop' },
    { value: 'FOOD_PROCESSING_UNIT', label: 'Food Processing Unit' },
    { value: 'CATERING_SERVICE', label: 'Catering Service' },
    { value: 'OTHER', label: 'Other' },
  ]

  const licenseTypeOptions = [
    { value: 'BASIC_REGISTRATION', label: 'Basic Registration' },
    { value: 'STATE_LICENSE', label: 'State License' },
    { value: 'CENTRAL_LICENSE', label: 'Central License' },
    { value: 'TEMPORARY_LICENSE', label: 'Temporary License' },
    { value: 'OTHER', label: 'Other' },
  ]

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Shop Entry' : 'Create New Shop Entry'}</CardTitle>
        <CardDescription>
          {mode === 'edit'
            ? 'Update the details of the shop entry.'
            : 'Fill in the details to add a new shop entry to the survey form.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="surveyFormId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Survey Form *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingForms}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a survey form" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {surveyForms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.district}
                          {form.taluk ? ` - ${form.taluk}` : ''}
                          {form.village ? ` - ${form.village}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="surveyDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Survey Date (கணக்கெடுப்பு நாள்) *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => {
                        field.onChange(e.target.value ? new Date(e.target.value) : new Date())
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shopType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Type (கடையின் வகை) *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shop type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shopTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name (கடையின் பெயர்) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shopAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Address (முகவரி) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shop address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (தொலைபேசி எண்)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Has License (உரிமம் சான்று) *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="YES">Yes (ஆம்)</SelectItem>
                      <SelectItem value="NO">No (இல்லை)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasLicense === 'YES' && (
              <>
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number (உரிமம் எண்) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="licenseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Type (உரிமம் சான்றின் வகை) *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select license type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {licenseTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Expiry Date (உரிமம் முடிவடையும் காலம்)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value).toISOString().split('T')[0]
                                : ''
                            }
                            onChange={(e) => {
                              field.onChange(e.target.value ? new Date(e.target.value) : null)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="fostacTraining"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    FOSTAC Training Participation (பயிற்சியில் பங்குபெற்றவரா) *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="YES">Yes (ஆம்)</SelectItem>
                      <SelectItem value="NO">No (இல்லை)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (குறிப்பு)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter any remarks" {...field} />
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
                    ? 'Update Shop Entry'
                    : 'Create Shop Entry'}
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

