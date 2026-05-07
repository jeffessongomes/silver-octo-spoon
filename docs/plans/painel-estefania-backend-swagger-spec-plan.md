# Plano -- painel-estefania-backend-swagger-spec

**Spec:** `docs/specs/painel-estefania-backend-swagger-spec.md`
**Branch:** master (sem nova branch por instrução do usuário)

---

## Notas de Infraestrutura

### Antes de começar
- [x] Instalar `swagger-jsdoc ^6.2.8` e `swagger-ui-express ^5.0.1`
- [x] Instalar `@types/swagger-jsdoc ^6.0.4` e `@types/swagger-ui-express ^4.1.8` (devDependencies)
- [ ] Adicionar `SWAGGER_ENABLED=true` ao `.env` local e `.env.example`

### Após implementação
- [ ] Verificar manualmente: `pnpm dev` → `http://localhost:3000/api-docs`

---

## Task 1 — Instalar dependências

**Arquivos:** `backend/package.json`, `backend/pnpm-lock.yaml`

```bash
cd backend && pnpm add swagger-jsdoc swagger-ui-express
cd backend && pnpm add -D @types/swagger-jsdoc @types/swagger-ui-express
```

---

## Task 2 — Criar `backend/src/docs/swagger.ts`

**Arquivos:** `backend/src/docs/swagger.ts` (novo)

Define schemas OpenAPI para todos os tipos de `src/shared/types.ts` + `ClienteRow`, configura swagger-jsdoc e exporta `swaggerSpec`.

Schemas a definir em `components/schemas`:
- `FaseStatus` (enum)
- `FaseTipo` (enum)
- `MaterialTipo` (enum)
- `Tarefa`
- `Material`
- `Fase`
- `DadosPainel`
- `ClienteRow`
- `ErrorResponse`

Respostas reutilizáveis em `components/responses`:
- `Unauthorized` (401)
- `Forbidden` (403)
- `NotFound` (404)
- `BadRequest` (400)
- `InternalError` (500)

---

## Task 3 — Testes de integração (RED)

**Arquivos:** `backend/tests/integration/api/docs.test.ts` (novo)

| # | Teste | Cenário |
|---|---|---|
| 1 | `GET /api-docs returns 200 with swagger ui html` | Swagger UI servida |
| 2 | `GET /api-docs.json returns valid openapi spec` | JSON com `openapi: 3.0.0` e `info.title` corretos |
| 3 | `GET /api-docs returns 404 when SWAGGER_ENABLED is false` | Rota desabilitada |

---

## Task 4 — Criar `backend/src/routes/docs.ts` + Modificar `backend/src/app.ts`

**Arquivos:**
- `backend/src/routes/docs.ts` (novo)
- `backend/src/app.ts` (modificar)

`docs.ts`: router com `swaggerUi.serve`, `swaggerUi.setup(swaggerSpec)` e rota `.json`.

`app.ts`: importar `createDocsRouter` e montar condicionalmente via `SWAGGER_ENABLED !== 'false'`.

---

## Task 5 — Adicionar 24 anotações JSDoc `@swagger` em `routes/index.ts`

**Arquivo:** `backend/src/routes/index.ts` (modificar)

| Tag | Endpoints |
|---|---|
| Clientes | POST /api/clientes, GET /api/clientes, GET /api/clientes/{clienteId}, PATCH /api/clientes/{clienteId}, DELETE /api/clientes/{clienteId} |
| Painel | GET /api/clientes/{clienteId}/painel |
| Fases | GET/POST /api/clientes/{clienteId}/fases, GET/PATCH/DELETE /api/clientes/{clienteId}/fases/{faseId} |
| Tarefas | GET/POST .../fases/{faseId}/tarefas, GET/PATCH/DELETE .../tarefas/{tarefaId} |
| Observações | GET/PUT/DELETE .../tarefas/{tarefaId}/observacao |
| Materiais | GET/POST .../biblioteca, POST .../fases/{faseId}/materiais, PATCH/DELETE .../materiais/{materialId} |

---

## Task 6 — Atualizar `.env.example`

Adicionar linha: `SWAGGER_ENABLED=true`

---

## Task 7 — Validação final

```bash
pnpm test          # 49/49 passando (46 existentes + 3 novos)
pnpm lint          # 0 erros
pnpm type-check    # 0 erros
pnpm build         # 0 erros
```
