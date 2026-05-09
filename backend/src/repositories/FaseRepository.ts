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

export interface TarefaComObservacao extends TarefaRow {
  observacao: string | null
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
  tipo: FaseTipo | null
  ordem: number
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface FaseComTarefas extends FaseRow {
  status: FaseStatus
  tarefas: TarefaComObservacao[]
  materiais: MaterialRow[]
}

export interface CreateTarefaDTO {
  texto: string
  observacao?: string
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

interface PainelFaseJoinRow {
  fase_id: string
  numero: string
  titulo: string
  resumo: string | null
  tipo: string | null
  ordem: number
  ativo: number
  criado_em: string
  atualizado_em: string
  tarefa_id: string | null
  texto: string | null
  concluida: number | null
  tarefa_ordem: number | null
  observacao: string | null
}

export class FaseRepository extends BaseRepository {
  private calcularStatus(tarefas: TarefaComObservacao[]): FaseStatus {
    const total = tarefas.length
    const concluidas = tarefas.filter((t) => t.concluida === 1).length
    if (total > 0 && concluidas === total) return 'done'
    if (concluidas > 0) return 'active'
    return 'pending'
  }

  async getFasesByCliente(clienteId: string): Promise<FaseRow[]> {
    return this.queryAll<FaseRow>(
      'SELECT id, cliente_id, numero, titulo, resumo, tipo, ordem, ativo, criado_em, atualizado_em FROM fases WHERE cliente_id = ? AND ativo = 1 ORDER BY ordem, criado_em',
      [clienteId]
    )
  }

  async getFaseWithTarefas(clienteId: string, faseId: string): Promise<FaseComTarefas | null> {
    const fase = await this.queryOne<FaseRow>(
      'SELECT id, cliente_id, numero, titulo, resumo, tipo, ordem, ativo, criado_em, atualizado_em FROM fases WHERE id = ? AND cliente_id = ? AND ativo = 1',
      [faseId, clienteId]
    )
    if (!fase) return null

    const tarefas = await this.queryAll<TarefaComObservacao>(
      `SELECT t.id, t.fase_id, t.cliente_id, t.texto, t.concluida, t.ordem,
              o.conteudo AS observacao
       FROM tarefas t
       LEFT JOIN observacoes o ON o.tarefa_id = t.id AND o.cliente_id = t.cliente_id
       WHERE t.fase_id = ? AND t.cliente_id = ?
       ORDER BY t.ordem`,
      [faseId, clienteId]
    )

    const materiais = await this.queryAll<MaterialRow>(
      'SELECT id, cliente_id, fase_id, nome, tipo, url, ordem FROM materiais WHERE fase_id = ? AND cliente_id = ? ORDER BY ordem',
      [faseId, clienteId]
    )

    return { ...fase, status: this.calcularStatus(tarefas), tarefas, materiais }
  }

  async getFasesWithAllTarefas(clienteId: string): Promise<FaseComTarefas[]> {
    const rows = await this.queryAll<PainelFaseJoinRow>(
      `SELECT
        f.id AS fase_id, f.numero, f.titulo, f.resumo, f.tipo, f.ordem, f.ativo, f.criado_em, f.atualizado_em,
        t.id AS tarefa_id, t.texto, t.concluida, t.ordem AS tarefa_ordem,
        o.conteudo AS observacao
       FROM fases f
       LEFT JOIN tarefas t ON t.fase_id = f.id AND t.cliente_id = ?
       LEFT JOIN observacoes o ON o.tarefa_id = t.id
       WHERE f.cliente_id = ? AND f.ativo = 1
       ORDER BY f.ordem ASC, t.ordem ASC`,
      [clienteId, clienteId]
    )

    const fasesMap = new Map<string, FaseComTarefas>()

    for (const row of rows) {
      if (!fasesMap.has(row.fase_id)) {
        fasesMap.set(row.fase_id, {
          id: row.fase_id,
          cliente_id: clienteId,
          numero: row.numero,
          titulo: row.titulo,
          resumo: row.resumo,
          tipo: row.tipo as FaseTipo | null,
          ordem: row.ordem,
          ativo: row.ativo,
          criado_em: row.criado_em,
          atualizado_em: row.atualizado_em,
          status: 'pending',
          tarefas: [],
          materiais: [],
        })
      }

      if (row.tarefa_id !== null) {
        fasesMap.get(row.fase_id)!.tarefas.push({
          id: row.tarefa_id,
          fase_id: row.fase_id,
          cliente_id: clienteId,
          texto: row.texto!,
          concluida: row.concluida!,
          ordem: row.tarefa_ordem!,
          observacao: row.observacao,
        })
      }
    }

    const fases = Array.from(fasesMap.values())
    for (const fase of fases) {
      fase.status = this.calcularStatus(fase.tarefas)
    }
    return fases
  }

  async createFaseWithTarefas(clienteId: string, data: CreateFaseDTO): Promise<FaseComTarefas> {
    const faseId = crypto.randomUUID()

    await this.db.run('BEGIN TRANSACTION')
    try {
      await this.execute(
        `INSERT INTO fases (id, cliente_id, numero, titulo, resumo, tipo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [faseId, clienteId, data.numero, data.titulo, data.resumo ?? null, data.tipo ?? null]
      )

      for (let i = 0; i < data.tarefas.length; i++) {
        const tarefaId = crypto.randomUUID()
        await this.execute(
          `INSERT INTO tarefas (id, fase_id, cliente_id, texto, ordem) VALUES (?, ?, ?, ?, ?)`,
          [tarefaId, faseId, clienteId, data.tarefas[i].texto, i]
        )
        const observacao = data.tarefas[i].observacao
        if (observacao && observacao.trim()) {
          const obsId = crypto.randomUUID()
          await this.execute(
            `INSERT INTO observacoes (id, tarefa_id, cliente_id, conteudo) VALUES (?, ?, ?, ?)`,
            [obsId, tarefaId, clienteId, observacao.trim()]
          )
        }
      }

      for (let i = 0; i < data.materiais.length; i++) {
        const matId = crypto.randomUUID()
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
