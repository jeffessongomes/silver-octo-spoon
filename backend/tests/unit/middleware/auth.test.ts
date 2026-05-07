import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { authClienteMiddleware } from '../../../src/middleware/auth'

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

describe('authClienteMiddleware', () => {
  it('should return 401 when X-Client-ID header is missing', () => {
    const req = { headers: {}, params: { clienteId: 'estefania' } } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    authClienteMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 when X-Client-ID does not match clienteId in params', () => {
    const req = {
      headers: { 'x-client-id': 'outro-cliente' },
      params: { clienteId: 'estefania' },
    } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    authClienteMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next when X-Client-ID matches clienteId', () => {
    const req = {
      headers: { 'x-client-id': 'estefania' },
      params: { clienteId: 'estefania' },
    } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    authClienteMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
