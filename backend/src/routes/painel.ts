import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'

export function createPainelRouter(container: Container): Router {
  const router = Router()
  const { painelController } = container

  /**
   * @swagger
   * /api/clientes/{clienteId}/painel:
   *   get:
   *     summary: Retorna o painel completo do cliente
   *     tags: [Painel]
   *     security:
   *       - ClienteAuth: []
   *     parameters:
   *       - in: path
   *         name: clienteId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do cliente
   *         example: estefania
   *     responses:
   *       200:
   *         description: Painel completo com fases, tarefas e biblioteca
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DadosPainel'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/clientes/:clienteId/painel', authClienteMiddleware, (req, res, next) =>
    painelController.getPainel(req, res, next)
  )

  return router
}
