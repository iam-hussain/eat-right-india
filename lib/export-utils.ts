export function exportToCSV<T>(
  data: T[],
  columns: { key: string; header: string; accessor?: (row: T) => string | number | null | undefined }[],
  filename: string = 'export'
) {
  // Get visible columns only
  const visibleColumns = columns.filter((col) => col.key !== 'actions')

  // Create CSV header
  const headers = visibleColumns.map((col) => col.header).join(',')

  // Create CSV rows
  const rows = data.map((row) => {
    return visibleColumns
      .map((col) => {
        const value = col.accessor ? col.accessor(row) : (row as any)[col.key]
        // Handle null/undefined
        if (value === null || value === undefined) return ''
        // Handle dates
        if (value instanceof Date) {
          return `"${value.toLocaleString()}"`
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  })

  // Combine header and rows
  const csvContent = [headers, ...rows].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToExcel<T>(
  data: T[],
  columns: { key: string; header: string; accessor?: (row: T) => string | number | null | undefined }[],
  filename: string = 'export'
) {
  // Excel format is similar to CSV but with tab separators and UTF-8 BOM
  const visibleColumns = columns.filter((col) => col.key !== 'actions')

  // Create Excel content (TSV format with BOM for Excel compatibility)
  const headers = visibleColumns.map((col) => col.header).join('\t')

  const rows = data.map((row) => {
    return visibleColumns
      .map((col) => {
        const value = col.accessor ? col.accessor(row) : (row as any)[col.key]
        if (value === null || value === undefined) return ''
        if (value instanceof Date) {
          return value.toLocaleString()
        }
        return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ')
      })
      .join('\t')
  })

  const excelContent = '\ufeff' + [headers, ...rows].join('\n') // BOM for UTF-8

  // Create blob and download
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

