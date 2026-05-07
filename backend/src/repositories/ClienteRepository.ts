import { BaseRepository } from './BaseRepository'

export interface ClienteRow {
  id: string
  nome: string
  descricao: string | null
  ativo: number
  criado_em: string
  atualizado_em: string
}

export interface CreateClienteDTO {
  id: string
  nome: string
  descricao?: string
}

export interface UpdateClienteDTO {
  nome?: string
  descricao?: string
  ativo?: boolean
}

export class ClienteRepository extends BaseRepository {
  async createCliente(data: CreateClienteDTO): Promise<ClienteRow> {
    await this.execute(
      `INSERT INTO clientes (id, nome, descricao) VALUES (?, ?, ?)`,
      [data.id, data.nome, data.descricao ?? null]
    )
    return this.queryOne<ClienteRow>(
      'SELECT * FROM clientes WHERE id = ?',
      [data.id]
    ) as Promise<ClienteRow>
  }

  async getCliente(clienteId: string): Promise<ClienteRow | null> {
    return this.queryOne<ClienteRow>(
      'SELECT * FROM clientes WHERE id = ?',
      [clienteId]
    )
  }

  async getAll(): Promise<ClienteRow[]> {
    return this.queryAll<ClienteRow>(
      'SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome'
    )
  }

  async updateCliente(clienteId: string, data: UpdateClienteDTO): Promise<ClienteRow | null> {
    const fields: string[] = []
    const params: (string | number | null)[] = []

    if (data.nome !== undefined) {
      fields.push('nome = ?')
      params.push(data.nome)
    }
    if (data.descricao !== undefined) {
      fields.push('descricao = ?')
      params.push(data.descricao)
    }
    if (data.ativo !== undefined) {
      fields.push('ativo = ?')
      params.push(data.ativo ? 1 : 0)
    }

    if (fields.length === 0) return this.getCliente(clienteId)

    fields.push('atualizado_em = CURRENT_TIMESTAMP')
    params.push(clienteId)

    await this.execute(
      `UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`,
      params
    )
    return this.getCliente(clienteId)
  }

  async deleteCliente(clienteId: string): Promise<void> {
    await this.execute('DELETE FROM clientes WHERE id = ?', [clienteId])
  }
}
