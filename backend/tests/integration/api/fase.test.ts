import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { clearAllTables } from '../../fixtures/testDatabase'
import type { Application } from 'express'

const BASE_URL = '/api/clientes/estefania/fases'
const CLIENT_ID = 'estefania'

const validFaseBody = {
  numero: 'Fase 01 · Mês 1',
  titulo: 'Discovery',
  resumo: 'Fase inicial de levantamento',
}

const validFaseBodyWithTarefas = {
  ...validFaseBody,
  tarefas: [{ texto: 'Levantar requisitos' }, { texto: 'Entrevistar stakeholders' }],
}

describe('POST /api/clientes/:clienteId/fases', () => {
  let app: Application

  beforeAll(async () => {
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  beforeEach(async () => {
    await clearAllTables()
    await request(app)
      .post('/api/clientes')
      .send({ id: CLIENT_ID, nome: 'Estefania Silva' })
  })

  it('should return 404 when cliente does not exist', async () => {
    const res = await request(app)
      .post('/api/clientes/nao-existe/fases')
      .set('X-Client-ID', 'nao-existe')
      .send(validFaseBody)

    expect(res.status).toBe(404)
    expect(res.body.statusCode).toBe(404)
    expect(res.body.error).toBe('NotFoundError')
  })

  it('should create fase and return 201 with valid body (no tarefas)', async () => {
    const res = await request(app)
      .post(BASE_URL)
      .set('X-Client-ID', CLIENT_ID)
      .send(validFaseBody)

    expect(res.status).toBe(201)
    expect(res.body.titulo).toBe(validFaseBody.titulo)
    expect(res.body.numero).toBe(validFaseBody.numero)
    expect(res.body.tarefas).toEqual([])
    expect(res.body.materiais).toEqual([])
  })

  it('should create fase and return 201 with valid body including tarefas', async () => {
    const res = await request(app)
      .post(BASE_URL)
      .set('X-Client-ID', CLIENT_ID)
      .send(validFaseBodyWithTarefas)

    expect(res.status).toBe(201)
    expect(res.body.tarefas).toHaveLength(2)
    expect(res.body.tarefas[0].texto).toBe('Levantar requisitos')
  })

  it('should return 400 when titulo is missing', async () => {
    const res = await request(app)
      .post(BASE_URL)
      .set('X-Client-ID', CLIENT_ID)
      .send({ numero: validFaseBody.numero, resumo: validFaseBody.resumo })

    expect(res.status).toBe(400)
    expect(res.body.statusCode).toBe(400)
  })

  it('should return 400 when numero is missing', async () => {
    const res = await request(app)
      .post(BASE_URL)
      .set('X-Client-ID', CLIENT_ID)
      .send({ titulo: validFaseBody.titulo, resumo: validFaseBody.resumo })

    expect(res.status).toBe(400)
    expect(res.body.statusCode).toBe(400)
  })

  it('should return 401 when X-Client-ID header is missing', async () => {
    const res = await request(app)
      .post(BASE_URL)
      .send(validFaseBody)

    expect(res.status).toBe(401)
    expect(res.body.statusCode).toBe(401)
  })

  it('should return 403 when X-Client-ID does not match clienteId in URL', async () => {
    await request(app)
      .post('/api/clientes')
      .send({ id: 'outro-cliente', nome: 'Outro Cliente' })

    const res = await request(app)
      .post(BASE_URL)
      .set('X-Client-ID', 'outro-cliente')
      .send(validFaseBody)

    expect(res.status).toBe(403)
    expect(res.body.statusCode).toBe(403)
  })
})
