import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'

export function createTarefasRouter(container: Container): Router {
  const router = Router()
  const { tarefaController } = container

  /**
   * @swagger
   * /api/clientes/{clienteId}/tarefas/{tarefaId}:
   *   get:
   *     summary: Retorna uma tarefa pelo ID
   *     tags: [Tarefas]
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
   *         description: Dados da tarefa
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tarefa'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/clientes/:clienteId/tarefas/:tarefaId', authClienteMiddleware, (req, res, next) =>
    tarefaController.getTarefa(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/tarefas/{tarefaId}:
   *   patch:
   *     summary: Atualiza uma tarefa
   *     tags: [Tarefas]
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
   *             properties:
   *               texto:
   *                 type: string
   *               concluida:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Tarefa atualizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tarefa'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.patch('/clientes/:clienteId/tarefas/:tarefaId', authClienteMiddleware, (req, res, next) =>
    tarefaController.updateTarefa(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/tarefas/{tarefaId}:
   *   delete:
   *     summary: Remove uma tarefa
   *     tags: [Tarefas]
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
   *         description: Tarefa removida
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/clientes/:clienteId/tarefas/:tarefaId', authClienteMiddleware, (req, res, next) =>
    tarefaController.deleteTarefa(req, res, next)
  )

  return router
}
