# Plano de Implementação — backend-db-audit

**Criado em:** 2026-05-09  
**Branch:** feat/backend-db-audit  
**Spec:** docs/specs/backend-db-audit-spec.md  
**Status:** Concluido

---

## Tasks

| # | Task | Status |
|---|---|---|
| 1 | Criar sistema de migrations (runner + 3 arquivos SQL) | Concluido |
| 2 | Atualizar `database/index.ts` para usar migration runner | Concluido |
| 3 | Refatorar `FaseRepository`: remover `status`, remover `recalculateFaseStatus`, adicionar `calcularStatus` + `getFasesWithAllTarefas` | Concluido |
| 4 | Refatorar `PainelService`: eliminar N+1 com JOIN unico | Concluido |
| 5 | Refatorar `FaseService`: remover chamadas a `recalculateFaseStatus` | Concluido |
| 6 | Migrar geracao de IDs para `crypto.randomUUID()` nos repositories | Concluido |
| 7 | Adicionar `getAllMaterialsByCliente` ao `MaterialRepository` | Concluido |
| 8 | Atualizar testes afetados (FaseRepository, FaseService, PainelService) | Concluido |
| 9 | Validar: `pnpm test` + `pnpm lint` + `pnpm type-check` | Concluido |

---

## Resultado final

- 109 testes passando (21 arquivos)
- 0 erros de lint
- 0 erros de type-check

## Arquivos criados

- `backend/src/database/migrations/001_initial.sql`
- `backend/src/database/migrations/002_rebuild_fases.sql`
- `backend/src/database/migrations/003_rebuild_materiais.sql`
- `backend/src/database/migrationRunner.ts`
- `backend/tests/unit/database/migrationRunner.test.ts`

## Arquivos modificados

- `backend/src/database/index.ts`
- `backend/src/repositories/FaseRepository.ts`
- `backend/src/repositories/TarefaRepository.ts`
- `backend/src/repositories/MaterialRepository.ts`
- `backend/src/repositories/ObservacaoRepository.ts`
- `backend/src/services/FaseService.ts`
- `backend/src/services/PainelService.ts`
- `backend/tests/unit/repositories/FaseRepository.test.ts`
- `backend/tests/unit/services/FaseService.test.ts`
- `backend/tests/unit/services/PainelService.test.ts`
