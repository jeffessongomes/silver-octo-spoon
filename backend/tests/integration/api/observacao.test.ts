import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { clearAllTables } from '../../fixtures/testDatabase'
import type { Application } from 'express'

describe('Observacoes API', () => {
  let app: Application
  let tarefaId: string

  beforeAll(async () => {
    app = await setupTestApp()
    await clearAllTables()

    await request(app).post('/api/clientes').send({ id: 'estefania', nome: 'Estefania Silva' })

    const faseRes = await request(app)
      .post('/api/clientes/estefania/fases')
      .set('X-Client-ID', 'estefania')
      .send({
        numero: 'Fase 01',
        titulo: 'Discovery',
        resumo: '',
        tarefas: [{ texto: 'Tarefa com observacao' }],
        materiais: [],
      })

    tarefaId = faseRes.body.tarefas[0].id
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  describe('PUT /api/clientes/:clienteId/tarefas/:tarefaId/observacao', () => {
    it('should create observacao (upsert)', async () => {
      const res = await request(app)
        .put(`/api/clientes/estefania/tarefas/${tarefaId}/observacao`)
        .set('X-Client-ID', 'estefania')
        .send({ conteudo: 'Primeira observacao' })

      expect(res.status).toBe(200)
      expect(res.body.conteudo).toBe('Primeira observacao')
    })

    it('should update observacao without 409 (upsert)', async () => {
      await request(app)
        .put(`/api/clientes/estefania/tarefas/${tarefaId}/observacao`)
        .set('X-Client-ID', 'estefania')
        .send({ conteudo: 'Primeira observacao' })

      const res = await request(app)
        .put(`/api/clientes/estefania/tarefas/${tarefaId}/observacao`)
        .set('X-Client-ID', 'estefania')
        .send({ conteudo: 'Observacao atualizada' })

      expect(res.status).toBe(200)
      expect(res.body.conteudo).toBe('Observacao atualizada')
    })

    it('should allow empty conteudo', async () => {
      const res = await request(app)
        .put(`/api/clientes/estefania/tarefas/${tarefaId}/observacao`)
        .set('X-Client-ID', 'estefania')
        .send({ conteudo: '' })

      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/clientes/:clienteId/tarefas/:tarefaId/observacao', () => {
    it('should return observacao when it exists', async () => {
      await request(app)
        .put(`/api/clientes/estefania/tarefas/${tarefaId}/observacao`)
        .set('X-Client-ID', 'estefania')
        .send({ conteudo: 'Conteudo existente' })

      const res = await request(app)
        .get(`/api/clientes/estefania/tarefas/${tarefaId}/observacao`)
        .set('X-Client-ID', 'estefania')

      expect(res.status).toBe(200)
      expect(res.body.conteudo).toBe('Conteudo existente')
    })
  })
})
