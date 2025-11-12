'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { surveyorLoginSchema, type SurveyorLoginInput } from '@/lib/zod-schemas'
import { login } from '@/app/actions/auth'
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

export function LoginForm() {
  const router = useRouter()
  const form = useForm<SurveyorLoginInput>({
    resolver: zodResolver(surveyorLoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (data: SurveyorLoginInput) => {
    const result = await login(data.username, data.password)

    if (result.success) {
      toast.success('Login successful!')
      router.push('/')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to login')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl sm:text-2xl">Login</CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Enter your credentials to access the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

