import type { Request, Response, NextFunction } from 'express'
import { PainelService } from '../services/PainelService'

export class PainelController {
  constructor(private painelService: PainelService) {}

  async getPainel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const painel = await this.painelService.getPainelCompleto(req.params.clienteId)
      res.json(painel)
    } catch (err) {
      next(err)
    }
  }
}
