import { Router } from 'express'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { FaseRepository } from '../repositories/FaseRepository'
import { TarefaRepository } from '../repositories/TarefaRepository'
import { ObservacaoRepository } from '../repositories/ObservacaoRepository'
import { MaterialRepository } from '../repositories/MaterialRepository'
import { ClienteService } from '../services/ClienteService'
import { FaseService } from '../services/FaseService'
import { PainelService } from '../services/PainelService'
import { ObservacaoService } from '../services/ObservacaoService'
import { ClienteController } from '../controllers/ClienteController'
import { FaseController } from '../controllers/FaseController'
import { TarefaController } from '../controllers/TarefaController'
import { ObservacaoController } from '../controllers/ObservacaoController'
import { MaterialController } from '../controllers/MaterialController'
import { PainelController } from '../controllers/PainelController'
import { ImportarPainelController } from '../controllers/ImportarPainelController'
import { ImportarPainelService } from '../services/ImportarPainelService'
import { authClienteMiddleware } from '../middleware/auth'
import { validateBody } from '../middleware/validation'

export function createRouter(): Router {
  const router = Router()

  const clienteRepo = new ClienteRepository()
  const faseRepo = new FaseRepository()
  const tarefaRepo = new TarefaRepository()
  const obsRepo = new ObservacaoRepository()
  const matRepo = new MaterialRepository()

  const clienteService = new ClienteService(clienteRepo)
  const faseService = new FaseService(faseRepo, tarefaRepo, clienteRepo)
  const painelService = new PainelService(clienteRepo, faseRepo, matRepo)
  const obsService = new ObservacaoService(obsRepo, tarefaRepo)

  const importarPainelService = new ImportarPainelService(clienteRepo, faseRepo)

  const clienteCtrl = new ClienteController(clienteService)
  const faseCtrl = new FaseController(faseService, faseRepo)
  const tarefaCtrl = new TarefaController(faseService, tarefaRepo)
  const obsCtrl = new ObservacaoController(obsService)
  const matCtrl = new MaterialController(matRepo)
  const painelCtrl = new PainelController(painelService)
  const importarPainelCtrl = new ImportarPainelController(importarPainelService)

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
    clienteCtrl.createCliente(req, res, next)
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
  router.get('/clientes', (req, res, next) => clienteCtrl.getAll(req, res, next))

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
    clienteCtrl.getCliente(req, res, next)
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
    clienteCtrl.updateCliente(req, res, next)
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
    clienteCtrl.deleteCliente(req, res, next)
  )

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
    painelCtrl.getPainel(req, res, next)
  )

  router.post('/clientes/:clienteId/painel/importar', authClienteMiddleware, (req, res, next) =>
    importarPainelCtrl.importarPainel(req, res, next)
  )

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
    faseCtrl.getFases(req, res, next)
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
    faseCtrl.createFase(req, res, next)
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
    faseCtrl.getFase(req, res, next)
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
    faseCtrl.updateFase(req, res, next)
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
    faseCtrl.deleteFase(req, res, next)
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
    faseCtrl.getTarefas(req, res, next)
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
    faseCtrl.createTarefa(req, res, next)
  )

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
    tarefaCtrl.getTarefa(req, res, next)
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
    tarefaCtrl.updateTarefa(req, res, next)
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
    tarefaCtrl.deleteTarefa(req, res, next)
  )

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
    obsCtrl.getObservacao(req, res, next)
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
    obsCtrl.upsertObservacao(req, res, next)
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
    obsCtrl.deleteObservacao(req, res, next)
  )

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
    matCtrl.getBiblioteca(req, res, next)
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
    matCtrl.createBibliotecaItem(req, res, next)
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
    matCtrl.createFaseMaterial(req, res, next)
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
    matCtrl.updateMaterial(req, res, next)
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
    matCtrl.deleteMaterial(req, res, next)
  )

  return router
}
