import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { errorHandlerMiddleware } from '../../../src/middleware/errorHandler'
import { ValidationError, NotFoundError } from '../../../src/shared/errors'

const mockReq = {} as Request
const mockNext = vi.fn() as NextFunction

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

describe('errorHandlerMiddleware', () => {
  it('should return 400 for ValidationError with details', () => {
    const res = mockRes()
    const err = new ValidationError('Dados inválidos', { campo: 'obrigatório' })

    errorHandlerMiddleware(err, mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(String),
        statusCode: 400,
        details: { campo: 'obrigatório' },
      })
    )
  })

  it('should return 404 for NotFoundError', () => {
    const res = mockRes()
    const err = new NotFoundError('Recurso não encontrado')

    errorHandlerMiddleware(err, mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should return 500 for generic Error', () => {
    const res = mockRes()
    const err = new Error('Erro inesperado')

    errorHandlerMiddleware(err, mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 })
    )
  })

  it('should return 422 for SQLITE_CONSTRAINT error', () => {
    const res = mockRes()
    const err = Object.assign(new Error('UNIQUE constraint failed'), { code: 'SQLITE_CONSTRAINT' })

    errorHandlerMiddleware(err, mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'UnprocessableEntity',
        statusCode: 422,
      })
    )
  })

  it('should return 500 for sqlite error without code', () => {
    const res = mockRes()
    const err = new Error('some db error without code')

    errorHandlerMiddleware(err, mockReq, res, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
