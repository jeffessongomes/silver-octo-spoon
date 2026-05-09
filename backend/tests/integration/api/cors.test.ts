import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import type { Application } from 'express'

describe('CORS Middleware', () => {
  let app: Application

  beforeAll(async () => {
    process.env.CORS_ORIGIN = 'http://localhost:5173'
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
    delete process.env.CORS_ORIGIN
  })

  describe('when request comes from an allowed origin', () => {
    it('should respond to OPTIONS preflight with 200 and Access-Control-Allow-Origin', async () => {
      const res = await request(app)
        .options('/api/clientes/1/biblioteca')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, X-Client-ID')

      expect(res.status).toBe(200)
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })

    it('should include X-Client-ID in Access-Control-Allow-Headers on preflight', async () => {
      const res = await request(app)
        .options('/api/clientes/1/biblioteca')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, X-Client-ID')

      expect(res.headers['access-control-allow-headers']).toMatch(/x-client-id/i)
    })

    it('should include Access-Control-Allow-Origin on regular GET requests', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')

      expect(res.status).toBe(200)
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })
  })

  describe('when request comes from a disallowed origin', () => {
    it('should not include Access-Control-Allow-Origin header', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://evil.com')

      expect(res.status).toBe(200)
      expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('when request has no Origin header', () => {
    it('should respond normally without CORS errors', async () => {
      const res = await request(app).get('/health')

      expect(res.status).toBe(200)
    })
  })
})

describe('CORS Middleware with empty CORS_ORIGIN', () => {
  let app: Application

  beforeAll(async () => {
    process.env.CORS_ORIGIN = ''
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
    delete process.env.CORS_ORIGIN
  })

  it('should fall back to http://localhost:5173 when CORS_ORIGIN is empty', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173')

    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('should respond to OPTIONS preflight with allowed origin when CORS_ORIGIN is empty', async () => {
    const res = await request(app)
      .options('/api/clientes/1/biblioteca')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Content-Type, X-Client-ID')

    expect(res.status).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})

describe('CORS Middleware with multiple origins', () => {
  let app: Application

  beforeAll(async () => {
    process.env.CORS_ORIGIN = 'http://localhost:5173,http://localhost:4000'
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
    delete process.env.CORS_ORIGIN
  })

  it('should allow all origins listed in CORS_ORIGIN', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:4000')

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4000')
  })

  it('should reject origins not listed in CORS_ORIGIN', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:9999')

    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })
})
