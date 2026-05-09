import { BaseRepository } from './BaseRepository'
import type { FiltroTarefas } from '../shared/types'
import type { TarefaRow } from './FaseRepository'

export interface CreateTarefaDTO {
  texto: string
  faseId: string
  clienteId: string
}

export interface UpdateTarefaDTO {
  texto?: string
  concluida?: boolean
}

export class TarefaRepository extends BaseRepository {
  async getTarefasByFase(
    clienteId: string,
    faseId: string,
    filtro: FiltroTarefas = 'todas'
  ): Promise<TarefaRow[]> {
    let sql = 'SELECT * FROM tarefas WHERE fase_id = ? AND cliente_id = ?'
    const params: (string | number)[] = [faseId, clienteId]

    if (filtro === 'pendentes') {
      sql += ' AND concluida = 0'
    } else if (filtro === 'concluidas') {
      sql += ' AND concluida = 1'
    }

    sql += ' ORDER BY ordem'
    return this.queryAll<TarefaRow>(sql, params)
  }

  async getTarefa(clienteId: string, tarefaId: string): Promise<TarefaRow | null> {
    return this.queryOne<TarefaRow>(
      'SELECT * FROM tarefas WHERE id = ? AND cliente_id = ?',
      [tarefaId, clienteId]
    )
  }

  async createTarefa(data: CreateTarefaDTO): Promise<TarefaRow> {
    const maxOrdem = await this.queryOne<{ max_ordem: number | null }>(
      'SELECT MAX(ordem) as max_ordem FROM tarefas WHERE fase_id = ? AND cliente_id = ?',
      [data.faseId, data.clienteId]
    )
    const ordem = (maxOrdem?.max_ordem ?? -1) + 1
    const tarefaId = crypto.randomUUID()

    await this.execute(
      `INSERT INTO tarefas (id, fase_id, cliente_id, texto, ordem) VALUES (?, ?, ?, ?, ?)`,
      [tarefaId, data.faseId, data.clienteId, data.texto, ordem]
    )

    return this.queryOne<TarefaRow>(
      'SELECT * FROM tarefas WHERE id = ?',
      [tarefaId]
    ) as Promise<TarefaRow>
  }

  async updateTarefa(
    clienteId: string,
    tarefaId: string,
    data: UpdateTarefaDTO
  ): Promise<TarefaRow> {
    const fields: string[] = []
    const params: (string | number | null)[] = []

    if (data.texto !== undefined) {
      fields.push('texto = ?')
      params.push(data.texto)
    }
    if (data.concluida !== undefined) {
      fields.push('concluida = ?')
      params.push(data.concluida ? 1 : 0)
    }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP')
      params.push(tarefaId, clienteId)
      await this.execute(
        `UPDATE tarefas SET ${fields.join(', ')} WHERE id = ? AND cliente_id = ?`,
        params
      )
    }

    return this.queryOne<TarefaRow>(
      'SELECT * FROM tarefas WHERE id = ? AND cliente_id = ?',
      [tarefaId, clienteId]
    ) as Promise<TarefaRow>
  }

  async deleteTarefa(clienteId: string, tarefaId: string): Promise<void> {
    await this.execute(
      'DELETE FROM tarefas WHERE id = ? AND cliente_id = ?',
      [tarefaId, clienteId]
    )
  }
}
