import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { setupTestApp, teardownTestApp } from '../../fixtures/testApp'
import { clearAllTables } from '../../fixtures/testDatabase'
import type { Application } from 'express'

describe('Tarefas API', () => {
  let app: Application
  let faseId: string

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
        tarefas: [{ texto: 'Tarefa inicial' }],
        materiais: [],
      })

    faseId = faseRes.body.id
  })

  afterAll(async () => {
    await teardownTestApp()
  })

  describe('POST /api/clientes/:clienteId/fases/:faseId/tarefas', () => {
    it('should create a new tarefa in the fase', async () => {
      const res = await request(app)
        .post(`/api/clientes/estefania/fases/${faseId}/tarefas`)
        .set('X-Client-ID', 'estefania')
        .send({ texto: 'Nova tarefa' })

      expect(res.status).toBe(201)
      expect(res.body.texto).toBe('Nova tarefa')
      expect(res.body.concluida).toBe(0)
    })
  })

  describe('PATCH /api/clientes/:clienteId/tarefas/:tarefaId', () => {
    it('should toggle tarefa to concluida and recalculate fase status', async () => {
      const allTarefas = await request(app)
        .get(`/api/clientes/estefania/fases/${faseId}/tarefas`)
        .set('X-Client-ID', 'estefania')

      const todasTarefas = allTarefas.body
      for (const t of todasTarefas) {
        await request(app)
          .patch(`/api/clientes/estefania/tarefas/${t.id}`)
          .set('X-Client-ID', 'estefania')
          .send({ concluida: true })
      }

      const res = await request(app)
        .patch(`/api/clientes/estefania/tarefas/${todasTarefas[0].id}`)
        .set('X-Client-ID', 'estefania')
        .send({ concluida: true })

      expect(res.status).toBe(200)
      expect(res.body.tarefa).toBeDefined()
      expect(res.body.fase).toBeDefined()
      expect(res.body.fase.status).toBe('done')
    })
  })

  describe('DELETE /api/clientes/:clienteId/tarefas/:tarefaId', () => {
    it('should delete tarefa', async () => {
      const createRes = await request(app)
        .post(`/api/clientes/estefania/fases/${faseId}/tarefas`)
        .set('X-Client-ID', 'estefania')
        .send({ texto: 'Para deletar' })

      const novaId = createRes.body.id

      const deleteRes = await request(app)
        .delete(`/api/clientes/estefania/tarefas/${novaId}`)
        .set('X-Client-ID', 'estefania')

      expect(deleteRes.status).toBe(204)
    })
  })
})
