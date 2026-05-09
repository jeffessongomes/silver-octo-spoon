# Plano de Implementação: backend-arch-refactor

**Ticket:** `backend-arch-refactor`
**Branch:** `refactor/backend-arch-cleanup`
**Data:** 2026-05-09

---

## Estado atual (diagnóstico)

| Problema | Localização |
|---|---|
| P1: Rotas monolíticas (1037 linhas) | `routes/index.ts` |
| P2: `calculateFaseStatus` duplicado | `FaseRepository.recalculateFaseStatus`, `FaseService.decorateFaseWithStatus`, `PainelService.mapFaseToDTO` |
| P3: Controllers bypassam Service | `FaseController` chama `faseRepository.getFasesByCliente`, `updateFase`, `deleteFase` diretamente |
| P4: Import dinâmico em método | `FaseController.getTarefas` faz `await import('../repositories/TarefaRepository')` |
| P5: Auth responde direto | `auth.ts` chama `res.status(401).json(...)` e `res.status(403).json(...)` |
| P6: Sem TarefaService | Lógica de tarefa espalhada em `FaseService` e `TarefaController` |
| P7: Sem MaterialService | `MaterialController` chama `materialRepository` diretamente |

---

## `calculateFaseStatus` (assinatura real)

```typescript
// shared/utils.ts
export function calculateFaseStatus(totalTasks: number, completedTasks: number): FaseStatus
```

Recebe contagens, não array. Os 3 locais de duplicação replicam exatamente essa lógica inline.

---

## Ordem de execução (Abordagem A — incremental)

```
T1 → T2 → T3 → T4 → T5 → T6 → Validação final
```

Cada task deixa os testes de integração passando.

---

## T1 — container.ts + app.ts

### Arquivos
- `backend/src/container.ts` (NOVO)
- `backend/src/app.ts` (ALTERAR)

### Testes
- Nenhum novo teste. Testes de integração existentes validam o wiring.
- Verificar: `pnpm test` deve passar após esta task.

### container.ts (novo)
```typescript
import { ClienteRepository } from './repositories/ClienteRepository'
import { FaseRepository } from './repositories/FaseRepository'
import { TarefaRepository } from './repositories/TarefaRepository'
import { ObservacaoRepository } from './repositories/ObservacaoRepository'
import { MaterialRepository } from './repositories/MaterialRepository'
import { ClienteService } from './services/ClienteService'
import { FaseService } from './services/FaseService'
import { PainelService } from './services/PainelService'
import { ObservacaoService } from './services/ObservacaoService'
import { ClienteController } from './controllers/ClienteController'
import { FaseController } from './controllers/FaseController'
import { TarefaController } from './controllers/TarefaController'
import { ObservacaoController } from './controllers/ObservacaoController'
import { MaterialController } from './controllers/MaterialController'
import { PainelController } from './controllers/PainelController'

export function createContainer() {
  const clienteRepo = new ClienteRepository()
  const faseRepo = new FaseRepository()
  const tarefaRepo = new TarefaRepository()
  const obsRepo = new ObservacaoRepository()
  const matRepo = new MaterialRepository()

  const clienteService = new ClienteService(clienteRepo)
  const faseService = new FaseService(faseRepo, tarefaRepo, clienteRepo) // assinatura atual
  const painelService = new PainelService(clienteRepo, faseRepo, matRepo)
  const obsService = new ObservacaoService(obsRepo, tarefaRepo)

  return {
    clienteController: new ClienteController(clienteService),
    faseController: new FaseController(faseService, faseRepo), // assinatura atual
    tarefaController: new TarefaController(faseService, tarefaRepo), // assinatura atual
    obsController: new ObservacaoController(obsService),
    matController: new MaterialController(matRepo), // assinatura atual
    painelController: new PainelController(painelService),
  }
}

export type Container = ReturnType<typeof createContainer>
```

### app.ts (alterar)
```typescript
// Trocar:
app.use('/api', createRouter())

// Por:
import { createContainer } from './container'
const container = createContainer()
app.use('/api', createRouter(container))
```

### routes/index.ts (assinatura)
```typescript
export function createRouter(container: Container): Router
```

---

## T2 — Rotas por domínio

### Arquivos novos
- `backend/src/routes/clientes.ts` (~80 linhas)
- `backend/src/routes/painel.ts` (~30 linhas)
- `backend/src/routes/fases.ts` (~150 linhas)
- `backend/src/routes/tarefas.ts` (~80 linhas)
- `backend/src/routes/observacoes.ts` (~60 linhas)
- `backend/src/routes/materiais.ts` (~90 linhas)

### routes/index.ts (após refactor)
```typescript
import { Router } from 'express'
import { Container } from '../container'
import { createClientesRouter } from './clientes'
import { createPainelRouter } from './painel'
import { createFasesRouter } from './fases'
import { createTarefasRouter } from './tarefas'
import { createObservacoesRouter } from './observacoes'
import { createMateriaisRouter } from './materiais'

export function createRouter(container: Container): Router {
  const router = Router()
  router.use(createClientesRouter(container))
  router.use(createPainelRouter(container))
  router.use(createFasesRouter(container))
  router.use(createTarefasRouter(container))
  router.use(createObservacoesRouter(container))
  router.use(createMateriaisRouter(container))
  return router
}
```

### Padrão de cada arquivo de rota
```typescript
// routes/clientes.ts
import { Router } from 'express'
import type { Container } from '../container'
import { authClienteMiddleware } from '../middleware/auth'
import { validateBody } from '../middleware/validation'

export function createClientesRouter(container: Container): Router {
  const router = Router()
  const { clienteController } = container

  /**
   * @swagger
   * /api/clientes: ...
   */
  router.post('/clientes', validateBody(['id', 'nome']), (req, res, next) =>
    clienteController.createCliente(req, res, next)
  )
  // ... etc
  return router
}
```

### Testes
- Nenhum novo. Integração existente valida contratos de API.

---

## T3 — Eliminar duplicação de calculateFaseStatus

### Arquivos alterados
- `backend/src/repositories/FaseRepository.ts` — `recalculateFaseStatus`
- `backend/src/services/FaseService.ts` — `decorateFaseWithStatus`
- `backend/src/services/PainelService.ts` — `mapFaseToDTO`

### Mudanças

**FaseRepository.recalculateFaseStatus:**
```typescript
// Antes: inline
let status: FaseStatus = 'pending'
if (total > 0 && concluidas === total) status = 'done'
else if (concluidas > 0) status = 'active'

// Depois:
import { calculateFaseStatus } from '../shared/utils'
const status = calculateFaseStatus(total, concluidas)
```

**FaseService.decorateFaseWithStatus:**
```typescript
// Antes: inline (mesma lógica)
// Depois:
import { calculateFaseStatus } from '../shared/utils'
private decorateFaseWithStatus(fase: FaseComTarefas): FaseComTarefas {
  const total = fase.tarefas.length
  const concluidas = fase.tarefas.filter((t) => t.concluida === 1).length
  return { ...fase, status: calculateFaseStatus(total, concluidas) }
}
```

**PainelService.mapFaseToDTO:**
```typescript
// Antes: inline (mesma lógica)
// Depois:
import { calculateFaseStatus } from '../shared/utils'
private mapFaseToDTO(fase: FaseComTarefas): Fase {
  const total = fase.tarefas.length
  const concluidas = fase.tarefas.filter((t) => t.concluida === 1).length
  const status = calculateFaseStatus(total, concluidas)
  // ... resto igual
}
```

### Testes
- Atualizar `tests/unit/services/FaseService.test.ts`: spy em `calculateFaseStatus`
- Atualizar `tests/unit/services/PainelService.test.ts`: spy em `calculateFaseStatus`
- Verificar `tests/unit/repositories/FaseRepository.test.ts`: deve continuar passando

---

## T4 — TarefaService (novo) + refactor FaseService + controllers

### Contexto: por que TarefaService precisa de FaseRepository

`TarefaService` chama `faseRepository.recalculateFaseStatus` e `faseRepository.getFaseWithTarefas`
após operações de tarefa (para retornar o estado atualizado da fase). Isso NÃO é circular — é
`TarefaService → FaseRepository` (sem volta).

### TarefaService (novo)
```typescript
// services/TarefaService.ts
export class TarefaService {
  constructor(
    private tarefaRepository: TarefaRepository,
    private faseRepository: FaseRepository
  ) {}

  async getTarefasByFase(clienteId, faseId, filtro): Promise<TarefaRow[]>
  async getTarefa(clienteId, tarefaId): Promise<TarefaRow | null>
  async createTarefa(clienteId, faseId, data): Promise<{ tarefa, fase: FaseComTarefas }>
  async updateTarefa(clienteId, tarefaId, data): Promise<{ tarefa, fase: FaseComTarefas }>
  async deleteTarefa(clienteId, tarefaId): Promise<void>
  async toggleConcluida(clienteId, tarefaId, faseId, concluida): Promise<{ tarefa, fase }>
}
```

`updateTarefa` e `deleteTarefa` buscam o faseId internamente via `tarefaRepository.getTarefa`.

### FaseService (após refactor)
Remove: `tarefaRepository`, `createTarefa`, `toggleTarefaEAtualizarFase`, `updateTarefa`, `deleteTarefa`

Adiciona:
```typescript
async getFases(clienteId: string): Promise<FaseRow[]>
async updateFase(clienteId, faseId, data): Promise<FaseComTarefas | null>
async deleteFase(clienteId, faseId): Promise<void>
```

Assinatura nova: `FaseService(faseRepo, clienteRepo)`

### FaseController (após refactor)
```typescript
constructor(
  private faseService: FaseService,
  private tarefaService: TarefaService
) {}

getFases   → faseService.getFases(...)
getFase    → faseService.getFaseComTarefas(...)
createFase → faseService.createFase(...)
updateFase → faseService.updateFase(...)      // antes: faseRepository direto
deleteFase → faseService.deleteFase(...)      // antes: faseRepository direto
createTarefa → tarefaService.createTarefa(...)
getTarefas → tarefaService.getTarefasByFase(...) // antes: dynamic import
```

### TarefaController (após refactor)
```typescript
constructor(private tarefaService: TarefaService) {} // antes: faseService + tarefaRepository

getTarefa    → tarefaService.getTarefa(...)
updateTarefa → tarefaService.updateTarefa(...)
deleteTarefa → tarefaService.deleteTarefa(...)
```

### container.ts (atualizar)
```typescript
const tarefaService = new TarefaService(tarefaRepo, faseRepo)
const faseService = new FaseService(faseRepo, clienteRepo)   // remove tarefaRepo, clienteRepo

faseController: new FaseController(faseService, tarefaService),
tarefaController: new TarefaController(tarefaService),
```

### Testes (novos)
`tests/unit/services/TarefaService.test.ts`:
- `createTarefa` creates tarefa and recalculates status
- `updateTarefa` updates tarefa, recalculates if concluida changed
- `deleteTarefa` removes tarefa
- `getTarefa` returns null when not found

---

## T5 — MaterialService (novo) + refactor MaterialController

### MaterialService (novo)
```typescript
// services/MaterialService.ts
export class MaterialService {
  constructor(private materialRepository: MaterialRepository) {}

  async getBiblioteca(clienteId): Promise<MaterialRow[]>
  async createBibliotecaItem(clienteId, data): Promise<MaterialRow>
  async createFaseMaterial(clienteId, faseId, data): Promise<MaterialRow>
  async updateMaterial(clienteId, materialId, data): Promise<MaterialRow | null>
  async deleteMaterial(clienteId, materialId): Promise<void>
}
```

### MaterialController (após refactor)
```typescript
constructor(private materialService: MaterialService) {} // antes: materialRepository
```

### container.ts (atualizar)
```typescript
const matService = new MaterialService(matRepo)
matController: new MaterialController(matService),
```

### Testes (novos)
`tests/unit/services/MaterialService.test.ts`:
- `getBiblioteca` delegates to repository
- `createBibliotecaItem` creates material sem fase
- `createFaseMaterial` creates material com faseId
- `updateMaterial` throws NotFoundError when not found
- `deleteMaterial` delegates to repository

---

## T6 — auth.ts → next(error)

### auth.ts (após refactor)
```typescript
import { UnauthorizedError, ForbiddenError } from '../shared/errors'

export function authClienteMiddleware(req, res, next): void {
  const clienteId = req.headers['x-client-id'] as string | undefined
  const paramsClienteId = req.params.clienteId

  if (!clienteId) {
    next(new UnauthorizedError('Header X-Client-ID é obrigatório'))
    return
  }

  if (paramsClienteId && clienteId !== paramsClienteId) {
    next(new ForbiddenError('X-Client-ID não tem permissão para acessar este cliente'))
    return
  }

  next()
}
```

### auth.test.ts (atualizar)
O teste atual verifica `res.status` sendo chamado — comportamento que muda.
Novo comportamento: `next` é chamado com erro; `res.status` não é chamado diretamente.

```typescript
// Antes:
expect(res.status).toHaveBeenCalledWith(401)
expect(next).not.toHaveBeenCalled()

// Depois:
expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
expect(res.status).not.toHaveBeenCalled()
```

---

## Validação final

```bash
cd backend
pnpm test          # todos os testes passando
pnpm lint          # 0 erros
pnpm type-check    # 0 erros
pnpm build         # build sem erros
```

---

## Notas de Infraestrutura

Nenhuma dependência de infraestrutura. Refatoração puramente interna.

---

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `src/container.ts` | NOVO |
| `src/services/TarefaService.ts` | NOVO |
| `src/services/MaterialService.ts` | NOVO |
| `src/routes/clientes.ts` | NOVO |
| `src/routes/painel.ts` | NOVO |
| `src/routes/fases.ts` | NOVO |
| `src/routes/tarefas.ts` | NOVO |
| `src/routes/observacoes.ts` | NOVO |
| `src/routes/materiais.ts` | NOVO |
| `src/app.ts` | ALTERAR |
| `src/routes/index.ts` | ALTERAR |
| `src/middleware/auth.ts` | ALTERAR |
| `src/services/FaseService.ts` | ALTERAR |
| `src/services/PainelService.ts` | ALTERAR |
| `src/repositories/FaseRepository.ts` | ALTERAR |
| `src/controllers/FaseController.ts` | ALTERAR |
| `src/controllers/TarefaController.ts` | ALTERAR |
| `src/controllers/MaterialController.ts` | ALTERAR |
| `tests/unit/services/TarefaService.test.ts` | NOVO |
| `tests/unit/services/MaterialService.test.ts` | NOVO |
| `tests/unit/middleware/auth.test.ts` | ALTERAR |
