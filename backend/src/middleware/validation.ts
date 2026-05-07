import type { Request, Response, NextFunction } from 'express'
import { ValidationError } from '../shared/errors'

export function validateBody(requiredFields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const field of requiredFields) {
      const value = req.body[field]
      if (value === undefined || value === null) {
        return next(new ValidationError(`Campo '${field}' é obrigatório`, { [field]: 'required' }))
      }
      if (typeof value === 'string' && !value.trim()) {
        return next(new ValidationError(`Campo '${field}' não pode ser vazio`, { [field]: 'empty' }))
      }
    }
    next()
  }
}
