import { describe, it, expect } from 'vitest'
import { parseAllowedOrigins } from '../../src/shared/cors'

describe('parseAllowedOrigins', () => {
  describe('when CORS_ORIGIN is not set', () => {
    it('should return the default localhost origin when undefined', () => {
      expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:5173'])
    })

    it('should return the default localhost origin when empty string', () => {
      expect(parseAllowedOrigins('')).toEqual(['http://localhost:5173'])
    })
  })

  describe('when CORS_ORIGIN has a single origin', () => {
    it('should return that origin in an array', () => {
      expect(parseAllowedOrigins('https://meuapp.com')).toEqual(['https://meuapp.com'])
    })
  })

  describe('when CORS_ORIGIN has multiple origins', () => {
    it('should return all origins', () => {
      expect(parseAllowedOrigins('https://a.com,https://b.com')).toEqual([
        'https://a.com',
        'https://b.com',
      ])
    })

    it('should trim whitespace from each origin', () => {
      expect(parseAllowedOrigins(' https://a.com , https://b.com ')).toEqual([
        'https://a.com',
        'https://b.com',
      ])
    })

    it('should ignore trailing commas', () => {
      expect(parseAllowedOrigins('https://a.com,')).toEqual(['https://a.com'])
    })
  })
})
