import type { Request, Response, NextFunction } from 'express'
import { MaterialService } from '../services/MaterialService'
import type { MaterialTipo } from '../shared/types'

export class MaterialController {
  constructor(private materialService: MaterialService) {}

  async getBiblioteca(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const biblioteca = await this.materialService.getBiblioteca(req.params.clienteId)
      res.json(biblioteca)
    } catch (err) {
      next(err)
    }
  }

  async createBibliotecaItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await this.materialService.createBibliotecaItem(req.params.clienteId, {
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
      const material = await this.materialService.createFaseMaterial(
        req.params.clienteId,
        req.params.faseId,
        {
          nome: req.body.nome,
          tipo: req.body.tipo as MaterialTipo,
          url: req.body.url ?? '',
        }
      )
      res.status(201).json(material)
    } catch (err) {
      next(err)
    }
  }

  async updateMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await this.materialService.updateMaterial(
        req.params.clienteId,
        req.params.materialId,
        req.body
      )
      res.json(material)
    } catch (err) {
      next(err)
    }
  }

  async deleteMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.materialService.deleteMaterial(req.params.clienteId, req.params.materialId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
