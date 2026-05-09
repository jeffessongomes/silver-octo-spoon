import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'

export function createObservacoesRouter(container: Container): Router {
  const router = Router()
  const { obsController } = container

  /**
   * @swagger
   * /api/clientes/{clienteId}/tarefas/{tarefaId}/observacao:
   *   get:
   *     summary: Retorna a observação de uma tarefa
   *     tags: [Observações]
   *     security:
   *       - ClienteAuth: []
   *     parameters:
   *       - in: path
   *         name: clienteId
   *         required: true
   *         schema:
   *           type: string
   *         example: estefania
   *       - in: path
   *         name: tarefaId
   *         required: true
   *         schema:
   *           type: string
   *         example: tarefa-abc123
   *     responses:
   *       200:
   *         description: Observação da tarefa
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 observacao:
   *                   type: string
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/clientes/:clienteId/tarefas/:tarefaId/observacao', authClienteMiddleware, (req, res, next) =>
    obsController.getObservacao(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/tarefas/{tarefaId}/observacao:
   *   put:
   *     summary: Cria ou atualiza a observação de uma tarefa (upsert)
   *     tags: [Observações]
   *     security:
   *       - ClienteAuth: []
   *     parameters:
   *       - in: path
   *         name: clienteId
   *         required: true
   *         schema:
   *           type: string
   *         example: estefania
   *       - in: path
   *         name: tarefaId
   *         required: true
   *         schema:
   *           type: string
   *         example: tarefa-abc123
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [observacao]
   *             properties:
   *               observacao:
   *                 type: string
   *                 example: Cliente solicitou revisão do prazo
   *     responses:
   *       200:
   *         description: Observação salva
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 observacao:
   *                   type: string
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.put('/clientes/:clienteId/tarefas/:tarefaId/observacao', authClienteMiddleware, (req, res, next) =>
    obsController.upsertObservacao(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/tarefas/{tarefaId}/observacao:
   *   delete:
   *     summary: Remove a observação de uma tarefa
   *     tags: [Observações]
   *     security:
   *       - ClienteAuth: []
   *     parameters:
   *       - in: path
   *         name: clienteId
   *         required: true
   *         schema:
   *           type: string
   *         example: estefania
   *       - in: path
   *         name: tarefaId
   *         required: true
   *         schema:
   *           type: string
   *         example: tarefa-abc123
   *     responses:
   *       204:
   *         description: Observação removida
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/clientes/:clienteId/tarefas/:tarefaId/observacao', authClienteMiddleware, (req, res, next) =>
    obsController.deleteObservacao(req, res, next)
  )

  return router
}
