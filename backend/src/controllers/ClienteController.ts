import type { Request, Response, NextFunction } from 'express'
import { ClienteService } from '../services/ClienteService'

export class ClienteController {
  constructor(private clienteService: ClienteService) {}

  async createCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await this.clienteService.createCliente(req.body)
      res.status(201).json(cliente)
    } catch (err) {
      next(err)
    }
  }

  async getCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await this.clienteService.getCliente(req.params.clienteId)
      res.json(cliente)
    } catch (err) {
      next(err)
    }
  }

  async updateCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cliente = await this.clienteService.updateCliente(req.params.clienteId, req.body)
      res.json(cliente)
    } catch (err) {
      next(err)
    }
  }

  async deleteCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.clienteService.deleteCliente(req.params.clienteId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientes = await this.clienteService.getAll()
      res.json(clientes)
    } catch (err) {
      next(err)
    }
  }
}
