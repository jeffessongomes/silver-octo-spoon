import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MaterialService } from '../../../src/services/MaterialService'
import { NotFoundError } from '../../../src/shared/errors'
import type { MaterialRepository, MaterialRow } from '../../../src/repositories/MaterialRepository'

const createMaterialRow = (overrides?: Partial<MaterialRow>): MaterialRow => ({
  id: 'mat-1',
  cliente_id: 'estefania',
  fase_id: null,
  nome: 'Contrato de Prestação de Serviços',
  tipo: 'doc',
  url: '',
  ordem: 0,
  ...overrides,
})

describe('MaterialService', () => {
  let service: MaterialService
  let matRepo: MaterialRepository

  beforeEach(() => {
    matRepo = {
      getMaterialsByCliente: vi.fn(),
      createMaterial: vi.fn(),
      updateMaterial: vi.fn(),
      deleteMaterial: vi.fn(),
    } as unknown as MaterialRepository

    service = new MaterialService(matRepo)
  })

  describe('when getBiblioteca is called', () => {
    it('should delegate to materialRepository', async () => {
      const materiais = [createMaterialRow()]
      vi.mocked(matRepo.getMaterialsByCliente).mockResolvedValue(materiais)

      const result = await service.getBiblioteca('estefania')

      expect(matRepo.getMaterialsByCliente).toHaveBeenCalledWith('estefania')
      expect(result).toEqual(materiais)
    })
  })

  describe('when createBibliotecaItem is called', () => {
    it('should create material without fase', async () => {
      const material = createMaterialRow()
      vi.mocked(matRepo.createMaterial).mockResolvedValue(material)

      const result = await service.createBibliotecaItem('estefania', { nome: 'Contrato de Prestação de Serviços', tipo: 'doc', url: '' })

      expect(matRepo.createMaterial).toHaveBeenCalledWith(expect.objectContaining({ clienteId: 'estefania', faseId: null }))
      expect(result).toEqual(material)
    })
  })

  describe('when createFaseMaterial is called', () => {
    it('should create material linked to a fase', async () => {
      const material = createMaterialRow({ fase_id: 'fase-1' })
      vi.mocked(matRepo.createMaterial).mockResolvedValue(material)

      const result = await service.createFaseMaterial('estefania', 'fase-1', { nome: 'Apresentação', tipo: 'slide', url: '' })

      expect(matRepo.createMaterial).toHaveBeenCalledWith(expect.objectContaining({ clienteId: 'estefania', faseId: 'fase-1' }))
      expect(result).toEqual(material)
    })
  })

  describe('when updateMaterial is called', () => {
    it('should throw NotFoundError when material does not exist', async () => {
      vi.mocked(matRepo.updateMaterial).mockResolvedValue(null)

      await expect(service.updateMaterial('estefania', 'nao-existe', {})).rejects.toThrow(NotFoundError)
    })

    it('should return updated material when found', async () => {
      const material = createMaterialRow({ nome: 'Novo Nome' })
      vi.mocked(matRepo.updateMaterial).mockResolvedValue(material)

      const result = await service.updateMaterial('estefania', 'mat-1', { nome: 'Novo Nome' })

      expect(matRepo.updateMaterial).toHaveBeenCalledWith('estefania', 'mat-1', { nome: 'Novo Nome' })
      expect(result.nome).toBe('Novo Nome')
    })
  })

  describe('when deleteMaterial is called', () => {
    it('should delegate to materialRepository', async () => {
      vi.mocked(matRepo.deleteMaterial).mockResolvedValue(undefined)

      await service.deleteMaterial('estefania', 'mat-1')

      expect(matRepo.deleteMaterial).toHaveBeenCalledWith('estefania', 'mat-1')
    })
  })
})
