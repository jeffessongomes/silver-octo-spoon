import type { Request, Response, NextFunction } from 'express'

export function authClienteMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clienteId = req.headers['x-client-id'] as string | undefined
  const paramsClienteId = req.params.clienteId

  if (!clienteId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Header X-Client-ID é obrigatório',
      statusCode: 401,
    })
    return
  }

  if (paramsClienteId && clienteId !== paramsClienteId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'X-Client-ID não tem permissão para acessar este cliente',
      statusCode: 403,
    })
    return
  }

  next()
}
