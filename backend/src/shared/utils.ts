import type { FaseStatus } from './types'
import { ValidationError } from './errors'

// ID validation: alphanumeric + hyphens, 1-50 chars
export function validateId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('ID is required and must be a string')
  }
  if (id.length > 50) {
    throw new ValidationError('ID must be at most 50 characters')
  }
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    throw new ValidationError('ID must contain only alphanumeric characters and hyphens')
  }
}

// String trimming and validation
export function trimString(value: string | undefined, maxLength?: number): string {
  if (!value || typeof value !== 'string') {
    throw new ValidationError('String value is required')
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new ValidationError('String cannot be empty')
  }
  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`String must be at most ${maxLength} characters`)
  }
  return trimmed
}

// URL validation (simple): can be empty or valid URL
export function validateUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') {
    return ''
  }
  if (url.length > 500) {
    throw new ValidationError('URL must be at most 500 characters')
  }
  // Allow empty, '#', or valid URLs
  if (url && url !== '#' && !url.startsWith('http')) {
    throw new ValidationError('URL must be valid or empty/pending (#)')
  }
  return url
}

// Calculate task completion status for a phase
export function calculateFaseStatus(totalTasks: number, completedTasks: number): FaseStatus {
  if (totalTasks === 0) {
    return 'pending'
  }
  if (completedTasks === totalTasks) {
    return 'done'
  }
  if (completedTasks > 0) {
    return 'active'
  }
  return 'pending'
}

// Generate UUID (simple version)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Slug generation (simple)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
