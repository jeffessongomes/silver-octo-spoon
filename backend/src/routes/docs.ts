import { Router } from 'express'
import type { RequestHandler } from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '../docs/swagger'

export { swaggerSpec } from '../docs/swagger'

export function createDocsRouter(): Router {
  const router = Router()
  const serve = swaggerUi.serve as unknown as RequestHandler[]
  const setup = swaggerUi.setup(swaggerSpec) as unknown as RequestHandler
  router.use('/', ...serve)
  router.get('/', setup)
  return router
}
