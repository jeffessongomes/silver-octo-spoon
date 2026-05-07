import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Painel Estefania API',
      version: '1.0.0',
      description: 'Backend de gerenciamento de fases, tarefas e observações por cliente',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Desenvolvimento' }],
    components: {
      securitySchemes: {
        ClienteAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Client-ID',
          description: 'ID do cliente para autenticação (ex: estefania)',
        },
      },
      schemas: {
        FaseStatus: {
          type: 'string',
          enum: ['done', 'active', 'pending'],
        },
        FaseTipo: {
          type: 'string',
          enum: ['extra'],
          nullable: true,
        },
        MaterialTipo: {
          type: 'string',
          enum: ['PDF', 'PNG', 'DOC', 'XLS', 'LINK', 'VIDEO'],
        },
        Tarefa: {
          type: 'object',
          required: ['id', 'texto'],
          properties: {
            id: { type: 'string' },
            texto: { type: 'string' },
            concluida: { type: 'boolean' },
            observacao: { type: 'string' },
          },
        },
        Material: {
          type: 'object',
          required: ['nome', 'tipo', 'url'],
          properties: {
            nome: { type: 'string' },
            tipo: { $ref: '#/components/schemas/MaterialTipo' },
            url: { type: 'string' },
            pendente: { type: 'boolean' },
          },
        },
        Fase: {
          type: 'object',
          required: ['id', 'numero', 'titulo', 'resumo', 'status', 'tarefas', 'materiais'],
          properties: {
            id: { type: 'string' },
            numero: { type: 'string' },
            titulo: { type: 'string' },
            resumo: { type: 'string' },
            status: { $ref: '#/components/schemas/FaseStatus' },
            tipo: { $ref: '#/components/schemas/FaseTipo' },
            tarefas: { type: 'array', items: { $ref: '#/components/schemas/Tarefa' } },
            materiais: { type: 'array', items: { $ref: '#/components/schemas/Material' } },
          },
        },
        DadosPainel: {
          type: 'object',
          required: ['cliente', 'fases', 'biblioteca'],
          properties: {
            cliente: { type: 'string' },
            fases: { type: 'array', items: { $ref: '#/components/schemas/Fase' } },
            biblioteca: { type: 'array', items: { $ref: '#/components/schemas/Material' } },
          },
        },
        ClienteRow: {
          type: 'object',
          required: ['id', 'nome', 'ativo', 'criado_em', 'atualizado_em'],
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            descricao: { type: 'string', nullable: true },
            ativo: { type: 'integer', enum: [0, 1] },
            criado_em: { type: 'string', format: 'date-time' },
            atualizado_em: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['error', 'message', 'statusCode'],
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
            details: { type: 'object' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Requisição inválida',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Unauthorized: {
          description: 'Header X-Client-ID ausente ou inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Forbidden: {
          description: 'Acesso negado ao recurso do cliente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        InternalError: {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    security: [{ ClienteAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/index.ts'), path.join(__dirname, '../routes/index.js')],
}

export const swaggerSpec = swaggerJsdoc(options)
