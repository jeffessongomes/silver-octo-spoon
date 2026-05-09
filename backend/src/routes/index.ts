import { Router } from 'express'
import type { Container } from '../container'
import { createClientesRouter } from './clientes'
import { createPainelRouter } from './painel'
import { createFasesRouter } from './fases'
import { createTarefasRouter } from './tarefas'
import { createObservacoesRouter } from './observacoes'
import { createMateriaisRouter } from './materiais'

export function createRouter(container: Container): Router {
  const router = Router()
  router.use(createClientesRouter(container))
  router.use(createPainelRouter(container))
  router.use(createFasesRouter(container))
  router.use(createTarefasRouter(container))
  router.use(createObservacoesRouter(container))
  router.use(createMateriaisRouter(container))
  return router
}
