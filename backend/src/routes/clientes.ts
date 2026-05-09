import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'
import { validateBody } from '../middleware/validation'

export function createClientesRouter(container: Container): Router {
  const router = Router()
  const { clienteController } = container

  /**
   * @swagger
   * /api/clientes:
   *   post:
   *     summary: Cria um novo cliente
   *     tags: [Clientes]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [id, nome]
   *             properties:
   *               id:
   *                 type: string
   *                 example: estefania
   *               nome:
   *                 type: string
   *                 example: Estefania Silva
   *               descricao:
   *                 type: string
   *     responses:
   *       201:
   *         description: Cliente criado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteRow'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  router.post('/clientes', validateBody(['id', 'nome']), (req, res, next) =>
    clienteController.createCliente(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes:
   *   get:
   *     summary: Lista todos os clientes ativos
   *     tags: [Clientes]
   *     security: []
   *     responses:
   *       200:
   *         description: Lista de clientes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ClienteRow'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  router.get('/clientes', (req, res, next) => clienteController.getAll(req, res, next))

  /**
   * @swagger
   * /api/clientes/{clienteId}:
   *   get:
   *     summary: Retorna um cliente pelo ID
   *     tags: [Clientes]
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
   *         description: Dados do cliente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteRow'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/clientes/:clienteId', authClienteMiddleware, (req, res, next) =>
    clienteController.getCliente(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}:
   *   patch:
   *     summary: Atualiza dados de um cliente
   *     tags: [Clientes]
   *     security:
   *       - ClienteAuth: []
   *     parameters:
   *       - in: path
   *         name: clienteId
   *         required: true
   *         schema:
   *           type: string
   *         example: estefania
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nome:
   *                 type: string
   *               descricao:
   *                 type: string
   *               ativo:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Cliente atualizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClienteRow'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.patch('/clientes/:clienteId', authClienteMiddleware, (req, res, next) =>
    clienteController.updateCliente(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}:
   *   delete:
   *     summary: Remove um cliente
   *     tags: [Clientes]
   *     security:
   *       - ClienteAuth: []
   *     parameters:
   *       - in: path
   *         name: clienteId
   *         required: true
   *         schema:
   *           type: string
   *         example: estefania
   *     responses:
   *       204:
   *         description: Cliente removido
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/clientes/:clienteId', authClienteMiddleware, (req, res, next) =>
    clienteController.deleteCliente(req, res, next)
  )

  return router
}
