# Plano de Implementação -- Painel Estefania Backend

**Ticket:** `painel-estefania-backend`  
**Abordagem:** TDD (RED → GREEN → IMPROVE)  
**Estrutura:** Layered Architecture (Repositories → Services → Controllers)

---

## Notas de Infraestrutura

### Antes de começar
- [x] Estrutura de pastas criada (`src/`, `tests/`)
- [x] `package.json` com dependências (express, sqlite3, vitest, supertest)
- [x] `tsconfig.json` (strict mode)
- [x] Tipos compartilhados (`src/shared/types.ts`)
- [x] Classes de erro (`src/shared/errors.ts`)
- [x] Utilitários (`src/shared/utils.ts`)
- [ ] Instalar dependências: `cd backend && pnpm install`

### Após implementação
- [ ] Verificar build: `pnpm build`
- [ ] Testes: `pnpm test` (26+ testes)
- [ ] Lint: `pnpm lint`
- [ ] Type-check: `pnpm type-check`
- [ ] Dev server: `pnpm dev` (manual testing)

---

## Fase 1 -- Database e Setup

### Task 1.1: Database Connection + Migration

**Arquivos:** `src/database/index.ts`, `src/database/schema.sql`

**RED:** Teste que valida:
- Banco de dados criado corretamente
- Tabelas existem (clientes, fases, tarefas, observacoes, materiais)
- Indices criados

**GREEN:** 
- Implementar `initializeDatabase()` que executa `schema.sql`
- Exportar conexão SQLite

**VERIFY:** `pnpm test src/database/`

---

## Fase 2 -- Repositories (Data Access Layer)

### Task 2.1: BaseRepository

**Arquivos:** `src/repositories/BaseRepository.ts`

**RED:** Testes para:
- `execute(sql, params)` com tratamento de erro
- Wrapper para queries comuns

**GREEN:**
- Classe abstrata com método `execute()`
- Tipagem completa (sem `any`)

**IMPROVE:** Documentação inline

---

### Task 2.2: ClienteRepository

**Arquivos:** `src/repositories/ClienteRepository.ts`

**Tests:** `tests/unit/repositories/ClienteRepository.test.ts`

**RED (3 testes):**
1. `createCliente()` insere cliente e retorna com `id`, `nome`, `criado_em`
2. `getCliente(clienteId)` retorna cliente ou `null`
3. `deleteCliente(clienteId)` deleta cliente e todas as fases/tarefas associadas (cascade)

**GREEN:** Implementar 3 métodos CRUD

**VERIFY:** `pnpm test tests/unit/repositories/ClienteRepository.test.ts`

---

### Task 2.3: FaseRepository

**Arquivos:** `src/repositories/FaseRepository.ts`

**Tests:** `tests/unit/repositories/FaseRepository.test.ts`

**RED (4 testes):**
1. `getFasesByCliente(clienteId)` retorna apenas fases do cliente
2. `getFaseWithTarefas(clienteId, faseId)` retorna fase com tarefas nested (JOIN)
3. `createFaseWithTarefas(clienteId, data)` insere fase + múltiplas tarefas em transação
4. `recalculateFaseStatus(clienteId, faseId)` atualiza status baseado em tarefas concluídas

**GREEN:** Implementar 4 métodos

**IMPROVE:** Transações SQLite para operações multi-tabela

**VERIFY:** `pnpm test tests/unit/repositories/FaseRepository.test.ts`

---

### Task 2.4: TarefaRepository

**Arquivos:** `src/repositories/TarefaRepository.ts`

**Tests:** `tests/unit/repositories/TarefaRepository.test.ts`

**RED (3 testes):**
1. `getTarefasByFase(clienteId, faseId, filtro)` com filtro `pendentes | concluidas | todas`
2. `updateTarefa(clienteId, tarefaId, { concluida })` marca/desmarcar concluída
3. `deleteTarefa(clienteId, tarefaId)` deleta tarefa + observação associada (cascade)

**GREEN:** Implementar 3 métodos

**VERIFY:** `pnpm test tests/unit/repositories/TarefaRepository.test.ts`

---

### Task 2.5: ObservacaoRepository

**Arquivos:** `src/repositories/ObservacaoRepository.ts`

**Tests:** `tests/unit/repositories/ObservacaoRepository.test.ts`

**RED (3 testes):**
1. `getObservacao(clienteId, tarefaId)` retorna observação ou `null`
2. `upsertObservacao(clienteId, tarefaId, conteudo)` cria se não existe, atualiza se existe (sem erro 409)
3. `deleteObservacao(clienteId, tarefaId)` deleta observação

**GREEN:** Implementar 3 métodos com `INSERT OR REPLACE`

**VERIFY:** `pnpm test tests/unit/repositories/ObservacaoRepository.test.ts`

---

### Task 2.6: MaterialRepository

**Arquivos:** `src/repositories/MaterialRepository.ts`

**Tests:** `tests/unit/repositories/MaterialRepository.test.ts`

**RED (2 testes):**
1. `getMaterialsByFase(clienteId, faseId)` retorna materiais da fase
2. `getMaterialsByCliente(clienteId)` retorna biblioteca global (`fase_id IS NULL`)

**GREEN:** Implementar 2 métodos + CRUD completo

**VERIFY:** `pnpm test tests/unit/repositories/MaterialRepository.test.ts`

---

## Fase 3 -- Services (Business Logic Layer)

### Task 3.1: FaseService

**Arquivos:** `src/services/FaseService.ts`

**Tests:** `tests/unit/services/FaseService.test.ts`

**RED (3 testes com mocks):**
1. `getFaseComTarefas(clienteId, faseId)` retorna fase + tarefas, lança `NotFoundError` se não existe
2. `createFase(clienteId, data)` cria fase com tarefas e calcula status inicial
3. `toggleTarefaEAtualizarFase(clienteId, tarefaId, concluida)` marca tarefa, recalcula status da fase, retorna `{ tarefa, fase }`

**GREEN:** Implementar 3 métodos com injeção de `FaseRepository` + `TarefaRepository`

**IMPROVE:** Método privado `decorateFaseWithStatus()` para reutilização

**VERIFY:** `pnpm test tests/unit/services/FaseService.test.ts`

---

### Task 3.2: PainelService

**Arquivos:** `src/services/PainelService.ts`

**Tests:** `tests/unit/services/PainelService.test.ts`

**RED (2 testes):**
1. `getPainelCompleto(clienteId)` agrega fases + biblioteca em `DadosPainel` com status visual recalculado
2. `getPainelCompleto()` retorna `404 NotFound` se cliente não existe

**GREEN:** Implementar agregação de repositories

**VERIFY:** `pnpm test tests/unit/services/PainelService.test.ts`

---

### Task 3.3: TarefaService

**Arquivos:** `src/services/TarefaService.ts`

**Tests:** `tests/unit/services/TarefaService.test.ts` (se necessário, pode ser simplificado)

---

### Task 3.4: ObservacaoService

**Arquivos:** `src/services/ObservacaoService.ts`

**Tests:** `tests/unit/services/ObservacaoService.test.ts`

**RED (1 teste):**
1. `upsertObservacao(clienteId, tarefaId, conteudo)` valida entrada + chama repository

**GREEN:** Wrapper com validação

---

## Fase 4 -- Middleware

### Task 4.1: Auth Middleware

**Arquivos:** `src/middleware/auth.ts`

**Tests:** `tests/unit/middleware/auth.test.ts`

**RED (2 testes):**
1. Sem header `X-Client-ID` → retorna `401 Unauthorized`
2. `X-Client-ID` diferente do `clienteId` na URL → retorna `403 Forbidden`

**GREEN:** Implementar `authClienteMiddleware()`

**VERIFY:** `pnpm test tests/unit/middleware/auth.test.ts`

---

### Task 4.2: Error Handler Middleware

**Arquivos:** `src/middleware/errorHandler.ts`

**Tests:** `tests/unit/middleware/errorHandler.test.ts`

**RED (3 testes):**
1. `ValidationError` → 400 com `details`
2. `NotFoundError` → 404
3. Erro genérico → 500

**GREEN:** Implementar `errorHandlerMiddleware()`

**VERIFY:** `pnpm test tests/unit/middleware/errorHandler.test.ts`

---

## Fase 5 -- Controllers

### Task 5.1: ClienteController

**Arquivos:** `src/controllers/ClienteController.ts`

**Tests:** `tests/integration/api/cliente.test.ts`

**RED (2 testes integracao):**
1. POST `/api/clientes` com validação
2. GET `/api/clientes/:clienteId` + DELETE

**GREEN:** Implementar handlers

---

### Task 5.2: FaseController

**Arquivos:** `src/controllers/FaseController.ts`

**Tests:** `tests/integration/api/fase.test.ts`

**RED (2 testes integracao):**
1. GET `/api/clientes/:clienteId/fases/:faseId` com tarefas nested
2. POST `/api/clientes/:clienteId/fases` com tarefas inline

---

### Task 5.3: TarefaController

**Arquivos:** `src/controllers/TarefaController.ts`

**Tests:** `tests/integration/api/tarefa.test.ts`

**RED (3 testes integracao):**
1. PATCH `/api/clientes/:clienteId/tarefas/:tarefaId` com `concluida: true` + fase recalculada
2. POST `/api/clientes/:clienteId/fases/:faseId/tarefas` cria tarefa
3. DELETE `/api/clientes/:clienteId/tarefas/:tarefaId`

---

### Task 5.4: ObservacaoController

**Arquivos:** `src/controllers/ObservacaoController.ts`

**Tests:** `tests/integration/api/observacao.test.ts`

**RED (2 testes integracao):**
1. PUT `/api/clientes/:clienteId/tarefas/:tarefaId/observacao` (UPSERT, sem 409)
2. GET `/api/clientes/:clienteId/tarefas/:tarefaId/observacao`

---

### Task 5.5: MaterialController

**Arquivos:** `src/controllers/MaterialController.ts`

**Tests:** `tests/integration/api/material.test.ts`

**RED (1 teste integracao):**
1. GET `/api/clientes/:clienteId/biblioteca` retorna materiais globais

---

## Fase 6 -- Routes e App

### Task 6.1: Rotas

**Arquivos:** `src/routes/index.ts`, `src/routes/clientes.ts`, `src/routes/fases.ts`, etc

**GREEN:** Agregação de rotas por módulo com middleware auth

---

### Task 6.2: App Setup

**Arquivos:** `src/app.ts`

**GREEN:** 
- Express setup com middlewares (json, auth, error handler)
- Ordem: body → auth → rotas → error handler

---

### Task 6.3: Server Entry Point

**Arquivos:** `src/server.ts`

**GREEN:**
- `app.listen(PORT)` com mensagem de log
- Variável `PORT` do `.env` (default: 3000)

---

## Fase 7 -- Validação Final

### Task 7.1: Test Coverage

- [ ] ~15 testes unit (repositories + services)
- [ ] ~11 testes integration (controllers + API)
- [ ] `pnpm test` — todos passando
- [ ] Cobertura > 80% em services/repositories

### Task 7.2: Qualidade

- [ ] `pnpm lint` — 0 erros
- [ ] `pnpm type-check` — 0 erros
- [ ] `pnpm build` — build bem-sucedido

### Task 7.3: Manual Testing (opcional)

```bash
npm run dev
# Testar endpoints com curl/Postman
# Golden path: criar cliente → fases → tarefas → toggle → observacoes
```

---

## Resumo de Tasks

| Fase | Task | Tipo | Arquivos | Testes |
|---|---|---|---|---|
| 1 | Database | Setup | `database/index.ts`, `schema.sql` | — |
| 2.1 | BaseRepository | Unit | `repositories/BaseRepository.ts` | — |
| 2.2 | ClienteRepository | Unit | `repositories/ClienteRepository.ts` | 3 |
| 2.3 | FaseRepository | Unit | `repositories/FaseRepository.ts` | 4 |
| 2.4 | TarefaRepository | Unit | `repositories/TarefaRepository.ts` | 3 |
| 2.5 | ObservacaoRepository | Unit | `repositories/ObservacaoRepository.ts` | 3 |
| 2.6 | MaterialRepository | Unit | `repositories/MaterialRepository.ts` | 2 |
| 3.1 | FaseService | Unit | `services/FaseService.ts` | 3 |
| 3.2 | PainelService | Unit | `services/PainelService.ts` | 2 |
| 3.3 | TarefaService | Unit | `services/TarefaService.ts` | — |
| 3.4 | ObservacaoService | Unit | `services/ObservacaoService.ts` | 1 |
| 4.1 | Auth Middleware | Unit | `middleware/auth.ts` | 2 |
| 4.2 | ErrorHandler Middleware | Unit | `middleware/errorHandler.ts` | 3 |
| 5.1-5.5 | Controllers | Integration | `controllers/*.ts` | ~11 |
| 6.1-6.3 | Routes + App | Setup | `routes/`, `app.ts`, `server.ts` | — |
| 7.1-7.3 | Validação | QA | — | — |

**Total esperado:** ~26+ testes, 100% cobertura em services/repositories

---

## Convenções

- **TypeScript:** strict mode, sem `any`
- **Padrão:** Repository → Service → Controller
- **Testes:** Vitest + factory functions para dados realistas
- **Erros:** Classes customizadas (ValidationError, NotFoundError, etc)
- **Transações:** SQLite para operações multi-tabela
- **Validação:** Na camada de Service / Controller
