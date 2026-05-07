import { BaseRepository } from './BaseRepository'
import type { MaterialTipo } from '../shared/types'
export type { MaterialRow } from './FaseRepository'
import type { MaterialRow } from './FaseRepository'

export interface CreateMaterialDTO {
  clienteId: string
  faseId: string | null
  nome: string
  tipo: MaterialTipo
  url: string
}

export interface UpdateMaterialDTO {
  nome?: string
  tipo?: MaterialTipo
  url?: string
}

export class MaterialRepository extends BaseRepository {
  async getMaterialsByFase(clienteId: string, faseId: string): Promise<MaterialRow[]> {
    return this.queryAll<MaterialRow>(
      'SELECT * FROM materiais WHERE fase_id = ? AND cliente_id = ? ORDER BY ordem',
      [faseId, clienteId]
    )
  }

  async getMaterialsByCliente(clienteId: string): Promise<MaterialRow[]> {
    return this.queryAll<MaterialRow>(
      'SELECT * FROM materiais WHERE fase_id IS NULL AND cliente_id = ? ORDER BY ordem',
      [clienteId]
    )
  }

  async getMaterial(clienteId: string, materialId: string): Promise<MaterialRow | null> {
    return this.queryOne<MaterialRow>(
      'SELECT * FROM materiais WHERE id = ? AND cliente_id = ?',
      [materialId, clienteId]
    )
  }

  async createMaterial(data: CreateMaterialDTO): Promise<MaterialRow> {
    const matId = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const maxOrdem = await this.queryOne<{ max_ordem: number | null }>(
      'SELECT MAX(ordem) as max_ordem FROM materiais WHERE cliente_id = ? AND (fase_id = ? OR (fase_id IS NULL AND ? IS NULL))',
      [data.clienteId, data.faseId, data.faseId]
    )
    const ordem = (maxOrdem?.max_ordem ?? -1) + 1

    await this.execute(
      `INSERT INTO materiais (id, cliente_id, fase_id, nome, tipo, url, ordem) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [matId, data.clienteId, data.faseId, data.nome, data.tipo, data.url, ordem]
    )

    return this.queryOne<MaterialRow>(
      'SELECT * FROM materiais WHERE id = ?',
      [matId]
    ) as Promise<MaterialRow>
  }

  async updateMaterial(
    clienteId: string,
    materialId: string,
    data: UpdateMaterialDTO
  ): Promise<MaterialRow | null> {
    const fields: string[] = []
    const params: (string | null)[] = []

    if (data.nome !== undefined) { fields.push('nome = ?'); params.push(data.nome) }
    if (data.tipo !== undefined) { fields.push('tipo = ?'); params.push(data.tipo) }
    if (data.url !== undefined) { fields.push('url = ?'); params.push(data.url) }

    if (fields.length > 0) {
      fields.push('atualizado_em = CURRENT_TIMESTAMP')
      params.push(materialId, clienteId)
      await this.execute(
        `UPDATE materiais SET ${fields.join(', ')} WHERE id = ? AND cliente_id = ?`,
        params
      )
    }

    return this.getMaterial(clienteId, materialId)
  }

  async deleteMaterial(clienteId: string, materialId: string): Promise<void> {
    await this.execute(
      'DELETE FROM materiais WHERE id = ? AND cliente_id = ?',
      [materialId, clienteId]
    )
  }
}
