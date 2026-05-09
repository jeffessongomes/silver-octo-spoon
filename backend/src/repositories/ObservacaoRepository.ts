import { BaseRepository } from './BaseRepository'

export interface ObservacaoRow {
  id: string
  tarefa_id: string
  cliente_id: string
  conteudo: string | null
  criado_em: string
  atualizado_em: string
}

export class ObservacaoRepository extends BaseRepository {
  async getObservacao(clienteId: string, tarefaId: string): Promise<ObservacaoRow | null> {
    return this.queryOne<ObservacaoRow>(
      'SELECT * FROM observacoes WHERE tarefa_id = ? AND cliente_id = ?',
      [tarefaId, clienteId]
    )
  }

  async upsertObservacao(
    clienteId: string,
    tarefaId: string,
    conteudo: string
  ): Promise<ObservacaoRow> {
    const existing = await this.getObservacao(clienteId, tarefaId)

    if (existing) {
      await this.execute(
        `UPDATE observacoes SET conteudo = ?, atualizado_em = CURRENT_TIMESTAMP
         WHERE tarefa_id = ? AND cliente_id = ?`,
        [conteudo, tarefaId, clienteId]
      )
    } else {
      const obsId = crypto.randomUUID()
      await this.execute(
        `INSERT INTO observacoes (id, tarefa_id, cliente_id, conteudo) VALUES (?, ?, ?, ?)`,
        [obsId, tarefaId, clienteId, conteudo]
      )
    }

    return this.queryOne<ObservacaoRow>(
      'SELECT * FROM observacoes WHERE tarefa_id = ? AND cliente_id = ?',
      [tarefaId, clienteId]
    ) as Promise<ObservacaoRow>
  }

  async deleteObservacao(clienteId: string, tarefaId: string): Promise<void> {
    await this.execute(
      'DELETE FROM observacoes WHERE tarefa_id = ? AND cliente_id = ?',
      [tarefaId, clienteId]
    )
  }
}
