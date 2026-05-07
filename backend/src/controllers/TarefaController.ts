import type { Request, Response, NextFunction } from 'express'
import { FaseService } from '../services/FaseService'
import { TarefaRepository } from '../repositories/TarefaRepository'
import { NotFoundError } from '../shared/errors'

export class TarefaController {
  constructor(
    private faseService: FaseService,
    private tarefaRepository: TarefaRepository
  ) {}

  async getTarefa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tarefa = await this.tarefaRepository.getTarefa(
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
      const tarefa = await this.tarefaRepository.getTarefa(
        req.params.clienteId,
        req.params.tarefaId
      )
      if (!tarefa) throw new NotFoundError(`Tarefa '${req.params.tarefaId}' não encontrada`)

      const result = await this.faseService.updateTarefa(
        req.params.clienteId,
        req.params.tarefaId,
        tarefa.fase_id,
        req.body
      )
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async deleteTarefa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tarefa = await this.tarefaRepository.getTarefa(
        req.params.clienteId,
        req.params.tarefaId
      )
      if (!tarefa) throw new NotFoundError(`Tarefa '${req.params.tarefaId}' não encontrada`)

      await this.faseService.deleteTarefa(req.params.clienteId, req.params.tarefaId, tarefa.fase_id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
