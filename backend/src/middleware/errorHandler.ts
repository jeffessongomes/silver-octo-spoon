import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/errors'

interface SqliteError extends Error {
  code?: string
}

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      ...(err.details && { details: err.details }),
    })
    return
  }

  if ((err as SqliteError).code === 'SQLITE_CONSTRAINT') {
    res.status(422).json({
      error: 'UnprocessableEntity',
      message: 'Operação viola uma restrição de integridade dos dados',
      statusCode: 422,
    })
    return
  }

  console.error('[Unhandled Error]', err)
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Erro interno do servidor',
    statusCode: 500,
  })
}
