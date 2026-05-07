import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { clearAllTables } from '../../fixtures/testDatabase'
import type { Application } from 'express'

describe('POST /api/clientes', () => {
  let app: Application

  beforeAll(async () => {
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  it('should create cliente with valid data', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .send({ id: 'estefania', nome: 'Estefania Silva' })

    expect(res.status).toBe(201)
    expect(res.body.id).toBe('estefania')
    expect(res.body.nome).toBe('Estefania Silva')
  })

  it('should return 400 when nome is missing', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .send({ id: 'cliente-sem-nome' })

    expect(res.status).toBe(400)
    expect(res.body.statusCode).toBe(400)
  })

  it('should return 400 when trying to create duplicate cliente', async () => {
    await clearAllTables()
    await request(app).post('/api/clientes').send({ id: 'duplicado', nome: 'Primeiro' })

    const res = await request(app)
      .post('/api/clientes')
      .send({ id: 'duplicado', nome: 'Segundo' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/clientes/:clienteId', () => {
  let app: Application

  beforeAll(async () => {
    app = await setupTestApp()
    await clearAllTables()
    await request(app).post('/api/clientes').send({ id: 'estefania', nome: 'Estefania Silva' })
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  it('should return cliente when it exists', async () => {
    const res = await request(app)
      .get('/api/clientes/estefania')
      .set('X-Client-ID', 'estefania')

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('estefania')
  })

  it('should return 404 when cliente does not exist', async () => {
    const res = await request(app)
      .get('/api/clientes/nao-existe')
      .set('X-Client-ID', 'nao-existe')

    expect(res.status).toBe(404)
  })
})
