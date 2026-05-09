# Plano de Implementacao — fix/cors-backend

**Spec:** `docs/specs/fix-cors-backend-spec.md`  
**Branch:** `fix/cors-backend`  
**Data:** 2026-05-08

---

## Tasks

### Task 1 — RED: Testes unitarios de `parseAllowedOrigins`
- **Arquivo:** `backend/tests/unit/parseAllowedOrigins.test.ts` (criar)
- **Cenarios:** 6 (ver spec — undefined, '', origem unica, multiplas, com espacos, virgula no final)
- **Verifica:** `cd backend && pnpm test tests/unit/parseAllowedOrigins.test.ts` (deve FALHAR — funcao nao existe)

### Task 2 — RED: Teste de integracao para `CORS_ORIGIN=''`
- **Arquivo:** `backend/tests/integration/api/cors.test.ts` (adicionar describe)
- **Cenario:** `CORS_ORIGIN=''` deve usar fallback `http://localhost:5173`
- **Verifica:** `cd backend && pnpm test tests/integration/api/cors.test.ts` (deve FALHAR)

### Task 3 — GREEN: Fix em `backend/src/app.ts`
- Extrair `parseAllowedOrigins(env?: string): string[]` como funcao exportada
- `??` → `||` e adicionar `.filter(Boolean)`
- **Verifica:** `cd backend && pnpm test` (todos devem passar)

### Task 4 — VERIFY: Suite completa
- `cd backend && pnpm test && pnpm lint && pnpm type-check`
