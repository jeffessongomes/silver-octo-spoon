# Plano de Implementacao — cors-backend-config

**Spec:** `docs/specs/cors-backend-config-spec.md`  
**Data:** 2026-05-07

---

## Notas de Infraestrutura

### Antes de comecar
- [ ] `pnpm add cors` no diretorio `backend/`
- [ ] `pnpm add -D @types/cors` no diretorio `backend/`

### Apos implementacao
- [ ] Adicionar `CORS_ORIGIN=<url-de-producao>` nas variaveis de ambiente de staging/producao quando URL for conhecida

---

## Tasks

### Task 1 — Instalar dependencias
- Arquivo: `backend/package.json`
- Acao: `pnpm add cors && pnpm add -D @types/cors` dentro de `backend/`
- Verificacao: package.json atualizado com `cors` em `dependencies` e `@types/cors` em `devDependencies`

---

### Task 2 — RED: Escrever teste de CORS (falha esperada)
- Arquivo: `backend/tests/integration/api/cors.test.ts`
- Cenarios:
  1. Preflight OPTIONS de origin permitida -> 200 + Access-Control-Allow-Origin + Access-Control-Allow-Headers com X-Client-ID
  2. Request GET de origin permitida -> resposta contem Access-Control-Allow-Origin
  3. Request de origin nao permitida -> resposta NAO contem Access-Control-Allow-Origin
  4. Request sem header Origin -> 200 sem erro
- Verificacao: `pnpm test cors` deve FALHAR (RED)

---

### Task 3 — GREEN: Adicionar cors middleware em app.ts
- Arquivo: `backend/src/app.ts`
- Acao: importar `cors`, definir `allowedOrigins` a partir de `process.env.CORS_ORIGIN`, registrar antes das rotas
- Verificacao: `pnpm test cors` deve PASSAR (GREEN)

---

### Task 4 — Atualizar variaveis de ambiente
- Arquivos: `backend/.env`, `backend/.env.example`
- Acao: adicionar `CORS_ORIGIN=http://localhost:5173` no `.env` e `CORS_ORIGIN=` no `.env.example`

---

### Task 5 — Validacao final
- `pnpm test` (suite completa do backend)
- `pnpm lint`
- `pnpm type-check`
