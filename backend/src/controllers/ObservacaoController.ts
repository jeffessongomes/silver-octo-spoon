import type { Request, Response, NextFunction } from 'express'
import { ObservacaoService } from '../services/ObservacaoService'

export class ObservacaoController {
  constructor(private observacaoService: ObservacaoService) {}

  async getObservacao(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const obs = await this.observacaoService.getObservacao(
        req.params.clienteId,
        req.params.tarefaId
      )
      if (!obs) {
        res.status(204).send()
        return
      }
      res.json(obs)
    } catch (err) {
      next(err)
    }
  }

  async upsertObservacao(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const obs = await this.observacaoService.upsertObservacao(
        req.params.clienteId,
        req.params.tarefaId,
        req.body.conteudo ?? ''
      )
      res.json(obs)
    } catch (err) {
      next(err)
    }
  }

  async deleteObservacao(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.observacaoService.deleteObservacao(req.params.clienteId, req.params.tarefaId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
