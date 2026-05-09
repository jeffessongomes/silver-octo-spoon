import type { Request, Response, NextFunction } from 'express'
import { UnauthorizedError, ForbiddenError } from '../shared/errors'

export function authClienteMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const clienteId = req.headers['x-client-id'] as string | undefined
  const paramsClienteId = req.params.clienteId

  if (!clienteId) {
    next(new UnauthorizedError('Header X-Client-ID é obrigatório'))
    return
  }

  if (paramsClienteId && clienteId !== paramsClienteId) {
    next(new ForbiddenError('X-Client-ID não tem permissão para acessar este cliente'))
    return
  }

  next()
}
