import type { Request, Response, NextFunction } from 'express'
import { ImportarPainelService, ImportacaoValidationError } from '../services/ImportarPainelService'

export class ImportarPainelController {
  constructor(private importarPainelService: ImportarPainelService) {}

  async importarPainel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.importarPainelService.importarPainel(
        req.params.clienteId,
        req.body
      )
      res.status(201).json(result)
    } catch (err) {
      if (err instanceof ImportacaoValidationError) {
        res.status(400).json({ error: err.message, detalhes: err.detalhes })
        return
      }
      next(err)
    }
  }
}
