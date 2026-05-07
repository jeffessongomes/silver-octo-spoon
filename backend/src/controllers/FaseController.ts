import type { Request, Response, NextFunction } from 'express'
import { FaseService } from '../services/FaseService'
import { FaseRepository } from '../repositories/FaseRepository'

export class FaseController {
  constructor(
    private faseService: FaseService,
    private faseRepository: FaseRepository
  ) {}

  async getFases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fases = await this.faseRepository.getFasesByCliente(req.params.clienteId)
      res.json(fases)
    } catch (err) {
      next(err)
    }
  }

  async getFase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fase = await this.faseService.getFaseComTarefas(
        req.params.clienteId,
        req.params.faseId
      )
      res.json(fase)
    } catch (err) {
      next(err)
    }
  }

  async createFase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fase = await this.faseService.createFase(req.params.clienteId, req.body)
      res.status(201).json(fase)
    } catch (err) {
      next(err)
    }
  }

  async updateFase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fase = await this.faseRepository.updateFase(
        req.params.clienteId,
        req.params.faseId,
        req.body
      )
      res.json(fase)
    } catch (err) {
      next(err)
    }
  }

  async deleteFase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.faseRepository.deleteFase(req.params.clienteId, req.params.faseId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  async createTarefa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.faseService.createTarefa(
        req.params.clienteId,
        req.params.faseId,
        req.body
      )
      res.status(201).json(result.tarefa)
    } catch (err) {
      next(err)
    }
  }

  async getTarefas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { TarefaRepository } = await import('../repositories/TarefaRepository')
      const tarefaRepo = new TarefaRepository()
      const filtro = (req.query.filtro as string) || 'todas'
      const tarefas = await tarefaRepo.getTarefasByFase(
        req.params.clienteId,
        req.params.faseId,
        filtro as 'todas' | 'pendentes' | 'concluidas'
      )
      res.json(tarefas)
    } catch (err) {
      next(err)
    }
  }
}
