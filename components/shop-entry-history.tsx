'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTimeForDisplay } from '@/lib/date-utils'
import { getShopEntryHistory } from '@/app/actions/shop-entry'
import { formatChangesForDisplay, type FieldChange } from '@/lib/history-utils'
import { ChevronDown, ChevronUp, User, Clock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type HistoryRecord = {
  id: string
  changeType: 'CREATE' | 'UPDATE' | 'DELETE'
  changedAt: Date
  changeSummary: string
  changes: unknown
  surveyor: {
    id: string
    displayName: string
  } | null
}

type ShopEntryHistoryProps = {
  shopEntryId: string
}

export function ShopEntryHistory({ shopEntryId }: ShopEntryHistoryProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getShopEntryHistory(shopEntryId)
        if (result.success && 'data' in result) {
          setHistory(result.data as HistoryRecord[])
        }
      } catch (error) {
        console.error('Error loading history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (shopEntryId) {
      loadHistory()
    }
  }, [shopEntryId])

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE':
        return 'bg-success/10 text-success-foreground border-success/20'
      case 'UPDATE':
        return 'bg-primary/10 text-primary-foreground border-primary/20'
      case 'DELETE':
        return 'bg-destructive/10 text-destructive-foreground border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <CardDescription>Loading history...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <CardDescription>No change history available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change History</CardTitle>
        <CardDescription>Track of all changes made to this shop entry</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((record, index) => {
            const isExpanded = expandedItems.has(record.id)
            const fieldChanges = formatChangesForDisplay(record.changes as Record<string, { before: unknown; after: unknown }>)
            const hasChanges = fieldChanges.length > 0

            return (
              <div
                key={record.id}
                className={cn(
                  'border rounded-lg p-4 space-y-3',
                  index !== history.length - 1 && 'border-b'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium border',
                          getChangeTypeColor(record.changeType)
                        )}
                      >
                        {record.changeType}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {record.changeSummary}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {record.surveyor && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>{record.surveyor.displayName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDateTimeForDisplay(record.changedAt)}</span>
                      </div>
                    </div>
                  </div>
                  {hasChanges && (
                    <button
                      onClick={() => toggleExpand(record.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span className="hidden sm:inline">Hide</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="hidden sm:inline">Show Details</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && hasChanges && (
                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Field Changes</span>
                    </div>
                    <div className="space-y-3">
                      {fieldChanges.map((change) => (
                        <div key={change.field} className="space-y-1.5">
                          <div className="text-sm font-medium">{change.fieldLabel}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Before</div>
                              <div className="p-2 rounded-md bg-muted/50 break-words">
                                {change.before ?? <span className="text-muted-foreground italic">(empty)</span>}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">After</div>
                              <div className="p-2 rounded-md bg-muted/50 break-words">
                                {change.after ?? <span className="text-muted-foreground italic">(empty)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

