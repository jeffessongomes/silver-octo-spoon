# Spec: Refatoração Arquitetural do Backend

**Ticket:** `backend-arch-refactor`
**Data:** 2026-05-08
**Status:** Aguardando aprovação

---

## Preflight

Branch atual: `fix/cors-backend`

> Esta spec cobre uma refatoração de médio porte. Recomenda-se criar uma branch dedicada antes de implementar:
> `refactor/backend-arch-cleanup` a partir de `master`.

---

## Objetivo

Reestruturar o backend para eliminar antipadrões identificados na análise: arquivo de rotas monolítico (1037 linhas), duplicação de lógica de cálculo de status em 3 locais, inconsistência no fluxo Controller → Service → Repository, e imports dinâmicos desnecessários. O resultado deve ser um codebase mais fácil de manter, testar e evoluir — sem alterar o contrato da API nem o schema do banco.

---

## Contexto do Problema

### Problemas Críticos

| # | Problema | Onde | Impacto |
|---|---------|------|---------|
| P1 | Arquivo de rotas monolítico | `routes/index.ts` (1037 linhas) | Impossível manter, rever ou testar isoladamente |
| P2 | Cálculo de status duplicado | `FaseRepository`, `FaseService`, `PainelService` | Bug em um lugar não reflete nos outros; comportamento diverge |
| P3 | Controllers bypassam Service | `FaseController.getFases()` chama repo direto | Viola layered architecture; lógica de negócio inacessível |
| P4 | Import dinâmico dentro de método | `FaseController` linha ~78 | Frágil, não testável via injeção de dependência |
| P5 | Auth middleware responde direto | `auth.ts` usa `res.status().json()` | Error handler global ignorado; respostas de erro inconsistentes |

### Problemas Médios

| # | Problema | Onde | Impacto |
|---|---------|------|---------|
| P6 | Sem TarefaService | Lógica em FaseService + TarefaRepository | Responsabilidades misturadas |
| P7 | Sem MaterialService | MaterialController chama repo direto | Sem camada para validações futuras |
| P8 | `generateId()` fraco | `utils.ts` | Colisão possível em escrita concorrente |
| P9 | Instâncias criadas em routes/index.ts | `routes/index.ts` | Acoplamento alto, sem ponto único de composição |

---

## O que NÃO muda

- Contrato da API (endpoints, status codes, payload format)
- Schema do banco de dados (SQLite, tabelas, índices)
- Stack (Express, SQLite, Vitest)
- Regras de negócio existentes
- Swagger/OpenAPI spec

---

## Modelo de Dados

Nenhuma alteração no schema SQL. As entidades TypeScript em `shared/types.ts` permanecem as mesmas. O que muda é o fluxo interno de dados entre camadas.

```
Request → Middleware → Router → Controller → Service → Repository → SQLite
                                                      ↓
                                               shared/types.ts (DTOs)
```

---

## Regras de Negócio

### RN-01: Fluxo de camadas obrigatório

Controllers SEMPRE invocam Services. Services SEMPRE invocam Repositories. Nenhuma camada pula outra.

```
Controller → Service → Repository     ✓
Controller → Repository               ✗
Service direto → DB                   ✗
```

### RN-02: Cálculo de status de fase

A função `calculateFaseStatus(tarefas)` deve existir apenas em `shared/utils.ts`. Services e Repositories chamam essa função; nenhum recalcula a lógica localmente.

### RN-03: Injeção de dependência

Todas as dependências (repositories, services) são passadas via construtor. Nenhum `new Repository()` dentro de método; nenhum `import()` dinâmico para instanciação.

### RN-04: Auth middleware

O middleware de autenticação deve chamar `next(new UnauthorizedError(...))` em vez de responder diretamente. O error handler global trata a resposta.

### RN-05: Rotas por domínio

Cada domínio tem seu próprio arquivo de rotas. `routes/index.ts` apenas combina os roteadores.

---

## Critérios de Aceite

### CA-01: Rotas modularizadas

**Dado** que o servidor está rodando  
**Quando** qualquer endpoint existente é chamado  
**Então** a resposta é idêntica à atual (mesmo status code, mesmo payload)

**Dado** que um desenvolvedor abre `routes/clientes.ts`  
**Quando** precisa entender as rotas de clientes  
**Então** vê apenas as rotas de clientes (não mais de 150 linhas)

### CA-02: Status de fase sem duplicação

**Dado** que `calculateFaseStatus` existe em `shared/utils.ts`  
**Quando** o status de uma fase é calculado  
**Então** é sempre chamado via `calculateFaseStatus` — não há lógica inline em Repository, Service ou PainelService

**Dado** que a regra de negócio de status muda  
**Quando** atualizo `shared/utils.ts`  
**Então** todos os fluxos (getFase, getFases, getPainel) refletem a mudança automaticamente

### CA-03: Controller → Service consistente

**Dado** que `FaseController.getFases` é chamado  
**Quando** processa a request  
**Então** delega para `FaseService.getFases` (não acessa `FaseRepository` diretamente)

### CA-04: Auth via error handler

**Dado** que uma request chega sem X-Client-ID válido  
**Quando** o auth middleware processa  
**Então** chama `next(new UnauthorizedError())` e o error handler retorna `{ error: "..." }` com status 401

### CA-05: Sem imports dinâmicos

**Dado** que `FaseController` é instanciado  
**Quando** qualquer método é chamado  
**Então** não há `import()` dinâmico — todos repositórios/services são injetados no construtor

### CA-06: Testes passando

**Dado** que a refatoração é concluída  
**Quando** `pnpm test` é executado  
**Então** todos os testes existentes passam sem modificação nos assertions

---

## Edge Cases

1. **Migração sem downtime**: A API deve continuar respondendo durante a refatoração; mudanças são internas ao código, sem alterar endpoints.

2. **Dependência circular**: `FaseService` precisa de `TarefaService` e vice-versa para operações compostas. Resolver via composição na camada de routes/container, não circular imports.

3. **PainelService com múltiplos repositórios**: `PainelService` agrega dados de fases, tarefas e materiais. Continua recebendo todos repositórios necessários via construtor.

4. **Cálculo de status em batch**: `PainelService.getPainelCompleto` chama `calculateFaseStatus` para cada fase via `Promise.all`. Garantir que a função utilitária seja pure e stateless (sem acesso ao DB).

5. **Swagger JSDoc inline**: Após split das rotas, as anotações `@swagger` devem seguir para os arquivos de rota correspondentes. Verificar que `swagger-jsdoc` encontra todos os arquivos via glob pattern.

---

## Arquitetura

### Estrutura alvo

```
backend/src/
  server.ts              (sem mudança)
  app.ts                 (sem mudança)
  container.ts           (NOVO) - composição e injeção de dependências
  
  shared/
    types.ts             (sem mudança)
    errors.ts            (sem mudança)
    utils.ts             (sem mudança — calculateFaseStatus já existe aqui)
    cors.ts              (sem mudança)
  
  middleware/
    auth.ts              (ALTERAR) - next(error) em vez de res.json
    validation.ts        (sem mudança)
    errorHandler.ts      (sem mudança)
  
  database/
    index.ts             (sem mudança)
    schema.sql           (sem mudança)
  
  repositories/          (sem mudança estrutural)
    BaseRepository.ts
    ClienteRepository.ts
    FaseRepository.ts    (ALTERAR) - remover recalculateFaseStatus inline, usar shared/utils
    TarefaRepository.ts
    ObservacaoRepository.ts
    MaterialRepository.ts
  
  services/
    ClienteService.ts    (sem mudança)
    FaseService.ts       (ALTERAR) - remover decorateFaseWithStatus inline, usar shared/utils; chamar TarefaService
    TarefaService.ts     (NOVO) - extrair lógica de tarefas de FaseService
    ObservacaoService.ts (sem mudança)
    MaterialService.ts   (NOVO) - thin layer sobre MaterialRepository
    PainelService.ts     (ALTERAR) - remover cálculo de status inline, usar shared/utils
  
  controllers/
    ClienteController.ts   (sem mudança)
    FaseController.ts      (ALTERAR) - injetar TarefaService no construtor; getFases via FaseService
    TarefaController.ts    (ALTERAR) - injetar TarefaService; remover acesso direto ao repo
    ObservacaoController.ts (sem mudança)
    MaterialController.ts  (ALTERAR) - injetar MaterialService
    PainelController.ts    (sem mudança)
  
  routes/
    index.ts             (ALTERAR) - apenas combina roteadores, sem instanciações
    clientes.ts          (NOVO) - ~80 linhas
    fases.ts             (NOVO) - ~150 linhas
    tarefas.ts           (NOVO) - ~80 linhas
    observacoes.ts       (NOVO) - ~60 linhas
    materiais.ts         (NOVO) - ~90 linhas
    painel.ts            (NOVO) - ~30 linhas
    docs.ts              (sem mudança)
  
  docs/
    swagger.ts           (sem mudança)
```

### container.ts — Composição de Dependências

```typescript
// Exemplo conceitual (não é código final)
export function createContainer(db: Database) {
  // Repositories
  const clienteRepo = new ClienteRepository(db)
  const faseRepo = new FaseRepository(db)
  const tarefaRepo = new TarefaRepository(db)
  const observacaoRepo = new ObservacaoRepository(db)
  const materialRepo = new MaterialRepository(db)

  // Services
  const tarefaService = new TarefaService(tarefaRepo, faseRepo)
  const faseService = new FaseService(faseRepo, tarefaService)
  const clienteService = new ClienteService(clienteRepo)
  const observacaoService = new ObservacaoService(observacaoRepo, tarefaRepo)
  const materialService = new MaterialService(materialRepo)
  const painelService = new PainelService(faseRepo, materialRepo)

  // Controllers
  return {
    clienteController: new ClienteController(clienteService),
    faseController: new FaseController(faseService),
    tarefaController: new TarefaController(tarefaService),
    observacaoController: new ObservacaoController(observacaoService),
    materialController: new MaterialController(materialService),
    painelController: new PainelController(painelService),
  }
}
```

### routes/index.ts — Após refatoração

```typescript
// Exemplo conceitual
import { Router } from 'express'
import { createClientesRouter } from './clientes'
import { createFasesRouter } from './fases'
// ...

export function createRouter(container: ReturnType<typeof createContainer>) {
  const router = Router()
  router.use('/clientes', createClientesRouter(container.clienteController))
  router.use('/fases', createFasesRouter(container.faseController))
  // ...
  return router
}
```

### Eliminação do Cálculo de Status Duplicado

Antes (3 implementações):
- `FaseRepository.recalculateFaseStatus()` — lógica inline
- `FaseService.decorateFaseWithStatus()` — lógica inline
- `PainelService.mapFaseToDTO()` — lógica inline

Depois (1 implementação):
- `shared/utils.ts: calculateFaseStatus(tarefas: Tarefa[]): StatusFase` — já existe
- Todos chamam: `import { calculateFaseStatus } from '../shared/utils'`

---

## Dependências de Infraestrutura

Nenhuma dependência de infraestrutura identificada.

Todas as melhorias são refatorações internas: sem novas libs, sem variáveis de ambiente adicionais, sem mudanças no schema SQL.

---

## Estratégia de Testes

### Testes existentes

Todos os testes de integração (`tests/integration/`) devem passar sem alteração nos assertions — são testes de API (black-box), não acoplados à estrutura interna.

### Novos testes unitários (obrigatórios)

| Arquivo alvo | O que testar |
|---|---|
| `TarefaService` | createTarefa, updateTarefa, deleteTarefa, toggleConcluida |
| `MaterialService` | createMaterial, updateMaterial, deleteMaterial |
| `FaseService` | getFases usa calculateFaseStatus (spy em shared/utils) |
| `PainelService` | getPainelCompleto usa calculateFaseStatus (spy) |

### Verificação de contratos (obrigatória)

Após cada arquivo refatorado, verificar que `pnpm test && pnpm lint && pnpm type-check` passa.

### Cenários prioritários

1. `FaseController.getFases` → `FaseService.getFases` (não repo direto)
2. Auth middleware com request sem X-Client-ID → status 401 via error handler
3. `calculateFaseStatus` chamado uma única vez por fluxo (sem duplicação em runtime)

---

## Fora de Escopo

- Soft deletes (adicionar `deletado_em` nas tabelas)
- Pagination (`offset`/`limit` em listagens)
- Rate limiting (`express-rate-limit`)
- Logging estruturado (Winston/Pino)
- Validação rigorosa de input (class-validator)
- Migração de banco de dados
- Mudanças no contrato da API
- Mudanças no schema SQL
- Mudanças na Swagger spec

---

## Abordagens Consideradas

### Abordagem A (Recomendada): Refatoração incremental por domínio

Refatorar um domínio por vez, nesta ordem:
1. `container.ts` + `routes/index.ts` (setup base)
2. Rotas por domínio (clientes → fases → tarefas → observacoes → materiais → painel)
3. Eliminar duplicação de status
4. TarefaService + MaterialService
5. Corrigir auth middleware

Cada passo é um commit independente. Testes passam ao fim de cada passo.

**Prós**: Revisável, revertível por passo, risco baixo.
**Contras**: Mais commits, estado intermediário com inconsistências toleradas temporariamente.

### Abordagem B: Reescrita em branch separada

Criar todos os arquivos novos em paralelo, depois substituir.

**Prós**: Branch isolada, não contamina main durante a refatoração.
**Contras**: Merge conflito maior no final, maior risco de regredir comportamento.

### Abordagem C: Manter routes/index.ts, apenas extrair lógica

Não quebrar routes, apenas eliminar duplicações e inconsistências.

**Prós**: Menor impacto, mais rápido.
**Contras**: Não resolve o problema principal (arquivo monolítico de 1037 linhas).

**Decisão**: Abordagem A, na branch `refactor/backend-arch-cleanup` a partir de `master`.
