import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'
import { validateBody } from '../middleware/validation'

export function createFasesRouter(container: Container): Router {
  const router = Router()
  const { faseController } = container

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases:
   *   get:
   *     summary: Lista todas as fases do cliente
   *     tags: [Fases]
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
   *         description: Lista de fases
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Fase'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  router.get('/clientes/:clienteId/fases', authClienteMiddleware, (req, res, next) =>
    faseController.getFases(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases:
   *   post:
   *     summary: Cria uma nova fase para o cliente
   *     tags: [Fases]
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
   *             required: [numero, titulo]
   *             properties:
   *               numero:
   *                 type: string
   *                 example: "01"
   *               titulo:
   *                 type: string
   *                 example: Briefing
   *               resumo:
   *                 type: string
   *               status:
   *                 $ref: '#/components/schemas/FaseStatus'
   *               tipo:
   *                 $ref: '#/components/schemas/FaseTipo'
   *     responses:
   *       201:
   *         description: Fase criada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Fase'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  router.post('/clientes/:clienteId/fases', authClienteMiddleware, validateBody(['numero', 'titulo']), (req, res, next) =>
    faseController.createFase(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases/{faseId}:
   *   get:
   *     summary: Retorna uma fase pelo ID
   *     tags: [Fases]
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
   *         name: faseId
   *         required: true
   *         schema:
   *           type: string
   *         example: fase-01
   *     responses:
   *       200:
   *         description: Dados da fase
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Fase'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/clientes/:clienteId/fases/:faseId', authClienteMiddleware, (req, res, next) =>
    faseController.getFase(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases/{faseId}:
   *   patch:
   *     summary: Atualiza uma fase
   *     tags: [Fases]
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
   *         name: faseId
   *         required: true
   *         schema:
   *           type: string
   *         example: fase-01
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titulo:
   *                 type: string
   *               resumo:
   *                 type: string
   *               status:
   *                 $ref: '#/components/schemas/FaseStatus'
   *               tipo:
   *                 $ref: '#/components/schemas/FaseTipo'
   *     responses:
   *       200:
   *         description: Fase atualizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Fase'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.patch('/clientes/:clienteId/fases/:faseId', authClienteMiddleware, (req, res, next) =>
    faseController.updateFase(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases/{faseId}:
   *   delete:
   *     summary: Remove uma fase
   *     tags: [Fases]
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
   *         name: faseId
   *         required: true
   *         schema:
   *           type: string
   *         example: fase-01
   *     responses:
   *       204:
   *         description: Fase removida
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/clientes/:clienteId/fases/:faseId', authClienteMiddleware, (req, res, next) =>
    faseController.deleteFase(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases/{faseId}/tarefas:
   *   get:
   *     summary: Lista tarefas de uma fase
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
   *         name: faseId
   *         required: true
   *         schema:
   *           type: string
   *         example: fase-01
   *     responses:
   *       200:
   *         description: Lista de tarefas
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Tarefa'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/clientes/:clienteId/fases/:faseId/tarefas', authClienteMiddleware, (req, res, next) =>
    faseController.getTarefas(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases/{faseId}/tarefas:
   *   post:
   *     summary: Cria uma tarefa em uma fase
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
   *         name: faseId
   *         required: true
   *         schema:
   *           type: string
   *         example: fase-01
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [texto]
   *             properties:
   *               texto:
   *                 type: string
   *                 example: Revisar briefing com o cliente
   *               concluida:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Tarefa criada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Tarefa'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  router.post('/clientes/:clienteId/fases/:faseId/tarefas', authClienteMiddleware, validateBody(['texto']), (req, res, next) =>
    faseController.createTarefa(req, res, next)
  )

  /**
   * @swagger
   * /api/clientes/{clienteId}/fases/{faseId}/materiais:
   *   post:
   *     summary: Adiciona um material a uma fase
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
   *         name: faseId
   *         required: true
   *         schema:
   *           type: string
   *         example: fase-01
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
   *                 example: Apresentação de Resultados
   *               tipo:
   *                 $ref: '#/components/schemas/MaterialTipo'
   *               url:
   *                 type: string
   *               pendente:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Material adicionado à fase
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
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.post('/clientes/:clienteId/fases/:faseId/materiais', authClienteMiddleware, validateBody(['nome', 'tipo']), (req, res, next) =>
    container.matController.createFaseMaterial(req, res, next)
  )

  return router
}
