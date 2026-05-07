import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { clearAllTables } from '../../fixtures/testDatabase'
import type { Application } from 'express'

describe('GET /api/clientes/:clienteId/painel', () => {
  let app: Application

  beforeAll(async () => {
    app = await setupTestApp()
    await clearAllTables()

    await request(app).post('/api/clientes').send({
      id: 'estefania',
      nome: 'Estefania Silva',
    })

    await request(app)
      .post('/api/clientes/estefania/fases')
      .set('X-Client-ID', 'estefania')
      .send({
        numero: 'Fase 01 · Mes 1',
        titulo: 'Discovery',
        resumo: 'Fase inicial',
        tarefas: [{ texto: 'Mapeamento de requisitos' }],
        materiais: [],
      })
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  it('should return DadosPainel with fases and biblioteca', async () => {
    const res = await request(app)
      .get('/api/clientes/estefania/painel')
      .set('X-Client-ID', 'estefania')

    expect(res.status).toBe(200)
    expect(res.body.cliente).toBe('estefania')
    expect(res.body.fases).toHaveLength(1)
    expect(res.body.fases[0].titulo).toBe('Discovery')
    expect(res.body.fases[0].tarefas).toHaveLength(1)
    expect(Array.isArray(res.body.biblioteca)).toBe(true)
  })

  it('should return 404 when cliente does not exist', async () => {
    const res = await request(app)
      .get('/api/clientes/nao-existe/painel')
      .set('X-Client-ID', 'nao-existe')

    expect(res.status).toBe(404)
  })

  it('should return 403 when X-Client-ID does not match', async () => {
    const res = await request(app)
      .get('/api/clientes/estefania/painel')
      .set('X-Client-ID', 'outro-cliente')

    expect(res.status).toBe(403)
  })
})
