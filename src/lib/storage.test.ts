import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readJson, writeJson } from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('readJson', () => {
    it('should return fallback when key is absent', () => {
      const result = readJson('missing-key', { count: 0 })

      expect(result).toEqual({ count: 0 })
    })

    it('should return parsed value when key exists', () => {
      localStorage.setItem('test-key', JSON.stringify({ items: [1, 2] }))

      const result = readJson<{ items: number[] }>('test-key', { items: [] })

      expect(result).toEqual({ items: [1, 2] })
    })

    it('should return fallback when stored value is invalid JSON', () => {
      localStorage.setItem('test-key', '{not valid json')

      const result = readJson('test-key', { fallback: true })

      expect(result).toEqual({ fallback: true })
    })

    it('should return fallback when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('access denied')
      })

      const result = readJson('test-key', 'fallback-value')

      expect(result).toBe('fallback-value')
    })
  })

  describe('writeJson', () => {
    it('should persist value as JSON', () => {
      writeJson('test-key', { name: 'Juliana Santos' })

      expect(localStorage.getItem('test-key')).toBe('{"name":"Juliana Santos"}')
    })

    it('should swallow errors when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      expect(() => writeJson('test-key', { value: 1 })).not.toThrow()
    })
  })
})
