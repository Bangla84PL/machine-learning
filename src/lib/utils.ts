import { type ClassValue, clsx } from 'clsx'

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Format date
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return formatDate(date)
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// Format number
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate file type
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return allowedTypes.includes(ext)
}

// Validate file size
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.'))
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Download file
export function downloadFile(data: string | Blob, filename: string, mimeType: string = 'text/csv') {
  const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Parse CSV (basic implementation)
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n')
  return lines.map((line) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim())
    return values
  })
}

// Calculate statistics
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

export function calculateStd(values: number[]): number {
  if (values.length === 0) return 0
  const mean = calculateMean(values)
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
  const variance = calculateMean(squaredDiffs)
  return Math.sqrt(variance)
}

export function calculateMin(values: number[]): number {
  if (values.length === 0) return 0
  return Math.min(...values)
}

export function calculateMax(values: number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values)
}
