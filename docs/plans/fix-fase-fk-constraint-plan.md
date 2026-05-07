# Plano: fix/fase-fk-constraint-404

**Spec:** `docs/specs/fix-fase-fk-constraint-spec.md`

---

## Tasks

### Task 1 — FaseService: validação de cliente (TDD)

**RED:** Adicionar em `backend/tests/unit/services/FaseService.test.ts`:
- `createFase` quando `clienteRepository.getCliente` retorna `null` → lança `NotFoundError`
- `createFase` quando cliente existe → delega para `faseRepository.createFaseWithTarefas`

**GREEN:** Modificar `backend/src/services/FaseService.ts`:
- Injetar `ClienteRepository` como 3º parâmetro do constructor
- Chamar `this.clienteRepository.getCliente(clienteId)` no início de `createFase`
- Se `null` → `throw new NotFoundError(...)`

**Verificação:** `pnpm --filter backend test unit/services/FaseService`

---

### Task 2 — errorHandler: interceptar SQLITE_CONSTRAINT (TDD)

**RED:** Adicionar em `backend/tests/unit/middleware/errorHandler.test.ts`:
- Erro com `code === 'SQLITE_CONSTRAINT'` → 422 com `UnprocessableEntity`
- Erro sem `code` (genérico) → 500 (comportamento existente)

**GREEN:** Modificar `backend/src/middleware/errorHandler.ts`:
- Adicionar bloco `SqliteError` antes do fallback 500
- Retornar 422 quando `err.code === 'SQLITE_CONSTRAINT'`

**Verificação:** `pnpm --filter backend test unit/middleware/errorHandler`

---

### Task 3 — routes/index.ts: passar clienteRepo ao FaseService

**Modificar** `backend/src/routes/index.ts`:
- Linha 30: `new FaseService(faseRepo, tarefaRepo, clienteRepo)`

**Verificação:** `pnpm --filter backend type-check`

---

### Task 4 — Testes de integração: fase.test.ts

**Criar** `backend/tests/integration/api/fase.test.ts` com 7 cenários:

| # | Cenário | Status |
|---|---|---|
| 1 | cliente inexistente | 404 |
| 2 | cliente existe, body válido (sem tarefas) | 201 |
| 3 | cliente existe, body válido, com tarefas | 201 |
| 4 | body sem `titulo` | 400 |
| 5 | body sem `numero` | 400 |
| 6 | sem header X-Client-ID | 401 |
| 7 | X-Client-ID diferente do clienteId da URL | 403 |

**Verificação:** `pnpm --filter backend test integration/api/fase`

---

### Validação Final

```bash
pnpm --filter backend test
pnpm --filter backend lint
pnpm --filter backend type-check
```
