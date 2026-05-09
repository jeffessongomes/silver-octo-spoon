import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { clearAllTables } from '../../fixtures/testDatabase'
import type { Application } from 'express'

describe('POST /api/clientes/:clienteId/painel/importar', () => {
  let app: Application

  beforeAll(async () => {
    app = await setupTestApp()
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  beforeEach(async () => {
    await clearAllTables()
    await request(app).post('/api/clientes').send({ id: 'estefania', nome: 'Estefania Silva' })
  })

  describe('when payload is valid', () => {
    it('should return 201 with importado count and fases list', async () => {
      const res = await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .set('X-Client-ID', 'estefania')
        .send({
          fases: [
            {
              titulo: 'Briefing',
              resumo: 'Reuniao inicial',
              tarefas: [{ texto: 'Colher requisitos' }],
              materiais: [],
            },
            {
              titulo: 'Criacao',
              tarefas: [],
            },
          ],
        })

      expect(res.status).toBe(201)
      expect(res.body.importado).toBe(2)
      expect(res.body.fases).toHaveLength(2)
      expect(res.body.fases[0].titulo).toBe('Briefing')
    })

    it('should persist fases so they appear in painel', async () => {
      await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .set('X-Client-ID', 'estefania')
        .send({ fases: [{ titulo: 'Onboarding', tarefas: [{ texto: 'Preencher formulario' }] }] })

      const painel = await request(app)
        .get('/api/clientes/estefania/painel')
        .set('X-Client-ID', 'estefania')

      expect(painel.body.fases).toHaveLength(1)
      expect(painel.body.fases[0].titulo).toBe('Onboarding')
      expect(painel.body.fases[0].tarefas).toHaveLength(1)
    })
  })

  describe('when payload is invalid', () => {
    it('should return 400 when fases is missing', async () => {
      const res = await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .set('X-Client-ID', 'estefania')
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.detalhes).toBeDefined()
    })

    it('should return 400 when fases is empty array', async () => {
      const res = await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .set('X-Client-ID', 'estefania')
        .send({ fases: [] })

      expect(res.status).toBe(400)
    })

    it('should return 400 when fase titulo is too short', async () => {
      const res = await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .set('X-Client-ID', 'estefania')
        .send({ fases: [{ titulo: 'AB' }] })

      expect(res.status).toBe(400)
      expect(res.body.detalhes).toBeInstanceOf(Array)
    })
  })

  describe('when cliente does not exist', () => {
    it('should return 404', async () => {
      const res = await request(app)
        .post('/api/clientes/nao-existe/painel/importar')
        .set('X-Client-ID', 'nao-existe')
        .send({ fases: [{ titulo: 'Qualquer Fase' }] })

      expect(res.status).toBe(404)
    })
  })

  describe('when auth fails', () => {
    it('should return 403 when X-Client-ID does not match', async () => {
      const res = await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .set('X-Client-ID', 'outro-cliente')
        .send({ fases: [{ titulo: 'Qualquer Fase' }] })

      expect(res.status).toBe(403)
    })

    it('should return 401 when X-Client-ID is missing', async () => {
      const res = await request(app)
        .post('/api/clientes/estefania/painel/importar')
        .send({ fases: [{ titulo: 'Qualquer Fase' }] })

      expect(res.status).toBe(401)
    })
  })
})
