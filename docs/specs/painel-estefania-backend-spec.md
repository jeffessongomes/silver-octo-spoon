# Spec -- Backend Painel Estefania (Express.js + Node.js + SQLite)

**Slug:** `painel-estefania-backend`
**Origem:** Implementacao de backend persistente em SQLite para suportar multi-cliente (white-label), com Arquitetura em Camadas (Layered Architecture) + MVC + Services.

---

## Objetivo

Criar um servidor Node.js + Express.js que persista dados de fases, tarefas e observacoes em SQLite, suportando multiplos clientes isolados (white-label). O backend expoe uma REST API para operacoes CRUD de fases e tarefas, com validacao de dados e calculo automatico de status de fase. O estado nao mais reside em localStorage -- o frontend se conecta ao servidor, enviando mudancas e consumindo dados.

**Por que:** estabelecer a camada de persistencia que permite multi-cliente, edicao de roadmaps via admin, e auditoria de mudancas. Arquitetura em camadas garante testabilidade, manutencao e escalabilidade sem duplicacao de logica.

---

## Modelo de Dados (Persistencia)

### Tipos TypeScript (reutilizaveis frontend + backend)

```typescript
// shared/types.ts (commitado em `src/shared/types.ts` no projeto backend)

export type FaseStatus = 'done' | 'active' | 'pending'
export type FaseTipo = 'extra'
export type MaterialTipo = 'PDF' | 'PNG' | 'DOC' | 'XLS' | 'LINK' | 'VIDEO'

export interface Tarefa {
  id: string
  texto: string
}

export interface Material {
  nome: string
  tipo: MaterialTipo
  url: string
}

export interface Fase {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo
  tarefas: Tarefa[]
  materiais: Material[]
}

export interface BibliotecaItem extends Material {}

export interface DadosPainel {
  cliente: string
  fases: Fase[]
  biblioteca: BibliotecaItem[]
}

export interface EstadoPainel {
  tarefas: Record<string, boolean>
  observacoes: Record<string, string>
  expandidas: string[]
  obsAbertas: string[]
}

export type FiltroTarefas = 'todas' | 'pendentes' | 'concluidas'
```

### Schema SQLite

```sql
-- clientes
CREATE TABLE clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- fases
CREATE TABLE fases (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  numero TEXT NOT NULL,            -- 'Fase 01 · Mes 1'
  titulo TEXT NOT NULL,
  resumo TEXT,
  status TEXT DEFAULT 'pending',   -- done | active | pending
  tipo TEXT,                        -- extra (opcional)
  ordem INTEGER DEFAULT 0,          -- para ordenacao
  ativo BOOLEAN DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- tarefas
CREATE TABLE tarefas (
  id TEXT PRIMARY KEY,
  fase_id TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  texto TEXT NOT NULL,
  concluida BOOLEAN DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fase_id) REFERENCES fases(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- observacoes
CREATE TABLE observacoes (
  id TEXT PRIMARY KEY,
  tarefa_id TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  conteudo TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  UNIQUE(tarefa_id)                 -- uma observacao por tarefa
);

-- materiais (biblioteca + materiais por fase)
CREATE TABLE materiais (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  fase_id TEXT,                     -- NULL = item de biblioteca global
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,               -- PDF | PNG | DOC | XLS | LINK | VIDEO
  url TEXT,                         -- '' | '#' = pendente
  ordem INTEGER DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fase_id) REFERENCES fases(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- indices para queries comuns
CREATE INDEX idx_fases_cliente ON fases(cliente_id);
CREATE INDEX idx_tarefas_cliente ON tarefas(cliente_id);
CREATE INDEX idx_tarefas_fase ON tarefas(fase_id);
CREATE INDEX idx_observacoes_cliente ON observacoes(cliente_id);
CREATE INDEX idx_materiais_cliente ON materiais(cliente_id);
CREATE INDEX idx_materiais_fase ON materiais(fase_id);
```

---

## Regras de Negocio

### Status visual da fase (derivado no backend)

```
concluidas === total && total > 0  -> 'done'
concluidas > 0                     -> 'active'
caso contrario                     -> 'pending'
```

Calculo automatico: apos cada mudanca de `concluida` em tarefa, o endpoint `PATCH /api/clientes/:clienteId/fases/:faseId` recalcula o status da fase.

### Material pendente

`material.url === '' || material.url === '#'` -> backend valida e retorna com flag `pendente: true` na resposta JSON (quando nao e string vazia).

### Isolamento por cliente

Toda query inclui `cliente_id` na clausula WHERE. Validacao no middleware: se `clienteId` na URL nao e cliente do usuário, retorna 403 Forbidden.

### Integridade referencial

- Deletar cliente -> delete cascade em todas as fases/tarefas/observacoes/materiais daquele cliente
- Deletar fase -> delete cascade em tarefas e materiais da fase
- Deletar tarefa -> delete cascade em observacao da tarefa

### Observacao por tarefa

Uma unica observacao por tarefa (`UNIQUE(tarefa_id)`). `UPSERT` na escrita: `INSERT OR REPLACE INTO observacoes`.

### Validacao de dados

- IDs: formato alphanumerico com hifens (ex: `fase-1`, `t1-2`)
- Strings vazias: trimmed; se vazio apos trim, retorna 400 Bad Request
- URLs: obrigatorio ser string (pode ser vazio ou '#' para pendente); nao valida protocolo
- Ordem: inteiros >= 0

---

## Criterios de Aceite

**CA1** -- Criacao de cliente
> **Dado** que um admin faz POST a `/api/clientes` com `{ "id": "novo-cliente", "nome": "Novo Cliente" }`
> **Entao** o cliente e criado no banco, com tabelas vazias (nenhuma fase/tarefa)

**CA2** -- Obter painel completo de um cliente
> **Dado** um cliente existente com fases e tarefas
> **Quando** GET `/api/clientes/:clienteId/painel`
> **Entao** retorna `DadosPainel` completo (fases com tarefas nested, biblioteca global), com status visual recalculado

**CA3** -- Toggle tarefa
> **Dado** uma tarefa nao concluida
> **Quando** PATCH `/api/clientes/:clienteId/tarefas/:tarefaId` com `{ "concluida": true }`
> **Entao** tarefa e marcada como concluida, fase e recalculada (se todas as tarefas estao concluidas, status vira 'done')

**CA4** -- Criar nova fase
> **Dado** um cliente
> **Quando** POST `/api/clientes/:clienteId/fases` com `{ "numero": "Fase 99", "titulo": "Nova", "resumo": "...", "tarefas": [...] }`
> **Entao** fase e criada com tarefas nested, status inicial derivado

**CA5** -- Criar nova tarefa em fase existente
> **Dado** uma fase existente
> **Quando** POST `/api/clientes/:clienteId/fases/:faseId/tarefas` com `{ "texto": "Nova tarefa" }`
> **Entao** tarefa e adicionada a fase, ordem atribuida (max ordem + 1), status da fase recalculado

**CA6** -- Upsert observacao
> **Dado** uma tarefa
> **Quando** PUT `/api/clientes/:clienteId/tarefas/:tarefaId/observacao` com `{ "conteudo": "texto" }`
> **Entao** se observacao nao existe, cria; se existe, atualiza (UPSERT), sem error 409

**CA7** -- Listar tarefas pendentes de uma fase
> **Dado** uma fase com 5 tarefas (3 concluidas, 2 pendentes)
> **Quando** GET `/api/clientes/:clienteId/fases/:faseId/tarefas?filtro=pendentes`
> **Entao** retorna apenas as 2 tarefas nao concluidas

**CA8** -- Deletar tarefa
> **Dado** uma tarefa com observacao
> **Quando** DELETE `/api/clientes/:clienteId/tarefas/:tarefaId`
> **Entao** tarefa e observacao sao deletadas (cascade), fase e recalculada

**CA9** -- Deletar fase
> **Dado** uma fase com tarefas e materiais
> **Quando** DELETE `/api/clientes/:clienteId/fases/:faseId`
> **Entao** fase, tarefas e materiais sao deletadas (cascade)

**CA10** -- Validacao de entrada
> **Dado** um request com dados invalidos (string vazia, ID invalido)
> **Quando** POST/PATCH
> **Entao** retorna 400 Bad Request com mensagem de erro clara

**CA11** -- Isolamento de cliente
> **Dado** dois clientes diferentes
> **Quando** usuario A tenta GET painel de cliente B (sem auth para cliente B)
> **Entao** retorna 403 Forbidden (ou 401 Unauthorized se sem token)

**CA12** -- Status recalculado apos toggle em tarefa
> **Dado** uma fase com 2 tarefas (1 concluida, 1 pendente) em status 'active'
> **Quando** PATCH tarefa pendente para `concluida: true`
> **Entao** resposta retorna fase com status recalculado para 'done'

---

## Edge Cases

1. **Ordem em tarefas/materiais**: ao criar/deletar, re-ordena lista para manter sequencia (0, 1, 2, ...). Nao usa UUIDs para ordem.
2. **Tarefa sem observacao vs observacao vazia**: GET retorna `observacao: null` ou `conteudo: ""`. PUT com conteudo vazio nao deleta -- apenas seta como string vazia.
3. **Fase sem tarefas**: status = 'pending' (nao 'done' mesmo que vazio). Se adiciona primeira tarefa concluida, status = 'done'.
4. **Biblioteca global vs materiais por fase**: biblioteca tem `fase_id = NULL`; materiais por fase tem `fase_id = {id}`.
5. **Cliente nao existe**: retorna 404 Not Found (nao 401).
6. **Transacao falha na escrita**: cliente ve erro 500 (nao estado corrupto). Usar transacoes SQLite para operacoes multi-tabela.
7. **Timestamp em UTC**: `CURRENT_TIMESTAMP` retorna UTC; frontend adapta se necessario.

---

## API REST

### Base URL
```
http://localhost:3000/api
```

### Autenticacao (MVP)

Para MVP, usar header simples `X-Client-ID: <clienteId>`. Em producao, seria JWT + roles.

```
GET /api/clientes/:clienteId/painel
Headers: X-Client-ID: estefania
```

### Endpoints

#### Clientes

**POST /api/clientes**
- Criar novo cliente
- Body: `{ "id": "slug-cliente", "nome": "Nome Completo", "descricao"?: "..." }`
- Response: 201 Created, `{ "id": "...", "nome": "...", "criado_em": "2026-05-07T10:30:00Z" }`

**GET /api/clientes/:clienteId**
- Obter detalhes do cliente
- Response: 200 OK, `{ "id": "...", "nome": "...", "ativo": true, "criado_em": "...", "atualizado_em": "..." }`

**PATCH /api/clientes/:clienteId**
- Atualizar cliente (nome, descricao, status)
- Body: `{ "nome"?: "...", "ativo"?: true }`
- Response: 200 OK

**DELETE /api/clientes/:clienteId**
- Deletar cliente e todos dados associados
- Response: 204 No Content

#### Painel Completo

**GET /api/clientes/:clienteId/painel**
- Retorna objeto `DadosPainel` completo (leitura)
- Response: 200 OK
```json
{
  "cliente": "estefania",
  "fases": [
    {
      "id": "fase-1",
      "numero": "Fase 01 · Mes 1",
      "titulo": "Discovery",
      "resumo": "...",
      "status": "done",
      "tipo": null,
      "tarefas": [
        {
          "id": "t1-1",
          "texto": "Mapeamento de requisitos",
          "concluida": true,
          "observacao": "Concluido no dia 05/05"
        }
      ],
      "materiais": [...]
    }
  ],
  "biblioteca": [
    {
      "nome": "Guia de estilos",
      "tipo": "PDF",
      "url": "https://..."
    }
  ]
}
```

#### Fases

**GET /api/clientes/:clienteId/fases**
- Listar todas as fases (sem tarefas nested)
- Query params: `?tipo=extra` (filtrar por tipo)
- Response: 200 OK, array de `{ "id", "numero", "titulo", "status", "tipo", "ordem" }`

**GET /api/clientes/:clienteId/fases/:faseId**
- Obter fase com tarefas nested
- Response: 200 OK, objeto completo `Fase`

**POST /api/clientes/:clienteId/fases**
- Criar nova fase
- Body:
```json
{
  "numero": "Fase 02 · Mes 2",
  "titulo": "Design",
  "resumo": "...",
  "tipo": null,
  "tarefas": [
    { "texto": "Wireframes" },
    { "texto": "Prototypo" }
  ],
  "materiais": [
    { "nome": "Referencia", "tipo": "LINK", "url": "#" }
  ]
}
```
- Response: 201 Created, objeto `Fase` completo com `id` gerado, status derivado

**PATCH /api/clientes/:clienteId/fases/:faseId**
- Atualizar fase (numero, titulo, resumo, tipo)
- Body: `{ "numero"?: "...", "titulo"?: "...", "resumo"?: "...", "tipo"?: null }`
- Response: 200 OK, objeto atualizado

**DELETE /api/clientes/:clienteId/fases/:faseId**
- Deletar fase e tarefas/materiais associados
- Response: 204 No Content

#### Tarefas

**GET /api/clientes/:clienteId/fases/:faseId/tarefas**
- Listar tarefas de uma fase
- Query params: `?filtro=pendentes | concluidas | todas` (default: todas)
- Response: 200 OK, array de `Tarefa` com `observacao` incluida

**POST /api/clientes/:clienteId/fases/:faseId/tarefas**
- Criar nova tarefa em fase
- Body: `{ "texto": "Nova tarefa" }`
- Response: 201 Created, `Tarefa` completo com `id` gerado

**GET /api/clientes/:clienteId/tarefas/:tarefaId**
- Obter tarefa (detalhes completos)
- Response: 200 OK

**PATCH /api/clientes/:clienteId/tarefas/:tarefaId**
- Atualizar tarefa (concluida, texto)
- Body: `{ "concluida"?: true, "texto"?: "Texto atualizado" }`
- Response: 200 OK, tarefa atualizada + fase com status recalculado
```json
{
  "tarefa": { "id": "t1-1", "texto": "...", "concluida": true },
  "fase": { "id": "fase-1", "status": "done" }
}
```

**DELETE /api/clientes/:clienteId/tarefas/:tarefaId**
- Deletar tarefa e observacao associada
- Response: 204 No Content

#### Observacoes

**GET /api/clientes/:clienteId/tarefas/:tarefaId/observacao**
- Obter observacao de uma tarefa
- Response: 200 OK, `{ "id": "...", "conteudo": "...", "atualizado_em": "..." }` ou 204 No Content se nao existe

**PUT /api/clientes/:clienteId/tarefas/:tarefaId/observacao**
- Criar ou atualizar observacao de tarefa (UPSERT)
- Body: `{ "conteudo": "Texto da observacao" }`
- Response: 200 OK, observacao criada/atualizada (nunca 409 Conflict)

**DELETE /api/clientes/:clienteId/tarefas/:tarefaId/observacao**
- Deletar observacao (deixa tarefa sem observacao)
- Response: 204 No Content

#### Materiais (Biblioteca + por Fase)

**GET /api/clientes/:clienteId/biblioteca**
- Listar materiais globais (biblioteca)
- Response: 200 OK, array de `Material`

**POST /api/clientes/:clienteId/biblioteca**
- Adicionar material a biblioteca global
- Body: `{ "nome": "...", "tipo": "PDF", "url": "#" }`
- Response: 201 Created

**POST /api/clientes/:clienteId/fases/:faseId/materiais**
- Adicionar material a fase
- Body: `{ "nome": "...", "tipo": "PDF", "url": "https://..." }`
- Response: 201 Created

**PATCH /api/clientes/:clienteId/materiais/:materialId**
- Atualizar material (nome, tipo, url)
- Body: `{ "url": "https://..." }`
- Response: 200 OK

**DELETE /api/clientes/:clienteId/materiais/:materialId**
- Deletar material
- Response: 204 No Content

---

## Erros e Validacao

### Coigos de status

- **200 OK**: operacao bem-sucedida, retorna dados
- **201 Created**: recurso criado com sucesso
- **204 No Content**: operacao bem-sucedida, sem dados a retornar
- **400 Bad Request**: validacao falhou (campo obrigatorio, formato invalido, etc)
- **401 Unauthorized**: sem autenticacao (header `X-Client-ID` faltando ou invalido)
- **403 Forbidden**: cliente autenticado nao tem permissao (tentando acessar outro cliente)
- **404 Not Found**: recurso nao encontrado
- **409 Conflict**: violacao de restricao (ex: `UNIQUE` em observacao -- mas UPSERT evita isso)
- **500 Internal Server Error**: erro interno (BD crash, transacao falhou, etc)

### Formato de erro

```json
{
  "error": "Nome do erro",
  "message": "Descricao legivel",
  "statusCode": 400,
  "details": { "campo": "razao" }
}
```

### Validacoes por campo

| Campo | Regra |
|---|---|
| `id` (cliente, fase, tarefa) | Alphanumerico + hifens, 1-50 chars, unico |
| `texto` (tarefa) | String, 1-500 chars, trim obrigatorio |
| `numero` (fase) | String, 1-100 chars, pode ter espacos/acentos |
| `titulo` | String, 1-200 chars |
| `resumo` | String, 0-1000 chars (opcional) |
| `url` | String, 0-500 chars (vazio ou `#` = pendente, https/http/// valido) |
| `conteudo` (observacao) | String, 0-5000 chars (pode ser vazio) |
| `tipo` (material) | Enum: PDF, PNG, DOC, XLS, LINK, VIDEO |
| `concluida` | Boolean |

---

## Arquitetura

### Layered Architecture (Camadas)

```
┌─────────────────────────────────────────┐
│        API Routes (Express)             │  <- HTTP layer (entrada/saida)
│  (Controllers neste nivel)              │
├─────────────────────────────────────────┤
│        Service Layer                    │  <- Business logic
│  (usePainelService, useFaseService)     │
├─────────────────────────────────────────┤
│        Repository Layer (Data Access)   │  <- DB abstraction
│  (FaseRepository, TarefaRepository)     │
├─────────────────────────────────────────┤
│        Database (SQLite)                │  <- Persistencia
└─────────────────────────────────────────┘
```

### Estrutura de arquivos (a criar)

```
backend/
  src/
    shared/
      types.ts                           # tipos compartilhados (Fase, Tarefa, etc)
      errors.ts                          # classes de erro customizadas
      utils.ts                           # helpers (validacao, slugify, etc)
    database/
      index.ts                           # conexao SQLite + migrations
      schema.sql                         # DDL (create tables)
    repositories/
      BaseRepository.ts                  # classe base com CRUD comum
      ClienteRepository.ts               # queries de cliente
      FaseRepository.ts                  # queries de fase (CRUD + status derivado)
      TarefaRepository.ts                # queries de tarefa (CRUD + conceito de concluida)
      ObservacaoRepository.ts            # queries de observacao (UPSERT)
      MaterialRepository.ts              # queries de material
    services/
      ClienteService.ts                  # logica de cliente (validacao, criacoes em lote)
      PainelService.ts                   # agrega fases/tarefas/materiais em DadosPainel
      FaseService.ts                     # calculo de status visual, derivacoes
      TarefaService.ts                   # toggle com side-effect de recalc de fase
      ObservacaoService.ts               # UPSERT + validacao
    controllers/
      ClienteController.ts               # handlers de cliente (GET, POST, PATCH, DELETE)
      FaseController.ts                  # handlers de fase
      TarefaController.ts                # handlers de tarefa
      ObservacaoController.ts            # handlers de observacao
      MaterialController.ts              # handlers de material
    middleware/
      auth.ts                            # validacao de X-Client-ID
      errorHandler.ts                    # interceptor de erros global
      validation.ts                      # schema validation (body, params, query)
    routes/
      index.ts                           # agregacao de rotas
      clientes.ts                        # rotas de cliente
      fases.ts                           # rotas de fase
      tarefas.ts                         # rotas de tarefa
      observacoes.ts                     # rotas de observacao
      materiais.ts                       # rotas de material
    app.ts                               # setup do Express (middlewares, rotas)
    server.ts                            # entry point (listen na porta)
  tests/
    unit/
      repositories/                      # testes de repository (fixtures de BD)
      services/                          # testes de service (mocks de repository)
    integration/
      api/                               # testes de API (requests HTTP reais)
    fixtures/
      seed.ts                            # dados de teste para BD
  package.json
  tsconfig.json
  .env.example
```

### Padroes de Implementacao

#### Repository Pattern

```typescript
// repositories/FaseRepository.ts
export class FaseRepository extends BaseRepository {
  async getFasesByCliente(clienteId: string): Promise<Fase[]> {
    // query SELECT ... WHERE cliente_id = ? ORDER BY ordem
  }

  async getFaseWithTarefas(clienteId: string, faseId: string): Promise<Fase> {
    // SELECT * FROM fases JOIN tarefas
  }

  async createFaseWithTarefas(clienteId: string, data: CreateFaseDTO): Promise<Fase> {
    // BEGIN TRANSACTION
    // INSERT INTO fases
    // INSERT INTO tarefas (multiplas)
    // COMMIT
  }

  async recalculateFaseStatus(clienteId: string, faseId: string): Promise<void> {
    // SELECT COUNT(concluida) FROM tarefas WHERE fase_id = ?
    // UPDATE fases SET status = (derived value)
  }
}
```

#### Service Pattern

```typescript
// services/FaseService.ts
export class FaseService {
  constructor(private faseRepository: FaseRepository) {}

  async getFaseComTarefas(clienteId: string, faseId: string) {
    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, faseId)
    if (!fase) throw new NotFoundError('Fase nao encontrada')
    return this.decorateFaseWithStatus(fase)
  }

  async toggleTarefaEAtualizarFase(
    clienteId: string,
    tarefaId: string,
    concluida: boolean
  ) {
    const tarefa = await this.tarefaRepository.updateTarefa(
      clienteId,
      tarefaId,
      { concluida }
    )
    
    // side-effect: recalcula status da fase
    const faseId = tarefa.faseId
    await this.faseRepository.recalculateFaseStatus(clienteId, faseId)
    
    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, faseId)
    return { tarefa, fase: this.decorateFaseWithStatus(fase) }
  }

  private decorateFaseWithStatus(fase: Fase): Fase {
    // calcula status visual baseado em tarefas concluidas
    const concluidas = fase.tarefas.filter(t => t.concluida).length
    const total = fase.tarefas.length
    const statusVisual = 
      concluidas === total && total > 0 ? 'done' :
      concluidas > 0 ? 'active' :
      'pending'
    return { ...fase, status: statusVisual }
  }
}
```

#### Controller Pattern

```typescript
// controllers/FaseController.ts
export class FaseController {
  constructor(private faseService: FaseService) {}

  async getFaseWithTarefas(req: Request, res: Response) {
    const { clienteId, faseId } = req.params
    const fase = await this.faseService.getFaseComTarefas(clienteId, faseId)
    res.json(fase)
  }

  async createFase(req: Request, res: Response) {
    const { clienteId } = req.params
    const { numero, titulo, resumo, tarefas } = req.body
    // validacao em middleware
    const fase = await this.faseService.createFase(clienteId, {
      numero, titulo, resumo, tarefas
    })
    res.status(201).json(fase)
  }
}
```

#### Middleware de Autenticacao

```typescript
// middleware/auth.ts
export function authClienteMiddleware(req: Request, res: Response, next: NextFunction) {
  const clienteId = req.headers['x-client-id'] as string
  const paramsClienteId = req.params.clienteId

  if (!clienteId) return res.status(401).json({ error: 'X-Client-ID header missing' })
  
  if (clienteId !== paramsClienteId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // em producao, validaria JWT + roles
  next()
}
```

#### Error Handling Global

```typescript
// middleware/errorHandler.ts
export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: 'Validation failed', details: err.details })
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message })
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message })
  }
  
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
```

---

## Estrategia de Testes

### Unit (Repositories + Services)

Usar fixtures SQLite em-memoria ou transacoes para isolacao.

| Componente | Cenarios | Exemplo |
|---|---|---|
| **FaseRepository** | `getFasesByCliente()` retorna apenas do cliente; `createFaseWithTarefas()` insere em transacao; `recalculateFaseStatus()` atualiza status baseado em tarefas | 4 testes |
| **TarefaRepository** | `updateTarefa()` marca/desmarcar concluida; lista com filtro pendentes/concluidas | 3 testes |
| **ObservacaoRepository** | UPSERT cria se nao existe, atualiza se existe; DELETE funciona | 3 testes |
| **FaseService** | `toggleTarefaEAtualizarFase()` retorna tarefa + fase com status recalculado; `getFaseComTarefas()` lanca NotFound se nao existe | 3 testes |
| **PainelService** | `getPainelCompleto()` agrega fases + biblioteca em DadosPainel com status derivados | 2 testes |

Total esperado: ~15 testes unit

### Integracao (Controllers + API)

HTTP requests reais contra BD de teste.

| Endpoint | Cenarios | Exemplo |
|---|---|---|
| **POST /api/clientes** | Criacao com sucesso; validacao (ID vazio, duplicado) | 2 testes |
| **GET /api/clientes/:clienteId/painel** | Retorna DadosPainel completo; 404 se cliente nao existe; isolamento de cliente | 3 testes |
| **PATCH /api/clientes/:clienteId/tarefas/:tarefaId** com `concluida: true` | Tarefa marcada, fase status recalculada para 'done' se todas concluidas | 2 testes |
| **POST /api/clientes/:clienteId/fases/:faseId/tarefas** | Nova tarefa criada; ordem atribuida corretamente | 1 teste |
| **PUT /api/clientes/:clienteId/tarefas/:tarefaId/observacao** | UPSERT sem 409 Conflict; conteudo vazio permitido | 2 testes |
| **DELETE /api/clientes/:clienteId/fases/:faseId** | Fase deletada + cascade em tarefas/materiais | 1 teste |

Total esperado: ~11 testes integracao

### Testing Libraries

- **Vitest**: test runner
- **Supertest**: HTTP assertions (`await request(app).get('/api/...').expect(200)`)
- **Better-sqlite3 ou sqlite3**: BD real em-memoria para testes
- **Fixtures**: seed.ts com dados de teste

---

## Plano de Execucao (preview do proj-impl)

### Fase 1: Infraestrutura e Setup (RED/GREEN)

1. **Projeto Node.js + TypeScript**
   - `npm init`, `package.json` com dependencies (express, sqlite3, vitest, supertest)
   - `tsconfig.json`, `.gitignore`, `.env.example`
   - Setup Vitest + coverage

2. **Database Setup**
   - `src/database/schema.sql` com tabelas completas
   - `src/database/index.ts`: funcao de inicializacao (create tables se nao existem)
   - Testes: validar schema criado corretamente

### Fase 2: Tipos e Utilitarios

3. **Tipos compartilhados**
   - `src/shared/types.ts`: copiar Fase, Tarefa, DadosPainel, etc
   - `src/shared/errors.ts`: classes ValidationError, NotFoundError, ConflictError

4. **Validacao e Utils**
   - `src/shared/utils.ts`: validateId(), trimString(), slugify(), calculateFaseStatus()
   - Testes: unit dos helpers

### Fase 3: Repositories (TDD)

5. **BaseRepository**
   - Metodos CRUD genericos: `create()`, `findById()`, `update()`, `delete()`
   - `execute(sql, params)` wrapper para erros

6. **ClienteRepository**
   - `createCliente()`, `getCliente()`, `updateCliente()`, `deleteCliente()`
   - `getAll()`
   - Testes unit: 3 testes

7. **FaseRepository**
   - `getFasesByCliente()`, `getFaseWithTarefas()`, `createFaseWithTarefas()`
   - `recalculateFaseStatus()`, `updateFase()`, `deleteFase()`
   - Testes unit: 4 testes

8. **TarefaRepository**
   - `getTarefasByFase()`, `getTarefa()`, `createTarefa()`
   - `updateTarefa()`, `deleteTarefa()`
   - Suporte a filtro pendentes/concluidas
   - Testes unit: 3 testes

9. **ObservacaoRepository**
   - `getObservacao()`, `upsertObservacao()`, `deleteObservacao()`
   - Testes unit: 3 testes

10. **MaterialRepository**
    - `getMaterialsByFase()`, `getMaterialsByCliente()` (biblioteca)
    - CRUD completo
    - Testes unit: 2 testes

### Fase 4: Services (TDD)

11. **FaseService**
    - `getFaseComTarefas()`, `createFase()`, `toggleTarefaEAtualizarFase()`
    - Orquestracao de repositories
    - Testes unit (com mocks): 3 testes

12. **PainelService**
    - `getPainelCompleto()`: agrega fases + biblioteca
    - Decora com status visual
    - Testes unit: 2 testes

13. **TarefaService**
    - `toggleTarefa()`: chama repository + dispara recalc de fase
    - Testes unit: 2 testes

14. **ObservacaoService**
    - `upsertObservacao()`: validacao + repository call
    - Testes unit: 1 teste

### Fase 5: Middleware e Validacao

15. **Middleware de autenticacao**
    - `authClienteMiddleware()`: valida X-Client-ID
    - Testes: 2 testes

16. **Middleware de erro global**
    - `errorHandlerMiddleware()`: intercepta e formata erros
    - Testes: 3 testes

### Fase 6: Controllers

17. **ClienteController**
    - GET, POST, PATCH, DELETE
    - Testes integracao: 2 testes

18. **FaseController**
    - GET (lista + detalhes), POST, PATCH, DELETE
    - Testes integracao: 2 testes

19. **TarefaController**
    - GET, POST, PATCH (com toggle + recalc), DELETE
    - Testes integracao: 3 testes

20. **ObservacaoController**
    - GET, PUT (UPSERT), DELETE
    - Testes integracao: 2 testes

21. **MaterialController**
    - GET, POST, PATCH, DELETE
    - Testes integracao: 2 testes

### Fase 7: Rotas e App

22. **Setup de rotas**
    - `src/routes/index.ts`: agregacao
    - Rotas por modulo (clientes.ts, fases.ts, etc)
    - Middleware application order

23. **App.ts e Server.ts**
    - Express setup com middlewares (json, auth, error handler)
    - Listener na porta (3000 local, env em producao)

24. **Seed de dados (opcional)**
    - `tests/fixtures/seed.ts`: insere cliente "estefania" com dados de teste
    - Usado em testes integracao

### Fase 8: Validacao Final

25. **Testes end-to-end (opcional)**
    - Cria cliente → fases → tarefas → togles → observacoes → verifica painel final

26. **Validacao**
    - `npm run lint` (ESLint)
    - `npm run type-check` (tsc)
    - `npm run test` (vitest)
    - `npm run build`
    - Manual: `npm run dev` + testar endpoints com curl/Postman

---

## Dependencias de Infraestrutura

| Dependencia | Versao | Proposito |
|---|---|---|
| `express` | ^4.18.0 | Framework HTTP |
| `sqlite` ou `better-sqlite3` | ^9.0.0 | Driver SQLite (sincrono mais simples) |
| `typescript` | ^5.x | Linguagem |
| `vitest` | ^1.x | Test runner |
| `supertest` | ^6.x | HTTP testing |
| `dotenv` | ^16.x | .env parsing |

Environment: Node.js 18+ (LTS)

---

## Fora de Escopo

- Autenticacao JWT (MVP usa X-Client-ID simples)
- Rate limiting
- Compressao HTTP
- Cache (Redis)
- Logging estruturado
- Metricas (Prometheus)
- Documentacao Swagger/OpenAPI (pode ser adicionada depois)
- Migracao de dados (setup manualmente por cliente)
- Backup/restore
- Audit trail (quem fez o que quando)

---

## Criterios de Sucesso

✅ **Desenvolvimento**
- [ ] Schema SQLite criado e testado
- [ ] Todas as repositories testadas (unit)
- [ ] Todas as services testadas (unit, mocks)
- [ ] Todos os controllers testados (integracao, HTTP)
- [ ] Validacao global de entrada funcionando
- [ ] Error handling retorna respostas consistentes

✅ **Qualidade**
- [ ] ~26 testes, 100% de cobertura em services/repositories
- [ ] Lint clean (ESLint)
- [ ] Type-check passed (tsc no strict mode)
- [ ] Build bem-sucedido

✅ **Integracao com Frontend**
- [ ] Frontend consegue fazer GET /api/clientes/:clienteId/painel
- [ ] Frontend consegue fazer PATCH /api/clientes/:clienteId/tarefas/:tarefaId
- [ ] Frontend consegue fazer PUT /api/clientes/:clienteId/tarefas/:tarefaId/observacao
- [ ] Todos os endpoints retornam DadosPainel atualizado
- [ ] Isolamento de cliente funciona (sem data leak)
