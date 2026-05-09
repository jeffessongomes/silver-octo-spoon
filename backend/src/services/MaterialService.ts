import type { MaterialRepository, MaterialRow, UpdateMaterialDTO } from '../repositories/MaterialRepository'
import { NotFoundError } from '../shared/errors'
import type { MaterialTipo } from '../shared/types'

interface CreateMaterialInput {
  nome: string
  tipo: MaterialTipo
  url: string
}

export class MaterialService {
  constructor(private materialRepository: MaterialRepository) {}

  async getBiblioteca(clienteId: string): Promise<MaterialRow[]> {
    return this.materialRepository.getMaterialsByCliente(clienteId)
  }

  async createBibliotecaItem(clienteId: string, data: CreateMaterialInput): Promise<MaterialRow> {
    return this.materialRepository.createMaterial({ ...data, clienteId, faseId: null })
  }

  async createFaseMaterial(clienteId: string, faseId: string, data: CreateMaterialInput): Promise<MaterialRow> {
    return this.materialRepository.createMaterial({ ...data, clienteId, faseId })
  }

  async updateMaterial(clienteId: string, materialId: string, data: UpdateMaterialDTO): Promise<MaterialRow> {
    const material = await this.materialRepository.updateMaterial(clienteId, materialId, data)
    if (!material) throw new NotFoundError(`Material '${materialId}' não encontrado`)
    return material
  }

  async deleteMaterial(clienteId: string, materialId: string): Promise<void> {
    return this.materialRepository.deleteMaterial(clienteId, materialId)
  }
}
