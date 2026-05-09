import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { authClienteMiddleware } from '../../../src/middleware/auth'
import { UnauthorizedError, ForbiddenError } from '../../../src/shared/errors'

const mockRes = () =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response

describe('authClienteMiddleware', () => {
  it('should call next with UnauthorizedError when X-Client-ID header is missing', () => {
    const req = { headers: {}, params: { clienteId: 'estefania' } } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    authClienteMiddleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError))
    const err = vi.mocked(next).mock.calls[0][0] as UnauthorizedError
    expect(err.statusCode).toBe(401)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should call next with ForbiddenError when X-Client-ID does not match clienteId in params', () => {
    const req = {
      headers: { 'x-client-id': 'outro-cliente' },
      params: { clienteId: 'estefania' },
    } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    authClienteMiddleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError))
    const err = vi.mocked(next).mock.calls[0][0] as ForbiddenError
    expect(err.statusCode).toBe(403)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should call next without arguments when X-Client-ID matches clienteId', () => {
    const req = {
      headers: { 'x-client-id': 'estefania' },
      params: { clienteId: 'estefania' },
    } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    authClienteMiddleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.status).not.toHaveBeenCalled()
  })
})
