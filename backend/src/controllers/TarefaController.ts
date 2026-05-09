import type { Request, Response, NextFunction } from 'express'
import { TarefaService } from '../services/TarefaService'
import { NotFoundError } from '../shared/errors'

export class TarefaController {
  constructor(private tarefaService: TarefaService) {}

  async getTarefa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tarefa = await this.tarefaService.getTarefa(
        req.params.clienteId,
        req.params.tarefaId
      )
      if (!tarefa) throw new NotFoundError(`Tarefa '${req.params.tarefaId}' não encontrada`)
      res.json(tarefa)
    } catch (err) {
      next(err)
    }
  }

  async updateTarefa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.tarefaService.updateTarefa(
        req.params.clienteId,
        req.params.tarefaId,
        req.body
      )
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async deleteTarefa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.tarefaService.deleteTarefa(req.params.clienteId, req.params.tarefaId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
