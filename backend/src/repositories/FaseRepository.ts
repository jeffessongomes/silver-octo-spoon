import { BaseRepository } from './BaseRepository'
import type { FaseStatus, FaseTipo, MaterialTipo } from '../shared/types'

export interface TarefaRow {
  id: string
  fase_id: string
  cliente_id: string
  texto: string
  concluida: number
  ordem: number
}

export interface MaterialRow {
  id: string
  cliente_id: string
  fase_id: string | null
  nome: string
  tipo: MaterialTipo
  url: string
  ordem: number
}

export interface FaseRow {
  id: string
  cliente_id: string
  numero: string
  titulo: string
  resumo: string | null
  status: FaseStatus
  tipo: FaseTipo | null
  ordem: number
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface FaseComTarefas extends FaseRow {
  tarefas: TarefaRow[]
  materiais: MaterialRow[]
}

export interface CreateTarefaDTO {
  texto: string
}

export interface CreateMaterialDTO {
  nome: string
  tipo: MaterialTipo
  url: string
}

export interface CreateFaseDTO {
  numero: string
  titulo: string
  resumo: string
  tipo?: FaseTipo | null
  tarefas: CreateTarefaDTO[]
  materiais: CreateMaterialDTO[]
}

export interface UpdateFaseDTO {
  numero?: string
  titulo?: string
  resumo?: string
  tipo?: FaseTipo | null
}

export class FaseRepository extends BaseRepository {
  async getFasesByCliente(clienteId: string): Promise<FaseRow[]> {
    return this.queryAll<FaseRow>(
      'SELECT * FROM fases WHERE cliente_id = ? AND ativo = 1 ORDER BY ordem, criado_em',
      [clienteId]
    )
  }

  async getFaseWithTarefas(clienteId: string, faseId: string): Promise<FaseComTarefas | null> {
    const fase = await this.queryOne<FaseRow>(
      'SELECT * FROM fases WHERE id = ? AND cliente_id = ? AND ativo = 1',
      [faseId, clienteId]
    )
    if (!fase) return null

    const tarefas = await this.queryAll<TarefaRow>(
      'SELECT * FROM tarefas WHERE fase_id = ? AND cliente_id = ? ORDER BY ordem',
      [faseId, clienteId]
    )

    const materiais = await this.queryAll<MaterialRow>(
      'SELECT * FROM materiais WHERE fase_id = ? AND cliente_id = ? ORDER BY ordem',
      [faseId, clienteId]
    )

    return { ...fase, tarefas, materiais }
  }

  async createFaseWithTarefas(clienteId: string, data: CreateFaseDTO): Promise<FaseComTarefas> {
    const faseId = `fase-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    await this.db.run('BEGIN TRANSACTION')
    try {
      await this.execute(
        `INSERT INTO fases (id, cliente_id, numero, titulo, resumo, tipo, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [faseId, clienteId, data.numero, data.titulo, data.resumo ?? null, data.tipo ?? null]
      )

      for (let i = 0; i < data.tarefas.length; i++) {
        const tarefaId = `t-${faseId}-${i + 1}`
        await this.execute(
          `INSERT INTO tarefas (id, fase_id, cliente_id, texto, ordem) VALUES (?, ?, ?, ?, ?)`,
          [tarefaId, faseId, clienteId, data.tarefas[i].texto, i]
        )
      }

      for (let i = 0; i < data.materiais.length; i++) {
        const matId = `mat-${faseId}-${i + 1}`
        await this.execute(
          `INSERT INTO materiais (id, cliente_id, fase_id, nome, tipo, url, ordem) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [matId, clienteId, faseId, data.materiais[i].nome, data.materiais[i].tipo, data.materiais[i].url, i]
        )
      }

      await this.db.run('COMMIT')
    } catch (err) {
      await this.db.run('ROLLBACK')
      throw err
    }

    const result = await this.getFaseWithTarefas(clienteId, faseId)
    return result!
  }

  async recalculateFaseStatus(clienteId: string, faseId: string): Promise<void> {
    const counts = await this.queryOne<{ total: number; concluidas: number }>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN concluida = 1 THEN 1 ELSE 0 END) as concluidas
       FROM tarefas WHERE fase_id = ? AND cliente_id = ?`,
      [faseId, clienteId]
    )

    const total = counts?.total ?? 0
    const concluidas = counts?.concluidas ?? 0

    let status: FaseStatus = 'pending'
    if (total > 0 && concluidas === total) {
      status = 'done'
    } else if (concluidas > 0) {
      status = 'active'
    }

    await this.execute(
      `UPDATE fases SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ? AND cliente_id = ?`,
      [status, faseId, clienteId]
    )
  }

  async updateFase(clienteId: string, faseId: string, data: UpdateFaseDTO): Promise<FaseComTarefas | null> {
    const fields: string[] = []
    const params: (string | null)[] = []

    if (data.numero !== undefined) { fields.push('numero = ?'); params.push(data.numero) }
    if (data.titulo !== undefined) { fields.push('titulo = ?'); params.push(data.titulo) }
    if (data.resumo !== undefined) { fields.push('resumo = ?'); params.push(data.resumo) }
    if (data.tipo !== undefined) { fields.push('tipo = ?'); params.push(data.tipo ?? null) }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP')
      params.push(faseId, clienteId)
      await this.execute(
        `UPDATE fases SET ${fields.join(', ')} WHERE id = ? AND cliente_id = ?`,
        params
      )
    }

    return this.getFaseWithTarefas(clienteId, faseId)
  }

  async deleteFase(clienteId: string, faseId: string): Promise<void> {
    await this.execute(
      'DELETE FROM fases WHERE id = ? AND cliente_id = ?',
      [faseId, clienteId]
    )
  }
}
