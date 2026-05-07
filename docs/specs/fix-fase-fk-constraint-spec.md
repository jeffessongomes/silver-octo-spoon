# Spec: fix/fase-fk-constraint-404

**Ticket:** BUG — POST /api/clientes/:clienteId/fases retorna SQLITE_CONSTRAINT sem tratamento adequado  
**Branch sugerida:** `fix/fase-fk-constraint-404`  
**Base:** `master`

---

## Objetivo

Corrigir dois problemas encadeados que ocorrem ao chamar `POST /api/clientes/:clienteId/fases` com um `clienteId` inexistente no banco:

1. **Falta de validacao de existencia:** `FaseService.createFase` nao verifica se o cliente existe antes de tentar o INSERT, causando falha de FK constraint no SQLite.
2. **Erro nao tratado:** O erro SQLite bruto (`code: 'SQLITE_CONSTRAINT'`) nao e uma instancia de `AppError`, entao o `errorHandlerMiddleware` o loga como `[Unhandled Error]` e retorna 500, em vez de uma resposta semantica.

---

## Modelo de dados

Sem mudancas de schema. Relacionamento relevante:

```sql
-- fases.cliente_id e FK obrigatoria
FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
```

Tipos envolvidos (sem alteracao):

```typescript
// FaseRepository.ts (existente)
interface CreateFaseDTO {
  numero: string
  titulo: string
  resumo: string
  tipo?: FaseTipo | null
  tarefas: CreateTarefaDTO[]
  materiais: CreateMaterialDTO[]
}

// ClienteRepository.ts (existente)
interface ClienteRow {
  id: string
  nome: string
  descricao: string | null
  ativo: number
  // ...
}
```

---

## Regras de negocio

1. Antes de criar uma fase, o cliente referenciado por `clienteId` **deve existir** no banco (tabela `clientes`, `ativo = 1` ou qualquer ativo).
2. Se o cliente nao existir → resposta **404** com mensagem clara.
3. Erros de constraint SQLite (`code === 'SQLITE_CONSTRAINT'`) que escapem da validacao de servico devem retornar **422** (rede de seguranca no `errorHandler`).
4. Erros de validacao de body (`numero` ou `titulo` ausentes) continuam retornando **400** (comportamento existente, sem mudanca).

---

## Criterios de Aceite

**CA-1: cliente inexistente → 404**
- Dado que nenhum cliente com id `"2"` existe no banco
- Quando `POST /api/clientes/2/fases` e chamado com `X-Client-ID: 2` e body valido
- Entao a API retorna **HTTP 404** com `{ "error": "NotFoundError", "statusCode": 404 }`

**CA-2: cliente existente → 201**
- Dado que o cliente `"estefania"` existe no banco
- Quando `POST /api/clientes/estefania/fases` e chamado com `X-Client-ID: estefania` e body `{ numero, titulo }`
- Entao a API retorna **HTTP 201** com a fase criada (incluindo `tarefas: []` e `materiais: []`)

**CA-3: body invalido → 400**
- Dado que o cliente existe
- Quando `POST /api/clientes/estefania/fases` e chamado sem o campo `titulo`
- Entao a API retorna **HTTP 400** (comportamento existente do `validateBody`)

**CA-4: erro de constraint residual → 422**
- Dado que qualquer erro SQLite com `code === 'SQLITE_CONSTRAINT'` escape para o errorHandler
- Quando o middleware o intercepta
- Entao a API retorna **HTTP 422** com `{ "error": "UnprocessableEntity", "statusCode": 422 }` — sem `[Unhandled Error]` no terminal

---

## Edge cases

1. **clienteId valido na URL mas X-Client-ID diferente:** ja tratado pelo `authClienteMiddleware` (403) — sem mudanca.
2. **X-Client-ID ausente:** ja tratado pelo `authClienteMiddleware` (401) — sem mudanca.
3. **Cliente inativo:** a query `getCliente` atual busca por qualquer `id` sem filtrar `ativo`. Manter o comportamento atual (nao e escopo deste fix decidir se inativo bloqueia criacao de fases).
4. **Transacao falha apos validacao:** o ROLLBACK existente em `createFaseWithTarefas` continua cobrindo isso. O erro relancado deve agora cair no handler de 422 se for constraint.
5. **clienteId com caracteres especiais/SQL injection:** sanitizado pela parametrizacao de queries existente — sem mudanca.

---

## UI

Nao se aplica — bug de backend puro. Sem mudancas no frontend.

---

## Arquitetura

### Arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `backend/src/services/FaseService.ts` | Injetar `ClienteRepository`; verificar existencia antes de criar fase |
| `backend/src/middleware/errorHandler.ts` | Detectar erros com `code === 'SQLITE_CONSTRAINT'` e retornar 422 |
| `backend/src/routes/index.ts` | Passar `clienteRepo` como terceiro argumento de `FaseService` |

### Arquivos a criar

| Arquivo | Proposito |
|---|---|
| `backend/tests/integration/api/fase.test.ts` | Testes de integracao para POST /api/clientes/:id/fases |

---

### Detalhe das mudancas

#### 1. `FaseService.ts` — injetar `ClienteRepository` e validar existencia

```typescript
// Antes
constructor(
  private faseRepository: FaseRepository,
  private tarefaRepository: TarefaRepository
) {}

async createFase(clienteId: string, data: CreateFaseDTO): Promise<FaseComTarefas> {
  const fase = await this.faseRepository.createFaseWithTarefas(clienteId, data)
  return this.decorateFaseWithStatus(fase)
}

// Depois
constructor(
  private faseRepository: FaseRepository,
  private tarefaRepository: TarefaRepository,
  private clienteRepository: ClienteRepository  // <-- novo
) {}

async createFase(clienteId: string, data: CreateFaseDTO): Promise<FaseComTarefas> {
  const cliente = await this.clienteRepository.getCliente(clienteId)  // <-- verificar existencia
  if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' nao encontrado`)
  
  const fase = await this.faseRepository.createFaseWithTarefas(clienteId, data)
  return this.decorateFaseWithStatus(fase)
}
```

#### 2. `routes/index.ts` — passar `clienteRepo` ao `FaseService`

```typescript
// Antes
const faseService = new FaseService(faseRepo, tarefaRepo)

// Depois
const faseService = new FaseService(faseRepo, tarefaRepo, clienteRepo)
```

#### 3. `errorHandler.ts` — interceptar SQLITE_CONSTRAINT

```typescript
// Adicionar antes do bloco generico de 500
interface SqliteError extends Error {
  code?: string
  errno?: number
}

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    // ... bloco existente sem mudanca
  }

  const sqliteErr = err as SqliteError
  if (sqliteErr.code === 'SQLITE_CONSTRAINT') {
    res.status(422).json({
      error: 'UnprocessableEntity',
      message: 'Operacao viola uma restricao de integridade dos dados',
      statusCode: 422,
    })
    return
  }

  console.error('[Unhandled Error]', err)
  res.status(500).json({ ... })
}
```

---

## Dependencias de infraestrutura

Nenhuma dependencia de infraestrutura identificada.

---

## Estrategia de testes

### Testes de integracao — `backend/tests/integration/api/fase.test.ts`

Usar `supertest` + `setupTestApp` + `clearAllTables` (mesmo padrao de `cliente.test.ts`).

**Cenarios obrigatorios:**

| # | Cenario | Metodo | Status esperado |
|---|---|---|---|
| 1 | cliente inexistente | POST `/api/clientes/nao-existe/fases` | 404 |
| 2 | cliente existe, body valido, sem tarefas | POST `/api/clientes/estefania/fases` | 201 |
| 3 | cliente existe, body valido, com tarefas | POST `/api/clientes/estefania/fases` | 201 |
| 4 | body sem campo `titulo` | POST `/api/clientes/estefania/fases` | 400 |
| 5 | body sem campo `numero` | POST `/api/clientes/estefania/fases` | 400 |
| 6 | sem header X-Client-ID | POST `/api/clientes/estefania/fases` | 401 |
| 7 | X-Client-ID diferente do clienteId da URL | POST `/api/clientes/estefania/fases` | 403 |

**Cenarios para `errorHandler` (unit test — `errorHandler.test.ts`):**

| # | Cenario | Status esperado |
|---|---|---|
| 8 | erro com `code === 'SQLITE_CONSTRAINT'` | 422 |
| 9 | erro SQLITE sem `code` (generico) | 500 |

### Testes de unidade — `FaseService.test.ts`

Adicionar cenarios:
- `createFase` quando `clienteRepository.getCliente` retorna `null` → lanca `NotFoundError`
- `createFase` quando cliente existe → delega para `faseRepository.createFaseWithTarefas`

---

## Fora de escopo

- Validacao de cliente ativo/inativo para criacao de fases
- Alteracao de outras rotas de fases (GET, PUT, DELETE)
- Mudancas no schema do banco
- Tratamento de outros codigos SQLite alem de `SQLITE_CONSTRAINT`
- Frontend / UI
