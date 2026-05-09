import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'
import { validateBody } from '../middleware/validation'

export function createMateriaisRouter(container: Container): Router {
  const router = Router()
  const { matController } = container

  /**
   * @swagger
   * /api/clientes/{clienteId}/biblioteca:
   *   get:
   *     summary: Lista a biblioteca de materiais do cliente
   *     tags: [Materiais]
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
   *       200:
   *         description: Lista de materiais da biblioteca
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Material'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  router.get('/clientes/:clienteId/biblioteca', authClienteMiddleware, (req, res, next) =>
    matController.getBiblioteca(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/biblioteca:
   *   post:
   *     summary: Adiciona um material à biblioteca do cliente
   *     tags: [Materiais]
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
   *             required: [nome, tipo]
   *             properties:
   *               nome:
   *                 type: string
   *                 example: Contrato de Prestação de Serviços
   *               tipo:
   *                 $ref: '#/components/schemas/MaterialTipo'
   *               url:
   *                 type: string
   *               pendente:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Material adicionado à biblioteca
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Material'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  router.post('/clientes/:clienteId/biblioteca', authClienteMiddleware, validateBody(['nome', 'tipo']), (req, res, next) =>
    matController.createBibliotecaItem(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/materiais/{materialId}:
   *   patch:
   *     summary: Atualiza um material
   *     tags: [Materiais]
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
   *         name: materialId
   *         required: true
   *         schema:
   *           type: string
   *         example: mat-abc123
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nome:
   *                 type: string
   *               tipo:
   *                 $ref: '#/components/schemas/MaterialTipo'
   *               url:
   *                 type: string
   *               pendente:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Material atualizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Material'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.patch('/clientes/:clienteId/materiais/:materialId', authClienteMiddleware, (req, res, next) =>
    matController.updateMaterial(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/materiais/{materialId}:
   *   delete:
   *     summary: Remove um material
   *     tags: [Materiais]
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
   *         name: materialId
   *         required: true
   *         schema:
   *           type: string
   *         example: mat-abc123
   *     responses:
   *       204:
   *         description: Material removido
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/clientes/:clienteId/materiais/:materialId', authClienteMiddleware, (req, res, next) =>
    matController.deleteMaterial(req, res, next)
  )

  return router
}
