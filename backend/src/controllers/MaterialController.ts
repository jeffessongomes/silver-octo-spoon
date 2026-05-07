import type { Request, Response, NextFunction } from 'express'
import { MaterialRepository } from '../repositories/MaterialRepository'
import { NotFoundError } from '../shared/errors'
import type { MaterialTipo } from '../shared/types'

export class MaterialController {
  constructor(private materialRepository: MaterialRepository) {}

  async getBiblioteca(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const biblioteca = await this.materialRepository.getMaterialsByCliente(req.params.clienteId)
      res.json(biblioteca)
    } catch (err) {
      next(err)
    }
  }

  async createBibliotecaItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await this.materialRepository.createMaterial({
        clienteId: req.params.clienteId,
        faseId: null,
        nome: req.body.nome,
        tipo: req.body.tipo as MaterialTipo,
        url: req.body.url ?? '',
      })
      res.status(201).json(material)
    } catch (err) {
      next(err)
    }
  }

  async createFaseMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await this.materialRepository.createMaterial({
        clienteId: req.params.clienteId,
        faseId: req.params.faseId,
        nome: req.body.nome,
        tipo: req.body.tipo as MaterialTipo,
        url: req.body.url ?? '',
      })
      res.status(201).json(material)
    } catch (err) {
      next(err)
    }
  }

  async updateMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await this.materialRepository.updateMaterial(
        req.params.clienteId,
        req.params.materialId,
        req.body
      )
      if (!material) throw new NotFoundError(`Material '${req.params.materialId}' não encontrado`)
      res.json(material)
    } catch (err) {
      next(err)
    }
  }

  async deleteMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.materialRepository.deleteMaterial(req.params.clienteId, req.params.materialId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
