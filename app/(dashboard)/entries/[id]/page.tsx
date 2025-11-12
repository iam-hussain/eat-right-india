'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { getShopEntry } from '@/app/actions/shop-entry'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Calendar, MapPin, Phone, Building2, FileText, Award, CheckCircle2, XCircle, User } from 'lucide-react'
import { formatDateTimeForDisplay, formatDateForDisplay } from '@/lib/date-utils'
import { ShopEntryHistory } from '@/components/shop-entry-history'

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

type ShopEntryDetail = {
  id: string
  surveyDate: Date
  shopName: string
  shopAddress: string
  phoneNumber: string | null
  shopType: string
  hasLicense: string
  licenseNumber: string | null
  licenseExpiryDate: Date | null
  fostacTraining: string
  licenseType: string | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  surveyForm: {
    id: string
    district: string
    taluk: string | null
    village: string | null
  }
  surveyor: {
    id: string
    displayName: string
  } | null
}

export default function ShopEntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState<ShopEntryDetail | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getShopEntry(id)
        if (result.success && 'data' in result) {
          setEntry(result.data as ShopEntryDetail)
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
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!entry) {
    return null
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/entries">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Entries</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{entry.shopName}</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {shopTypeLabels[entry.shopType] || entry.shopType}
              </p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/entries/${entry.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit Entry</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </Button>
        </div>

        {/* Main Information Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Shop Information</CardTitle>
            <CardDescription className="text-sm">Basic details about the shop</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  Shop Name
                </div>
                <div className="text-base font-semibold break-words">{entry.shopName}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  Shop Type
                </div>
                <div className="text-base break-words">{shopTypeLabels[entry.shopType] || entry.shopType}</div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  Address
                </div>
                <div className="text-base break-words">{entry.shopAddress}</div>
              </div>

              {entry.phoneNumber && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    Phone Number
                  </div>
                  <div className="text-base break-words">{entry.phoneNumber}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* License Information Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">License Information</CardTitle>
            <CardDescription className="text-sm">License and certification details</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  Has License
                </div>
                <div className="flex items-center gap-2">
                  {entry.hasLicense === 'YES' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-base font-semibold text-green-600">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-base text-muted-foreground">No</span>
                    </>
                  )}
                </div>
              </div>

              {entry.hasLicense === 'YES' && (
                <>
                  {entry.licenseNumber && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        License Number
                      </div>
                      <div className="text-base font-mono break-all">{entry.licenseNumber}</div>
                    </div>
                  )}

                  {entry.licenseType && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        License Type
                      </div>
                      <div className="text-base break-words">
                        {licenseTypeLabels[entry.licenseType] || entry.licenseType}
                      </div>
                    </div>
                  )}

                  {entry.licenseExpiryDate && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        License Expiry Date
                      </div>
                      <div className="text-base">{formatDateForDisplay(entry.licenseExpiryDate)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Training Information Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Training Information</CardTitle>
            <CardDescription className="text-sm">FOSTAC training participation</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 flex-shrink-0" />
                FOSTAC Training
              </div>
              <div className="flex items-center gap-2">
                {entry.fostacTraining === 'YES' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-base font-semibold text-green-600">Yes</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-base text-muted-foreground">No</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Information Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Survey Information</CardTitle>
            <CardDescription className="text-sm">Survey form and surveyor details</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  Survey Date & Time
                </div>
                <div className="text-base break-words">{formatDateTimeForDisplay(entry.surveyDate)}</div>
              </div>

              {entry.surveyor && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    Surveyor
                  </div>
                  <div className="text-base break-words">{entry.surveyor.displayName}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  District
                </div>
                <div className="text-base break-words">{entry.surveyForm.district}</div>
              </div>

              {entry.surveyForm.taluk && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    Taluk
                  </div>
                  <div className="text-base break-words">{entry.surveyForm.taluk}</div>
                </div>
              )}

              {entry.surveyForm.village && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    Village
                  </div>
                  <div className="text-base break-words">{entry.surveyForm.village}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Remarks Card */}
        {entry.remarks && (
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Remarks</CardTitle>
              <CardDescription className="text-sm">Additional notes and comments</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-base whitespace-pre-wrap break-words">{entry.remarks}</div>
            </CardContent>
          </Card>
        )}

        {/* Metadata Card */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Metadata</CardTitle>
            <CardDescription className="text-sm">Record creation and update information</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Created At</div>
                <div className="text-base break-words">{formatDateTimeForDisplay(entry.createdAt)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div className="text-base break-words">{formatDateTimeForDisplay(entry.updatedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change History Card */}
        <ShopEntryHistory shopEntryId={entry.id} />
      </div>
    </div>
  )
}

