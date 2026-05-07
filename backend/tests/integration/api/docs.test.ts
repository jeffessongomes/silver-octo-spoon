import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { initializeDatabase, closeDatabase } from '../../../src/database'
import { createApp } from '../../../src/app'
import type { Application } from 'express'

describe('GET /api-docs', () => {
  let app: Application

  beforeAll(async () => {
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  it('should serve swagger ui html at /api-docs/', async () => {
    const res = await request(app).get('/api-docs/')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
  })

  it('should return valid openapi spec at /api-docs.json', async () => {
    const res = await request(app).get('/api-docs.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.0')
    expect(res.body.info.title).toBe('Painel Estefania API')
    expect(res.body.info.version).toBe('1.0.0')
  })
})

describe('GET /api-docs with SWAGGER_ENABLED=false', () => {
  let app: Application
  const saved = process.env.SWAGGER_ENABLED

  beforeAll(async () => {
    process.env.SWAGGER_ENABLED = 'false'
    await initializeDatabase(':memory:')
    app = createApp()
  })

  afterAll(async () => {
    if (saved === undefined) {
      delete process.env.SWAGGER_ENABLED
    } else {
      process.env.SWAGGER_ENABLED = saved
    }
    await closeDatabase()
  })

  it('should return 404 when SWAGGER_ENABLED is false', async () => {
    const res = await request(app).get('/api-docs')
    expect(res.status).toBe(404)
  })
})
