# Spec -- Swagger / OpenAPI para Painel Estefania Backend

**Slug:** `painel-estefania-backend-swagger`
**Origem:** Adição de documentação interativa da REST API usando swagger-jsdoc + swagger-ui-express.

---

## Objetivo

Expor uma interface Swagger UI em `http://localhost:3000/api-docs` que documente todos os 24 endpoints da REST API do Painel Estefania. A documentação deve ser gerada automaticamente a partir de anotações JSDoc nas rotas, sem refatoração dos controllers ou services existentes.

**Por que:** facilitar o consumo da API pelo frontend e por terceiros, reduzir dependência de documentação manual e permitir testes interativos dos endpoints diretamente no browser.

---

## Modelo de Dados (OpenAPI Schemas)

Os schemas OpenAPI mapeiam os tipos TypeScript existentes em `src/shared/types.ts`:

```yaml
# Equivalência TypeScript -> OpenAPI Schema

FaseStatus: enum [done, active, pending]
FaseTipo:   enum [extra]
MaterialTipo: enum [PDF, PNG, DOC, XLS, LINK, VIDEO]

Tarefa:
  id: string
  texto: string
  concluida: boolean (opcional)
  observacao: string (opcional)

Material:
  nome: string
  tipo: MaterialTipo
  url: string
  pendente: boolean (opcional)

Fase:
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo: FaseTipo (opcional, nullable)
  tarefas: Tarefa[]
  materiais: Material[]

DadosPainel:
  cliente: string
  fases: Fase[]
  biblioteca: Material[]

ErrorResponse:
  error: string
  message: string
  statusCode: number
  details: object (opcional)

ClienteRow:
  id: string
  nome: string
  descricao: string (nullable)
  ativo: 0 | 1
  criado_em: string (datetime)
  atualizado_em: string (datetime)
```

---

## Regras de Negócio

1. **Sem autenticação no Swagger UI** (MVP): a UI é pública, mas os endpoints ainda exigem `X-Client-ID` para funcionar.
2. **Chave de segurança documentada**: definir `X-Client-ID` como `securityScheme` do tipo `apiKey` em `header`, permitindo que o usuário informe o ID no "Authorize" do Swagger UI.
3. **Schemas reutilizáveis**: todos os tipos devem ser definidos em `components/schemas` e referenciados com `$ref`, sem duplicação inline.
4. **Tags para agrupamento**: endpoints agrupados por domínio — Clientes, Painel, Fases, Tarefas, Observações, Materiais.
5. **Respostas de erro padronizadas**: todos os endpoints documentam as respostas 400, 401, 403, 404 e 500 usando o schema `ErrorResponse`.
6. **Ambiente dev only**: a rota `/api-docs` pode ser servida em todos os ambientes (MVP), mas deve ser facilmente desativável via variável de ambiente `SWAGGER_ENABLED`.

---

## Critérios de Aceite

**CA1 — Swagger UI acessível**
> **Dado** que o servidor está rodando
> **Quando** o usuário acessa `http://localhost:3000/api-docs`
> **Então** a Swagger UI é exibida com título "Painel Estefania API" e versão "1.0.0"

**CA2 — Todos os endpoints documentados**
> **Dado** que a Swagger UI está aberta
> **Quando** o usuário expande qualquer uma das 6 tags (Clientes, Painel, Fases, Tarefas, Observações, Materiais)
> **Então** todos os 24 endpoints aparecem com método HTTP, path e descrição

**CA3 — Autenticação via Swagger UI**
> **Dado** que a Swagger UI está aberta
> **Quando** o usuário clica em "Authorize" e informa `X-Client-ID: estefania`
> **Então** todas as requisições subsequentes incluem o header `X-Client-ID` automaticamente

**CA4 — Schemas visíveis**
> **Dado** que a Swagger UI está aberta
> **Quando** o usuário acessa a seção "Schemas"
> **Então** os schemas `Fase`, `Tarefa`, `Material`, `DadosPainel`, `ClienteRow` e `ErrorResponse` estão documentados

**CA5 — Requisição interativa funciona**
> **Dado** que o usuário autenticou com `X-Client-ID: estefania`
> **Quando** usa o botão "Try it out" em `GET /api/clientes/{clienteId}/painel`
> **Então** a requisição é enviada ao servidor e a resposta é exibida com status 200

**CA6 — Spec JSON disponível**
> **Dado** que o servidor está rodando
> **Quando** o usuário acessa `http://localhost:3000/api-docs.json`
> **Então** retorna o documento OpenAPI completo em formato JSON

**CA7 — Testes não quebram**
> **Dado** que a documentação Swagger foi adicionada
> **Quando** `pnpm test` é executado
> **Então** todos os 46 testes existentes continuam passando (zero regressão)

---

## Edge Cases

1. **SWAGGER_ENABLED=false**: a rota `/api-docs` retorna 404, e o JSON spec também não é exposto. Útil para ambientes de produção.
2. **Endpoint não documentado**: se um endpoint novo for adicionado sem JSDoc, ele não aparece na UI, mas o servidor funciona normalmente.
3. **Schema divergente**: se um campo for adicionado ao TypeScript mas não ao schema JSDoc, a UI mostra o schema desatualizado. Risco aceitável para MVP.
4. **Conflito de porta**: `swagger-ui-express` serve assets estáticos na rota configurada. Não conflita com `/api` pois usam prefixos diferentes.
5. **`X-Client-ID` ausente no "Try it out"**: o endpoint retorna 401 com mensagem clara, comportamento já testado.

---

## UI

Não há UI React nesta feature. A interface é a Swagger UI padrão servida pelo `swagger-ui-express`:

- **URL:** `http://localhost:3000/api-docs`
- **Título:** `Painel Estefania API`
- **Versão:** `1.0.0`
- **Descrição:** backend de gerenciamento de fases, tarefas e observações por cliente
- **Authorize button:** campo para `X-Client-ID` (apiKey in header)
- **Tags/seções:**
  - `Clientes` — CRUD de clientes
  - `Painel` — leitura do painel completo
  - `Fases` — CRUD de fases
  - `Tarefas` — CRUD de tarefas
  - `Observações` — UPSERT de observações
  - `Materiais` — CRUD de materiais e biblioteca

---

## Arquitetura

### Abordagem escolhida: swagger-jsdoc + swagger-ui-express

Geração da spec em runtime a partir de anotações JSDoc. Sem refatoração de controllers ou services.

### Arquivos a criar

```
backend/
  src/
    docs/
      swagger.ts        # configuração swagger-jsdoc (paths, schemas, info)
    routes/
      docs.ts           # rota /api-docs e /api-docs.json
```

### Arquivos a modificar

```
backend/
  src/
    app.ts              # montar rota /api-docs condicionalmente (SWAGGER_ENABLED)
    routes/index.ts     # adicionar JSDoc @swagger acima de cada handler (24 anotações)
  .env.example          # adicionar SWAGGER_ENABLED=true
  package.json          # adicionar swagger-jsdoc e swagger-ui-express
```

### Estrutura do swagger.ts

```typescript
// src/docs/swagger.ts
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
        // FaseStatus, Tarefa, Fase, DadosPainel, ErrorResponse, etc.
      },
    },
    security: [{ ClienteAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],  // onde estão os JSDoc
}

export const swaggerSpec = swaggerJsdoc(options)
```

### Exemplo de anotação JSDoc (routes/index.ts)

```typescript
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
```

### Rota de docs (routes/docs.ts)

```typescript
// src/routes/docs.ts
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from '../docs/swagger'

export function createDocsRouter(): Router {
  const router = Router()
  router.use('/', swaggerUi.serve)
  router.get('/', swaggerUi.setup(swaggerSpec))
  router.get('.json', (_req, res) => res.json(swaggerSpec))
  return router
}
```

### Modificação em app.ts

```typescript
// Adicionar após app.use('/api', createRouter()):
if (process.env.SWAGGER_ENABLED !== 'false') {
  const { createDocsRouter } = require('./routes/docs')
  app.use('/api-docs', createDocsRouter())
}
```

---

## Dependências de Infraestrutura

| Dependência | Versão | Propósito |
|---|---|---|
| `swagger-jsdoc` | ^6.2.8 | Gera spec OpenAPI a partir de JSDoc |
| `swagger-ui-express` | ^5.0.1 | Serve a Swagger UI como middleware Express |
| `@types/swagger-jsdoc` | ^6.0.4 | Tipos TypeScript para swagger-jsdoc |
| `@types/swagger-ui-express` | ^4.1.8 | Tipos TypeScript para swagger-ui-express |

**Variáveis de ambiente novas:**

| Variável | Valor padrão | Descrição |
|---|---|---|
| `SWAGGER_ENABLED` | `true` | Habilita/desabilita a rota `/api-docs` |

---

## Estratégia de Testes

Os testes são focados em garantir que a adição do Swagger não quebre nada existente e que a rota de docs responde corretamente.

### Testes de integração (novos — 3 testes)

| Teste | Cenário |
|---|---|
| `GET /api-docs` retorna 200 | Swagger UI é servida |
| `GET /api-docs.json` retorna spec válida | JSON com `openapi: 3.0.0` e `info.title` corretos |
| `GET /api-docs` com `SWAGGER_ENABLED=false` retorna 404 | Rota desabilitada em produção |

### Regressão (obrigatório)

- `pnpm test` deve continuar com **46/46 passando** após a implementação.
- Nenhum arquivo de teste existente deve ser modificado.

### Testes manuais (golden path)

1. `pnpm dev` → acessar `http://localhost:3000/api-docs`
2. Verificar que as 6 tags aparecem com os endpoints corretos
3. Clicar em "Authorize", informar `X-Client-ID: estefania`
4. Usar "Try it out" em `GET /api/clientes/{clienteId}/painel` com `clienteId=estefania`
5. Verificar resposta 200 com `DadosPainel`

---

## Fora de Escopo

- Autenticação JWT no Swagger UI (MVP usa `X-Client-ID` simples)
- Versionamento da spec (`/api/v1/`, `/api/v2/`)
- Publicação da spec em portal externo (Stoplight, Redocly)
- Redoc como alternativa à Swagger UI
- Validação de request/response contra o schema OpenAPI em runtime
- Geração automática de código cliente (SDKs)
- Testes de contrato (Pact)

---

## Critérios de Sucesso

- [ ] `GET /api-docs` retorna Swagger UI com os 24 endpoints documentados
- [ ] `GET /api-docs.json` retorna spec OpenAPI válida
- [ ] Authorize com `X-Client-ID` funciona na UI
- [ ] "Try it out" funciona para pelo menos um endpoint autenticado
- [ ] `pnpm test` — 46+ testes passando (zero regressão)
- [ ] `pnpm lint` — 0 erros
- [ ] `pnpm type-check` — 0 erros
- [ ] `SWAGGER_ENABLED=false` desativa a rota `/api-docs`
